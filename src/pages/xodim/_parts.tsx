// Xodim kabineti uchun umumiy komponentlar va yordamchilar
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Building2, CalendarDays, Clock, QrCode, ScanLine, CheckCircle2 } from 'lucide-react'
import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { useJoriy } from '@/shared/hooks'
import { Alert, Badge, Bar, Button, Card, Field, Inp, Modal } from '@/ui'
import { kursRasmi } from '@/ui/art'
import { sana, sanaVaqt } from '@/lib/format'
import { KURS_TURI, SHAKL, YONALISH } from '@/lib/holat'

export const OYLAR = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
export const FAOL_HOLAT: T.YozilishHolat[] = ['yuborildi', 'qabul_qilindi', 'navbatda', 'oqimoqda']
export const OCHIQ_KURS: T.YozilishHolat[] = ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi']

export function kursInfo(db: DB, o: T.Oqim) {
  const v = A.versiya(db, o.versiyaId)!
  const p = A.provayder(db, o.providerId)!
  const band = A.bandOrinlar(db, o.id)
  return { v, p, band, bosh: Math.max(0, o.orinlar - band), kredit: v.tasdiqlanganKredit ?? v.soralganKredit }
}

/** Shaxsning oqimdagi amaldagi yozilishi (rad etilgan/chiqqanlar hisobga olinmaydi) */
export function meningYozilishim(db: DB, personId: string | undefined, oqimId: string) {
  return db.yozilishlar.find((y) => y.personId === personId && y.oqimId === oqimId && !['rad_etildi', 'chiqdi'].includes(y.holat))
}

/** Oylar boʻyicha kredit (yozuv sanasi boʻyicha) va yigʻma */
export function oylikKredit(db: DB, personId: string, yil: number) {
  const oy = Array(12).fill(0) as number[]
  db.jurnal.filter((j) => j.personId === personId && j.yil === yil).forEach((j) => {
    const m = j.manba === 'otkazish' ? 0 : Number(j.sana.slice(5, 7)) - 1
    if (m >= 0 && m < 12) oy[m] += j.miqdor
  })
  let jami = 0
  return oy.map((k, i) => {
    jami += k
    return { x: OYLAR[i], kredit: Math.round(k * 10) / 10, jami: Math.round(jami * 10) / 10 }
  })
}

/** Kurs tavsiyalari: avval yetishmayotgan ulushlar (majburiy/amaliy), keyin mutaxassislik */
export function tavsiyalar(db: DB, s: T.Shaxs, h: T.YillikHolat, bugun: string, soni = 3) {
  const majKam = h.majburiy < h.majburiyKerak
  const amalKam = h.amaliy < h.amaliyKerak
  return db.oqimlar
    .filter((o) => A.katalogdami(db, o, bugun) && !meningYozilishim(db, s.id, o.id))
    .map((o) => {
      const v = A.versiya(db, o.versiyaId)!
      if (!A.mosmi(db, s, v).ok) return null
      let ball = 0
      const sabab: string[] = []
      if (majKam && v.kursTuri === 'majburiy') { ball += 3; sabab.push('majburiy ulush yetishmaydi') }
      if (amalKam && v.yonalish === 'amaliy') { ball += 3; sabab.push('amaliy ulush yetishmaydi') }
      if (v.mutaxassisliklar.includes(s.mutaxassislikId)) { ball += 1; sabab.push('mutaxassisligingizga mos') }
      return { o, v, ball, sabab }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.ball - a.ball || a.o.boshlanish.localeCompare(b.o.boshlanish))
    .slice(0, soni)
}

/** Faol oqimlardagi mashgʻulotlar (kelgusi), vaqt boʻyicha */
export function keyingiMashgulotlar(db: DB, personId: string, bugunISO: string) {
  return db.yozilishlar
    .filter((y) => y.personId === personId && ['qabul_qilindi', 'oqimoqda'].includes(y.holat))
    .flatMap((y) => {
      const o = A.oqim(db, y.oqimId)!
      const v = A.versiya(db, o.versiyaId)!
      return o.mashgulotlar.map((m) => ({ m, o, v, y }))
    })
    .filter((x) => x.m.sana.slice(0, 10) >= bugunISO)
    .sort((a, b) => a.m.sana.localeCompare(b.m.sana))
}

/** Demo QR kodlar: bugungi (yoki eng yaqin, hali qayd etilmagan) mashgʻulot kodi */
export function demoQrKodlar(db: DB, personId: string, bugunISO: string) {
  return db.yozilishlar
    .filter((y) => y.personId === personId && ['qabul_qilindi', 'oqimoqda'].includes(y.holat))
    .map((y) => {
      const o = A.oqim(db, y.oqimId)!
      const v = A.versiya(db, o.versiyaId)!
      const qayd = new Set(db.davomat.filter((d) => d.yozilishId === y.id).map((d) => d.mashgulotId))
      const m = o.mashgulotlar.find((x) => x.sana.slice(0, 10) === bugunISO) ?? o.mashgulotlar.find((x) => !qayd.has(x.id)) ?? o.mashgulotlar[o.mashgulotlar.length - 1]
      return m ? { kod: m.qrKod, nomi: v.nomi, sana: m.sana, qayd: qayd.has(m.id) } : null
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
}

export function Rasm({ src, h = 72, w = 96, r = 12 }: { src: string; h?: number; w?: number; r?: number }) {
  return <img src={src} alt="" loading="lazy" style={{ width: w, height: h, objectFit: 'cover', borderRadius: r, flex: 'none', background: 'var(--surface-3)' }} />
}

/** Katalog kurs kartasi */
export function KursKarta({ o, onOpen, children, izoh }: { o: T.Oqim; onOpen?: () => void; children?: ReactNode; izoh?: ReactNode }) {
  const { db } = useJoriy()
  const { v, p, band, bosh, kredit } = kursInfo(db, o)
  return (
    <Card className="course" hover onClick={onOpen}>
      <div className="cover">
        <img src={kursRasmi(v)} alt="" loading="lazy" />
        <div className="ov2" />
        <div className="tl2">
          <Badge ton={v.kursTuri === 'majburiy' ? 'brand' : 'teal'}>{KURS_TURI[v.kursTuri]}</Badge>
          <Badge ton={v.yonalish === 'amaliy' ? 'warn' : 'info'}>{YONALISH[v.yonalish]}</Badge>
        </div>
        <div className="cr">{kredit} kredit</div>
      </div>
      <div className="body">
        <div className="prov">
          <Building2 size={13} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.qisqa}</span>
          {A.akkFaolmi(p) && <Badge ton="ok">Akkreditatsiyalangan</Badge>}
        </div>
        <h3>{v.nomi}</h3>
        <div className="row wrap gap-6 xs muted">
          <CalendarDays size={13} /> {sana(o.boshlanish)} – {sana(o.tugash)}
          <span>· {SHAKL[v.shakl]}</span>
          <span className="row gap-4"><Clock size={12} /> {v.soatNazariy + v.soatAmaliy} soat</span>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className="row between xs mb-8" style={{ marginBottom: 4 }}>
            <span className="muted">Boʻsh oʻrinlar</span>
            <b>{bosh} / {o.orinlar}</b>
          </div>
          <Bar v={band} max={o.orinlar} thin ton={bosh <= 3 ? 'warn' : undefined} />
        </div>
        {izoh}
        {children}
      </div>
    </Card>
  )
}

/** QR davomat — mashgʻulot QR-kodini skanerlash yoki kiritish (A.qrDavomat) */
export function QrDavomatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, user, amal, toast, bugun } = useJoriy()
  const [kod, setKod] = useState('')
  const [skan, setSkan] = useState(false)
  const [natija, setNatija] = useState<{ nomi: string; mavzu: string; takror: boolean; sana: string } | null>(null)
  const demo = useMemo(() => demoQrKodlar(db, user.personId ?? '', bugun), [db, user.personId, bugun])
  useEffect(() => {
    if (open) {
      setKod('')
      setNatija(null)
      setSkan(false)
    }
  }, [open])
  const yubor = (k = kod) => {
    if (!k.trim()) return
    const r = amal(A.qrDavomat, k)
    if (r) {
      const v = A.versiya(db, r.oqim.versiyaId)
      setNatija({ nomi: v?.nomi ?? r.oqim.kod, mavzu: r.m.mavzu, takror: r.takror, sana: r.m.sana })
      toast({ turi: r.takror ? 'info' : 'ok', sarlavha: r.takror ? 'Davomat avval qayd etilgan' : 'Davomat qayd etildi', matn: `${v?.nomi ?? ''} — ${sana(r.m.sana)}` })
    }
  }
  const kamera = () => {
    setSkan(true)
    setTimeout(() => {
      setSkan(false)
      const k = demo[0]?.kod
      if (k) {
        setKod(k)
        yubor(k)
      } else toast({ turi: 'warn', matn: 'Kamerada QR-kod aniqlanmadi. Kodni qoʻlda kiriting.' })
    }, 1400)
  }
  return (
    <Modal open={open} onClose={onClose} title="QR davomat" sub="Mashgʻulot zalidagi QR-kodni skanerlang yoki kodni kiriting" footer={<><Button v="ghost" onClick={onClose}>Yopish</Button><Button v="primary" icon={<QrCode />} disabled={!kod.trim()} onClick={() => yubor()}>Davomatni qayd etish</Button></>}>
      <div className="col gap-16">
        <div style={{ position: 'relative', height: 170, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#0a3a5c,#0f9a9a)', display: 'grid', placeItems: 'center', color: '#fff' }}>
          <div style={{ width: 120, height: 120, border: '3px solid rgba(255,255,255,.85)', borderRadius: 18, position: 'relative', display: 'grid', placeItems: 'center' }}>
            {natija ? <CheckCircle2 size={54} /> : <QrCode size={54} style={{ opacity: 0.8 }} />}
            {skan && <motion.div style={{ position: 'absolute', left: 6, right: 6, height: 3, background: '#7ff0e6', borderRadius: 3, boxShadow: '0 0 12px #7ff0e6' }} initial={{ top: 8 }} animate={{ top: [8, 108, 8] }} transition={{ duration: 1.4, ease: 'easeInOut' }} />}
          </div>
          <div className="xs" style={{ position: 'absolute', bottom: 8, opacity: 0.85 }}>{skan ? 'Skanerlanmoqda…' : 'Kamera imitatsiyasi'}</div>
        </div>
        <Button v="soft" icon={<ScanLine />} onClick={kamera} loading={skan} block>Kamera orqali skanerlash (imitatsiya)</Button>
        <Field label="QR-kod matni" help="Kod har bir mashgʻulot uchun alohida beriladi">
          <Inp value={kod} onChange={(e) => setKod(e.target.value)} placeholder="ETTP-QR-…" className="mono" onKeyDown={(e) => e.key === 'Enter' && yubor()} />
        </Field>
        {demo.length > 0 && (
          <div>
            <div className="xs muted mb-8">Demo uchun bugungi kodlar (bosing):</div>
            <div className="row wrap gap-6">
              {demo.map((d) => (
                <button key={d.kod} className="chip" onClick={() => setKod(d.kod)} title={d.nomi}>
                  <QrCode /> demo: <span className="mono">{d.kod}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {natija && (
          <Alert ton={natija.takror ? 'info' : 'ok'} title={natija.takror ? 'Bu mashgʻulot uchun davomat avval qayd etilgan' : 'Davomat qayd etildi'}>
            {natija.nomi} · {natija.mavzu} · {sanaVaqt(natija.sana)}
          </Alert>
        )}
        <div className="xs muted">Davomat QR orqali faqat shu oqim tinglovchisi uchun qayd etiladi. Bir vaqtda ikki joyda qayd etish sifat nazorati signaliga tushadi.</div>
      </div>
    </Modal>
  )
}

/** Manba belgisi */
export function Manba({ m }: { m: string }) {
  return <span className="tag" style={{ fontWeight: 500 }}>Manba: {m}</span>
}
