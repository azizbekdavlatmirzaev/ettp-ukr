import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button, Card, cx } from '@/ui'
import { sana } from '@/lib/format'

export interface TaqvimItem { id: string; sana: string; tugash?: string; nomi: string; turi: 'kurs' | 'muddat' | 'dars' | 'test' | 'eslatma'; izoh?: string }
const OY = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']
const HAFTA = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const RANG: Record<string, string> = { kurs: 'var(--primary)', dars: 'var(--teal-500)', test: '#7c5cc4', muddat: 'var(--err)', eslatma: 'var(--amber-500)' }
const NOM: Record<string, string> = { kurs: 'Kurs', dars: 'Mashgʻulot', test: 'Test / baholash', muddat: 'Muddat', eslatma: 'Eslatma' }

/** Oylik taqvim (TZ: muddatlar va kurs sanalari Taqvimga tushadi). */
export function Taqvim({ items, boshlangich }: { items: TaqvimItem[]; boshlangich?: string }) {
  const b = new Date((boshlangich ?? new Date().toISOString()).slice(0, 10) + 'T12:00:00')
  const [y, setY] = useState(b.getFullYear())
  const [m, setM] = useState(b.getMonth())
  const [tanlangan, setTanlangan] = useState<string>(new Date().toISOString().slice(0, 10))
  const kunlar = useMemo(() => {
    const first = new Date(y, m, 1)
    const start = (first.getDay() + 6) % 7
    const n = new Date(y, m + 1, 0).getDate()
    const arr: (string | null)[] = Array(start).fill(null)
    for (let d = 1; d <= n; d++) arr.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    while (arr.length % 7) arr.push(null)
    return arr
  }, [y, m])
  const kunda = (d: string) => items.filter((i) => (i.tugash ? i.sana.slice(0, 10) <= d && i.tugash.slice(0, 10) >= d : i.sana.slice(0, 10) === d))
  const bugun = new Date().toISOString().slice(0, 10)
  const oyItems = items.filter((i) => i.sana.slice(0, 7) === `${y}-${String(m + 1).padStart(2, '0')}` || (i.tugash && i.tugash.slice(0, 7) >= `${y}-${String(m + 1).padStart(2, '0')}` && i.sana.slice(0, 7) <= `${y}-${String(m + 1).padStart(2, '0')}`)).sort((a, b) => a.sana.localeCompare(b.sana))
  const oz = (k: number) => {
    const d = new Date(y, m + k, 1)
    setY(d.getFullYear())
    setM(d.getMonth())
  }
  return (
    <div className="grid g-main">
      <Card>
        <div className="row between mb-16">
          <h2>{OY[m]} {y}</h2>
          <div className="row">
            <Button size="sm" v="ghost" onClick={() => { setY(new Date().getFullYear()); setM(new Date().getMonth()) }}>Bugun</Button>
            <button className="icon-btn" onClick={() => oz(-1)} aria-label="Oldingi oy"><ChevronLeft /></button>
            <button className="icon-btn" onClick={() => oz(1)} aria-label="Keyingi oy"><ChevronRight /></button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {HAFTA.map((h) => (
            <div key={h} className="xs muted b center" style={{ padding: '4px 0' }}>{h}</div>
          ))}
          {kunlar.map((d, i) => {
            if (!d) return <div key={i} />
            const ev = kunda(d)
            return (
              <motion.button
                key={d}
                whileHover={{ y: -2 }}
                onClick={() => setTanlangan(d)}
                className={cx('card')}
                style={{ padding: '6px 6px 8px', minHeight: 74, textAlign: 'left', cursor: 'pointer', borderColor: d === tanlangan ? 'var(--primary)' : d === bugun ? 'var(--teal-400)' : undefined, background: d === bugun ? 'var(--accent-soft)' : undefined, boxShadow: 'none', borderRadius: 10 }}
              >
                <div className={cx('small', d === bugun && 'b')} style={{ color: d === bugun ? 'var(--teal-600)' : undefined }}>{Number(d.slice(8))}</div>
                <div className="col gap-4 mt-4">
                  {ev.slice(0, 2).map((e) => (
                    <div key={e.id} className="xs" style={{ background: RANG[e.turi], color: '#fff', borderRadius: 5, padding: '1px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nomi}</div>
                  ))}
                  {ev.length > 2 && <div className="xs muted">+{ev.length - 2}</div>}
                </div>
              </motion.button>
            )
          })}
        </div>
        <div className="legend mt-16">
          {Object.entries(NOM).map(([k, v]) => (
            <span key={k}><i style={{ background: RANG[k] }} />{v}</span>
          ))}
        </div>
      </Card>
      <div className="col gap-16">
        <Card>
          <h3 className="mb-12">{sana(tanlangan)}</h3>
          {kunda(tanlangan).length === 0 ? <div className="muted small">Bu kunga tadbir yoʻq.</div> : kunda(tanlangan).map((e) => (
            <div key={e.id} className="li">
              <span className="ic" style={{ background: RANG[e.turi], color: '#fff' }}>{NOM[e.turi][0]}</span>
              <div className="grow">
                <div className="b small">{e.nomi}</div>
                <div className="xs muted">{NOM[e.turi]}{e.tugash ? ` · ${sana(e.sana)} – ${sana(e.tugash)}` : ''}{e.izoh ? ` · ${e.izoh}` : ''}</div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="mb-12">Shu oydagi tadbirlar</h3>
          {oyItems.length === 0 ? <div className="muted small">Tadbir yoʻq.</div> : oyItems.map((e) => (
            <div key={e.id} className="li" style={{ cursor: 'pointer' }} onClick={() => setTanlangan(e.sana.slice(0, 10))}>
              <span className="ic" style={{ background: RANG[e.turi], color: '#fff', fontWeight: 700 }}>{Number(e.sana.slice(8, 10))}</span>
              <div className="grow">
                <div className="b small">{e.nomi}</div>
                <div className="xs muted">{NOM[e.turi]} · {sana(e.sana)}{e.tugash ? ` – ${sana(e.tugash)}` : ''}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
