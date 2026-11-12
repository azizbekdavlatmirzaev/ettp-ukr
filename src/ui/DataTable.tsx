import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, Search } from 'lucide-react'
import { excelYukla } from '@/lib/eksport'
import { useStore } from '@/domain/store'
import { eksportQayd } from '@/domain/amallar'
import { Empty, Sel, cx } from './index'

export interface Col<T> {
  k: string
  l: ReactNode
  r: (row: T) => ReactNode
  sort?: (row: T) => string | number
  excel?: (row: T) => string | number | undefined | null
  w?: number | string
  align?: 'right' | 'center'
  hide?: boolean
}
export interface Filtr<T> { k: string; l: string; options: { v: string; l: string }[]; get: (row: T) => string | string[] }

export function DataTable<T extends { id: string }>({
  rows, cols, search, filters, exportName, onRow, selectable, bulk, pageSize = 12, empty, tools, title, initialSort, rowClass,
}: {
  rows: T[]
  cols: Col<T>[]
  search?: (r: T) => string
  filters?: Filtr<T>[]
  exportName?: string
  onRow?: (r: T) => void
  selectable?: boolean
  bulk?: (ids: string[], clear: () => void) => ReactNode
  pageSize?: number
  empty?: ReactNode
  tools?: ReactNode
  title?: ReactNode
  initialSort?: { k: string; dir: 1 | -1 }
  rowClass?: (r: T) => string | undefined
}) {
  const [q, setQ] = useState('')
  const [f, setF] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | undefined>(initialSort)
  const [page, setPage] = useState(0)
  const [sel, setSel] = useState<string[]>([])
  const amal = useStore((s) => s.amal)
  const toast = useStore((s) => s.toast)

  const filtered = useMemo(() => {
    let r = rows
    if (q.trim() && search) {
      const s = q.trim().toLowerCase()
      r = r.filter((x) => search(x).toLowerCase().includes(s))
    }
    for (const fl of filters ?? []) {
      const v = f[fl.k]
      if (v) r = r.filter((x) => {
        const g = fl.get(x)
        return Array.isArray(g) ? g.includes(v) : g === v
      })
    }
    if (sort) {
      const c = cols.find((c) => c.k === sort.k)
      if (c?.sort) r = [...r].sort((a, b) => {
        const x = c.sort!(a), y = c.sort!(b)
        return (x > y ? 1 : x < y ? -1 : 0) * sort.dir
      })
    }
    return r
  }, [rows, q, f, sort, filters, search, cols])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const p = Math.min(page, pages - 1)
  const view = filtered.slice(p * pageSize, (p + 1) * pageSize)
  const vis = cols.filter((c) => !c.hide)

  const eksport = () => {
    if (!exportName) return
    const us = cols.filter((c) => c.excel).map((c) => ({ kalit: c.k, nomi: typeof c.l === 'string' ? c.l : c.k, qiymat: c.excel! }))
    excelYukla(exportName, exportName, us, filtered)
    amal(eksportQayd, `${exportName} (Excel)`, filtered.length)
    toast({ turi: 'ok', matn: `${filtered.length} qator Excel faylga yuklandi. Eksport audit jurnaliga yozildi.` })
  }

  const allOn = view.length > 0 && view.every((r) => sel.includes(r.id))

  return (
    <div className="card flush">
      {(title || search || filters?.length || exportName || tools) && (
        <div className="tbl-tools">
          {title && <div className="b" style={{ marginRight: 'auto' }}>{title}</div>}
          {search && (
            <div className="search">
              <Search />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Qidirish..." aria-label="Qidirish" />
            </div>
          )}
          {filters?.map((fl) => (
            <Sel key={fl.k} style={{ width: 'auto', minWidth: 150, height: 36, minHeight: 36, padding: '0 32px 0 10px', fontSize: 13 }} value={f[fl.k] ?? ''} onChange={(e) => { setF({ ...f, [fl.k]: e.target.value }); setPage(0) }} options={fl.options} placeholder={fl.l + ': barchasi'} />
          ))}
          <div className="row" style={{ marginLeft: 'auto' }}>
            {tools}
            {exportName && (
              <button className="btn secondary sm" onClick={eksport} title="Excel eksport">
                <FileSpreadsheet /> Excel
              </button>
            )}
          </div>
        </div>
      )}
      {selectable && sel.length > 0 && bulk && (
        <div className="bulk">
          <span>{sel.length} ta tanlandi</span>
          <div className="row wrap" style={{ marginLeft: 'auto' }}>{bulk(sel, () => setSel([]))}</div>
        </div>
      )}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {selectable && (
                <th className="chk">
                  <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? sel.filter((x) => !view.some((r) => r.id === x)) : Array.from(new Set([...sel, ...view.map((r) => r.id)])))} aria-label="Hammasini tanlash" />
                </th>
              )}
              {vis.map((c) => (
                <th
                  key={c.k}
                  className={cx(c.sort && 'sortable', c.align)}
                  style={{ width: c.w, textAlign: c.align }}
                  onClick={() => c.sort && setSort(sort?.k === c.k ? { k: c.k, dir: sort.dir === 1 ? -1 : 1 } : { k: c.k, dir: 1 })}
                >
                  <span className="row gap-4" style={{ display: 'inline-flex' }}>
                    {c.l}
                    {c.sort && (sort?.k === c.k ? sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} className={cx(onRow && 'click', sel.includes(r.id) && 'sel', rowClass?.(r))} onClick={() => onRow?.(r)}>
                {selectable && (
                  <td className="chk" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={sel.includes(r.id)} onChange={() => setSel(sel.includes(r.id) ? sel.filter((x) => x !== r.id) : [...sel, r.id])} aria-label="Tanlash" />
                  </td>
                )}
                {vis.map((c) => (
                  <td key={c.k} style={{ textAlign: c.align }}>{c.r(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!view.length && (empty ?? <Empty title="Maʼlumot topilmadi">Qidiruv yoki filtr shartlarini oʻzgartirib koʻring.</Empty>)}
      </div>
      {filtered.length > 0 && (
        <div className="tbl-foot">
          <span>
            {p * pageSize + 1}–{Math.min(filtered.length, (p + 1) * pageSize)} / {filtered.length} ta yozuv
          </span>
          {pages > 1 && (
            <div className="pager">
              <button disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Oldingi">‹</button>
              {Array.from({ length: pages }, (_, i) => i).filter((i) => i === 0 || i === pages - 1 || Math.abs(i - p) <= 1).map((i, k, arr) => (
                <span key={i} className="row gap-4">
                  {k > 0 && arr[k - 1] !== i - 1 && <span className="muted">…</span>}
                  <button className={cx(i === p && 'on')} onClick={() => setPage(i)}>{i + 1}</button>
                </span>
              ))}
              <button disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Keyingi">›</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
