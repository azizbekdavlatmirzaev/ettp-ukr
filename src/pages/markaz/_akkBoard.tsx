import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Users } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Holat, Badge, cx } from '@/ui'
import { sana } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { useMarkaz, MuddatBadge, ishKunlari } from './_parts'

export const USTUNLAR: { k: string; l: string; holatlar: T.AkkArizaHolat[] }[] = [
  { k: 'toliqlik', l: 'Toʻliqlik', holatlar: ['yuborildi', 'toliqlik'] },
  { k: 'kamchilik', l: 'Kamchilik', holatlar: ['kamchilik'] },
  { k: 'ekspertiza', l: 'Ekspertiza', holatlar: ['ekspertiza'] },
  { k: 'joyida', l: 'Joyida', holatlar: ['joyida'] },
  { k: 'komissiya', l: 'Komissiya', holatlar: ['komissiya', 'qaror'] },
  { k: 'yakunlandi', l: 'Yakunlandi', holatlar: ['yakunlandi'] },
]

export const TURI_NOMI: Record<T.AkkAriza['turi'], string> = { provayder: 'Provayder', dastur: 'Dastur', qayta: 'Qayta akk.' }

export function obyektNomi(db: ReturnType<typeof useMarkaz>['db'], a: T.AkkAriza) {
  return a.versiyaId ? A.versiya(db, a.versiyaId)?.nomi ?? '—' : A.provayder(db, a.providerId)?.nomi ?? '—'
}

export function Doska({ rows, onOpen }: { rows: T.AkkAriza[]; onOpen: (id: string) => void }) {
  const { db, bugun } = useMarkaz()
  return (
    <LayoutGroup>
      <div className="mk-kanban">
        {USTUNLAR.map((u) => {
          const ichida = rows.filter((a) => u.holatlar.includes(a.holat))
          return (
            <div key={u.k} className="mk-col">
              <div className="mk-col-h">
                <span>{u.l}</span>
                <span className="n">{ichida.length}</span>
              </div>
              <AnimatePresence>
                {ichida.map((a) => {
                  const kun = a.holat === 'yakunlandi' ? undefined : ishKunlari(bugun, a.muddat, db.sozlamalar.bayramlar)
                  return (
                    <motion.div
                      key={a.id}
                      layout
                      layoutId={'akk-' + a.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      className={cx('mk-kart', kun !== undefined && kun < 0 && 'late')}
                      onClick={() => onOpen(a.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="row between">
                        <span className="mono xs b">{a.raqam}</span>
                        <span className="tag">{TURI_NOMI[a.turi]}</span>
                      </div>
                      <div className="t">{obyektNomi(db, a)}</div>
                      <div className="xs muted">{A.provayder(db, a.providerId)?.qisqa}</div>
                      <div className="row wrap gap-6 mt-8">
                        {a.holat === 'yakunlandi' ? <Holat h={a.qaror?.turi === 'rad' ? 'rad_etilgan' : 'tasdiqlangan'}>{a.qaror?.raqam ?? 'Yakunlandi'}</Holat> : <MuddatBadge muddat={a.muddat} />}
                        {(a.ekspertlar.length > 0 || a.holat === 'ekspertiza') && (
                          <Badge ton={a.varaqlar.length >= 2 ? 'ok' : 'muted'}>
                            <Users size={11} /> {a.varaqlar.length}/{a.ekspertlar.length}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {!ichida.length && <div className="xs muted center" style={{ padding: '18px 4px' }}>Boʻsh</div>}
            </div>
          )
        })}
      </div>
    </LayoutGroup>
  )
}

export function Jadval({ rows, onOpen }: { rows: T.AkkAriza[]; onOpen: (id: string) => void }) {
  const { db } = useMarkaz()
  return (
    <DataTable
      rows={rows}
      exportName="akkreditatsiya-arizalari"
      onRow={(r) => onOpen(r.id)}
      search={(r) => `${r.raqam} ${obyektNomi(db, r)} ${A.provayder(db, r.providerId)?.qisqa}`}
      filters={[
        { k: 'turi', l: 'Turi', options: Object.entries(TURI_NOMI).map(([v, l]) => ({ v, l })), get: (r) => r.turi },
        { k: 'holat', l: 'Bosqich', options: USTUNLAR.map((u) => ({ v: u.k, l: u.l })), get: (r) => USTUNLAR.find((u) => u.holatlar.includes(r.holat))?.k ?? '' },
      ]}
      cols={[
        { k: 'raqam', l: 'Raqam', r: (r) => <span className="mono xs b">{r.raqam}</span>, sort: (r) => r.raqam, excel: (r) => r.raqam },
        { k: 'turi', l: 'Turi', r: (r) => <span className="tag">{TURI_NOMI[r.turi]}</span>, excel: (r) => TURI_NOMI[r.turi] },
        { k: 'prov', l: 'Provayder', r: (r) => A.provayder(db, r.providerId)?.qisqa, excel: (r) => A.provayder(db, r.providerId)?.nomi },
        { k: 'obyekt', l: 'Obyekt', r: (r) => <span className="small">{obyektNomi(db, r)}</span>, excel: (r) => obyektNomi(db, r) },
        { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, sort: (r) => r.holat, excel: (r) => holatMatn(r.holat)[0] },
        { k: 'eksp', l: 'Varaqlar', align: 'center', r: (r) => `${r.varaqlar.length}/${r.ekspertlar.length}`, excel: (r) => `${r.varaqlar.length}/${r.ekspertlar.length}` },
        { k: 'yub', l: 'Yuborilgan', r: (r) => <span className="small nowrap">{sana(r.yuborilgan)}</span>, sort: (r) => r.yuborilgan ?? '', excel: (r) => r.yuborilgan },
        { k: 'muddat', l: 'Muddat', r: (r) => <MuddatBadge muddat={r.muddat} yopiq={r.holat === 'yakunlandi'} />, sort: (r) => r.muddat, excel: (r) => r.muddat },
      ]}
    />
  )
}
