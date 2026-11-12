import { useMemo } from 'react'
import { useDB } from '@/domain/store'
import { DataTable } from '@/ui/DataTable'
import { Holat } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { ROL_NOMI } from '@/domain/malumotnoma'
import type { AuditYozuv } from '@/domain/types'

/** Audit jurnali (oʻchirilmaydi): kim, qachon, qayerdan, nima qildi, avval va keyin (TZ 4.1.6). */
export function AuditJadval({ filtr }: { filtr?: (a: AuditYozuv) => boolean }) {
  const db = useDB()
  const rows = useMemo(() => (filtr ? db.audit.filter(filtr) : db.audit), [db.audit, filtr])
  return (
    <DataTable
      rows={rows}
      exportName="audit-jurnali"
      search={(a) => `${a.fio} ${a.amal} ${a.obyekt} ${a.keyin ?? ''}`}
      filters={[
        { k: 'natija', l: 'Natija', options: [{ v: 'ok', l: 'Bajarildi' }, { v: 'rad_etildi', l: 'Rad etildi' }], get: (a) => a.natija },
        { k: 'rol', l: 'Rol', options: Object.entries(ROL_NOMI).map(([v, l]) => ({ v, l })), get: (a) => a.rol },
      ]}
      pageSize={15}
      cols={[
        { k: 'sana', l: 'Vaqt', r: (a) => <span className="nowrap small">{sanaVaqt(a.sana)}</span>, sort: (a) => a.sana, excel: (a) => sanaVaqt(a.sana) },
        { k: 'fio', l: 'Kim', r: (a) => <div><div className="b small">{a.fio}</div><div className="xs muted">{ROL_NOMI[a.rol] ?? a.rol}</div></div>, sort: (a) => a.fio, excel: (a) => a.fio },
        { k: 'amal', l: 'Amal', r: (a) => a.amal, excel: (a) => a.amal },
        { k: 'obyekt', l: 'Obyekt', r: (a) => <span className="tag">{a.obyekt}</span>, excel: (a) => a.obyekt },
        { k: 'ip', l: 'Qayerdan', r: (a) => <span className="mono xs">{a.ip}</span>, excel: (a) => a.ip },
        { k: 'keyin', l: 'Avval → keyin', r: (a) => <span className="xs muted" title={a.keyin}>{a.oldin ? `${a.oldin.slice(0, 40)} → ` : ''}{(a.keyin ?? '').slice(0, 70)}</span>, excel: (a) => `${a.oldin ?? ''} → ${a.keyin ?? ''}` },
        { k: 'natija', l: 'Natija', r: (a) => <Holat ton={a.natija === 'ok' ? 'ok' : 'err'}>{a.natija === 'ok' ? 'Bajarildi' : 'Rad etildi'}</Holat>, excel: (a) => a.natija },
      ]}
    />
  )
}
