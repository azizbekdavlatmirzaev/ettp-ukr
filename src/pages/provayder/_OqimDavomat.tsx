// Oqim → «Davomat» bandi: mashgʻulot tanlash, jurnal (keldi/kelmadi/uzrli), dars QR-kodi.
import { useEffect, useMemo, useState } from 'react'
import { Save, QrCode, Maximize2, CheckCheck, Monitor } from 'lucide-react'
import { Alert, Badge, Button, Card, CardH, Empty, Inp, Modal, Seg } from '@/ui'
import { QR } from '@/ui/charts'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { sana, sanaVaqt } from '@/lib/format'
import { useProv, Yopiq } from './_umumiy'

type Qator = { holat: T.Davomat['holat'] | ''; dalil: string }

export function DavomatTab({ o }: { o: T.Oqim }) {
  const { db, yozilishlar, amal, toast, operator } = useProv()
  const v = A.versiya(db, o.versiyaId)!
  const bugunM = o.mashgulotlar.find((m) => m.sana.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const [mId, setMId] = useState(bugunM?.id ?? o.mashgulotlar[0]?.id)
  const [katta, setKatta] = useState(false)
  const m = o.mashgulotlar.find((x) => x.id === mId)
  const ting = useMemo(() => yozilishlar.filter((y) => y.oqimId === o.id && ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi'].includes(y.holat)), [yozilishlar, o.id])
  const mavjud = (yId: string) => db.davomat.find((d) => d.yozilishId === yId && d.mashgulotId === mId)
  const [q, setQ] = useState<Record<string, Qator>>({})

  useEffect(() => {
    const r: Record<string, Qator> = {}
    ting.forEach((y) => {
      const d = db.davomat.find((x) => x.yozilishId === y.id && x.mashgulotId === mId)
      r[y.id] = { holat: d?.holat ?? '', dalil: d?.dalil ?? '' }
    })
    setQ(r)
  }, [mId, ting, db.davomat])

  if (!o.mashgulotlar.length) return <Empty title="Mashgʻulotlar yoʻq">Oqim sanalarini kiriting — mashgʻulotlar avtomatik yaratiladi.</Empty>

  const keldi = Object.values(q).filter((x) => x.holat === 'keldi' || x.holat === 'uzrli').length
  const saqla = () => {
    const qat = ting.filter((y) => q[y.id]?.holat).map((y) => ({ yozilishId: y.id, holat: q[y.id].holat as T.Davomat['holat'], dalil: q[y.id].dalil.trim() || undefined }))
    if (!qat.length) return toast({ turi: 'warn', matn: 'Hech bir tinglovchi uchun belgi qoʻyilmagan.' })
    const uzrsiz = qat.find((x) => x.holat === 'uzrli' && !x.dalil)
    if (uzrsiz) return toast({ turi: 'warn', sarlavha: 'Uzrli sabab dalili yoʻq', matn: 'Uzrli deb belgilangan tinglovchi uchun hujjat raqami yoki izoh kiriting.' })
    const t0 = performance.now()
    const r = amal((d, c) => {
      A.davomatSaqla(d, c, o.id, mId!, qat)
      return true
    })
    if (r) toast({ turi: 'ok', sarlavha: 'Davomat saqlandi', matn: `${qat.length} ta tinglovchi · ${Math.max(1, Math.round(performance.now() - t0))} ms (reglament: 2 soniya)` })
  }

  return (
    <div className="grid g-main">
      <Card>
        <CardH icon={<CheckCheck />} title="Elektron jurnal" sub={m ? `${sana(m.sana)} · ${m.mavzu}` : ''} right={v.shakl !== 'oflayn' ? <Badge ton="info"><Monitor size={12} /> Manba: LMS + jurnal</Badge> : <Badge ton="muted">Manba: QR + jurnal</Badge>} />
        <div className="row wrap gap-6 mb-12">
          {o.mashgulotlar.map((x, i) => {
            const soni = db.davomat.filter((d) => d.mashgulotId === x.id).length
            return (
              <button key={x.id} className={`chip ${x.id === mId ? 'on' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setMId(x.id)} title={x.mavzu}>
                {i + 1}-dars · {sana(x.sana).slice(0, 5)} {soni ? `· ${soni}` : ''}
              </button>
            )
          })}
        </div>
        {!operator && <Alert ton="info">Davomatni provayder operatori kiritadi. Rahbar faqat koʻradi.</Alert>}
        {ting.length ? (
          <div className="col gap-4 mt-8">
            {ting.map((y) => {
              const s = A.shaxs(db, y.personId)!
              const d = mavjud(y.id)
              const r = q[y.id] ?? { holat: '', dalil: '' }
              return (
                <div key={y.id} className="li" style={{ flexWrap: 'wrap' }}>
                  <div className="grow" style={{ minWidth: 160 }}>
                    <div className="b small">{A.toliqFio(s)}</div>
                    <div className="xs muted">{d ? `${d.usul} · ${sanaVaqt(d.vaqt)} · ${d.kiritgan}` : 'belgi yoʻq'}</div>
                  </div>
                  <Seg<T.Davomat['holat'] | ''>
                    id={`dv-${y.id}`}
                    value={r.holat}
                    onChange={(h) => operator && setQ({ ...q, [y.id]: { ...r, holat: h } })}
                    items={[{ v: 'keldi', l: 'Keldi' }, { v: 'kelmadi', l: 'Kelmadi' }, { v: 'uzrli', l: 'Uzrli' }]}
                  />
                  {r.holat === 'uzrli' && <Inp style={{ maxWidth: 220 }} value={r.dalil} disabled={!operator} onChange={(e) => setQ({ ...q, [y.id]: { ...r, dalil: e.target.value } })} placeholder="Dalil: hujjat №, izoh" aria-label="Uzrli sabab dalili" />}
                </div>
              )
            })}
          </div>
        ) : (
          <Empty title="Qabul qilingan tinglovchi yoʻq">«Tinglovchilar» bandida arizalarni qabul qiling.</Empty>
        )}
        <div className="card-f row between wrap">
          <span className="small">Belgilangan: <b>{Object.values(q).filter((x) => x.holat).length}</b> / {ting.length} · qatnashgan {keldi}</span>
          {operator ? (
            <div className="row wrap">
              <Button size="sm" v="ghost" onClick={() => setQ(Object.fromEntries(ting.map((y) => [y.id, { holat: 'keldi' as const, dalil: q[y.id]?.dalil ?? '' }])))}>Hammasi keldi</Button>
              <Button size="sm" v="primary" icon={<Save />} onClick={saqla}>Saqlash</Button>
            </div>
          ) : (
            <Yopiq>Faqat operator saqlaydi</Yopiq>
          )}
        </div>
      </Card>

      <Card delay={0.06}>
        <CardH icon={<QrCode />} title="Dars QR-kodi" sub="Tinglovchilar telefonidan skanerlaydi (Xodim → QR davomat)" right={<Button size="xs" v="ghost" icon={<Maximize2 />} onClick={() => setKatta(true)}>Katta ekran</Button>} />
        {m && (
          <div className="col" style={{ alignItems: 'center', textAlign: 'center' }}>
            <QR matn={m.qrKod} size={220} />
            <div className="code" style={{ width: '100%', textAlign: 'center' }}>{m.qrKod}</div>
            <div className="xs muted">{sana(m.sana)} · {m.mavzu}</div>
            <Alert ton="info">QR skanerlashning oʻzi kredit bermaydi — baholash sharti ham bajarilishi kerak.</Alert>
          </div>
        )}
      </Card>

      <Modal open={katta} onClose={() => setKatta(false)} title="Dars QR-kodi" sub={m ? `${o.kod} · ${sana(m.sana)} · ${m.mavzu}` : ''} size="lg">
        {m && (
          <div className="col" style={{ alignItems: 'center', padding: 12 }}>
            <QR matn={m.qrKod} size={340} />
            <div className="stat-big mono" style={{ fontSize: 20 }}>{m.qrKod}</div>
            <div className="muted small">Ekranni tinglovchilarga koʻrsating — skanerlangach davomat avtomatik yoziladi.</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
