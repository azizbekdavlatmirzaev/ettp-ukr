import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileBarChart, FileDown, ChevronRight } from 'lucide-react'
import * as A from '@/domain/amallar'
import { DataTable } from '@/ui/DataTable'
import { Button, Card, CardH, PageHeader, cx } from '@/ui'
import { BarCh } from '@/ui/charts'
import { umumiyPdf } from '@/lib/eksport'
import { son } from '@/lib/format'
import { useMarkaz, manba } from './_parts'
import { hisobotlar, type Hisobot } from './_hisobotlar'

export default function MarkazHisobotlar() {
  const { db, yil, bugun, amal, ok } = useMarkaz()
  const royxat = useMemo(() => hisobotlar(db, yil, bugun), [db, yil, bugun])
  const [tanl, setTanl] = useState('prov')
  const [busy, setBusy] = useState(false)
  const h = royxat.find((x) => x.id === tanl) ?? royxat[0]

  const pdf = async (x: Hisobot) => {
    setBusy(true)
    try {
      await umumiyPdf(`hisobot-${x.id}-${bugun}`, x.nomi, [
        { t: 'Tavsif', qatorlar: [x.desc, `Qatorlar soni: ${x.rows.length}. Sana: ${bugun}.`] },
        { t: 'Maʼlumotlar', qatorlar: x.rows.map((r, i) => `${i + 1}. ` + x.ustunlar.map((u) => `${u.l}: ${r[u.k] ?? '—'}`).join(' · ')) },
      ])
      amal(A.eksportQayd, `${x.nomi} (PDF)`, x.rows.length)
      ok(`«${x.nomi}» PDF yuklandi. Eksport audit jurnaliga yozildi.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Hisobotlar" desc="Tayyor hisobotlar: koʻrib chiqing, Excel yoki PDF yuklab oling. Har bir eksport audit jurnaliga yoziladi." source={manba('UKR quyi tizimi maʼlumotlari (real vaqt)')} />
      <div className="grid g-side">
        <Card flush>
          <div style={{ padding: 8 }}>
            {royxat.map((x) => (
              <motion.button key={x.id} whileHover={{ x: 2 }} className={cx('li')} onClick={() => setTanl(x.id)}
                style={{ width: '100%', border: 'none', background: x.id === h.id ? 'var(--primary-soft)' : 'transparent', borderRadius: 10, padding: '10px 10px', cursor: 'pointer', textAlign: 'left' }}>
                <div className={cx('ic', x.id === h.id && 'brand')}><FileBarChart /></div>
                <div className="grow"><div className="small b">{x.nomi}</div><div className="xs muted">{x.rows.length} qator</div></div>
                <ChevronRight size={15} />
              </motion.button>
            ))}
          </div>
        </Card>
        <div className="col gap-16" style={{ minWidth: 0 }}>
          <Card key={h.id}>
            <CardH icon={<FileBarChart />} title={h.nomi} sub={h.desc} right={<Button size="sm" v="secondary" icon={<FileDown />} loading={busy} onClick={() => pdf(h)}>PDF</Button>} />
            <BarCh data={h.grafik.data} keys={h.grafik.keys} names={h.grafik.names} height={220} />
          </Card>
          <DataTable
            key={h.id + '-t'}
            rows={h.rows}
            exportName={`hisobot-${h.id}`}
            search={(r) => Object.values(r).join(' ')}
            title={`${h.rows.length} qator`}
            cols={h.ustunlar.map((u) => ({
              k: u.k,
              l: u.l,
              align: u.son ? ('right' as const) : undefined,
              r: (r: (typeof h.rows)[number]) => (u.son && typeof r[u.k] === 'number' ? son(r[u.k] as number, 1).replace(/\.0$/, '') : String(r[u.k] ?? '—')),
              sort: (r: (typeof h.rows)[number]) => r[u.k] ?? '',
              excel: (r: (typeof h.rows)[number]) => r[u.k],
            }))}
          />
        </div>
      </div>
    </>
  )
}
