import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Badge, Button, Empty, Modal } from '@/ui'
import { kursRasmi } from '@/ui/art'
import { KURS_TURI, SHAKL, YONALISH } from '@/lib/holat'
import { Rasm } from './_parts'

/** Rejaga kurs qoʻshish: tasdiqlangan va mutaxassislikka mos dastur versiyalari */
export function RejaPicker({ open, onClose, mavjud, onTanla }: { open: boolean; onClose: () => void; mavjud: string[]; onTanla: (v: T.DasturVersiya) => void }) {
  const { db, shaxs } = useXodim()
  const [q, setQ] = useState('')
  const [tur, setTur] = useState<'' | 'majburiy' | 'amaliy'>('')
  const rows = useMemo(() => db.versiyalar
    .filter((v) => v.holat === 'tasdiqlangan' && A.mosmi(db, shaxs, v).ok && !mavjud.includes(v.id))
    .filter((v) => (tur === 'majburiy' ? v.kursTuri === 'majburiy' : tur === 'amaliy' ? v.yonalish === 'amaliy' : true))
    .filter((v) => !q.trim() || v.nomi.toLowerCase().includes(q.trim().toLowerCase())), [db, shaxs, mavjud, q, tur])
  return (
    <Modal open={open} onClose={onClose} title="Rejaga kurs qoʻshish" sub="Faqat tasdiqlangan va mutaxassisligingizga mos dasturlar" size="lg">
      <div className="col gap-12">
        <div className="row wrap">
          <div className="row grow" style={{ minWidth: 200, border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px', height: 38 }}>
            <Search size={15} color="var(--text-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Dastur nomi…" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'var(--text)' }} />
          </div>
          <button className={`chip ${tur === '' ? 'on' : ''}`} onClick={() => setTur('')}>Barchasi</button>
          <button className={`chip ${tur === 'majburiy' ? 'on' : ''}`} onClick={() => setTur('majburiy')}>Majburiy</button>
          <button className={`chip ${tur === 'amaliy' ? 'on' : ''}`} onClick={() => setTur('amaliy')}>Amaliy</button>
        </div>
        <div className="scroll-y" style={{ maxHeight: 440 }}>
          {rows.length === 0 ? <Empty title="Mos dastur topilmadi">Qidiruv shartini oʻzgartiring.</Empty> : rows.map((v) => {
            const p = A.provayder(db, db.dasturlar.find((d) => d.id === v.dasturId)?.providerId)
            return (
              <div key={v.id} className="li">
                <Rasm src={kursRasmi(v)} w={64} h={48} r={10} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="b small">{v.nomi}</div>
                  <div className="row wrap gap-6 mt-4">
                    <Badge ton={v.kursTuri === 'majburiy' ? 'brand' : 'teal'}>{KURS_TURI[v.kursTuri]}</Badge>
                    <Badge ton={v.yonalish === 'amaliy' ? 'warn' : 'info'}>{YONALISH[v.yonalish]}</Badge>
                    <span className="xs muted">{p?.qisqa} · {SHAKL[v.shakl]}</span>
                  </div>
                </div>
                <b className="nowrap small">{v.tasdiqlanganKredit ?? v.soralganKredit} kr</b>
                <Button size="sm" v="soft" icon={<Plus />} onClick={() => onTanla(v)}>Qoʻshish</Button>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
