import { useState } from 'react'
import { Send, BookOpen } from 'lucide-react'
import { DataTable } from '@/ui/DataTable'
import { Bar, Button, Holat, Badge } from '@/ui'
import { son } from '@/lib/format'
import { MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import type { XodimQator } from './_umumiy'
import { XAVF_NOM } from './_umumiy'
import { EslatmaModal, KursTavsiyaModal } from './_Modallar'

/** Xodimlar UKR holati jadvali: filtrlar, Excel, tanlab eslatma/kurs tavsiyasi */
export function XodimJadval({ rows, bolimlar, onRow }: { rows: XodimQator[]; bolimlar: string[]; onRow: (r: XodimQator) => void }) {
  const [esl, setEsl] = useState<{ ids: string[]; clear: () => void } | null>(null)
  const [kurs, setKurs] = useState<{ ids: string[]; clear: () => void } | null>(null)
  const pid = (ids: string[]) => rows.filter((r) => ids.includes(r.id)).map((r) => r.s.id)
  const mutlar = Array.from(new Set(rows.map((r) => r.s.mutaxassislikId)))
  return (
    <>
      <DataTable
        rows={rows}
        title="Xodimlar UKR holati"
        exportName="muassasa-ukr-holati"
        search={(r) => `${r.fio} ${r.m.lavozim} ${r.m.bolim} ${r.mut}`}
        selectable
        onRow={onRow}
        initialSort={{ k: 'foiz', dir: 1 }}
        filters={[
          { k: 'bolim', l: 'Boʻlim', options: bolimlar.map((b) => ({ v: b, l: b })), get: (r) => r.m.bolim },
          { k: 'mut', l: 'Mutaxassislik', options: MUTAXASSISLIKLAR.filter((m) => mutlar.includes(m.id)).map((m) => ({ v: m.id, l: m.nomi })), get: (r) => r.s.mutaxassislikId },
          { k: 'holat', l: 'Holat', options: Object.entries(XAVF_NOM).map(([v, l]) => ({ v, l })).concat([{ v: 'qarz', l: 'Oʻtgan yil qarzi bor' }]), get: (r) => (r.qarzdor ? [r.h.xavf, 'qarz'] : [r.h.xavf]) },
        ]}
        bulk={(ids, clear) => (
          <>
            <Button size="sm" v="white" icon={<Send size={15} />} onClick={() => setEsl({ ids, clear })}>Eslatma yuborish</Button>
            <Button size="sm" v="white" icon={<BookOpen size={15} />} onClick={() => setKurs({ ids, clear })}>Kurs tavsiya qilish</Button>
          </>
        )}
        cols={[
          { k: 'fio', l: 'F.I.Sh.', r: (r) => <div className="b small">{r.fio}</div>, sort: (r) => r.fio, excel: (r) => r.fio },
          { k: 'lavozim', l: 'Lavozim', r: (r) => <span className="small">{r.m.lavozim}</span>, sort: (r) => r.m.lavozim, excel: (r) => r.m.lavozim },
          { k: 'bolim', l: 'Boʻlim', r: (r) => <span className="tag">{r.m.bolim}</span>, sort: (r) => r.m.bolim, excel: (r) => r.m.bolim },
          { k: 'mut', l: 'Mutaxassislik', r: (r) => <span className="small">{r.mut}</span>, sort: (r) => r.mut, excel: (r) => r.mut },
          { k: 'T', l: 'Talab T', align: 'right', r: (r) => r.h.T, sort: (r) => r.h.T, excel: (r) => r.h.T },
          { k: 'X', l: 'Hisobga olingan X', align: 'right', r: (r) => <b>{son(r.h.X)}</b>, sort: (r) => r.h.X, excel: (r) => r.h.X },
          { k: 'yet', l: 'Yetishmaydi', align: 'right', r: (r) => (r.h.yetishmaydi ? <span style={{ color: 'var(--err)' }} className="b">{r.h.yetishmaydi}</span> : '—'), sort: (r) => r.h.yetishmaydi, excel: (r) => r.h.yetishmaydi },
          { k: 'foiz', l: 'Bajarilish', w: 120, r: (r) => <div style={{ minWidth: 90 }}><div className="xs muted">{r.foiz}%</div><Bar v={r.foiz} thin ton={r.foiz >= 100 ? 'ok' : r.h.xavf === 'xavf' ? 'warn' : undefined} /></div>, sort: (r) => r.foiz, excel: (r) => `${r.foiz}%` },
          { k: 'maj', l: 'Majburiy ulush', r: (r) => <span className="small nowrap">{r.h.majburiy}/{r.h.majburiyKerak}</span>, sort: (r) => r.majburiyFoiz, excel: (r) => `${r.h.majburiy}/${r.h.majburiyKerak}` },
          { k: 'holat', l: 'Holat', r: (r) => <div className="col gap-4"><Holat h={r.h.xavf} />{r.qarzdor && <Badge ton="err">Qarzdor (oʻtgan yil)</Badge>}</div>, sort: (r) => r.h.xavf, excel: (r) => `${XAVF_NOM[r.h.xavf]}${r.qarzdor ? ' · oʻtgan yil qarzi' : ''}` },
        ]}
      />
      <EslatmaModal open={!!esl} onClose={() => setEsl(null)} personIds={esl ? pid(esl.ids) : []} onDone={() => esl?.clear()} />
      <KursTavsiyaModal open={!!kurs} onClose={() => setKurs(null)} personIds={kurs ? pid(kurs.ids) : []} onDone={() => kurs?.clear()} />
    </>
  )
}
