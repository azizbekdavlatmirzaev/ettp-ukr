import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, FilterX, Search, SearchX } from 'lucide-react'
import { useStore } from '@/domain/store'
import { MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { Button, Empty, Sel, Seg } from '@/ui'
import { SHAKL } from '@/lib/holat'
import { PageBand, PublicLayout, bugunISO, yangilanganMatn } from './_parts'
import { KursKarta, hududYoki, katalogQatorlar, type KatalogQator } from './_KursKarta'
import { KatalogDrawer } from './_KatalogDrawer'

const KREDIT = [
  { v: '1-5', l: '1–5 kredit' },
  { v: '6-9', l: '6–9 kredit' },
  { v: '10-99', l: '10 va undan koʻp' },
]

export default function PublicOchiqKatalog() {
  const db = useStore((s) => s.db)
  const loc = useLocation()
  const nav = useNavigate()
  const qatorlar = useMemo(() => katalogQatorlar(db, bugunISO()), [db])
  const [q, setQ] = useState('')
  const [mut, setMut] = useState('')
  const [shakl, setShakl] = useState('')
  const [hudud, setHudud] = useState('')
  const [prov, setProv] = useState('')
  const [kredit, setKredit] = useState('')
  const [tartib, setTartib] = useState<'sana' | 'kredit' | 'nomi'>('sana')
  const [tanlangan, setTanlangan] = useState<KatalogQator | null>(null)

  useEffect(() => {
    const id = (loc.state as { ochiq?: string } | null)?.ochiq
    if (!id) return
    setTanlangan(qatorlar.find((x) => x.o.id === id) ?? null)
    nav(loc.pathname, { replace: true, state: null })
  }, [loc.state, loc.pathname, qatorlar, nav])

  const hududlar = useMemo(() => Array.from(new Set(qatorlar.map(hududYoki))).sort(), [qatorlar])
  const provlar = useMemo(() => Array.from(new Map(qatorlar.map((x) => [x.p.id, x.p.qisqa])).entries()).map(([v, l]) => ({ v, l })).sort((a, b) => a.l.localeCompare(b.l)), [qatorlar])

  const korinadi = useMemo(() => {
    const s = q.trim().toLowerCase()
    let r = qatorlar.filter((x) => {
      if (s && !`${x.v.nomi} ${x.p.nomi} ${x.p.qisqa} ${x.o.kod}`.toLowerCase().includes(s)) return false
      if (mut && x.v.mutaxassisliklar.length && !x.v.mutaxassisliklar.includes(mut)) return false
      if (shakl && x.v.shakl !== shakl) return false
      if (hudud && hududYoki(x) !== hudud) return false
      if (prov && x.p.id !== prov) return false
      if (kredit) {
        const [a, b] = kredit.split('-').map(Number)
        const k = x.v.tasdiqlanganKredit ?? 0
        if (k < a || k > b) return false
      }
      return true
    })
    if (tartib === 'kredit') r = [...r].sort((a, b) => (b.v.tasdiqlanganKredit ?? 0) - (a.v.tasdiqlanganKredit ?? 0))
    if (tartib === 'nomi') r = [...r].sort((a, b) => a.v.nomi.localeCompare(b.v.nomi))
    return r
  }, [qatorlar, q, mut, shakl, hudud, prov, kredit, tartib])

  const filtrBor = !!(q || mut || shakl || hudud || prov || kredit)
  const tozala = () => { setQ(''); setMut(''); setShakl(''); setHudud(''); setProv(''); setKredit('') }

  return (
    <PublicLayout>
      <PageBand crumb="Kurslar katalogi" icon={<BookOpen />} title="UKR kurslari katalogi"
        lead="Faqat akkreditatsiyalangan provayderlarning tasdiqlangan dasturlari va qabul ochiq oqimlari. Kredit miqdori akkreditatsiyada tasdiqlangan."
        source={`Manba: Provayderlar va dasturlar reestri · yangilangan: ${yangilanganMatn()}`} />
      <div className="pb-body">
        <div className="pb-wrap">
          <motion.div className="pb-card kt-bar" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="pb-filters">
              <div className="pb-search">
                <Search />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kurs, provayder yoki oqim kodi..." aria-label="Qidirish" />
              </div>
              <Sel className="inp" value={mut} onChange={(e) => setMut(e.target.value)} options={MUTAXASSISLIKLAR.map((m) => ({ v: m.id, l: m.nomi }))} placeholder="Mutaxassislik: barchasi" aria-label="Mutaxassislik" />
              <Sel value={shakl} onChange={(e) => setShakl(e.target.value)} options={Object.entries(SHAKL).map(([v, l]) => ({ v, l }))} placeholder="Shakl: barchasi" aria-label="Shakl" />
              <Sel value={hudud} onChange={(e) => setHudud(e.target.value)} options={hududlar} placeholder="Hudud: barchasi" aria-label="Hudud" />
              <Sel value={prov} onChange={(e) => setProv(e.target.value)} options={provlar} placeholder="Provayder: barchasi" aria-label="Provayder" />
              <Sel value={kredit} onChange={(e) => setKredit(e.target.value)} options={KREDIT} placeholder="Kredit: barchasi" aria-label="Kredit" />
            </div>
            <div className="row between wrap mt-12">
              <div className="row wrap gap-6">
                <span className="b">{korinadi.length} ta kurs</span>
                <span className="xs muted">/ jami {qatorlar.length} ta ochiq oqim</span>
                {filtrBor && <Button v="ghost" size="xs" icon={<FilterX />} onClick={tozala}>Filtrlarni tozalash</Button>}
              </div>
              <Seg id="kt-sort" value={tartib} onChange={setTartib} items={[{ v: 'sana', l: 'Sana' }, { v: 'kredit', l: 'Kredit' }, { v: 'nomi', l: 'Nomi' }]} />
            </div>
          </motion.div>

          <div className="mt-24">
            {korinadi.length ? (
              <motion.div className="kt-grid" layout>
                <AnimatePresence initial={false}>
                  {korinadi.map((x, i) => <KursKarta key={x.o.id} q={x} i={i} onClick={() => setTanlangan(x)} />)}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="pb-card">
                <Empty icon={<SearchX />} title="Mos kurs topilmadi" action={<Button v="soft" onClick={tozala}>Filtrlarni tozalash</Button>}>
                  Qidiruv soʻzini qisqartiring yoki filtrlardan birini olib tashlang. Yangi oqimlar provayderlar tomonidan muntazam eʼlon qilinadi.
                </Empty>
              </div>
            )}
          </div>
        </div>
      </div>
      <KatalogDrawer q={tanlangan} onClose={() => setTanlangan(null)} />
    </PublicLayout>
  )
}
