import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Camera, Code2, KeyRound, QrCode, ScanLine, Search, ShieldCheck } from 'lucide-react'
import { useStore } from '@/domain/store'
import { Button } from '@/ui'
import { PageBand, PublicLayout, Reveal, yangilanganMatn } from './_parts'
import { izla, demoKalitlar, kalitAjrat, type Natija } from './_tekshir'
import { TekshirNatija } from './_TekshirNatija'
import { KameraModal } from './_Kamera'

export default function PublicTekshirish() {
  const db = useStore((s) => s.db)
  const { kalit } = useParams()
  const nav = useNavigate()
  const [matn, setMatn] = useState(kalit ? kalitAjrat(kalit) : '')
  const [natija, setNatija] = useState<{ n: Natija; ms: number; id: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [kamera, setKamera] = useState(false)
  const demo = useMemo(() => demoKalitlar(db), [db])
  const notogri = useMemo(() => 'UKR 2026-9' + String(Math.floor(Math.random() * 90000) + 10000), [])

  const tekshir = useCallback(async (k: string) => {
    const t0 = performance.now()
    setBusy(true)
    // tarmoq kechikishi imitatsiyasi (talab: 2 soniyagacha)
    await new Promise((r) => setTimeout(r, 140 + Math.random() * 160))
    const n = izla(useStore.getState().db, k)
    setNatija({ n, ms: performance.now() - t0, id: Date.now() })
    setBusy(false)
  }, [])

  useEffect(() => {
    if (kalit) {
      const k = kalitAjrat(kalit)
      setMatn(k)
      tekshir(k)
    } else setNatija(null)
  }, [kalit, tekshir])

  const yubor = (k: string) => {
    const t = kalitAjrat(k)
    if (!t) return
    setMatn(t)
    if (kalitAjrat(kalit ?? '') === t) tekshir(t)
    else nav('/tekshirish/' + encodeURIComponent(t))
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    yubor(matn)
  }
  const skanerlandi = useCallback((m: string) => {
    setKamera(false)
    yubor(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kalit])

  return (
    <PublicLayout>
      <PageBand crumb="Sertifikatni tekshirish" icon={<QrCode />} title="Sertifikat va hujjatlarni tekshirish"
        lead="QR-kodni skanerlang yoki seriya-raqamni kiriting. Natija Platformaning yagona yozuvidan olinadi: bekor qilingan hujjat har doim «bekor qilingan» deb koʻrinadi."
        source={`Manba: UKR sertifikatlar moduli · yangilangan: ${yangilanganMatn()}`} />
      <div className="pb-body">
        <div className="pb-wrap">
          <div className="tk-box">
            <motion.div className="pb-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ padding: 24 }}>
              <form className="tk-form" onSubmit={onSubmit}>
                <div className="pb-search">
                  <KeyRound />
                  <input value={matn} onChange={(e) => setMatn(e.target.value)} placeholder="UKR 2026-000123 yoki QR-kalit" aria-label="Sertifikat raqami yoki QR-kalit" autoComplete="off" spellCheck={false} />
                </div>
                <Button v="primary" type="submit" loading={busy} disabled={!matn.trim()} icon={<Search />}>Tekshirish</Button>
                <Button v="secondary" type="button" icon={<Camera />} onClick={() => setKamera(true)}>Skanerlash</Button>
              </form>
              <div className="tk-chips">
                <span className="xs muted">Namunalar:</span>
                {demo.haqiqiy && <button className="chip" onClick={() => yubor(`${demo.haqiqiy!.seriya} ${demo.haqiqiy!.raqam}`)}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--ok)' }} /> Haqiqiy · {demo.haqiqiy.seriya} {demo.haqiqiy.raqam}</button>}
                {demo.bekor && <button className="chip" onClick={() => yubor(demo.bekor!.qrKalit)}><span style={{ width: 8, height: 8, borderRadius: 4, background: demo.bekor.holat === 'bekor_qilingan' ? 'var(--err)' : 'var(--amber-500)' }} /> {demo.bekor.holat === 'bekor_qilingan' ? 'Bekor qilingan' : 'Tuzatilgan'} (QR)</button>}
                <button className="chip" onClick={() => yubor(notogri)}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--text-3)' }} /> Notoʻgʻri · {notogri}</button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {busy ? (
                <motion.div key="yukl" className="tk-res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 28 }}>
                  <div className="row gap-16"><div className="sk" style={{ width: 84, height: 84, borderRadius: '50%' }} /><div className="grow col"><div className="sk" style={{ height: 24, width: 200 }} /><div className="sk" style={{ height: 14 }} /><div className="sk" style={{ height: 14, width: '70%' }} /></div></div>
                </motion.div>
              ) : natija ? (
                <TekshirNatija key={natija.id} n={natija.n} ms={natija.ms} />
              ) : (
                <motion.div key="bosh" className="pb-card mt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: 22, background: 'var(--primary-soft)', color: 'var(--primary)' }}><ScanLine size={32} /></motion.div>
                  <h3 className="mt-12">Hujjat raqamini kiriting yoki QR-kodni skanerlang</h3>
                  <p className="sub small mt-4">Tekshiruv 2 soniyagacha davom etadi. Natijada faqat cheklangan maʼlumot koʻrsatiladi.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid g3 mt-24">
              {[
                { i: <ShieldCheck />, t: 'Yagona yozuv', m: 'Qayta chop etish yangi sertifikat yaratmaydi — QR doim bitta yozuvga olib boradi.' },
                { i: <QrCode />, t: 'Holat tarixi', m: 'Amalda → tuzatilgan → bekor qilingan. Fayl yashirincha almashtirilmaydi.' },
                { i: <Building2 />, t: 'Ish beruvchilar uchun API', m: 'GET /api/ukr/v1/certificates/{seriya-raqam} — raqam boʻyicha avtomatik tekshirish.' },
              ].map((x, k) => (
                <Reveal key={x.t} delay={k * 0.08}>
                  <div className="ld-tr pb-lift" style={{ background: 'var(--surface)' }}>
                    <div className="ic">{x.i}</div>
                    <h3>{x.t}</h3>
                    <p>{x.m}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-16">
              <div className="rs-code"><span className="m">GET</span> /api/ukr/v1/certificates/UKR-2026-000123{'\n\n'}{JSON.stringify({ valid: true, status: 'amalda', series: 'UKR', number: '2026-000123', holder: 'Karimov A. B.', course: 'Oʻtkir koronar sindrom: zamonaviy yondashuvlar', provider: 'Tibbiyot xodimlarini kasbiy rivojlantirish instituti', date: '2026-06-12', hours: 36, credits: 12 }, null, 2)}</div>
              <p className="pb-note mt-8"><Code2 /> Namuna javob: ish beruvchi tizimlari API kaliti bilan soʻrov yuboradi; javobda JSHSHIR boʻlmaydi.</p>
            </Reveal>
          </div>
        </div>
      </div>
      <KameraModal open={kamera} onClose={() => setKamera(false)} onTopildi={skanerlandi} />
    </PublicLayout>
  )
}
