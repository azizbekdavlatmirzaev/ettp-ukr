import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Badge, Button, Card, Empty, Holat, Sel } from '@/ui'
import { BOSH_FILTR, KatalogFiltr, filtrla, type KFiltr } from './_KatalogFiltr'
import { KursDrawer } from './_KursDrawer'
import { KursKarta, kursInfo, meningYozilishim } from './_parts'

const SARALASH = [
  { v: 'sana', l: 'Boshlanish sanasi' },
  { v: 'kredit', l: 'Kredit (koʻpdan)' },
  { v: 'orin', l: 'Boʻsh oʻrinlar' },
  { v: 'nomi', l: 'Nomi (A–Z)' },
]

export function Katalog() {
  const { db, shaxs, bugun } = useXodim()
  const [sp, setSp] = useSearchParams()
  const [f, setF] = useState<KFiltr>(BOSH_FILTR)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('sana')
  const [panel, setPanel] = useState(false)
  const [tanlangan, setTanlangan] = useState<T.Oqim | null>(null)

  const katalog = useMemo(() => db.oqimlar.filter((o) => A.katalogdami(db, o, bugun)), [db, bugun])
  useEffect(() => {
    const id = sp.get('kurs')
    if (id) {
      const o = A.oqim(db, id)
      if (o) setTanlangan(o)
    }
  }, [sp, db])

  const rows = useMemo(() => {
    let r = filtrla(db, shaxs, katalog, f)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      r = r.filter((o) => {
        const { v, p } = kursInfo(db, o)
        return `${v.nomi} ${p.nomi} ${p.qisqa} ${o.kod}`.toLowerCase().includes(s)
      })
    }
    const key = (o: T.Oqim) => {
      const i = kursInfo(db, o)
      return sort === 'kredit' ? -i.kredit : sort === 'orin' ? -i.bosh : sort === 'nomi' ? i.v.nomi : o.boshlanish
    }
    return [...r].sort((a, b) => {
      const x = key(a), y = key(b)
      return x > y ? 1 : x < y ? -1 : 0
    })
  }, [db, shaxs, katalog, f, q, sort])

  const yop = () => {
    setTanlangan(null)
    if (sp.get('kurs')) {
      sp.delete('kurs')
      setSp(sp, { replace: true })
    }
  }
  const faolFiltr = Object.entries(f).filter(([k, v]) => k !== 'mos' && v).length

  return (
    <div className="grid g-side">
      <div className={panel ? '' : 'katalog-filtr'} style={{ display: 'block' }}>
        <div style={{ position: 'sticky', top: 80 }}>
          <KatalogFiltr f={f} set={setF} rows={katalog} db={db} />
        </div>
      </div>
      <div className="col gap-16" style={{ minWidth: 0 }}>
        <Card className="row wrap" >
          <div className="row grow" style={{ minWidth: 200, border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px', height: 40 }}>
            <Search size={16} color="var(--text-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kurs, provayder yoki oqim kodi…" aria-label="Kurs qidirish" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, height: 38, color: 'var(--text)' }} />
          </div>
          <Sel value={sort} onChange={(e) => setSort(e.target.value)} options={SARALASH} style={{ width: 'auto', minWidth: 180, height: 40, minHeight: 40 }} aria-label="Saralash" />
          <Button v={panel ? 'primary' : 'secondary'} size="sm" icon={<SlidersHorizontal />} onClick={() => setPanel(!panel)} className="filtr-tugma">
            Filtr {faolFiltr > 0 && <Badge ton="brand">{faolFiltr}</Badge>}
          </Button>
          <div className="small muted" style={{ width: '100%' }}>
            {rows.length} ta kurs topildi · qabul ochiq va akkreditatsiyasi amaldagi oqimlar {f.mos && <span>· <b>faqat sizga mos</b></span>}
          </div>
        </Card>
        {rows.length === 0 ? (
          <Card>
            <Empty title="Mos kurs topilmadi" action={<Button v="secondary" onClick={() => { setF({ ...BOSH_FILTR, mos: false }); setQ('') }}>Filtrlarni tozalash</Button>}>
              Filtr shartlarini yumshating yoki «Mos kurslar» belgisini olib tashlang.
            </Empty>
          </Card>
        ) : (
          <motion.div layout className="grid g3 katalog-grid">
            <AnimatePresence mode="popLayout">
              {rows.map((o) => {
                const yoz = meningYozilishim(db, shaxs.id, o.id)
                const mos = A.mosmi(db, shaxs, A.versiya(db, o.versiyaId)!)
                return (
                  <motion.div key={o.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}>
                    <KursKarta o={o} onOpen={() => setTanlangan(o)} izoh={yoz ? <div className="row gap-6 xs"><span className="muted">Arizangiz:</span> <Holat h={yoz.holat} /></div> : !mos.ok ? <div className="xs" style={{ color: 'var(--warn)' }}>⚠ {mos.sabab}</div> : null} />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      <KursDrawer o={tanlangan} onClose={yop} />
      <style>{`
        .filtr-tugma { display: none; }
        @media (max-width: 860px) {
          .filtr-tugma { display: inline-flex; }
          .katalog-filtr { display: none !important; }
        }
        @media (max-width: 1280px) and (min-width: 861px) { .katalog-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
      `}</style>
    </div>
  )
}
