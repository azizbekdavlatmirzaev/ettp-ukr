import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Lock, CheckCircle2, Clock, PenLine } from 'lucide-react'
import { Button, Holat, KPI, PageHeader, Empty, Badge } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import { kursRasmi } from '@/ui/art'
import { sana, kunFarq } from '@/lib/format'
import { SHAKL } from '@/lib/holat'
import { mutNomi } from '@/shared/hooks'
import type { DasturVersiya } from '@/domain/types'
import { manba, oxirgiVersiya, useProv } from './_umumiy'

interface Qator { id: string; kod: string; v: DasturVersiya; soni: number }

export default function ProvayderDasturlar() {
  const { db, dasturlar, bugun } = useProv()
  const nav = useNavigate()
  const qatorlar = useMemo<Qator[]>(() => dasturlar.map((d) => ({ id: d.id, kod: d.kod, v: oxirgiVersiya(db, d), soni: d.versiyalar.length })), [db, dasturlar])

  const soni = (h: string[]) => qatorlar.filter((q) => h.includes(q.v.holat)).length

  const cols: Col<Qator>[] = [
    {
      k: 'nomi', l: 'Dastur', sort: (r) => r.v.nomi, excel: (r) => r.v.nomi, w: '34%',
      r: (r) => (
        <div className="row" style={{ alignItems: 'center' }}>
          <img src={kursRasmi(r.v)} alt="" width={44} height={44} style={{ borderRadius: 10, objectFit: 'cover', flex: 'none' }} />
          <div style={{ minWidth: 0 }}>
            <div className="b">{r.v.nomi}</div>
            <div className="xs muted mono">{r.kod}</div>
          </div>
        </div>
      ),
    },
    { k: 'kod', l: 'Kod', excel: (r) => r.kod, r: (r) => r.kod, hide: true },
    { k: 'ver', l: 'Versiya', sort: (r) => r.v.versiya, excel: (r) => r.v.versiya, r: (r) => <span className="tag">v{r.v.versiya}{r.soni > 1 ? ` · ${r.soni} ta` : ''}</span> },
    {
      k: 'mut', l: 'Mutaxassisliklar', excel: (r) => r.v.mutaxassisliklar.map(mutNomi).join('; ') || 'Barcha',
      r: (r) => (
        <div className="row wrap gap-4" style={{ maxWidth: 240 }}>
          {r.v.mutaxassisliklar.length ? r.v.mutaxassisliklar.slice(0, 2).map((m) => <span key={m} className="tag">{mutNomi(m)}</span>) : <span className="tag">Barcha mutaxassisliklar</span>}
          {r.v.mutaxassisliklar.length > 2 && <span className="tag">+{r.v.mutaxassisliklar.length - 2}</span>}
        </div>
      ),
    },
    { k: 'soat', l: 'Soat', align: 'right', sort: (r) => r.v.soatNazariy + r.v.soatAmaliy, excel: (r) => r.v.soatNazariy + r.v.soatAmaliy, r: (r) => <span title={`Nazariy ${r.v.soatNazariy} · amaliy ${r.v.soatAmaliy}`}>{r.v.soatNazariy + r.v.soatAmaliy}</span> },
    { k: 'shakl', l: 'Shakl', excel: (r) => SHAKL[r.v.shakl], r: (r) => SHAKL[r.v.shakl] },
    {
      k: 'kredit', l: 'Kredit (soʻr. / tasdiq.)', align: 'right', sort: (r) => r.v.tasdiqlanganKredit ?? 0, excel: (r) => `${r.v.soralganKredit} / ${r.v.tasdiqlanganKredit ?? '—'}`,
      r: (r) => (
        <span className="nowrap">
          {r.v.soralganKredit} / {r.v.tasdiqlanganKredit !== undefined ? <b className="row gap-4" style={{ display: 'inline-flex' }}><Lock size={12} />{r.v.tasdiqlanganKredit}</b> : <span className="muted">—</span>}
        </span>
      ),
    },
    { k: 'holat', l: 'Holat', sort: (r) => r.v.holat, excel: (r) => r.v.holat, r: (r) => <Holat h={r.v.holat} /> },
    {
      k: 'muddat', l: 'Amal muddati', sort: (r) => r.v.amalMuddati ?? '', excel: (r) => r.v.amalMuddati ?? '',
      r: (r) => {
        if (!r.v.amalMuddati) return <span className="muted">—</span>
        const k = kunFarq(r.v.amalMuddati, bugun)
        return (
          <div className="col gap-4">
            <span>{sana(r.v.amalMuddati)}</span>
            {k < 0 ? <Badge ton="err">Tugagan</Badge> : k < 180 ? <Badge ton="warn">{k} kun qoldi</Badge> : null}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Dasturlar"
        desc="Oʻquv dasturlari pasporti va versiyalari. Mazmun, soat yoki kredit oʻzgarsa — yangi versiya ochiladi va qayta koʻrib chiqiladi; eski oqimlar eski versiyada qoladi."
        source={manba('Dasturlar reestri')}
        actions={<Button v="primary" icon={<Plus />} onClick={() => nav('/provayder/dasturlar/yangi')}>Yangi dastur</Button>}
      />
      <div className="grid g4 mb-16">
        <KPI icon={<BookOpen />} label="Jami dasturlar" value={qatorlar.length} />
        <KPI icon={<CheckCircle2 />} label="Tasdiqlangan" value={soni(['tasdiqlangan'])} ton="ok" delay={0.04} />
        <KPI icon={<Clock />} label="Koʻrib chiqishda" value={soni(['korib_chiqishda'])} ton="warn" delay={0.08} />
        <KPI icon={<PenLine />} label="Qoralama / rad etilgan" value={soni(['qoralama', 'rad_etilgan'])} ton="teal" delay={0.12} />
      </div>
      <DataTable
        rows={qatorlar}
        cols={cols}
        search={(r) => `${r.v.nomi} ${r.kod} ${r.v.mutaxassisliklar.map(mutNomi).join(' ')}`}
        filters={[
          { k: 'holat', l: 'Holat', options: [{ v: 'tasdiqlangan', l: 'Tasdiqlangan' }, { v: 'korib_chiqishda', l: 'Koʻrib chiqishda' }, { v: 'qoralama', l: 'Qoralama' }, { v: 'rad_etilgan', l: 'Rad etilgan' }, { v: 'arxiv', l: 'Arxiv' }], get: (r) => r.v.holat },
          { k: 'shakl', l: 'Shakl', options: Object.entries(SHAKL).map(([v, l]) => ({ v, l })), get: (r) => r.v.shakl },
        ]}
        exportName="dasturlar"
        onRow={(r) => nav(`/provayder/dasturlar/${r.id}`)}
        initialSort={{ k: 'nomi', dir: 1 }}
        empty={<Empty title="Dastur hali yoʻq" action={<Button v="primary" icon={<Plus />} onClick={() => nav('/provayder/dasturlar/yangi')}>Birinchi dasturni kiritish</Button>}>Dastur pasportini kiriting va akkreditatsiyaga yuboring.</Empty>}
      />
    </>
  )
}
