import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FileSearch, Globe2, MessageSquareWarning, Plus } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useXodim } from '@/shared/hooks'
import { MurojaatModal } from '@/shared/Murojaat'
import { Button, Empty, Holat, PageHeader, Tabs } from '@/ui'
import { DataTable } from '@/ui/DataTable'
import { kunFarq, sana, sanaVaqt } from '@/lib/format'
import { ArizaDrawer, type ArizaRow } from './_ArizaDrawer'
import { TanOlishForma } from './_TanOlishForma'
import { PsvForma } from './_PsvForma'

type Tab = 'barchasi' | 'tan_olish' | 'murojaat' | 'psv' | 'kurs'
const TUR: Record<ArizaRow['tur'], string> = { tan_olish: 'Xorijiy kreditni tan olish', murojaat: 'Murojaat', psv: 'PSV', kurs: 'Kursga ariza' }

export default function Arizalar() {
  const { db, user, shaxs } = useXodim()
  const [tab, setTab] = useState<Tab>('barchasi')
  const [menu, setMenu] = useState(false)
  const [forma, setForma] = useState<'' | 'tan' | 'mur' | 'psv'>('')
  const [tanl, setTanl] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const k = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false)
    document.addEventListener('mousedown', k)
    return () => document.removeEventListener('mousedown', k)
  }, [])

  const rows = useMemo<ArizaRow[]>(() => [
    ...db.tanOlish.filter((t) => t.personId === shaxs.id).map((t) => ({ id: t.id, tur: 'tan_olish' as const, raqam: t.raqam, nomi: t.kurs, holat: t.holat, sana: t.yuborilgan, muddat: t.muddat, x: t })),
    ...db.murojaatlar.filter((m) => m.arizachiId === user.id).map((m) => ({ id: m.id, tur: 'murojaat' as const, raqam: m.raqam, nomi: m.obyekt?.nomi ?? m.matn.slice(0, 60), holat: m.holat, sana: m.yuborilgan, muddat: m.muddat, x: m })),
    ...db.psv.filter((p) => p.personId === shaxs.id).map((p) => ({ id: p.id, tur: 'psv' as const, raqam: p.raqam, nomi: `PSV: ${p.qabulQiluvchi}`, holat: p.holat, sana: p.yaratilgan, x: p })),
    ...db.yozilishlar.filter((y) => y.personId === shaxs.id).map((y) => {
      const o = A.oqim(db, y.oqimId)!
      return { id: y.id, tur: 'kurs' as const, raqam: o.kod, nomi: A.versiya(db, o.versiyaId)?.nomi ?? o.kod, holat: y.holat, sana: y.yuborilgan, x: y }
    }),
  ].sort((a, b) => b.sana.localeCompare(a.sana)), [db, shaxs.id, user.id])

  const korin = tab === 'barchasi' ? rows : rows.filter((r) => r.tur === tab)
  const n = (t: ArizaRow['tur']) => rows.filter((r) => r.tur === t).length
  const tanlangan = rows.find((r) => r.id === tanl) ?? null
  const yangi = (f: 'tan' | 'mur' | 'psv') => { setMenu(false); setForma(f) }

  return (
    <>
      <PageHeader title="Arizalarim" desc="Xorijiy kreditni tan olish, murojaat va apellyatsiyalar, PSV soʻrovlari va kursga arizalar" source={`Manba: Arizalar moduli · yangilangan: ${sanaVaqt(new Date().toISOString())}`}
        actions={
          <div ref={ref} style={{ position: 'relative' }}>
            <Button v="primary" icon={<Plus />} onClick={() => setMenu(!menu)}>Yangi ariza <ChevronDown size={15} /></Button>
            <AnimatePresence>
              {menu && (
                <motion.div className="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ minWidth: 280 }}>
                  <button onClick={() => yangi('tan')}><Globe2 /> <span><b>Xorijiy kreditni tan olish</b><div className="xs muted">Xorijda oʻtgan kurs boʻyicha</div></span></button>
                  <button onClick={() => yangi('mur')}><MessageSquareWarning /> <span><b>Murojaat / apellyatsiya</b><div className="xs muted">Kredit, baho, sertifikat ustidan</div></span></button>
                  <button onClick={() => yangi('psv')}><FileSearch /> <span><b>PSV soʻrovi</b><div className="xs muted">Hujjatlarni manbadan tekshirish</div></span></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        } />
      <div className="mb-16">
        <Tabs id="ariza" value={tab} onChange={setTab} tabs={[
          { v: 'barchasi', l: 'Barchasi', n: rows.length },
          { v: 'tan_olish', l: 'Xorijiy kreditni tan olish', n: n('tan_olish') },
          { v: 'murojaat', l: 'Murojaatlar', n: n('murojaat') },
          { v: 'psv', l: 'PSV', n: n('psv') },
          { v: 'kurs', l: 'Kursga arizalar', n: n('kurs') },
        ]} />
      </div>
      <DataTable
        rows={korin}
        onRow={(r) => setTanl(r.id)}
        search={(r) => `${r.raqam} ${r.nomi}`}
        exportName="arizalarim"
        initialSort={{ k: 'sana', dir: -1 }}
        empty={<Empty title="Ariza yoʻq" action={<Button v="primary" icon={<Plus />} onClick={() => setMenu(true)}>Yangi ariza</Button>}>«Yangi ariza» tugmasi orqali tan olish, murojaat yoki PSV soʻrovini yuboring.</Empty>}
        cols={[
          { k: 'raqam', l: 'Raqam', r: (r) => <span className="mono small nowrap">{r.raqam}</span>, sort: (r) => r.raqam, excel: (r) => r.raqam },
          { k: 'tur', l: 'Turi', r: (r) => <span className="tag">{TUR[r.tur]}</span>, excel: (r) => TUR[r.tur] },
          { k: 'nomi', l: 'Mazmuni', r: (r) => <span className="small b">{r.nomi}</span>, excel: (r) => r.nomi },
          { k: 'holat', l: 'Holat', r: (r) => <span className="row wrap gap-4"><Holat h={r.holat} />{r.tur === 'psv' && r.x.tolov.holat === 'kutilmoqda' && <Holat ton="warn">Toʻlov: kutilmoqda</Holat>}</span>, excel: (r) => r.holat },
          { k: 'sana', l: 'Yuborilgan', r: (r) => <span className="small nowrap">{sana(r.sana)}</span>, sort: (r) => r.sana, excel: (r) => sana(r.sana) },
          { k: 'muddat', l: 'Muddat', r: (r) => r.muddat && !['tasdiqlandi', 'rad_etildi', 'qaror', 'yopildi'].includes(r.holat) ? <span className="small nowrap" style={{ color: kunFarq(r.muddat) <= 2 ? 'var(--warn)' : undefined }}>{sana(r.muddat)}</span> : <span className="muted">—</span>, excel: (r) => r.muddat ?? '' },
        ]}
      />
      <ArizaDrawer r={tanlangan} onClose={() => setTanl(null)} />
      <TanOlishForma open={forma === 'tan'} onClose={() => setForma('')} />
      <MurojaatModal open={forma === 'mur'} onClose={() => setForma('')} />
      <PsvForma open={forma === 'psv'} onClose={() => setForma('')} onYaratildi={(p) => setTanl(p.id)} />
    </>
  )
}
