import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, CalendarCheck, ClipboardList, ClipboardCheck, FileBarChart, MapPin, CalendarDays, UserRound, Link2 } from 'lucide-react'
import { Button, Empty, Holat, PageHeader, Tabs, Bar } from '@/ui'
import { EKG, kursRasmi } from '@/ui/art'
import * as A from '@/domain/amallar'
import { sana, pul } from '@/lib/format'
import { MOLIYA, SHAKL } from '@/lib/holat'
import { hududNomi } from '@/shared/hooks'
import { manba, useProv } from './_umumiy'
import { OqimTugmalari } from './Oqimlar'
import { TinglovchilarTab } from './_OqimTinglovchi'
import { DavomatTab } from './_OqimDavomat'
import { BaholashTab } from './_OqimBaholash'
import { NatijaTab } from './_OqimNatija'
import { HisobotTab } from './_OqimHisobot'

type Tab = 'tinglovchilar' | 'davomat' | 'baholash' | 'natija' | 'hisobot'

export default function ProvayderOqim() {
  const { id } = useParams()
  const { db, oqimlar, yozilishlar, natijalar } = useProv()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as Tab) || 'tinglovchilar'
  const o = oqimlar.find((x) => x.id === id)

  if (!o) {
    return (
      <>
        <PageHeader title="Oqim topilmadi" crumbs={[{ l: 'Oqimlar', to: '/provayder/oqimlar' }, { l: 'Topilmadi' }]} />
        <Empty title="Oqim topilmadi yoki boshqa provayderga tegishli" action={<Button v="primary" onClick={() => nav('/provayder/oqimlar')}>Oqimlar roʻyxati</Button>}>Provayder faqat oʻz oqimlarini koʻradi.</Empty>
      </>
    )
  }
  const v = A.versiya(db, o.versiyaId)!
  const band = A.bandOrinlar(db, o.id)
  const ys = yozilishlar.filter((y) => y.oqimId === o.id)
  const yangi = ys.filter((y) => y.holat === 'yuborildi').length
  const kutish = natijalar.filter((n) => n.holat === 'tasdiqlashda' && ys.some((y) => y.id === n.yozilishId)).length

  return (
    <>
      <PageHeader
        title={v.nomi}
        crumbs={[{ l: 'Oqimlar', to: '/provayder/oqimlar' }, { l: o.kod }]}
        desc={`Dastur v${v.versiya} · ${v.soatNazariy + v.soatAmaliy} soat · tasdiqlangan kredit ${v.tasdiqlanganKredit ?? '—'}`}
        source={manba(v.shakl === 'oflayn' ? 'Elektron jurnal va QR davomat' : 'LMS (Moodle) va elektron jurnal')}
        actions={<OqimTugmalari o={o} size="sm" />}
      />

      <motion.div className="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 0 }}>
        <div className="row wrap" style={{ gap: 0, alignItems: 'stretch' }}>
          <div style={{ flex: '0 0 220px', minHeight: 150, background: `url(${kursRasmi(v)}) center/cover`, position: 'relative' }} className="hide-sm">
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 40%, rgba(11,77,120,.95))' }} />
          </div>
          <div style={{ flex: '1 1 300px', padding: '20px 24px', position: 'relative', minWidth: 0 }}>
            <div className="hero-pattern" />
            <EKG className="hero-ekg" />
            <div className="row wrap gap-6" style={{ position: 'relative' }}>
              <span className="chip mono">{o.kod}</span>
              <Holat h={o.holat} />
              <span className="chip">{SHAKL[v.shakl]}</span>
              <span className="chip">{MOLIYA[o.moliya]}{o.narx ? ` · ${pul(o.narx)}` : ''}</span>
            </div>
            <div className="grid g2 mt-12" style={{ position: 'relative', gap: 10 }}>
              <div className="row gap-6 small"><CalendarDays size={15} /> {sana(o.boshlanish)} — {sana(o.tugash)} · qabul {sana(o.qabulTugash)} gacha</div>
              <div className="row gap-6 small"><MapPin size={15} /> {o.joy}, {hududNomi(o.hududId)}</div>
              <div className="row gap-6 small"><UserRound size={15} /> {o.oqituvchi}</div>
              {o.havola ? <div className="row gap-6 small"><Link2 size={15} /> <a href={o.havola} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>{o.havola}</a></div> : <div />}
            </div>
            <div className="glass mt-12" style={{ position: 'relative', maxWidth: 360 }}>
              <div className="row between small"><span>Bandlik</span><b>{band} / {o.orinlar}</b></div>
              <div className="mt-4"><Bar v={band} max={o.orinlar} thin /></div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-16">
        <Tabs
          id="oqim-tab"
          value={tab}
          onChange={(t) => setSp({ tab: t }, { replace: true })}
          tabs={[
            { v: 'tinglovchilar', l: 'Tinglovchilar', icon: <Users size={15} />, n: yangi || undefined },
            { v: 'davomat', l: 'Davomat', icon: <CalendarCheck size={15} /> },
            { v: 'baholash', l: 'Baholash', icon: <ClipboardList size={15} /> },
            { v: 'natija', l: 'Natija', icon: <ClipboardCheck size={15} />, n: kutish || undefined },
            { v: 'hisobot', l: 'Hisobot', icon: <FileBarChart size={15} /> },
          ]}
        />
      </div>
      <div className="mt-16">
        {tab === 'tinglovchilar' && <TinglovchilarTab o={o} />}
        {tab === 'davomat' && <DavomatTab o={o} />}
        {tab === 'baholash' && <BaholashTab o={o} />}
        {tab === 'natija' && <NatijaTab o={o} />}
        {tab === 'hisobot' && <HisobotTab o={o} />}
      </div>
    </>
  )
}
