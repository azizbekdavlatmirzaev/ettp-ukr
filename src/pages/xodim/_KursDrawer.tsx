import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Send, Target } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim, mutNomi, hududNomi } from '@/shared/hooks'
import { Alert, Badge, Bar, Button, Confirm, DL, Holat, Modal } from '@/ui'
import { kursRasmi } from '@/ui/art'
import { pul, sana } from '@/lib/format'
import { KURS_TURI, MOLIYA, SHAKL, TADBIR, YONALISH } from '@/lib/holat'
import { kursInfo, meningYozilishim } from './_parts'

export function KursDrawer({ o, onClose }: { o: T.Oqim | null; onClose: () => void }) {
  return (
    <Modal open={!!o} onClose={onClose} drawer title={o ? 'Kurs tafsilotlari' : ''} sub={o?.kod}>
      {o && <Ichki o={o} onClose={onClose} />}
    </Modal>
  )
}

function Ichki({ o, onClose }: { o: T.Oqim; onClose: () => void }) {
  const { db, shaxs, amal, toast, bugun } = useXodim()
  const nav = useNavigate()
  const [tasdiq, setTasdiq] = useState(false)
  const { v, p, band, bosh, kredit } = kursInfo(db, o)
  const mos = A.mosmi(db, shaxs, v)
  const yoz = meningYozilishim(db, shaxs.id, o.id)
  const ochiq = A.katalogdami(db, o, bugun)
  const yubor = () => {
    const r = amal(A.yozilishYubor, o.id)
    setTasdiq(false)
    if (r) toast({ turi: 'ok', sarlavha: 'Ariza yuborildi', matn: `«${v.nomi}» — provayder koʻrib chiqqach xabar beramiz.` })
  }
  return (
    <div className="col gap-16">
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 150 }}>
        <img src={kursRasmi(v)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 30%,rgba(6,30,48,.75))' }} />
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, color: '#fff' }}>
          <div className="row wrap gap-6 mb-8">
            <Badge ton={v.kursTuri === 'majburiy' ? 'brand' : 'teal'}>{KURS_TURI[v.kursTuri]}</Badge>
            <Badge ton={v.yonalish === 'amaliy' ? 'warn' : 'info'}>{YONALISH[v.yonalish]}</Badge>
            <Badge ton="ok">{kredit} kredit</Badge>
          </div>
          <h2 style={{ color: '#fff' }}>{v.nomi}</h2>
        </div>
      </div>

      {yoz && (
        <Alert ton="info" title="Siz bu oqimga ariza bergansiz" action={<Button size="sm" v="secondary" onClick={() => { onClose(); nav('/xodim/oquv/kurslarim') }}>Mening kurslarim</Button>}>
          Holat: <Holat h={yoz.holat} />
        </Alert>
      )}
      {!mos.ok && <Alert ton="warn" title="Bu kurs sizga mos emas">{mos.sabab} Maʼlumot notoʻgʻri boʻlsa, Reestr maʼlumotini tuzatish uchun murojaat yuboring.</Alert>}
      {!ochiq && !yoz && <Alert ton="warn" title="Qabul yopiq">Bu oqimga qabul muddati tugagan yoki provayder akkreditatsiyasi amalda emas.</Alert>}

      <div>
        <div className="b small mb-8 row gap-6"><Target size={15} /> Maqsad</div>
        <p className="small sub">{v.maqsad}</p>
      </div>
      <div>
        <div className="b small mb-8">Oʻquv natijalari</div>
        <div className="col gap-6">
          {v.natijalar.map((n) => <div key={n} className="row gap-6 small"><CheckCircle2 size={15} color="var(--ok)" /> {n}</div>)}
        </div>
      </div>
      <DL items={[
        ['Provayder', <span className="row wrap gap-6">{p.nomi} <Holat h={p.holat} /></span>],
        ['Akkreditatsiya qarori', p.qaror ? `${p.qaror.raqam}, ${sana(p.qaror.sana)} (amal: ${sana(p.qaror.muddat)} gacha)` : '—'],
        ['Dastur holati', <span className="row gap-6"><Holat h={v.holat} /> {v.amalMuddati && <span className="xs muted">{sana(v.amalMuddati)} gacha</span>}</span>],
        ['Hajm', `${v.soatNazariy} soat nazariy + ${v.soatAmaliy} soat amaliy`],
        ['Tadbir turi / shakl', `${TADBIR[v.tadbirTuri]} · ${SHAKL[v.shakl]}`],
        ['Baholash', v.baholash.join(', ')],
        ['Tinglovchilar', v.tinglovchi === 'barchasi' ? 'Barcha tibbiyot xodimlari' : v.tinglovchi === 'oliy' ? 'Oliy maʼlumotli' : 'Oʻrta maʼlumotli'],
        ['Mutaxassisliklar', v.mutaxassisliklar.length ? v.mutaxassisliklar.map(mutNomi).join(', ') : 'Barcha mutaxassisliklar'],
        ['Oʻqituvchilar', v.oqituvchilar.join(', ')],
        ['Sanalar', `${sana(o.boshlanish)} – ${sana(o.tugash)} · qabul ${sana(o.qabulTugash)} gacha`],
        ['Joy', `${o.joy} (${hududNomi(o.hududId)})`],
        ['Til', v.til],
        ['Narx / moliya', `${pul(o.narx)} · ${MOLIYA[o.moliya]}`],
      ]} />
      <div>
        <div className="row between small mb-8"><span className="muted">Boʻsh oʻrinlar</span><b>{bosh} / {o.orinlar}</b></div>
        <Bar v={band} max={o.orinlar} ton={bosh <= 3 ? 'warn' : undefined} />
      </div>
      <div className="xs muted">Kredit faqat yakuniy baholashdan oʻtib, provayder rahbari natijani tasdiqlagandan soʻng avtomatik yoziladi.</div>
      <div className="row wrap" style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', paddingTop: 8 }}>
        <Button v="primary" icon={<Send />} disabled={!mos.ok || !ochiq || !!yoz} onClick={() => setTasdiq(true)} title={!mos.ok ? mos.sabab : undefined}>
          {yoz ? 'Ariza yuborilgan' : 'Yozilish'}
        </Button>
        <Button v="ghost" onClick={onClose}>Yopish</Button>
      </div>
      <Confirm open={tasdiq} onClose={() => setTasdiq(false)} onOk={yubor} title="Kursga yozilish" okText="Ariza yuborish">
        <p className="small">«{v.nomi}» ({o.kod}) oqimiga ariza yuborilsinmi? Provayder arizani qabul qilgach, sanalar taqvimingizga qoʻshiladi.</p>
        {bosh === 0 && <Alert ton="warn">Boʻsh oʻrin qolmagan — arizangiz navbatga qoʻyilishi mumkin.</Alert>}
      </Confirm>
    </div>
  )
}
