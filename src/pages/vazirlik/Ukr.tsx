import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle2, CircleAlert, Building2, BookOpen, GraduationCap, Award, Globe2, Activity } from 'lucide-react'
import { PageHeader } from '@/ui'
import { EKG } from '@/ui/art'
import { useJoriy } from '@/shared/hooks'
import { sanaVaqt } from '@/lib/format'
import { BOSH_FILTR, TINGLOVCHI_HOLAT, filtrla, oxirgiYangilanish, ulush, useShaxslar, yigma, yilOqimlari, type Filtr } from './_hisob'
import { FiltrPanel, Korsatkich } from './_Korsatkich'
import { MonitoringGrafiklar } from './_Grafiklar'

export default function VazirlikUkr() {
  const { db, bugun, yil } = useJoriy()
  const [f, setF] = useState<Filtr>(BOSH_FILTR(yil))
  const barcha = useShaxslar(db, f.yil, bugun)
  const q = useMemo(() => filtrla(barcha, f), [barcha, f])
  const st = yigma(q)
  const yang = sanaVaqt(oxirgiYangilanish(db))
  const turlar = Array.from(new Set(db.muassasalar.map((m) => m.turi))).sort()
  const yillar = Array.from(new Set([...db.jurnal.map((j) => j.yil), yil])).filter((y) => y <= yil).sort((a, b) => b - a)

  const d = useMemo(() => {
    const ids = new Set(q.map((r) => r.s.id))
    const prov = db.provayderlar.filter((p) => !f.hudud || p.hududId === f.hudud)
    const faolProv = prov.filter((p) => p.holat === 'akkreditatsiyalangan' || p.holat === 'shartli').length
    const provIds = new Set(prov.map((p) => p.id))
    const dasturlar = db.versiyalar.filter((v) => provIds.has(db.dasturlar.find((x) => x.id === v.dasturId)?.providerId ?? '') && (!f.mut || v.mutaxassisliklar.length === 0 || v.mutaxassisliklar.includes(f.mut)) && (!f.daraja || v.tinglovchi === 'barchasi' || v.tinglovchi === f.daraja))
    const oqimlar = yilOqimlari(db, f)
    const oqimIds = new Set(oqimlar.map((o) => o.id))
    const tinglovchi = db.yozilishlar.filter((y) => oqimIds.has(y.oqimId) && TINGLOVCHI_HOLAT.includes(y.holat) && ids.has(y.personId)).length
    const sert = db.sertifikatlar.filter((s) => s.turi === 'UKR' && s.sana.slice(0, 4) === String(f.yil) && ids.has(s.personId) && s.holat !== 'bekor_qilingan').length
    const tan = db.tanOlish.filter((t) => t.yuborilgan.slice(0, 4) === String(f.yil) && ids.has(t.personId))
    return { prov, faolProv, dasturlar, tasdiq: dasturlar.filter((v) => v.holat === 'tasdiqlangan').length, oqimlar, tinglovchi, sert, tan }
  }, [db, f, q])

  const maxrajYoq = st.n === 0
  const kir = `filtr: ${[f.hudud && 'hudud', f.mut && 'mutaxassislik', f.daraja && 'daraja', f.turi && 'muassasa turi'].filter(Boolean).join(', ') || 'yoʻq'}; ${f.yil}-yil`

  return (
    <>
      <PageHeader title="UKR monitoringi" desc="Uzluksiz kasbiy rivojlanish boʻyicha umumiy koʻrsatkichlar (faqat oʻqish). Filtrlar barcha vidjetlarga qoʻllanadi." source={`Manba: Platforma Reestri, HRM, UKR kredit jurnali · yangilangan: ${yang}`} />
      <motion.div className="hero mb-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row between wrap" style={{ position: 'relative', gap: 20 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="sub small row gap-6"><Activity size={15} /> Sogʻliqni saqlash vazirligi · tahlil paneli</div>
            <h1 style={{ margin: '6px 0 8px', fontSize: 26 }}>Tibbiyot xodimlarining uzluksiz kasbiy rivojlanishi — {f.yil}</h1>
            <div className="sub small">Qamrov maxraji — Reestrdagi faol mehnat munosabati bor xodimlar ({yang} holatiga). Maxraj aniqlanmasa koʻrsatkich chiqarilmaydi.</div>
          </div>
          <div className="glass col gap-4" style={{ minWidth: 200 }}>
            <div className="xs" style={{ opacity: 0.8 }}>Talabni bajarganlar</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{maxrajYoq ? '—' : `${ulush(st.bajarildi, st.n)}%`}</div>
            <div className="xs" style={{ opacity: 0.8 }}>{st.bajarildi} / {st.n} xodim · {st.kredit} kredit</div>
          </div>
        </div>
      </motion.div>

      <div className="mb-16"><FiltrPanel f={f} setF={setF} turlar={turlar} yillar={yillar} /></div>

      <div className="grid g4 mb-16">
        <Korsatkich icon={<Users />} label="Qamrov" value={ulush(st.ukr, st.n)} suffix="%" kasr={1} maxrajYoq={maxrajYoq} hint={`${st.ukr} / ${st.n} xodim`} formula="UKR hisobi bor xodimlar / Reestrdagi xodimlar × 100" manba="Platforma Reestri (maxraj), UKR kredit jurnali va yozilishlar (surat)" yangilangan={yang} kiritilgan={`faol mehnat munosabati bor shaxslar; UKR hisobi — kamida bitta kredit yozuvi yoki kursga yozilish; ${kir}`} />
        <Korsatkich icon={<CheckCircle2 />} label="Talabni bajarganlar ulushi" value={ulush(st.bajarildi, st.n)} suffix="%" kasr={1} ton="ok" delay={0.05} maxrajYoq={maxrajYoq} hint={`${st.bajarildi} ta xodim`} formula="X ≥ T va majburiy/amaliy ulushlar bajarilgan xodimlar / Reestrdagi xodimlar" manba="Kredit xizmati (yillik holat, amaldagi qoida versiyasi)" yangilangan={yang} kiritilgan={`istisno (dekret) va yangi xodimlarga talab proporsional; ${kir}`} />
        <Korsatkich icon={<CircleAlert />} label="Qarzdorlar" value={st.qarzdor} ton="err" delay={0.1} hint={`xavf ostida: ${st.xavf}`} formula="oʻtgan yil talabi bajarilmagan yoki yil yakunida X < T boʻlgan xodimlar soni" manba="Kredit xizmati, yil yakuni hisoboti" yangilangan={yang} kiritilgan={kir} />
        <Korsatkich icon={<Building2 />} label="Faol provayderlar" value={d.faolProv} ton="teal" delay={0.15} hint={`jami ${d.prov.length}: ${['korib_chiqilmoqda', 'toxtatilgan', 'muddati_tugagan'].map((h) => d.prov.filter((p) => p.holat === h).length).join(' / ')} (koʻrib chiqilmoqda / toʻxtatilgan / tugagan)`} formula="akkreditatsiyalangan + shartli akkreditatsiyalangan provayderlar" manba="Provayderlar reestri" yangilangan={yang} kiritilgan={f.hudud ? 'tanlangan hududdagi provayderlar (xorijiylar kirmaydi)' : 'barcha, shu jumladan xorijiy'} />
        <Korsatkich icon={<BookOpen />} label="Tasdiqlangan dasturlar" value={d.tasdiq} delay={0.2} hint={`koʻrib chiqishda: ${d.dasturlar.filter((v) => v.holat === 'korib_chiqishda').length}`} formula="holati «tasdiqlangan» dastur versiyalari" manba="Dasturlar reestri" yangilangan={yang} kiritilgan="mutaxassislik va daraja filtri dastur auditoriyasiga qoʻllanadi" />
        <Korsatkich icon={<GraduationCap />} label="Kurslar (oqimlar)" value={d.oqimlar.length} delay={0.25} hint={`tinglovchilar: ${d.tinglovchi}`} formula="yil ichida boshlangan oqimlar; tinglovchi — qabul qilingan, oʻqiyotgan, tugatgan, oʻtmagan" manba="Oqimlar va yozilishlar" yangilangan={yang} kiritilgan="qoralama va bekor qilingan oqimlar kirmaydi" />
        <Korsatkich icon={<Award />} label="Sertifikatlar" value={d.sert} ton="ok" delay={0.3} formula="yil ichida berilgan UKR sertifikatlari (bekor qilinganlarsiz)" manba="Sertifikatlar reestri" yangilangan={yang} kiritilgan={kir} />
        <Korsatkich icon={<Globe2 />} label="Tan olish arizalari" value={d.tan.length} delay={0.35} hint={`tasdiqlandi: ${d.tan.filter((t) => t.holat === 'tasdiqlandi').length} · rad: ${d.tan.filter((t) => t.holat === 'rad_etildi').length}`} formula="yil ichida yuborilgan xorijiy kreditni tan olish arizalari" manba="Tan olish moduli" yangilangan={yang} kiritilgan={kir} />
      </div>

      <MonitoringGrafiklar db={db} q={q} f={f} />
      <div className="xs muted">Shaxs darajasidagi maʼlumot bu panelda koʻrsatilmaydi. Hisobotlar — «Hisobotlar» tabida (Excel/PDF, audit bilan).</div>
    </>
  )
}
