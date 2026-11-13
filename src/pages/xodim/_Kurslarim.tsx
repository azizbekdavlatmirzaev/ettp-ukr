import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, CalendarClock, PlayCircle, Star, Undo2 } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Bar, Button, Card, Confirm, Empty, Field, Holat, Modal, Seg, Stagger, Txt, staggerItem } from '@/ui'
import { kursRasmi } from '@/ui/art'
import { sana, sanaVaqt } from '@/lib/format'
import { OCHIQ_KURS, Rasm } from './_parts'
import { useBajar } from './_bajar'

type Guruh = 'barchasi' | 'faol' | 'tugagan' | 'bekor'
const GURUH: Record<Exclude<Guruh, 'barchasi'>, T.YozilishHolat[]> = {
  faol: ['yuborildi', 'qabul_qilindi', 'navbatda', 'oqimoqda'],
  tugagan: ['tugatdi', 'otmadi'],
  bekor: ['rad_etildi', 'chiqdi'],
}

export function Kurslarim() {
  const { db, shaxs, toast } = useXodim()
  const bajar = useBajar()
  const nav = useNavigate()
  const [g, setG] = useState<Guruh>('faol')
  const [bekor, setBekor] = useState<T.Yozilish | null>(null)
  const [sor, setSor] = useState<T.Yozilish | null>(null)
  const hammasi = useMemo(() => db.yozilishlar.filter((y) => y.personId === shaxs.id).sort((a, b) => b.yuborilgan.localeCompare(a.yuborilgan)), [db.yozilishlar, shaxs.id])
  const rows = g === 'barchasi' ? hammasi : hammasi.filter((y) => GURUH[g].includes(y.holat))
  const n = (k: Exclude<Guruh, 'barchasi'>) => hammasi.filter((y) => GURUH[k].includes(y.holat)).length

  return (
    <div className="col gap-16">
      <Seg id="kurslarim" value={g} onChange={setG} items={[
        { v: 'faol', l: `Faol (${n('faol')})` },
        { v: 'tugagan', l: `Tugagan (${n('tugagan')})` },
        { v: 'bekor', l: `Bekor/rad (${n('bekor')})` },
        { v: 'barchasi', l: `Barchasi (${hammasi.length})` },
      ]} />
      {rows.length === 0 ? (
        <Card><Empty title="Bu boʻlimda kurs yoʻq" action={<Button v="primary" onClick={() => nav('/xodim/oquv')}>Katalogdan tanlash</Button>}>Katalogdan mos kursni tanlab ariza yuboring.</Empty></Card>
      ) : (
        <Stagger className="col gap-16">
          {rows.map((y) => {
            const o = A.oqim(db, y.oqimId)!
            const v = A.versiya(db, o.versiyaId)!
            const p = A.provayder(db, o.providerId)!
            const ochiq = OCHIQ_KURS.includes(y.holat)
            const df = ochiq ? A.davomatFoizi(db, y) : 0
            const keyingi = o.mashgulotlar.find((m) => m.sana.slice(0, 10) >= new Date().toISOString().slice(0, 10))
            const natija = db.natijalar.find((x) => x.yozilishId === y.id)
            const sert = natija && db.sertifikatlar.find((s) => s.natijaId === natija.id)
            return (
              <motion.div key={y.id} variants={staggerItem}>
                <Card>
                  <div className="row top wrap" style={{ gap: 16 }}>
                    <Rasm src={kursRasmi(v)} w={110} h={82} />
                    <div className="grow col gap-6" style={{ minWidth: 220, flex: '1 1 260px' }}>
                      <div className="row wrap gap-6"><Holat h={y.holat} /><span className="xs muted">{o.kod} · {p.qisqa}</span></div>
                      <h3>{v.nomi}</h3>
                      <div className="xs muted row wrap gap-6"><CalendarClock size={13} /> {sana(o.boshlanish)} – {sana(o.tugash)} · ariza {sanaVaqt(y.yuborilgan)}</div>
                      {y.sabab && <div className="xs" style={{ color: 'var(--err)' }}>Sabab: {y.sabab}</div>}
                      {ochiq && (
                        <div className="grid g2 mt-4" style={{ gap: 12 }}>
                          <div>
                            <div className="row between xs mb-8" style={{ marginBottom: 4 }}><span className="muted">Darslar</span><b>{y.progress.length}/{v.darslar.length}</b></div>
                            <Bar v={y.progress.length} max={v.darslar.length} thin />
                          </div>
                          <div>
                            <div className="row between xs" style={{ marginBottom: 4 }}><span className="muted">Davomat</span><b>{df}%</b></div>
                            <Bar v={df} thin ton={df < 75 ? 'warn' : 'ok'} />
                          </div>
                        </div>
                      )}
                      {ochiq && keyingi && ['qabul_qilindi', 'oqimoqda'].includes(y.holat) && <div className="xs">Keyingi mashgʻulot: <b>{sanaVaqt(keyingi.sana)}</b> — {keyingi.mavzu}</div>}
                      {y.sorovnoma && <div className="xs muted">Soʻrovnoma topshirilgan: {'★'.repeat(y.sorovnoma.baho)}{'☆'.repeat(5 - y.sorovnoma.baho)}</div>}
                    </div>
                    <div className="col gap-6" style={{ flex: '0 0 auto' }}>
                      {ochiq && <Button v="primary" size="sm" icon={<PlayCircle />} onClick={() => nav(`/xodim/kurs/${o.id}`)}>Kursni ochish</Button>}
                      {['yuborildi', 'qabul_qilindi', 'navbatda'].includes(y.holat) && <Button v="ghost" size="sm" icon={<Undo2 />} onClick={() => setBekor(y)}>Arizani qaytarib olish</Button>}
                      {['tugatdi', 'otmadi'].includes(y.holat) && !y.sorovnoma && <Button v="soft" size="sm" icon={<Star />} onClick={() => setSor(y)}>Soʻrovnoma</Button>}
                      {sert && <Button v="secondary" size="sm" icon={<Award />} onClick={() => nav('/xodim/hujjatlar')}>Sertifikat {sert.seriya} {sert.raqam}</Button>}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </Stagger>
      )}
      <Confirm open={!!bekor} onClose={() => setBekor(null)} ton="danger" okText="Qaytarib olish" title="Arizani qaytarib olish"
        onOk={() => { if (bekor && bajar(A.yozilishBekor, bekor.id)) toast({ turi: 'ok', matn: 'Ariza qaytarib olindi.' }); setBekor(null) }}>
        <p className="small">Arizani qaytarib olsangiz, oʻrningiz boshqa tinglovchiga beriladi. Keyin qayta ariza berishingiz mumkin (qabul ochiq boʻlsa).</p>
      </Confirm>
      <Sorovnoma y={sor} onClose={() => setSor(null)} />
    </div>
  )
}

function Sorovnoma({ y, onClose }: { y: T.Yozilish | null; onClose: () => void }) {
  const { toast } = useXodim()
  const bajar = useBajar()
  const [baho, setBaho] = useState(0)
  const [izoh, setIzoh] = useState('')
  const yubor = () => {
    if (!y) return
    if (bajar(A.sorovnoma, y.id, baho, izoh)) {
      toast({ turi: 'ok', sarlavha: 'Rahmat!', matn: 'Anonim soʻrovnoma qabul qilindi. Provayder reytingi yangilandi.' })
      setBaho(0)
      setIzoh('')
      onClose()
    }
  }
  return (
    <Modal open={!!y} onClose={onClose} title="Anonim soʻrovnoma" sub="Javobingiz provayderga ism-sharifsiz, faqat oʻrtacha baho sifatida koʻrinadi"
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" disabled={!baho} onClick={yubor}>Yuborish</Button></>}>
      <div className="col gap-16">
        <Field label="Kurs sifatini baholang (1–5)" req>
          <div className="row gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.button key={i} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setBaho(i)} aria-label={`${i} ball`} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
                <Star size={32} fill={i <= baho ? '#e8a33d' : 'none'} color={i <= baho ? '#e8a33d' : 'var(--border-strong)'} />
              </motion.button>
            ))}
          </div>
        </Field>
        <Field label="Izoh (ixtiyoriy)">
          <Txt rows={3} value={izoh} onChange={(e) => setIzoh(e.target.value)} placeholder="Nima yoqdi, nimani yaxshilash kerak?" />
        </Field>
      </div>
    </Modal>
  )
}
