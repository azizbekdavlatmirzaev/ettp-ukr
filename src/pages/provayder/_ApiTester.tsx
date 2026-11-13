// «API va LMS» → interaktiv sinovchi: POST /api/ukr/v1/results imitatsiyasi (200 / 409 / 422 / 429).
import { useMemo, useRef, useState } from 'react'
import { Send, Repeat, RefreshCw, TerminalSquare } from 'lucide-react'
import { Badge, Button, Card, CardH, Field, Inp, Sel, Seg } from '@/ui'
import * as A from '@/domain/amallar'
import { sanaVaqt } from '@/lib/format'
import { useProv, uuid } from './_umumiy'

interface Javob { http: number; body: unknown; vaqt: string; ms: number }

export function ApiTester() {
  const { db, p, oqimlar, yozilishlar, amal } = useProv()
  const faol = useMemo(() => oqimlar.filter((o) => yozilishlar.some((y) => y.oqimId === o.id && ['qabul_qilindi', 'oqimoqda'].includes(y.holat))), [oqimlar, yozilishlar])
  const [oId, setOId] = useState(faol[0]?.id ?? oqimlar[0]?.id ?? '')
  const ting = yozilishlar.filter((y) => y.oqimId === oId && !['rad_etildi', 'chiqdi'].includes(y.holat))
  const [jshshir, setJ] = useState(() => (ting[0] ? A.shaxs(db, ting[0].personId)!.jshshir : ''))
  const [natija, setNatija] = useState<'passed' | 'failed'>('passed')
  const [ball, setBall] = useState(86)
  const [eventId, setEventId] = useState(uuid)
  const [javoblar, setJavoblar] = useState<Javob[]>([])
  const sorovlar = useRef<number[]>([])
  const o = A.oqim(db, oId)

  const body = { event_id: eventId, provider_id: p.id, cohort_id: o?.kod ?? '', jshshir, result: natija, score: ball, completed_at: new Date().toISOString().slice(0, 19) + '+05:00' }

  const yubor = () => {
    const t0 = performance.now()
    const now = Date.now()
    sorovlar.current = sorovlar.current.filter((t) => now - t < 10000)
    sorovlar.current.push(now)
    let j: Javob
    if (sorovlar.current.length > 6) {
      j = { http: 429, body: { status: 'rejected', reason: 'Soʻrovlar limiti: 10 soniyada 6 ta. Retry-After: 10' }, vaqt: new Date().toISOString(), ms: 1 }
    } else {
      const r = amal(A.lmsNatija, { event_id: body.event_id, cohort_id: body.cohort_id, jshshir: body.jshshir, result: body.result, score: body.score })
      j = { http: r?.http ?? 500, body: r ? { status: r.status, reason: r.reason } : { status: 'error' }, vaqt: new Date().toISOString(), ms: Math.max(1, Math.round(performance.now() - t0)) }
    }
    setJavoblar((x) => [j, ...x].slice(0, 8))
  }

  const ton = (h: number) => (h === 200 ? 'ok' : h === 409 ? 'warn' : 'err') as 'ok' | 'warn' | 'err'
  const oxirgi = javoblar[0]

  return (
    <Card>
      <CardH icon={<TerminalSquare />} title="Interaktiv sinov" sub="Soʻrov haqiqatan qayta ishlanadi: baho LMS manbasi bilan yoziladi, takror event_id → 409" right={<Badge ton="brand">sandbox</Badge>} />
      <div className="form-grid">
        <Field label="Oqim (cohort_id)" req>
          <Sel value={oId} onChange={(e) => { setOId(e.target.value); const y = yozilishlar.find((x) => x.oqimId === e.target.value && !['rad_etildi', 'chiqdi'].includes(x.holat)); setJ(y ? A.shaxs(db, y.personId)!.jshshir : '') }} options={oqimlar.map((x) => ({ v: x.id, l: `${x.kod} · ${A.versiya(db, x.versiyaId)?.nomi.slice(0, 34)}` }))} />
        </Field>
        <Field label="Tinglovchi (JSHSHIR)" req help="Roʻyxatdan tanlang yoki xato JSHSHIR kiriting (422)">
          <div className="row">
            <Sel value={ting.some((y) => A.shaxs(db, y.personId)?.jshshir === jshshir) ? jshshir : ''} onChange={(e) => setJ(e.target.value)} placeholder="Qoʻlda" options={ting.map((y) => { const s = A.shaxs(db, y.personId)!; return { v: s.jshshir, l: A.qisqaFio(s) } })} />
            <Inp className="mono" value={jshshir} onChange={(e) => setJ(e.target.value)} aria-label="JSHSHIR" />
          </div>
        </Field>
        <Field label="result"><Seg id="api-res" value={natija} onChange={setNatija} items={[{ v: 'passed' as const, l: 'passed' }, { v: 'failed' as const, l: 'failed' }]} /></Field>
        <Field label="score (0–100)"><Inp type="number" min={0} max={100} value={ball} onChange={(e) => setBall(Number(e.target.value))} /></Field>
        <Field label="event_id (yagona soʻrov identifikatori)" full>
          <div className="row">
            <Inp className="mono" value={eventId} onChange={(e) => setEventId(e.target.value)} />
            <Button v="ghost" size="sm" icon={<RefreshCw />} onClick={() => setEventId(uuid())}>Yangi</Button>
          </div>
        </Field>
      </div>
      <div className="code mt-12">{`POST /api/ukr/v1/results\nAuthorization: Bearer ukr_live_••••\nIdempotency-Key: ${eventId}\n\n${JSON.stringify(body, null, 2)}`}</div>
      <div className="row wrap mt-12">
        <Button v="primary" icon={<Send />} disabled={!o} onClick={yubor}>Yuborish</Button>
        <Button v="secondary" icon={<Repeat />} disabled={!javoblar.length} onClick={yubor}>Takror yuborish (shu event_id)</Button>
        <Button v="ghost" onClick={() => { setEventId(uuid()); setJavoblar([]) }}>Tozalash</Button>
      </div>
      {oxirgi && (
        <div className="mt-12">
          <div className="row gap-6 mb-8"><Badge ton={ton(oxirgi.http)}>HTTP {oxirgi.http}</Badge><span className="xs muted">{oxirgi.ms} ms · {sanaVaqt(oxirgi.vaqt)}</span></div>
          <div className="code">{JSON.stringify(oxirgi.body, null, 2)}</div>
        </div>
      )}
      {javoblar.length > 1 && (
        <div className="col gap-4 mt-12">
          <div className="xs muted b">Soʻrovlar tarixi</div>
          {javoblar.slice(1).map((j, i) => (
            <div key={i} className="row gap-6 xs"><Badge ton={ton(j.http)}>{j.http}</Badge><span className="mono">{(j.body as { reason?: string }).reason}</span></div>
          ))}
        </div>
      )}
    </Card>
  )
}
