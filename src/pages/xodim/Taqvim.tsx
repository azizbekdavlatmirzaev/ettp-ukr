import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, GraduationCap } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useXodim } from '@/shared/hooks'
import { Taqvim, type TaqvimItem } from '@/shared/Taqvim'
import { Button, PageHeader } from '@/ui'
import { kunFarq, sana, sanaVaqt } from '@/lib/format'

const CHORAK_OXIRI: Record<string, string> = { '1-chorak': '03-31', '2-chorak': '06-30', '3-chorak': '09-30', '4-chorak': '12-31' }

export default function XodimTaqvim() {
  const { db, shaxs, bugun, yil } = useXodim()
  const nav = useNavigate()
  const items = useMemo<TaqvimItem[]>(() => {
    const r: TaqvimItem[] = db.taqvim.filter((t) => t.personId === shaxs.id).map((t) => ({ id: t.id, sana: t.sana, tugash: t.tugash, nomi: t.nomi, turi: t.turi }))
    const nomlar = new Set(r.filter((x) => x.turi === 'kurs').map((x) => x.nomi))
    db.yozilishlar.filter((y) => y.personId === shaxs.id && ['qabul_qilindi', 'oqimoqda', 'navbatda', 'yuborildi'].includes(y.holat)).forEach((y) => {
      const o = A.oqim(db, y.oqimId)!
      const v = A.versiya(db, o.versiyaId)!
      if (!nomlar.has(v.nomi)) r.push({ id: 'K-' + y.id, sana: o.boshlanish, tugash: o.tugash, nomi: v.nomi, turi: 'kurs', izoh: y.holat === 'qabul_qilindi' || y.holat === 'oqimoqda' ? o.kod : 'ariza koʻrib chiqilmoqda' })
      if (['qabul_qilindi', 'oqimoqda'].includes(y.holat))
        o.mashgulotlar.forEach((m) => r.push({ id: m.id, sana: m.sana, nomi: `${m.mavzu}`, turi: 'dars', izoh: `${v.nomi}, ${m.sana.slice(11, 16)}` }))
    })
    db.rejalar.filter((x) => x.personId === shaxs.id).forEach((rj) => rj.bandlar.filter((b) => !b.bajarildi).forEach((b) => {
      const oxir = CHORAK_OXIRI[b.muddat]
      if (oxir) r.push({ id: 'RB-' + b.id, sana: `${rj.yil}-${oxir}`, nomi: `Reja: ${b.nomi}`, turi: 'muddat', izoh: `${b.muddat} oxirigacha` })
    }))
    if (shaxs.toifaMuddati && !r.some((x) => x.sana === shaxs.toifaMuddati)) r.push({ id: 'TOIFA', sana: shaxs.toifaMuddati, nomi: 'Malaka toifasi muddati', turi: 'muddat' })
    if (!r.some((x) => x.sana === `${yil}-12-31` && x.turi === 'muddat')) r.push({ id: 'YIL', sana: `${yil}-12-31`, nomi: `${yil}-yil UKR hisobot davri yakuni`, turi: 'muddat' })
    return r
  }, [db, shaxs, yil])
  const yaqin = items.filter((i) => i.sana.slice(0, 10) >= bugun).sort((a, b) => a.sana.localeCompare(b.sana)).slice(0, 3)
  return (
    <>
      <PageHeader title="Taqvim" desc="Kurslar, mashgʻulotlar, testlar va muddatlar bir joyda" source={`Manba: oqimlar jadvali, rivojlanish rejasi va Reestr · ${sanaVaqt(new Date().toISOString())}`}
        actions={<Button v="primary" icon={<GraduationCap />} onClick={() => nav('/xodim/oquv')}>Kurs tanlash</Button>} />
      {yaqin.length > 0 && (
        <div className="row wrap gap-6 mb-16">
          <span className="small muted row gap-4"><CalendarClock size={15} /> Yaqinda:</span>
          {yaqin.map((x) => <span key={x.id} className="chip"><b>{sana(x.sana)}</b> {x.nomi.length > 40 ? x.nomi.slice(0, 40) + '…' : x.nomi} <span className="muted">({kunFarq(x.sana.slice(0, 10) + 'T12:00:00') <= 0 ? 'bugun' : `${kunFarq(x.sana.slice(0, 10) + 'T12:00:00')} kun`})</span></span>)}
        </div>
      )}
      <Taqvim items={items} boshlangich={bugun} />
    </>
  )
}
