import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ListChecks, Lock, Plus } from 'lucide-react'
import { KONIKMALAR } from '@/domain/malumotnoma'
import { Alert, Bar, Button, Card, CardH, Holat, PageHeader, Stagger, staggerItem } from '@/ui'
import { DataTable } from '@/ui/DataTable'
import { sana, sanaVaqt } from '@/lib/format'
import { DARAJA } from '@/lib/holat'
import { RezidentYoq, bazaNomi, useRezident } from './_rz'
import { LogbookForma } from './_LogbookForma'

export default function Logbook() {
  const d = useRezident()
  const [forma, setForma] = useState(false)
  if (!d.r) return <><PageHeader title="Logbook" /><RezidentYoq /></>
  const { r, db, lh, att, yozuvlar, lFoiz } = d
  const konikmalar = KONIKMALAR[r.mutaxassislikId] ?? KONIKMALAR.M01
  const knom = (k: string) => konikmalar.find((x) => x.kod === k)?.nomi ?? k
  const rows = [...yozuvlar].sort((a, b) => b.sana.localeCompare(a.sana))
  return (
    <>
      <PageHeader title="Logbook" desc="Amaliy koʻnikmalar daftari — har bir yozuv klinik rahbar tomonidan tasdiqlanadi" source={`Manba: Rezidentura moduli · ${sanaVaqt(new Date().toISOString())}`}
        actions={<Button v="primary" icon={<Plus />} onClick={() => setForma(true)}>Yozuv qoʻshish</Button>} />

      <Card className="mb-16">
        <div className="row wrap between" style={{ gap: 16 }}>
          <div className="grow" style={{ minWidth: 240 }}>
            <div className="row between small" style={{ marginBottom: 4 }}><span className="muted">Umumiy bajarilish (minimal talab boʻyicha)</span><b>{lFoiz}%</b></div>
            <Bar v={lFoiz} ton={lFoiz >= 100 ? 'ok' : undefined} />
          </div>
          {att.ruxsat
            ? <Holat ton="ok">Yakuniy attestatsiyaga ruxsat bor</Holat>
            : <Holat ton="warn">Attestatsiyaga ruxsat yoʻq — {att.yetmaydi.length} ta majburiy koʻnikma yetishmaydi</Holat>}
        </div>
        {!att.ruxsat && <Alert ton="warn" title="Yakuniy attestatsiya bloklangan">Yetishmaydi: {att.yetmaydi.map((k) => `${k.kod} (${k.tasdiqlangan}/${k.minimal})`).join(', ')}. Logbook toʻldirilmasa yoki majburiy koʻnikma yetishmasa, ruxsat berilmaydi.</Alert>}
      </Card>

      <Card className="mb-16">
        <CardH icon={<ListChecks />} title="Koʻnikmalar boʻyicha holat" sub="Faqat tasdiqlangan yozuvlar hisobga olinadi" />
        <Stagger className="grid g2" >
          {lh.map((k) => (
            <motion.div key={k.kod} variants={staggerItem} className="card" style={{ boxShadow: 'none', padding: '12px 14px' }}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="row gap-6"><span className="mono xs muted">{k.kod}</span>{k.majburiy ? <span className="tag"><Lock size={11} /> majburiy</span> : <span className="tag">ixtiyoriy</span>}</div>
                  <div className="b small mt-4">{k.nomi}</div>
                </div>
                {k.foiz >= 100 && <CheckCircle2 size={18} color="var(--ok)" />}
              </div>
              <div className="row between xs mt-8" style={{ marginBottom: 4 }}><span className="muted">{k.kutilmoqda > 0 ? `${k.kutilmoqda} ta kutilmoqda` : ' '}</span><b>{k.tasdiqlangan} / {k.minimal}</b></div>
              <Bar v={k.tasdiqlangan} max={k.minimal} thin ton={k.foiz >= 100 ? 'ok' : k.majburiy && k.foiz < 50 ? 'err' : 'warn'} />
            </motion.div>
          ))}
        </Stagger>
      </Card>

      <DataTable title="Yozuvlar" rows={rows} exportName="logbook" search={(y) => `${y.konikmaKod} ${knom(y.konikmaKod)} ${y.izoh}`} initialSort={{ k: 'sana', dir: -1 }}
        filters={[
          { k: 'holat', l: 'Holat', options: [{ v: 'kutilmoqda', l: 'Kutilmoqda' }, { v: 'tasdiqlangan', l: 'Tasdiqlangan' }, { v: 'rad_etildi', l: 'Rad etildi' }], get: (y) => y.holat },
          { k: 'k', l: 'Koʻnikma', options: konikmalar.map((k) => ({ v: k.kod, l: k.kod })), get: (y) => y.konikmaKod },
        ]}
        cols={[
          { k: 'sana', l: 'Sana', r: (y) => <span className="nowrap small">{sana(y.sana)}</span>, sort: (y) => y.sana, excel: (y) => y.sana },
          { k: 'k', l: 'Koʻnikma', r: (y) => <div><span className="mono xs muted">{y.konikmaKod}</span><div className="small b">{knom(y.konikmaKod)}</div></div>, sort: (y) => y.konikmaKod, excel: (y) => `${y.konikmaKod} ${knom(y.konikmaKod)}` },
          { k: 'd', l: 'Daraja', r: (y) => <span className="small">{DARAJA[y.daraja]}</span>, excel: (y) => DARAJA[y.daraja] },
          { k: 'joy', l: 'Joy', r: (y) => <span className="xs">{bazaNomi(db, y.joy)}</span>, excel: (y) => bazaNomi(db, y.joy) },
          { k: 'izoh', l: 'Izoh', r: (y) => <span className="small">{y.izoh}</span>, excel: (y) => y.izoh },
          { k: 'holat', l: 'Holat', r: (y) => <div><Holat h={y.holat} />{y.rahbarIzohi && <div className="xs muted mt-4">«{y.rahbarIzohi}»</div>}</div>, excel: (y) => y.holat },
        ]} />
      <LogbookForma open={forma} onClose={() => setForma(false)} mut={r.mutaxassislikId} />
    </>
  )
}
