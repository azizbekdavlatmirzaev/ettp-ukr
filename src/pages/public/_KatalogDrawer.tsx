import { useNavigate } from 'react-router-dom'
import { CheckCircle2, GraduationCap, Info, LogIn } from 'lucide-react'
import { useStore, useUser } from '@/domain/store'
import * as A from '@/domain/amallar'
import { MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { ROL_YOL } from '@/layout/nav'
import { kursRasmi } from '@/ui/art'
import { Alert, Bar, Button, DL, Holat, Modal } from '@/ui'
import { pul, sana } from '@/lib/format'
import { KURS_TURI, MOLIYA, SHAKL, TADBIR, YONALISH } from '@/lib/holat'
import { hududYoki, type KatalogQator } from './_KursKarta'

export function KatalogDrawer({ q, onClose }: { q: KatalogQator | null; onClose: () => void }) {
  const nav = useNavigate()
  const u = useUser()
  const db = useStore((s) => s.db)
  if (!q) return null
  const { o, v, p, band } = q
  const qoldi = Math.max(0, o.orinlar - band)
  const xodim = u?.rol === 'xodim'
  const s = xodim ? A.shaxs(db, u?.personId) : undefined
  const mos = s ? A.mosmi(db, s, v) : undefined

  const yozil = () => {
    if (!u) nav('/kirish', { state: { qayt: '/xodim/oquv' } })
    else if (xodim) nav('/xodim/oquv', { state: { oqimId: o.id } })
    else nav(ROL_YOL[u.rol])
  }

  return (
    <Modal
      open
      drawer
      onClose={onClose}
      title={v.nomi}
      sub={`${p.nomi} · oqim ${o.kod}`}
      footer={
        <>
          <Button v="ghost" onClick={onClose}>Yopish</Button>
          {u && !xodim ? (
            <Button v="secondary" onClick={yozil}>Kabinetga oʻtish</Button>
          ) : (
            <Button v="primary" icon={u ? <GraduationCap /> : <LogIn />} onClick={yozil} disabled={mos ? !mos.ok : false}>
              {u ? 'Yozilish (kabinetda)' : 'Yozilish'}
            </Button>
          )}
        </>
      }
    >
      <div className="kt-cover">
        <img src={kursRasmi(v)} alt="" />
        <div className="cr">{v.tasdiqlanganKredit} kredit</div>
      </div>
      {!u && <Alert ton="info" title="Yozilish uchun tizimga kiring">OneID/MyID orqali kirgach, mutaxassislik va malaka darajangiz Reestrdan avtomatik tekshiriladi.</Alert>}
      {u && !xodim && <Alert ton="warn">Kursga faqat tibbiyot xodimi oʻz kabinetidan yoziladi. Siz {u.fio} sifatida kirgansiz.</Alert>}
      {mos && !mos.ok && <Alert ton="err" title="Bu kurs sizga mos emas">{mos.sabab}</Alert>}
      {mos?.ok && <Alert ton="ok">Kurs Reestrdagi mutaxassisligingizga mos.</Alert>}

      <div className="row wrap mt-16 gap-6">
        <Holat h={p.holat} />
        <span className="badge nodot brand">{KURS_TURI[v.kursTuri]}</span>
        <span className="badge nodot teal">{YONALISH[v.yonalish]}</span>
        <span className="badge nodot muted">{TADBIR[v.tadbirTuri]}</span>
      </div>

      <div className="kt-sec">
        <h4>Oqim</h4>
        <DL items={[
          ['Sanalar', `${sana(o.boshlanish)} — ${sana(o.tugash)}`],
          ['Qabul muddati', `${sana(o.qabulTugash)} gacha`],
          ['Shakl', SHAKL[v.shakl]],
          ['Joy', o.joy],
          ['Hudud', hududYoki(q)],
          ['Hajm', `${v.soatNazariy} soat nazariy + ${v.soatAmaliy} soat amaliy`],
          ['Moliyalashtirish', `${MOLIYA[o.moliya]} · ${pul(o.narx)}`],
          ['Til', v.til],
          ['Oʻqituvchilar', v.oqituvchilar.join(', ')],
        ]} />
        <div className="mt-12">
          <div className="row between xs muted mb-8"><span>Band oʻrinlar</span><span>{band} / {o.orinlar} · {qoldi ? `${qoldi} oʻrin boʻsh` : 'navbatga yoziladi'}</span></div>
          <Bar v={band} max={o.orinlar} ton={qoldi < 5 ? 'warn' : undefined} />
        </div>
      </div>

      <div className="kt-sec">
        <h4>Maqsad</h4>
        <p className="small sub" style={{ lineHeight: 1.6 }}>{v.maqsad}</p>
      </div>
      <div className="kt-sec">
        <h4>Oʻquv natijalari</h4>
        <ul className="kt-list">{v.natijalar.map((n) => <li key={n}>{n}</li>)}</ul>
      </div>
      <div className="kt-sec">
        <h4>Kim uchun</h4>
        <p className="small sub">
          {v.tinglovchi === 'barchasi' ? 'Oliy va oʻrta maʼlumotli xodimlar' : v.tinglovchi === 'oliy' ? 'Oliy maʼlumotli xodimlar' : 'Oʻrta maʼlumotli xodimlar'}
          {v.mutaxassisliklar.length ? ` · ${v.mutaxassisliklar.map((m) => MUTAXASSISLIKLAR.find((x) => x.id === m)?.nomi).filter(Boolean).join(', ')}` : ' · barcha mutaxassisliklar'}
        </p>
      </div>
      <div className="kt-sec">
        <h4>Dastur tarkibi va baholash</h4>
        {v.darslar.map((d) => (
          <div key={d.id} className="li" style={{ padding: '8px 0' }}>
            <span className="ic brand" style={{ width: 30, height: 30 }}><CheckCircle2 size={15} /></span>
            <span className="grow small">{d.nomi}</span>
            <span className="xs muted">{d.davomiylik} daq</span>
          </div>
        ))}
        <p className="xs muted mt-8">Baholash: {v.baholash.join(', ')}</p>
      </div>
      <div className="pb-note mt-16">
        <Info /> Kredit akkreditatsiyada tasdiqlangan ({v.tasdiqlanganKredit}), dastur amal qiladi: {sana(v.amalMuddati)} gacha. Provayder kreditni oʻzgartira olmaydi.
      </div>
    </Modal>
  )
}
