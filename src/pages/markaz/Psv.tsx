import { useEffect, useState } from 'react'
import { FileSearch, Send, FileDown, Truck, ShieldCheck, CreditCard, Database } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Badge, Button, Confirm, DL, Field, Holat, Inp, KPI, Modal, PageHeader, Sel } from '@/ui'
import { pul, sana, sanaVaqt } from '@/lib/format'
import { PSV_HUJJAT, holat as holatMatn } from '@/lib/holat'
import { sertifikatPdf } from '@/lib/eksport'
import { useMarkaz, manba, RolTugma, MUT_SABAB, shaxsQisqa, Sec } from './_parts'

const SORUVCHI: Record<T.PsvIsh['soruvchi'], string> = { shaxs: 'Shaxsning oʻzi', vakil: 'Vakil', xorijiy_tashkilot: 'Xorijiy tashkilot' }
type Javob = 'tasdiqlandi' | 'farq' | 'tasdiqlanmadi'

export default function MarkazPsv() {
  const { db, mutaxassis, ijro, ok, amal, bugun } = useMarkaz()
  const [tanl, setTanl] = useState<string>()
  const [oyna, setOyna] = useState<'' | 'sorov' | 'hisobot'>('')
  const [javobTuri, setJavobTuri] = useState<string>()
  const [jv, setJv] = useState<{ holat: Javob; xat: string; sana: string }>({ holat: 'tasdiqlandi', xat: '', sana: bugun })
  const [usul, setUsul] = useState<'API' | 'pochta' | 'arizachi'>('API')
  const p = db.psv.find((x) => x.id === tanl)
  useEffect(() => setJv({ holat: 'tasdiqlandi', xat: '', sana: bugun }), [javobTuri, bugun])
  const kutilmoqda = p ? p.hujjatlar.filter((h) => h.holat === 'kutilmoqda') : []
  const sert = p?.hisobotId ? db.sertifikatlar.find((s) => s.id === p.hisobotId) : undefined

  const billing = () => { if (!p) return; const r = ijro(A.psvBillingCallback, p.id); if (r.ok) ok('Yagona billingdan toʻlov tasdigʻi qabul qilindi (imitatsiya).') }
  const sorov = () => {
    if (!p) return
    const r = ijro(A.psvManbaSorov, p.id)
    setOyna('')
    if (r.ok) ok('Ichki manbalar (Reestr, UKR) avtomatik javob berdi; tashqi manbalarga rasmiy soʻrov yuborildi.', p.raqam)
  }
  const javob = () => {
    if (!p || !javobTuri) return
    const r = ijro(A.psvJavob, p.id, javobTuri, jv.holat, `Xat № ${jv.xat}, ${sana(jv.sana)}`)
    if (r.ok) { ok(`${PSV_HUJJAT[javobTuri]}: manba javobi qayd etildi.`); setJavobTuri(undefined) }
  }
  const hisobot = () => {
    if (!p) return
    const r = ijro(A.psvHisobot, p.id)
    setOyna('')
    if (r.ok && r.r) ok(`PSV hisoboti ${r.r.seriya} ${r.r.raqam} ERI bilan yaratildi.`, p.raqam)
  }
  const yuklab = async () => {
    if (!sert) return
    await sertifikatPdf(sert, db.sozlamalar.sertifikatShablon)
    amal(A.eksportQayd, `PSV hisoboti ${sert.raqam} (PDF)`, 1)
    ok('PSV hisoboti PDF yuklandi. Eksport auditga yozildi.')
  }
  const yetkaz = () => { if (!p) return; const r = ijro(A.psvYetkaz, p.id, usul); if (r.ok) ok(`Hisobot ${p.qabulQiluvchi} ga yetkazildi (${usul}).`) }

  return (
    <>
      <PageHeader title="PSV — birlamchi manbadan tasdiqlash" desc="Diplom, mutaxassislik, toifa, staj, UKR va davlat roʻyxati maʼlumotlarini rasmiy manbalardan tasdiqlash. Faqat shaxs roziligi va toʻlov tasdigʻi bilan." source={manba('PSV ishlari, HEMIS, Reestr, mehnat tizimi, billing')} />
      <div className="grid g4 mb-16">
        <KPI icon={<FileSearch />} label="Ochiq ishlar" value={db.psv.filter((x) => !['yetkazildi', 'rad_etildi'].includes(x.holat)).length} />
        <KPI icon={<Database />} label="Manba javobi kutilmoqda" value={db.psv.reduce((s, x) => s + x.hujjatlar.filter((h) => h.holat === 'kutilmoqda').length, 0)} ton="warn" delay={0.05} />
        <KPI icon={<CreditCard />} label="Toʻlov kutilmoqda" value={db.psv.filter((x) => x.tolov.holat === 'kutilmoqda').length} ton="err" delay={0.1} />
        <KPI icon={<Truck />} label="Yetkazilgan" value={db.psv.filter((x) => x.holat === 'yetkazildi').length} ton="ok" delay={0.15} />
      </div>
      <DataTable
        rows={[...db.psv].reverse()}
        exportName="psv-ishlari"
        onRow={(r) => setTanl(r.id)}
        search={(r) => `${r.raqam} ${r.qabulQiluvchi} ${shaxsQisqa(db, r.personId)}`}
        filters={[{ k: 'h', l: 'Holat', options: ['yangi', 'manba_sorovi', 'javob_kutilmoqda', 'hisobot_tayyor', 'yetkazildi', 'rad_etildi'].map((v) => ({ v, l: holatMatn(v)[0] })), get: (r) => r.holat }]}
        cols={[
          { k: 'raqam', l: 'Raqam', r: (r) => <span className="mono xs b">{r.raqam}</span>, excel: (r) => r.raqam },
          { k: 'shaxs', l: 'Shaxs', r: (r) => shaxsQisqa(db, r.personId), excel: (r) => shaxsQisqa(db, r.personId) },
          { k: 'sor', l: 'Soʻruvchi', r: (r) => <span className="tag">{SORUVCHI[r.soruvchi]}</span>, excel: (r) => SORUVCHI[r.soruvchi] },
          { k: 'qq', l: 'Qabul qiluvchi', r: (r) => <span className="small">{r.qabulQiluvchi}</span>, excel: (r) => r.qabulQiluvchi },
          { k: 'huj', l: 'Hujjatlar', align: 'center', r: (r) => `${r.hujjatlar.filter((h) => h.holat !== 'kutilmoqda').length}/${r.hujjatlar.length}`, excel: (r) => r.hujjatlar.length },
          { k: 'tolov', l: 'Toʻlov', r: (r) => <Holat h={r.tolov.holat} />, excel: (r) => r.tolov.holat },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, excel: (r) => holatMatn(r.holat)[0] },
        ]}
      />
      <Modal open={!!p} onClose={() => setTanl(undefined)} drawer title={p?.raqam ?? ''} sub={p && <span className="row gap-6"><Holat h={p.holat} /><span className="small">{p.qabulQiluvchi}</span></span>}
        footer={p && p.holat !== 'yetkazildi' && (
          <div className="mk-actions">
            <RolTugma ruxsat={mutaxassis && p.tolov.holat !== 'kutilmoqda' && kutilmoqda.length > 0} sabab={!mutaxassis ? MUT_SABAB : p.tolov.holat === 'kutilmoqda' ? 'Toʻlov tizimidan tasdiq kelmagan — soʻrov yuborilmaydi.' : 'Barcha manbalar javob bergan.'} v="soft" icon={<Send />} onClick={() => setOyna('sorov')}>Manbalarga soʻrov yuborish</RolTugma>
            {!p.hisobotId && <RolTugma ruxsat={kutilmoqda.length === 0 && !p.rozilik.bekor} sabab={p.rozilik.bekor ? 'Shaxs roziligini bekor qilgan.' : `Manba javobi kutilmoqda: ${kutilmoqda.map((h) => PSV_HUJJAT[h.turi]).join(', ')}.`} v="primary" icon={<ShieldCheck />} onClick={() => setOyna('hisobot')}>Hisobot yaratish (ERI)</RolTugma>}
            {sert && <Button v="secondary" icon={<FileDown />} onClick={yuklab}>Hisobot PDF</Button>}
            {p.hisobotId && (
              <span className="row gap-6">
                <Sel style={{ width: 'auto' }} value={usul} onChange={(e) => setUsul(e.target.value as typeof usul)} options={[{ v: 'API', l: 'API orqali' }, { v: 'pochta', l: 'Rasmiy pochta' }, { v: 'arizachi', l: 'Arizachiga' }]} />
                <Button v="success" icon={<Truck />} onClick={yetkaz}>Yetkazish</Button>
              </span>
            )}
          </div>
        )}>
        {p && (
          <>
            <DL items={[['Shaxs', shaxsQisqa(db, p.personId)], ['Soʻruvchi', SORUVCHI[p.soruvchi]], ['Qabul qiluvchi', p.qabulQiluvchi], ['Maqsad', p.maqsad], ['Yaratilgan', sanaVaqt(p.yaratilgan)], ['Yetkazish', p.yetkazish ? `${p.yetkazish.usul} · ${sanaVaqt(p.yetkazish.sana)}` : '—']]} />
            <Sec icon={<ShieldCheck />} title="Rozilik">
              {p.rozilik.bekor ? <Alert ton="err">Shaxs roziligini bekor qilgan — maʼlumot uzatilmaydi.</Alert> : <DL items={[['Hajm', p.rozilik.hajm], ['Amal qilish muddati', sana(p.rozilik.muddat)], ['Berilgan', sanaVaqt(p.rozilik.berilgan)]]} />}
            </Sec>
            <Sec icon={<CreditCard />} title="Toʻlov" right={<Holat h={p.tolov.holat} />}>
              <div className="row between wrap">
                <span className="small">Tarif: <b>{pul(p.tolov.tarif)}</b>{p.tolov.hisob && <> · hisob <span className="mono">{p.tolov.hisob}</span></>}</span>
                {p.tolov.holat === 'kutilmoqda' && <Button size="sm" v="ghost" onClick={billing}>Billing javobini olish (imitatsiya)</Button>}
              </div>
              <div className="xs muted mt-4">Toʻlov holati faqat Yagona billing javobi bilan oʻzgaradi — qoʻlda «toʻlandi» qilib boʻlmaydi.</div>
            </Sec>
            <Sec icon={<Database />} title="Manbalar boʻyicha hujjatlar">
              {p.hujjatlar.map((h) => (
                <div key={h.turi} className="li" style={{ alignItems: 'flex-start' }}>
                  <div className="grow">
                    <div className="small b">{PSV_HUJJAT[h.turi]} <span className="tag">{h.manba}</span></div>
                    <div className="xs muted">{h.javob ? `${h.javob} · ${sanaVaqt(h.sana)}` : 'Javob kelmagan'}</div>
                  </div>
                  <div className="col gap-4" style={{ alignItems: 'flex-end' }}>
                    <Holat h={h.holat} />
                    {h.holat === 'kutilmoqda' && <RolTugma size="xs" v="ghost" ruxsat={mutaxassis} sabab={MUT_SABAB} onClick={() => setJavobTuri(h.turi)}>Javobni qayd etish</RolTugma>}
                  </div>
                </div>
              ))}
            </Sec>
            {sert && <Alert ton="ok" title="Hisobot tayyor">{sert.seriya} {sert.raqam} · {sana(sert.sana)} · QR kalit <span className="mono">{sert.qrKalit}</span></Alert>}
          </>
        )}
      </Modal>
      <Modal open={!!javobTuri} onClose={() => setJavobTuri(undefined)} title="Manba javobini qayd etish" sub={javobTuri ? PSV_HUJJAT[javobTuri] : ''}
        footer={<><Button v="ghost" onClick={() => setJavobTuri(undefined)}>Bekor qilish</Button><Button v="primary" disabled={!jv.xat.trim()} onClick={javob}>Saqlash</Button></>}>
        <div className="form-grid">
          <Field label="Natija" req full><Sel value={jv.holat} onChange={(e) => setJv({ ...jv, holat: e.target.value as Javob })} options={[{ v: 'tasdiqlandi', l: 'Tasdiqlandi' }, { v: 'farq', l: 'Farq topildi' }, { v: 'tasdiqlanmadi', l: 'Tasdiqlanmadi' }]} /></Field>
          <Field label="Javob xati raqami" req><Inp value={jv.xat} onChange={(e) => setJv({ ...jv, xat: e.target.value })} placeholder="HEMIS-2026/1123" /></Field>
          <Field label="Xat sanasi" req><Inp type="date" value={jv.sana} onChange={(e) => setJv({ ...jv, sana: e.target.value })} /></Field>
        </div>
        <div className="xs muted mt-12">Javob dalil sifatida saqlanadi va hisobotga kiritiladi.</div>
      </Modal>
      <Confirm open={oyna === 'sorov'} onClose={() => setOyna('')} onOk={sorov} title="Manbalarga soʻrov yuborish" okText="Yuborish">
        <p className="small">Rozilik hajmi doirasida: {p?.rozilik.hajm}. Ichki manbalar darhol javob beradi, tashqilari — rasmiy xat bilan.</p>
      </Confirm>
      <Confirm open={oyna === 'hisobot'} onClose={() => setOyna('')} onOk={hisobot} eri title="PSV hisobotini yaratish" okText="Yaratish">
        {p && <div className="row wrap gap-6">{p.hujjatlar.map((h) => <Badge key={h.turi} ton={h.holat === 'tasdiqlandi' ? 'ok' : 'err'}>{PSV_HUJJAT[h.turi]}: {holatMatn(h.holat)[0]}</Badge>)}</div>}
      </Confirm>
    </>
  )
}
