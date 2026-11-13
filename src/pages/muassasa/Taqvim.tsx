import { useMemo } from 'react'
import { CalendarDays, GraduationCap, ClipboardCheck, Flag } from 'lucide-react'
import * as A from '@/domain/amallar'
import { Taqvim, type TaqvimItem } from '@/shared/Taqvim'
import { KPI, PageHeader } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { useMuassasa } from './_umumiy'

const qoshKun = (s: string, n: number) => {
  const d = new Date(s.slice(0, 10) + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function MuassasaTaqvim() {
  const { db, mid, bugun, yil } = useMuassasa()
  const items = useMemo(() => {
    const xodimlar = A.muassasaXodimlari(db, mid, bugun)
    const ids = new Set(xodimlar.map((m) => m.personId))
    const out: TaqvimItem[] = []
    // xodimlarning kurslari (qabul qilingan / oʻqiyotgan / ariza bergan)
    db.yozilishlar.filter((y) => ids.has(y.personId) && ['yuborildi', 'qabul_qilindi', 'oqimoqda', 'tugatdi'].includes(y.holat)).forEach((y) => {
      const o = A.oqim(db, y.oqimId)
      const v = A.versiya(db, o?.versiyaId)
      const s = A.shaxs(db, y.personId)
      if (!o || !v || !s || o.tugash < `${yil - 1}-12-01`) return
      out.push({ id: 'k-' + y.id, sana: o.boshlanish, tugash: o.tugash, nomi: `${A.qisqaFio(s)}: ${v.nomi}`, turi: 'kurs', izoh: `${o.kod} · ${y.holat === 'yuborildi' ? 'ariza koʻrib chiqilmoqda' : y.holat === 'tugatdi' ? 'tugatgan' : 'qabul qilingan'}` })
    })
    // reja muddatlari
    const md = db.sozlamalar.muddatlar
    out.push({ id: 'rj-yil', sana: `${yil}-${md.rejaYillik}`, nomi: `${yil + 1}-yil rivojlanish rejalarini tasdiqlash muddati`, turi: 'muddat' })
    xodimlar.filter((m) => m.dan.slice(0, 4) === String(yil)).forEach((m) => {
      const s = A.shaxs(db, m.personId)
      if (s) out.push({ id: 'rj-' + m.id, sana: qoshKun(m.dan, md.rejaYangiXodim), nomi: `Yangi xodim rejasi: ${A.qisqaFio(s)}`, turi: 'muddat', izoh: `${md.rejaYangiXodim} kun ichida` })
    })
    db.rejalar.filter((r) => r.muassasaId === mid && ids.has(r.personId) && r.holat === 'yuborildi').forEach((r) => {
      const s = A.shaxs(db, r.personId)
      if (s) out.push({ id: 'rjk-' + r.id, sana: r.yangilangan.slice(0, 10), nomi: `Reja yuborildi: ${A.qisqaFio(s)}`, turi: 'eslatma', izoh: 'Tasdiqlash kutilmoqda' })
    })
    // yil yakuni
    out.push({ id: 'yil-oxiri', sana: `${yil}-12-31`, nomi: `${yil}-yil UKR yakuni: talab bajarilishi hisoblanadi`, turi: 'muddat' })
    out.push({ id: 'yil-boshi', sana: `${yil + 1}-01-01`, nomi: `${yil + 1}-yil hisob davri boshlanadi`, turi: 'eslatma' })
    return out
  }, [db, mid, bugun, yil])
  const kurslar = items.filter((i) => i.turi === 'kurs')
  const yaqin = kurslar.filter((i) => i.sana >= bugun && i.sana <= qoshKun(bugun, 30)).length
  const qolgan = Math.max(0, Math.ceil((new Date(`${yil}-12-31T23:59:00`).getTime() - new Date(bugun + 'T12:00:00').getTime()) / 86400000))

  return (
    <>
      <PageHeader title="Taqvim" desc="Xodimlar kurs sanalari, reja muddatlari va yil yakuni." source={`Manba: oqimlar jadvali, UKR rejalar, Sozlamalar · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <div className="grid g4 mb-16">
        <KPI icon={<GraduationCap />} label="Xodimlar kurslari" value={kurslar.length} />
        <KPI icon={<CalendarDays />} label="30 kunda boshlanadi" value={yaqin} ton="teal" delay={0.05} />
        <KPI icon={<ClipboardCheck />} label="Reja muddatlari" value={items.filter((i) => i.id.startsWith('rj')).length} ton="warn" delay={0.1} />
        <KPI icon={<Flag />} label="Yil yakunigacha" value={qolgan} suffix="kun" ton="err" delay={0.15} />
      </div>
      <Taqvim items={items} boshlangich={bugun} />
    </>
  )
}
