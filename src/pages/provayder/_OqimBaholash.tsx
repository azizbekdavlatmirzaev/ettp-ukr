// Oqim → «Baholash» bandi: tur boʻyicha ballar, rubrika oynasi, Excel import.
import { useEffect, useMemo, useState } from 'react'
import { Lock, PenLine, SlidersHorizontal } from 'lucide-react'
import { Alert, Badge, Button, Card, CardH, Empty, Field, Inp, Modal, Seg } from '@/ui'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { sanaVaqt } from '@/lib/format'
import { BAHO_TURLARI, useProv, Yopiq } from './_umumiy'
import { ExcelBaho } from './_ExcelBaho'

const MEZON: Record<T.BaholashTuri, string[]> = {
  test: ['Nazariy bilim'],
  amaliy: ['Tayyorgarlik va xavfsizlik', 'Texnikani bajarish', 'Ketma-ketlik', 'Natijani baholash', 'Hujjatlashtirish'],
  vaziyatli: ['Muammoni aniqlash', 'Diagnostik fikrlash', 'Davolash rejasi', 'Asoslash'],
  OSKE: ['Anamnez va muloqot', 'Fizikal tekshiruv', 'Klinik koʻnikma', 'Qaror qabul qilish', 'Professionallik'],
  suhbat: ['Bilim chuqurligi', 'Mantiqiy fikrlash', 'Muloqot madaniyati'],
}

export function BaholashTab({ o }: { o: T.Oqim }) {
  const { db, yozilishlar, operator } = useProv()
  const v = A.versiya(db, o.versiyaId)!
  const turlar = useMemo(() => {
    const t = new Set<T.BaholashTuri>(['test', ...(v.baholash as T.BaholashTuri[])])
    return BAHO_TURLARI.filter((b) => t.has(b.v))
  }, [v.baholash])
  const ting = useMemo(() => yozilishlar.filter((y) => y.oqimId === o.id && ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi'].includes(y.holat)), [yozilishlar, o.id])
  const [kir, setKir] = useState<{ y: T.Yozilish; turi: T.BaholashTuri }>()

  const eng = (yId: string, t: T.BaholashTuri) => db.baholashlar.filter((b) => b.yozilishId === yId && b.turi === t).sort((a, b) => b.ball - a.ball)[0]

  return (
    <div className="col gap-16">
      <Card flush>
        <div style={{ padding: '16px 20px 0' }}>
          <CardH icon={<SlidersHorizontal />} title="Baholash vedomosti" sub={`Dastur baholash usullari: ${turlar.map((t) => t.l).join(', ')} · oʻtish bali 70`} right={!operator ? <Yopiq>Baholarni operator kiritadi</Yopiq> : undefined} />
        </div>
        {ting.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tinglovchi</th>
                  {turlar.map((t) => <th key={t.v} style={{ textAlign: 'center' }}>{t.l}</th>)}
                </tr>
              </thead>
              <tbody>
                {ting.map((y) => {
                  const s = A.shaxs(db, y.personId)!
                  return (
                    <tr key={y.id}>
                      <td><div className="b small">{A.toliqFio(s)}</div><div className="xs muted">davomat {A.davomatFoizi(db, y)}%</div></td>
                      {turlar.map((t) => {
                        const b = eng(y.id, t.v)
                        const tizim = b?.manba === 'Test quyi tizimi' || b?.manba === 'LMS'
                        return (
                          <td key={t.v} style={{ textAlign: 'center' }}>
                            {b ? (
                              <div className="col gap-4" style={{ alignItems: 'center' }}>
                                <Badge ton={b.otdi ? 'ok' : 'err'}>{b.ball} · {b.otdi ? 'oʻtdi' : 'oʻtmadi'}</Badge>
                                <span className="xs muted row gap-4" title={`${b.baholovchi} · ${sanaVaqt(b.sana)}`}>{tizim && <Lock size={11} />}{b.manba}</span>
                                {operator && !tizim && <Button size="xs" v="ghost" icon={<PenLine />} onClick={() => setKir({ y, turi: t.v })}>Tahrir</Button>}
                              </div>
                            ) : operator ? (
                              <Button size="xs" v="soft" icon={<PenLine />} onClick={() => setKir({ y, turi: t.v })}>{t.v === 'test' ? 'Qoʻlda' : 'Rubrika'}</Button>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Baholanadigan tinglovchi yoʻq">Qabul qilingan tinglovchilar shu yerda koʻrinadi.</Empty>
        )}
        <div style={{ padding: '0 20px 16px' }} className="xs muted row gap-6"><Lock size={12} /> Test quyi tizimi va LMS ballari avtomatik tushadi va bu yerda oʻzgartirilmaydi.</div>
      </Card>
      {operator && <ExcelBaho o={o} ting={ting} />}
      <RubrikaModal kir={kir} onClose={() => setKir(undefined)} />
    </div>
  )
}

function RubrikaModal({ kir, onClose }: { kir?: { y: T.Yozilish; turi: T.BaholashTuri }; onClose: () => void }) {
  const { db, amal, toast } = useProv()
  const mezon = kir ? MEZON[kir.turi] : []
  const [usul, setUsul] = useState<'rubrika' | 'ball'>('rubrika')
  const [q, setQ] = useState<number[]>([])
  const [ball, setBall] = useState(80)
  const [otish, setOtish] = useState(70)
  useEffect(() => {
    if (!kir) return
    const b = db.baholashlar.find((x) => x.yozilishId === kir.y.id && x.turi === kir.turi && x.manba !== 'Test quyi tizimi')
    setQ(MEZON[kir.turi].map(() => b?.ball ?? 75))
    setBall(b?.ball ?? 80)
    setOtish(b?.otishBali ?? 70)
    setUsul(kir.turi === 'test' ? 'ball' : 'rubrika')
  }, [kir]) // eslint-disable-line react-hooks/exhaustive-deps
  const ortacha = q.length ? Math.round(q.reduce((a, b) => a + b, 0) / q.length) : 0
  const yakuniy = usul === 'rubrika' ? ortacha : ball
  const s = kir ? A.shaxs(db, kir.y.personId) : undefined
  const saqla = () => {
    if (!kir) return
    const r = amal((d, c) => {
      A.baholashKirit(d, c, kir.y.id, kir.turi, yakuniy, otish, 'Rubrika')
      return true
    })
    if (r) {
      toast({ turi: 'ok', matn: `${s ? A.qisqaFio(s) : ''}: ${BAHO_TURLARI.find((t) => t.v === kir.turi)?.l} — ${yakuniy} ball (${yakuniy >= otish ? 'oʻtdi' : 'oʻtmadi'})` })
      onClose()
    }
  }
  return (
    <Modal open={!!kir} onClose={onClose} title={`${BAHO_TURLARI.find((t) => t.v === kir?.turi)?.l ?? ''} — elektron rubrika`} sub={s ? `${A.toliqFio(s)} · baholovchi tasdigʻi bilan` : ''}
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" onClick={saqla}>Bahoni saqlash ({yakuniy})</Button></>}>
      <div className="col gap-16">
        <Seg id="rub-usul" value={usul} onChange={setUsul} items={[{ v: 'rubrika' as const, l: 'Rubrika mezonlari' }, { v: 'ball' as const, l: 'Yakuniy ball' }]} />
        {usul === 'rubrika' ? (
          <div className="col gap-12">
            {mezon.map((m, i) => (
              <div key={m}>
                <div className="row between small"><span>{m}</span><b>{q[i] ?? 0}</b></div>
                <input type="range" min={0} max={100} step={5} value={q[i] ?? 0} onChange={(e) => setQ(q.map((x, k) => (k === i ? Number(e.target.value) : x)))} style={{ width: '100%', accentColor: 'var(--primary)' }} aria-label={m} />
              </div>
            ))}
            <Alert ton={ortacha >= otish ? 'ok' : 'warn'} title={`Oʻrtacha: ${ortacha} ball`}>{ortacha >= otish ? 'Oʻtish balidan yuqori' : `Oʻtish bali ${otish} — yetmaydi`}</Alert>
          </div>
        ) : (
          <Field label="Ball (0–100)" req><Inp type="number" min={0} max={100} value={ball} onChange={(e) => setBall(Number(e.target.value))} /></Field>
        )}
        <Field label="Oʻtish bali" help="Dastur pasportidagi meʼyor (odatda 70)"><Inp type="number" min={0} max={100} value={otish} onChange={(e) => setOtish(Number(e.target.value))} /></Field>
      </div>
    </Modal>
  )
}
