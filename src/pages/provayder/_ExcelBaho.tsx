// Excel orqali natijalarni yuklash: shablon → fayl → qator-qator tekshiruv → faqat xatosiz qatorlar qabul qilinadi.
import { useRef, useState } from 'react'
import { FileSpreadsheet, Download, Upload, CheckCircle2 } from 'lucide-react'
import { Alert, Badge, Button, Card, CardH } from '@/ui'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { excelOqi, excelShablon } from '@/lib/eksport'
import { BAHO_TURLARI, useProv } from './_umumiy'

interface Qator { n: number; jshshir: string; turi: string; ball: number; y?: T.Yozilish; xato?: string }

export function ExcelBaho({ o, ting }: { o: T.Oqim; ting: T.Yozilish[] }) {
  const { db, amal, toast } = useProv()
  const ref = useRef<HTMLInputElement>(null)
  const [fayl, setFayl] = useState('')
  const [qatorlar, setQatorlar] = useState<Qator[]>([])
  const [busy, setBusy] = useState(false)

  const shablon = () => {
    const namuna = ting.slice(0, 4).map((y, i) => [A.shaxs(db, y.personId)!.jshshir, i % 2 ? 'OSKE' : 'amaliy', 70 + i * 6])
    namuna.push(['12345', 'amaliy', 88], [namuna[0]?.[0] ?? '30101851234567', 'imtihon', 90], [namuna[1]?.[0] ?? '30101851234567', 'suhbat', 140])
    excelShablon(`natijalar-shablon-${o.kod}`, ['JSHSHIR', 'turi', 'ball'], namuna)
    toast({ turi: 'info', matn: 'Shablon yuklandi: 4 ta toʻgʻri va 3 ta ataylab xato qator (namuna uchun).' })
  }

  const oqi = async (f?: File) => {
    if (!f) return
    setBusy(true)
    const t0 = performance.now()
    try {
      const raw = await excelOqi(f)
      const turlar = BAHO_TURLARI.map((t) => t.v as string)
      const r: Qator[] = raw.slice(0, 1000).map((x, i) => {
        const jshshir = String(x.JSHSHIR ?? x.jshshir ?? '').trim()
        const turi = String(x.turi ?? x.TURI ?? '').trim()
        const ball = Number(x.ball ?? x.BALL)
        const s = db.shaxslar.find((p) => p.jshshir === jshshir)
        const y = s ? ting.find((t) => t.personId === s.id) : undefined
        let xato: string | undefined
        if (!/^\d{14}$/.test(jshshir)) xato = 'JSHSHIR 14 raqamdan iborat emas'
        else if (!s) xato = 'Reestrda topilmadi'
        else if (!y) xato = 'Bu oqim tinglovchisi emas'
        else if (!turlar.includes(turi)) xato = `Baholash turi notoʻgʻri («${turi}»): ${turlar.join(', ')}`
        else if (Number.isNaN(ball) || ball < 0 || ball > 100) xato = 'Ball 0–100 oraligʻida boʻlishi kerak'
        return { n: i + 2, jshshir, turi, ball, y, xato }
      })
      setQatorlar(r)
      setFayl(f.name)
      toast({ turi: 'info', matn: `${f.name}: ${r.length} qator tekshirildi (${Math.round(performance.now() - t0)} ms). Xatosiz: ${r.filter((x) => !x.xato).length}.` })
    } catch {
      toast({ turi: 'err', sarlavha: 'Fayl oʻqilmadi', matn: 'Faqat .xlsx shablon formatini yuklang (ustunlar: JSHSHIR, turi, ball).' })
    }
    setBusy(false)
  }

  const yaxshi = qatorlar.filter((q) => !q.xato)
  const qabul = () => {
    const r = amal((d, c) => {
      yaxshi.forEach((q) => A.baholashKirit(d, c, q.y!.id, q.turi as T.BaholashTuri, q.ball, 70, 'Excel'))
      return yaxshi.length
    })
    if (r !== undefined) {
      toast({ turi: 'ok', sarlavha: `${r} ta baho qabul qilindi`, matn: `${qatorlar.length - r} ta xatoli qator rad etildi. Natijani «Natija» bandida shakllantiring.` })
      setQatorlar([])
      setFayl('')
    }
  }

  return (
    <Card delay={0.05}>
      <CardH icon={<FileSpreadsheet />} title="Natijalarni Excel orqali yuklash" sub="Shablon · 1 000 qatorgacha · faqat xatosiz qatorlar qabul qilinadi" right={
        <>
          <Button size="sm" v="ghost" icon={<Download />} onClick={shablon}>Shablon</Button>
          <Button size="sm" v="secondary" icon={<Upload />} loading={busy} onClick={() => ref.current?.click()}>Fayl yuklash</Button>
          <input ref={ref} type="file" accept=".xlsx,.xls" hidden onChange={(e) => { oqi(e.target.files?.[0]); e.target.value = '' }} />
        </>
      } />
      {qatorlar.length > 0 ? (
        <div className="col gap-6">
          <Alert ton={qatorlar.length === yaxshi.length ? 'ok' : 'warn'} title={`${fayl}: ${yaxshi.length} ta xatosiz, ${qatorlar.length - yaxshi.length} ta xatoli qator`} action={<Button size="sm" v="primary" icon={<CheckCircle2 />} disabled={!yaxshi.length} onClick={qabul}>{yaxshi.length} ta qatorni qabul qilish</Button>}>
            Xatoli qatorlar tuzatilib qayta yuklanishi mumkin.
          </Alert>
          <div className="tbl-wrap scroll-y">
            <table className="tbl">
              <thead><tr><th>Qator</th><th>JSHSHIR</th><th>Tinglovchi</th><th>Turi</th><th>Ball</th><th>Tekshiruv</th></tr></thead>
              <tbody>
                {qatorlar.map((q) => (
                  <tr key={q.n}>
                    <td>{q.n}</td>
                    <td className="mono small">{q.jshshir || '—'}</td>
                    <td className="small">{q.y ? A.qisqaFio(A.shaxs(db, q.y.personId)!) : '—'}</td>
                    <td>{q.turi}</td>
                    <td>{Number.isNaN(q.ball) ? '—' : q.ball}</td>
                    <td>{q.xato ? <Badge ton="err">{q.xato}</Badge> : <Badge ton="ok">OK</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="xs muted">Ustunlar: <span className="kbd">JSHSHIR</span> <span className="kbd">turi</span> (test, amaliy, vaziyatli, OSKE, suhbat) <span className="kbd">ball</span> (0–100). Takror yuklash mavjud bahoni yangilaydi — bitta tinglovchi va tur uchun bitta yozuv.</div>
      )}
    </Card>
  )
}
