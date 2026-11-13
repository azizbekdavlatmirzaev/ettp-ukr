import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FileSpreadsheet, FileText, MapPinned, Stethoscope, Building2, Wallet, Award } from 'lucide-react'
import * as A from '@/domain/amallar'
import { HUDUDLAR, MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { useJoriy } from '@/shared/hooks'
import { excelYukla, umumiyPdf } from '@/lib/eksport'
import { sanaVaqt } from '@/lib/format'
import { MOLIYA, PROV_TURI, holat as holatMatn } from '@/lib/holat'
import { Button, Card, PageHeader } from '@/ui'
import { BOSH_FILTR, TINGLOVCHI_HOLAT, guruhla, oxirgiYangilanish, ulush, useShaxslar, yigma, yilOqimlari } from './_hisob'
import { FonHisobot } from './_FonHisobot'

type R = Record<string, string | number>
interface Hisobot { k: string; nomi: string; tavsif: string; icon: ReactNode; ustun: [string, string][]; rows: R[] }

export default function VazirlikHisobotlar() {
  const { db, bugun, yil, amal, toast } = useJoriy()
  const [busy, setBusy] = useState('')
  const q = useShaxslar(db, yil, bugun)
  const yashir = (n: number) => (n < db.sozlamalar.ochiqStatistikaMinGuruh ? `${n} (<${db.sozlamalar.ochiqStatistikaMinGuruh})` : n)

  const hisobotlar = useMemo<Hisobot[]>(() => {
    const kesim = (g: Map<string, typeof q>, nom: (k: string) => string) => Array.from(g.entries()).map(([k, v]) => { const s = yigma(v); return { nomi: nom(k), n: s.n, bajarildi: s.bajarildi, foiz: ulush(s.bajarildi, s.n), xavf: s.xavf, qarzdor: s.qarzdor, qamrov: ulush(s.ukr, s.n) } }).sort((a, b) => String(a.nomi).localeCompare(String(b.nomi)))
    const kesimUstun: [string, string][] = [['nomi', 'Kesim'], ['n', 'Xodimlar'], ['bajarildi', 'Bajarganlar'], ['foiz', 'Bajarganlar, %'], ['xavf', 'Xavf ostida'], ['qarzdor', 'Qarzdorlar'], ['qamrov', 'Qamrov, %']]
    const oqimlar = yilOqimlari(db, BOSH_FILTR(yil))
    return [
      { k: 'hudud', nomi: 'Hududlar kesimi', tavsif: '14 hudud: bajarilish, qarzdorlar, qamrov', icon: <MapPinned />, ustun: kesimUstun, rows: kesim(guruhla(q, (r) => r.hudud), (k) => HUDUDLAR.find((h) => h.id === k)?.nomi ?? k) },
      { k: 'mut', nomi: 'Mutaxassisliklar kesimi', tavsif: 'Mutaxassisliklar boʻyicha yillik holat', icon: <Stethoscope />, ustun: kesimUstun, rows: kesim(guruhla(q, (r) => r.s.mutaxassislikId), (k) => MUTAXASSISLIKLAR.find((m) => m.id === k)?.nomi ?? k) },
      { k: 'prov', nomi: 'Provayderlar reestri', tavsif: 'Holat, turi, qaror va muddat', icon: <Building2 />, ustun: [['nomi', 'Provayder'], ['turi', 'Turi'], ['holat', 'Holat'], ['qaror', 'Qaror'], ['muddat', 'Muddat'], ['reyting', 'Soʻrovnoma']], rows: db.provayderlar.map((p) => ({ nomi: p.nomi, turi: PROV_TURI[p.turi], holat: holatMatn(p.holat)[0], qaror: p.qaror?.raqam ?? '—', muddat: p.qaror?.muddat ?? '—', reyting: p.reyting ?? '—' })) },
      { k: 'moliya', nomi: 'Moliyalashtirish', tavsif: `${yil}-yil oqimlari: reja va fakt`, icon: <Wallet />, ustun: [['nomi', 'Manba'], ['oqim', 'Oqimlar'], ['reja', 'Reja (oʻrin)'], ['fakt', 'Fakt (tinglovchi)'], ['foiz', 'Bajarilish, %']], rows: (['byudjet', 'ish_beruvchi', 'shaxsiy', 'grant'] as const).map((m) => { const os = oqimlar.filter((o) => o.moliya === m); const reja = os.reduce((a, o) => a + o.orinlar, 0); const fakt = os.reduce((a, o) => a + db.yozilishlar.filter((y) => y.oqimId === o.id && TINGLOVCHI_HOLAT.includes(y.holat)).length, 0); return { nomi: MOLIYA[m], oqim: os.length, reja, fakt, foiz: ulush(fakt, reja) } }) },
      { k: 'sert', nomi: 'Sertifikatlar yigʻmasi', tavsif: 'Provayderlar boʻyicha berilgan sertifikatlar', icon: <Award />, ustun: [['nomi', 'Provayder'], ['jami', 'Jami'], ['joriy', `${yil}-yil`], ['bekor', 'Bekor qilingan']], rows: Array.from(new Set(db.sertifikatlar.filter((s) => s.turi === 'UKR').map((s) => s.provider))).map((p) => { const ss = db.sertifikatlar.filter((s) => s.provider === p && s.turi === 'UKR'); return { nomi: p, jami: ss.length, joriy: ss.filter((s) => s.sana.startsWith(String(yil))).length, bekor: ss.filter((s) => s.holat === 'bekor_qilingan').length } }).sort((a, b) => b.jami - a.jami) },
    ]
  }, [q, db, yil])

  const excel = (h: Hisobot) => {
    const rows = h.rows.map((r) => ({ ...r, n: typeof r.n === 'number' ? yashir(r.n) : r.n }))
    excelYukla(`vazirlik-${h.k}-${yil}`, h.nomi, h.ustun.map(([k, n]) => ({ kalit: k, nomi: n, qiymat: (r: R) => r[k] })), rows)
    amal(A.eksportQayd, `${h.nomi} (Excel)`, rows.length)
    toast({ turi: 'ok', matn: `${h.nomi}: Excel yuklandi. Eksport audit jurnaliga yozildi.` })
  }
  const pdf = async (h: Hisobot) => {
    setBusy(h.k)
    try {
      await umumiyPdf(`vazirlik-${h.k}-${yil}`, `${h.nomi} — ${yil}-yil`, [
        { t: 'Parametrlar', qatorlar: [`Sana: ${bugun}. Maxraj: Reestrdagi faol mehnat munosabati bor xodimlar (${sanaVaqt(oxirgiYangilanish(db))} holatiga).`] },
        { t: h.ustun.map(([, n]) => n).join(' | '), qatorlar: h.rows.map((r, i) => `${i + 1}. ${h.ustun.map(([k]) => (k === 'n' && typeof r[k] === 'number' ? yashir(r[k] as number) : r[k])).join(' | ')}`) },
      ])
      amal(A.eksportQayd, `${h.nomi} (PDF)`, h.rows.length)
      toast({ turi: 'ok', matn: `${h.nomi}: PDF yuklandi. Eksport audit jurnaliga yozildi.` })
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <PageHeader title="Hisobotlar" desc="Tayyor yigʻma hisobotlar (Excel/PDF). Har bir eksport audit jurnaliga yoziladi; shaxs darajasidagi maʼlumot chiqarilmaydi." source={`Manba: Platforma Reestri, UKR quyi tizimi · yangilangan: ${sanaVaqt(oxirgiYangilanish(db))}`} />
      <div className="grid g3 mb-16">
        {hisobotlar.map((h, i) => (
          <motion.div key={h.k} className="card hover col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="row"><span className="li" style={{ border: 0, padding: 0 }}><span className="ic brand">{h.icon}</span></span><div><div className="b">{h.nomi}</div><div className="xs muted">{h.tavsif}</div></div></div>
            <div className="small muted">{h.rows.length} qator · {h.ustun.length} ustun</div>
            <div className="row wrap" style={{ marginTop: 'auto' }}>
              <Button size="sm" icon={<FileSpreadsheet size={15} />} onClick={() => excel(h)}>Excel</Button>
              <Button size="sm" v="soft" icon={<FileText size={15} />} loading={busy === h.k} onClick={() => pdf(h)}>PDF</Button>
            </div>
          </motion.div>
        ))}
      </div>
      <FonHisobot />
      <Card className="mt-16">
        <div className="small muted">Ochiq statistika qoidasi: {db.sozlamalar.ochiqStatistikaMinGuruh} kishidan kichik guruhlar eksportda «&lt;{db.sozlamalar.ochiqStatistikaMinGuruh}» belgisi bilan koʻrsatiladi. Hisobotlar kredit jurnalidan har safar qayta hisoblanadi.</div>
      </Card>
    </>
  )
}
