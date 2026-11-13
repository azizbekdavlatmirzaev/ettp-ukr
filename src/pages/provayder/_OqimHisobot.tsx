// Oqim → «Hisobot» bandi va oqim statistikasi (Hisobotlar sahifasi ham foydalanadi).
import { FileDown, FileBarChart, Users, CheckCircle2, XCircle, Star, CalendarCheck, Award } from 'lucide-react'
import { Button, Card, CardH, KPI } from '@/ui'
import { BarCh, Donut, Legenda } from '@/ui/charts'
import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { excelYukla, umumiyPdf } from '@/lib/eksport'
import { sana } from '@/lib/format'
import { useProv } from './_umumiy'

export function oqimStat(db: DB, o: T.Oqim) {
  const ys = db.yozilishlar.filter((y) => y.oqimId === o.id)
  const qabul = ys.filter((y) => ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi'].includes(y.holat))
  const tugatgan = ys.filter((y) => y.holat === 'tugatdi').length
  const otmagan = ys.filter((y) => y.holat === 'otmadi').length
  const dav = qabul.length ? Math.round(qabul.reduce((a, y) => a + A.davomatFoizi(db, y), 0) / qabul.length) : 0
  const sor = ys.filter((y) => y.sorovnoma).map((y) => y.sorovnoma!.baho)
  const sorov = sor.length ? Math.round((sor.reduce((a, b) => a + b, 0) / sor.length) * 10) / 10 : 0
  const nIds = new Set(db.natijalar.filter((n) => ys.some((y) => y.id === n.yozilishId)).map((n) => n.id))
  const sert = db.sertifikatlar.filter((s) => s.natijaId && nIds.has(s.natijaId)).length
  const kredit = db.jurnal.filter((j) => j.manba === 'natija' && nIds.has(j.manbaId)).reduce((a, j) => a + j.miqdor, 0)
  return { arizalar: ys.length, qabul: qabul.length, tugatgan, otmagan, dav, sorov, sorSoni: sor.length, sert, kredit }
}

export function HisobotTab({ o }: { o: T.Oqim }) {
  const { db, p, toast } = useProv()
  const v = A.versiya(db, o.versiyaId)!
  const st = oqimStat(db, o)
  const ys = db.yozilishlar.filter((y) => y.oqimId === o.id && ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi'].includes(y.holat))
  const holatlar = [
    { name: 'Tugatdi', value: st.tugatgan },
    { name: 'Oʻtmadi', value: st.otmagan },
    { name: 'Oʻqimoqda', value: st.qabul - st.tugatgan - st.otmagan },
  ].filter((x) => x.value > 0)
  const davomat = o.mashgulotlar.map((m, i) => ({
    x: `${i + 1}-dars`,
    keldi: db.davomat.filter((d) => d.mashgulotId === m.id && d.holat === 'keldi').length,
    uzrli: db.davomat.filter((d) => d.mashgulotId === m.id && d.holat === 'uzrli').length,
    kelmadi: db.davomat.filter((d) => d.mashgulotId === m.id && d.holat === 'kelmadi').length,
  }))

  const excel = () => {
    excelYukla(`hisobot-${o.kod}`, o.kod, [
      { kalit: 'fio', nomi: 'F.I.Sh.', qiymat: (y: T.Yozilish) => A.toliqFio(A.shaxs(db, y.personId)!) },
      { kalit: 'holat', nomi: 'Holat', qiymat: (y) => y.holat },
      { kalit: 'dav', nomi: 'Davomat %', qiymat: (y) => A.davomatFoizi(db, y) },
      { kalit: 'ball', nomi: 'Yakuniy ball', qiymat: (y) => db.natijalar.find((n) => n.yozilishId === y.id)?.ball ?? '' },
      { kalit: 'nat', nomi: 'Natija', qiymat: (y) => db.natijalar.find((n) => n.yozilishId === y.id)?.natija ?? '' },
    ], ys)
    toast({ turi: 'ok', matn: `${o.kod} hisoboti Excel faylga yuklandi.` })
  }
  const pdf = async () => {
    await umumiyPdf(`hisobot-${o.kod}`, `Kurs hisoboti: ${v.nomi}`, [
      { t: 'Oqim', qatorlar: [`Kod: ${o.kod}`, `Provayder: ${p.nomi}`, `Sanalar: ${sana(o.boshlanish)} — ${sana(o.tugash)}`, `Oʻqituvchi: ${o.oqituvchi}`, `Tasdiqlangan kredit: ${v.tasdiqlanganKredit ?? '—'}`] },
      { t: 'Koʻrsatkichlar', qatorlar: [`Arizalar: ${st.arizalar}`, `Qabul qilingan: ${st.qabul}`, `Tugatgan: ${st.tugatgan}`, `Oʻtmagan: ${st.otmagan}`, `Oʻrtacha davomat: ${st.dav}%`, `Soʻrovnoma bahosi: ${st.sorov || '—'} (${st.sorSoni} ta javob)`, `Sertifikatlar: ${st.sert}`, `Berilgan kredit: ${st.kredit}`] },
      { t: 'Tinglovchilar', qatorlar: ys.map((y, i) => `${i + 1}. ${A.qisqaFio(A.shaxs(db, y.personId)!)} — ${y.holat}, davomat ${A.davomatFoizi(db, y)}%`) },
    ])
    toast({ turi: 'ok', matn: 'PDF hisobot yaratildi.' })
  }

  return (
    <div className="col gap-16">
      <div className="grid g4">
        <KPI icon={<Users />} label="Qabul qilingan" value={st.qabul} hint={`${st.arizalar} ta ariza`} />
        <KPI icon={<CheckCircle2 />} label="Tugatgan" value={st.tugatgan} ton="ok" delay={0.04} />
        <KPI icon={<XCircle />} label="Oʻtmagan" value={st.otmagan} ton={st.otmagan ? 'err' : undefined} delay={0.08} />
        <KPI icon={<CalendarCheck />} label="Oʻrtacha davomat" value={st.dav} suffix="%" ton="teal" delay={0.12} />
        <KPI icon={<Star />} label="Soʻrovnoma" value={st.sorov} kasr={1} suffix="/ 5" hint={`${st.sorSoni} ta anonim javob`} delay={0.16} />
        <KPI icon={<Award />} label="Sertifikat / kredit" value={st.sert} suffix={`· ${st.kredit} kr`} ton="ok" delay={0.2} />
      </div>
      <div className="grid g-main">
        <Card>
          <CardH icon={<CalendarCheck />} title="Davomat mashgʻulotlar boʻyicha" />
          <BarCh data={davomat} keys={['keldi', 'uzrli', 'kelmadi']} names={{ keldi: 'Keldi', uzrli: 'Uzrli', kelmadi: 'Kelmadi' }} stacked colors={['#3ba776', '#e8a33d', '#d1495b']} />
        </Card>
        <Card delay={0.05}>
          <CardH icon={<FileBarChart />} title="Natijalar taqsimoti" right={<><Button size="sm" v="secondary" onClick={excel}>Excel</Button><Button size="sm" v="primary" icon={<FileDown />} onClick={pdf}>PDF</Button></>} />
          <Donut data={holatlar.length ? holatlar : [{ name: 'Maʼlumot yoʻq', value: 1 }]} colors={['#3ba776', '#d1495b', '#0fa3a3']} center={<div><div className="stat-big">{st.qabul}</div><div className="xs muted">tinglovchi</div></div>} />
          <Legenda items={holatlar.map((h) => ({ l: h.name, v: h.value }))} colors={['#3ba776', '#d1495b', '#0fa3a3']} />
        </Card>
      </div>
    </div>
  )
}
