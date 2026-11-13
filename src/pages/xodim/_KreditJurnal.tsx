import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award } from 'lucide-react'
import type * as T from '@/domain/types'
import { bekorQilinganlar } from '@/domain/kredit'
import { useXodim } from '@/shared/hooks'
import { MurojaatTugma } from '@/shared/Murojaat'
import { Alert, Badge, Button, DL, Modal } from '@/ui'
import { DataTable } from '@/ui/DataTable'
import { sana, sanaVaqt } from '@/lib/format'
import { KURS_TURI, MANBA, TADBIR, YONALISH } from '@/lib/holat'

export function KreditJurnal({ yil }: { yil: number }) {
  const { db, shaxs } = useXodim()
  const nav = useNavigate()
  const [tanl, setTanl] = useState<T.KreditYozuvi | null>(null)
  const rows = useMemo(() => db.jurnal.filter((j) => j.personId === shaxs.id && j.yil === yil).sort((a, b) => b.seq - a.seq), [db.jurnal, shaxs.id, yil])
  const bekor = useMemo(() => bekorQilinganlar(db.jurnal), [db.jurnal])
  const qv = (id: string) => db.qoidalar.find((q) => q.id === id)?.versiya ?? '—'
  const sert = (id?: string) => db.sertifikatlar.find((s) => s.id === id)
  return (
    <>
      <DataTable
        title={`Kredit jurnali — ${yil}`}
        rows={rows}
        exportName={`kredit-jurnali-${yil}`}
        search={(j) => `${j.nomi} ${j.providerNomi} ${j.asos}`}
        initialSort={{ k: 'sana', dir: -1 }}
        filters={[
          { k: 'manba', l: 'Manba', options: Object.entries(MANBA).map(([v, l]) => ({ v, l })), get: (j) => j.manba },
          { k: 'kt', l: 'Kurs turi', options: Object.entries(KURS_TURI).map(([v, l]) => ({ v, l })), get: (j) => j.kursTuri },
          { k: 'yon', l: 'Yoʻnalish', options: Object.entries(YONALISH).map(([v, l]) => ({ v, l })), get: (j) => j.yonalish },
        ]}
        onRow={setTanl}
        rowClass={(j) => (j.miqdor < 0 ? 'qator-bekor' : undefined)}
        cols={[
          { k: 'sana', l: 'Sana', r: (j) => <span className="nowrap small">{sana(j.sana)}</span>, sort: (j) => j.sana, excel: (j) => sana(j.sana) },
          { k: 'nomi', l: 'Kurs / asos', r: (j) => (
            <div style={{ minWidth: 200 }}>
              <div className="b small" style={{ textDecoration: bekor.has(j.id) ? 'line-through' : undefined }}>{j.nomi}</div>
              <div className="xs muted">{j.providerNomi}{bekor.has(j.id) && <> · <span style={{ color: 'var(--err)' }}>bekor qilingan</span></>}{j.bekorQilinganId && <> · <span style={{ color: 'var(--err)' }}>bekor qiluvchi yozuv</span></>}</div>
            </div>
          ), sort: (j) => j.nomi, excel: (j) => j.nomi },
          { k: 'prov', l: 'Provayder', r: (j) => j.providerNomi, excel: (j) => j.providerNomi, hide: true },
          { k: 'miqdor', l: 'Kredit', align: 'right', r: (j) => <b style={{ color: j.miqdor < 0 ? 'var(--err)' : 'var(--ok)' }}>{j.miqdor > 0 ? '+' : ''}{j.miqdor}</b>, sort: (j) => j.miqdor, excel: (j) => j.miqdor },
          { k: 'turi', l: 'Turi', r: (j) => <Badge ton={j.kursTuri === 'majburiy' ? 'brand' : 'teal'}>{KURS_TURI[j.kursTuri]}</Badge>, excel: (j) => KURS_TURI[j.kursTuri] },
          { k: 'yon', l: 'Yoʻnalish', r: (j) => YONALISH[j.yonalish], excel: (j) => YONALISH[j.yonalish] },
          { k: 'manba', l: 'Manba', r: (j) => <span className="tag">{MANBA[j.manba]}</span>, excel: (j) => MANBA[j.manba] },
          { k: 'qoida', l: 'Qoida', r: (j) => <span className="mono xs">v{qv(j.qoidaId)}</span>, excel: (j) => qv(j.qoidaId) },
          { k: 'sert', l: 'Sertifikat', r: (j) => { const s = sert(j.sertifikatId); return s ? <Button size="xs" v="ghost" icon={<Award />} onClick={(e) => { e.stopPropagation(); nav('/xodim/hujjatlar') }}>{s.raqam}</Button> : <span className="muted">—</span> }, excel: (j) => sert(j.sertifikatId)?.raqam ?? '' },
          { k: 'm', l: '', r: (j) => <MurojaatTugma size="xs" turi="kredit" obyekt={{ turi: 'KreditYozuvi', id: j.id, nomi: `${j.nomi} (${j.miqdor > 0 ? '+' : ''}${j.miqdor} kredit, ${sana(j.sana)})` }} label="Murojaat" /> },
        ]}
      />
      <style>{`.qator-bekor td { background: var(--err-soft); }`}</style>
      <Modal open={!!tanl} onClose={() => setTanl(null)} drawer title="Kredit yozuvi" sub={tanl ? `#${tanl.seq}` : ''}>
        {tanl && (
          <div className="col gap-16">
            {tanl.bekorQilinganId && <Alert ton="err" title="Bekor qiluvchi yozuv">Bu yozuv avvalgi yozuvni bekor qiladi. Jurnal yozuvlari oʻchirilmaydi — tuzatish faqat qarama-qarshi yozuv bilan.</Alert>}
            {bekor.has(tanl.id) && <Alert ton="warn" title="Bu yozuv bekor qilingan">Unga qarshi bekor qiluvchi yozuv mavjud.</Alert>}
            <DL items={[
              ['Nomi', tanl.nomi],
              ['Provayder', tanl.providerNomi],
              ['Miqdor', <b style={{ color: tanl.miqdor < 0 ? 'var(--err)' : 'var(--ok)' }}>{tanl.miqdor > 0 ? '+' : ''}{tanl.miqdor} kredit</b>],
              ['Kurs turi / yoʻnalish', `${KURS_TURI[tanl.kursTuri]} · ${YONALISH[tanl.yonalish]}`],
              ['Tadbir turi', TADBIR[tanl.tadbirTuri]],
              ['Manba', MANBA[tanl.manba]],
              ['Asos', tanl.asos],
              ['Qoida versiyasi', `v${qv(tanl.qoidaId)}`],
              ['Hisobot yili', tanl.yil],
              ['Yozilgan', sanaVaqt(tanl.sana)],
              ['Yaratuvchi', tanl.yaratuvchi],
              ['Sertifikat', sert(tanl.sertifikatId) ? `${sert(tanl.sertifikatId)!.seriya} ${sert(tanl.sertifikatId)!.raqam}` : '—'],
            ]} />
            <MurojaatTugma turi="kredit" obyekt={{ turi: 'KreditYozuvi', id: tanl.id, nomi: `${tanl.nomi} (${tanl.miqdor} kredit)` }} label="Ushbu yozuv ustidan murojaat yuborish" />
          </div>
        )}
      </Modal>
    </>
  )
}
