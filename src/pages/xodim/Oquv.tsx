import { useNavigate, useParams } from 'react-router-dom'
import { BookOpen, ClipboardList, LayoutGrid } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useXodim } from '@/shared/hooks'
import { PageHeader, Tabs } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { Katalog } from './_Katalog'
import { Kurslarim } from './_Kurslarim'
import { Reja } from './_Reja'
import { FAOL_HOLAT } from './_parts'

type Tab = 'katalog' | 'kurslarim' | 'reja'

export default function Oquv() {
  const { tab } = useParams()
  const nav = useNavigate()
  const { db, shaxs, bugun } = useXodim()
  const t: Tab = tab === 'kurslarim' || tab === 'reja' ? tab : 'katalog'
  const katalogSoni = db.oqimlar.filter((o) => A.katalogdami(db, o, bugun)).length
  const faol = db.yozilishlar.filter((y) => y.personId === shaxs.id && FAOL_HOLAT.includes(y.holat)).length
  const desc = t === 'katalog' ? 'Akkreditatsiyalangan provayderlarning qabul ochiq kurslari' : t === 'kurslarim' ? 'Arizalaringiz, oʻqiyotgan va tugatgan kurslaringiz' : 'Yillik rivojlanish rejasi — ish beruvchi bilan kelishiladi'
  return (
    <>
      <PageHeader title="Oʻquv tadbirlari" desc={desc} source={`Manba: UKR katalogi va dasturlar reestri · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <div className="mb-16">
        <Tabs id="oquv" value={t} onChange={(v) => nav(v === 'katalog' ? '/xodim/oquv' : `/xodim/oquv/${v}`)} tabs={[
          { v: 'katalog', l: 'Katalog', n: katalogSoni, icon: <LayoutGrid size={16} /> },
          { v: 'kurslarim', l: 'Mening kurslarim', n: faol, icon: <BookOpen size={16} /> },
          { v: 'reja', l: 'Rivojlanish rejasi', icon: <ClipboardList size={16} /> },
        ]} />
      </div>
      {t === 'katalog' && <Katalog />}
      {t === 'kurslarim' && <Kurslarim />}
      {t === 'reja' && <Reja />}
    </>
  )
}
