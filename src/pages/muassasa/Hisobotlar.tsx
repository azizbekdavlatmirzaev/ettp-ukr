import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FileText, FileSpreadsheet, AlertTriangle, ClipboardCheck, Layers } from 'lucide-react'
import * as A from '@/domain/amallar'
import { DataTable, type Col } from '@/ui/DataTable'
import { Button, Card, Holat, PageHeader, cx } from '@/ui'
import { umumiyPdf } from '@/lib/eksport'
import { sanaVaqt, son } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { useMuassasa, statistika, XAVF_NOM, type XodimQator } from './_umumiy'
import { rejaQoplash } from './_RejaKarta'

type Hisobot = 'holat' | 'qarz' | 'reja' | 'bolim'
interface Q { id: string; [k: string]: string | number }

export default function MuassasaHisobotlar() {
  const { db, mid, muassasa, qatorlar, bugun, yil, amal, toast } = useMuassasa()
  const [h, setH] = useState<Hisobot>('holat')
  const [busy, setBusy] = useState(false)

  const xodimQ = (r: XodimQator): Q => ({ id: r.id, fio: r.fio, lavozim: r.m.lavozim, bolim: r.m.bolim, mut: r.mut, T: r.h.T, X: r.h.X, yet: r.h.yetishmaydi, maj: `${r.h.majburiy}/${r.h.majburiyKerak}`, holat: XAVF_NOM[r.h.xavf] + (r.qarzdor ? ' · oʻtgan yil qarzi' : '') })
  const data = useMemo(() => {
    const holat = qatorlar.map(xodimQ)
    const qarz = qatorlar.filter((r) => r.qarzdor || r.h.xavf === 'xavf' || r.h.xavf === 'qarzdor').map(xodimQ)
    const xs = new Set(qatorlar.map((r) => r.s.id))
    const reja = db.rejalar.filter((r) => r.muassasaId === mid && xs.has(r.personId) && r.holat !== 'qoralama').map((r): Q => {
      const k = rejaQoplash(db, r)
      return { id: r.id, fio: A.toliqFio(k.s), yil: r.yil, versiya: r.versiya, bandlar: r.bandlar.length, bajarildi: `${k.bajarildi}/${r.bandlar.length}`, foiz: r.bandlar.length ? Math.round((k.bajarildi / r.bandlar.length) * 100) : 0, qoplash: `${k.jami}/${k.T}`, holat: holatMatn(r.holat)[0] }
    })
    const bolim = (muassasa?.bolimlar ?? []).map((b): Q => {
      const q = qatorlar.filter((r) => r.m.bolim === b)
      const st = statistika(q)
      return { id: b, bolim: b, n: st.n, bajarildi: st.bajarildi, yolda: st.yolda, xavf: st.xavf, qarzdor: st.qarzdor, ortacha: `${st.ortacha}%` }
    })
    return { holat, qarz, reja, bolim }
  }, [qatorlar, db, mid, muassasa])

  const X = (k: string, l: string, right = false): Col<Q> => ({ k, l, r: (r) => (k === 'holat' ? <span className="small">{r[k]}</span> : r[k]), sort: (r) => r[k], excel: (r) => r[k], align: right ? 'right' : undefined })
  const xodimCols = [X('fio', 'F.I.Sh.'), X('lavozim', 'Lavozim'), X('bolim', 'Boʻlim'), X('mut', 'Mutaxassislik'), X('T', 'Talab T', true), X('X', 'Hisobga olingan X', true), X('yet', 'Yetishmaydi', true), X('maj', 'Majburiy'), X('holat', 'Holat')]
  const HIS: Record<Hisobot, { nomi: string; tavsif: string; icon: ReactNode; rows: Q[]; cols: Col<Q>[] }> = {
    holat: { nomi: 'UKR holati', tavsif: 'Barcha xodimlar: talab, hisobga olingan, holat', icon: <FileSpreadsheet />, rows: data.holat, cols: xodimCols },
    qarz: { nomi: 'Qarzdorlar roʻyxati', tavsif: 'Qarzdorlar va xavf ostidagilar', icon: <AlertTriangle />, rows: data.qarz, cols: xodimCols },
    reja: { nomi: 'Rejalar bajarilishi', tavsif: 'Bandlar bajarilishi va talab qoplanishi', icon: <ClipboardCheck />, rows: data.reja, cols: [X('fio', 'Xodim'), X('yil', 'Yil'), X('versiya', 'Versiya', true), X('bandlar', 'Bandlar', true), X('bajarildi', 'Bajarilgan'), X('foiz', 'Bajarilish %', true), X('qoplash', 'Kredit / talab'), X('holat', 'Holat')] },
    bolim: { nomi: 'Boʻlimlar kesimi', tavsif: 'Boʻlimlar boʻyicha holatlar yigʻmasi', icon: <Layers />, rows: data.bolim, cols: [X('bolim', 'Boʻlim'), X('n', 'Xodimlar', true), X('bajarildi', 'Bajardi', true), X('yolda', 'Reja boʻyicha', true), X('xavf', 'Xavf ostida', true), X('qarzdor', 'Qarzdor', true), X('ortacha', 'Oʻrtacha %')] },
  }
  const joriy = HIS[h]

  const pdf = async () => {
    setBusy(true)
    try {
      const st = statistika(qatorlar)
      const ustunlar = joriy.cols.map((c) => c.k)
      await umumiyPdf(`muassasa-${h}-${yil}`, `${joriy.nomi} — ${muassasa?.nomi ?? ''}`, [
        { t: 'Umumiy koʻrsatkichlar', qatorlar: [`Yil: ${yil} · sana: ${bugun}`, `Xodimlar: ${st.n}; talabni bajarganlar: ${st.bajarildi}; xavf ostida: ${st.xavf}; qarzdorlar: ${st.qarzdor}; oʻrtacha bajarilish: ${st.ortacha}%`] },
        { t: `${joriy.nomi} (${joriy.rows.length} qator)`, qatorlar: joriy.rows.map((r, i) => `${i + 1}. ${ustunlar.map((k) => r[k]).join(' · ')}`) },
        { t: 'Manba', qatorlar: ['HRM (tasdiqlangan mehnat munosabatlari), UKR kredit jurnali. Hisobot faqat muassasaning hozir ishlayotgan xodimlarini oʻz ichiga oladi.'] },
      ])
      amal(A.eksportQayd, `${joriy.nomi} (PDF)`, joriy.rows.length)
      toast({ turi: 'ok', matn: `PDF yuklab olindi (${joriy.rows.length} qator). Eksport audit jurnaliga yozildi.` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Hisobotlar" desc="Tayyor hisobotlar: oldindan koʻrish, Excel va PDF. Har bir eksport audit jurnaliga yoziladi." source={`Manba: UKR kredit jurnali, HRM · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <div className="grid g4 mb-16">
        {(Object.keys(HIS) as Hisobot[]).map((k, i) => (
          <motion.button key={k} type="button" className={cx('card', 'hover')} onClick={() => setH(k)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ textAlign: 'left', cursor: 'pointer', borderColor: h === k ? 'var(--primary)' : undefined, background: h === k ? 'var(--primary-soft)' : undefined }}>
            <div className="row"><span className="li" style={{ border: 0, padding: 0 }}><span className="ic brand">{HIS[k].icon}</span></span><div className="b">{HIS[k].nomi}</div></div>
            <div className="xs muted mt-8">{HIS[k].tavsif}</div>
            <div className="small mt-8"><b>{son(HIS[k].rows.length)}</b> qator</div>
          </motion.button>
        ))}
      </div>
      <Card className="mb-16">
        <div className="row between wrap">
          <div><h3>{joriy.nomi}</h3><div className="xs muted">{muassasa?.nomi} · {yil}-yil · {joriy.rows.length} qator</div></div>
          <div className="row wrap">
            <Holat ton="info">Oldindan koʻrish</Holat>
            <Button v="primary" icon={<FileText size={16} />} loading={busy} onClick={pdf}>PDF yuklab olish</Button>
          </div>
        </div>
        <div className="xs muted mt-8">Excel — jadval ustidagi «Excel» tugmasi orqali (filtrlangan qatorlar yuklanadi).</div>
      </Card>
      <DataTable<Q> key={h} rows={joriy.rows} cols={joriy.cols} exportName={`muassasa-${h}`} search={(r) => Object.values(r).join(' ')} pageSize={10} />
    </>
  )
}
