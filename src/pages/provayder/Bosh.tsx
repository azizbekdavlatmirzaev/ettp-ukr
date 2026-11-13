import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Layers, Users, Inbox, ClipboardCheck, Star, ArrowRight, ShieldCheck, FileWarning, CalendarDays, PenLine, Plus, GraduationCap } from 'lucide-react'
import { Button, Card, CardH, Holat, KPI, PageHeader, Ring, Stagger, staggerItem, Timeline, Empty, Badge } from '@/ui'
import { AreaCh } from '@/ui/charts'
import { EKG, IMG } from '@/ui/art'
import * as A from '@/domain/amallar'
import { kunFarq, OY_QISQA, sana, son } from '@/lib/format'
import { PROV_TURI } from '@/lib/holat'
import { manba, oxirgiVersiya, useProv } from './_umumiy'

interface Ish { ic: JSX.Element; ton: 'warn' | 'err' | 'info' | 'brand' | 'ok'; matn: string; izoh: string; tugma: string; to: string }

export default function ProvayderBosh() {
  const { db, user, p, dasturlar, oqimlar, yozilishlar, natijalar, operator, rahbar, bugun } = useProv()
  const nav = useNavigate()

  const k = useMemo(() => {
    const oxirgi = dasturlar.map((d) => oxirgiVersiya(db, d))
    const faolDastur = db.versiyalar.filter((v) => v.holat === 'tasdiqlangan' && dasturlar.some((d) => d.id === v.dasturId)).length
    const ochiq = oqimlar.filter((o) => ['elon_qilingan', 'davom_etmoqda'].includes(o.holat)).length
    const hozir = yozilishlar.filter((y) => ['oqimoqda', 'qabul_qilindi'].includes(y.holat) && oqimlar.find((o) => o.id === y.oqimId)?.holat === 'davom_etmoqda').length
    const yangi = yozilishlar.filter((y) => y.holat === 'yuborildi').length
    const kutish = natijalar.filter((n) => n.holat === 'tasdiqlashda').length
    const sorov = yozilishlar.filter((y) => y.sorovnoma).map((y) => y.sorovnoma!.baho)
    const reyting = sorov.length ? sorov.reduce((a, b) => a + b, 0) / sorov.length : p.reyting ?? 0
    const natijasiz = oqimlar.filter((o) => o.holat === 'davom_etmoqda' && o.tugash < bugun && yozilishlar.some((y) => y.oqimId === o.id && ['qabul_qilindi', 'oqimoqda'].includes(y.holat) && !natijalar.some((n) => n.yozilishId === y.id)))
    const qoralama = oxirgi.filter((v) => v.holat === 'qoralama' || v.holat === 'rad_etilgan')
    const kamchilik = db.akkArizalar.filter((a) => a.providerId === p.id && a.holat === 'kamchilik')
    const qoralamaAriza = db.akkArizalar.filter((a) => a.providerId === p.id && a.holat === 'qoralama')
    return { faolDastur, ochiq, hozir, yangi, kutish, reyting, natijasiz, qoralama, kamchilik, qoralamaAriza }
  }, [db, dasturlar, oqimlar, yozilishlar, natijalar, p, bugun])

  const qolganKun = p.qaror?.muddat ? kunFarq(p.qaror.muddat, bugun) : undefined
  const umumiyKun = p.qaror ? Math.max(1, kunFarq(p.qaror.muddat, p.qaror.sana)) : 1

  const ishlar: Ish[] = []
  if (k.yangi) ishlar.push({ ic: <Inbox />, ton: 'info', matn: `${k.yangi} ta yangi ariza`, izoh: 'Tinglovchilar kursga yozilish uchun ariza yubordi', tugma: 'Koʻrish', to: '/provayder/tinglovchilar' })
  if (operator) k.natijasiz.forEach((o) => ishlar.push({ ic: <ClipboardCheck />, ton: 'warn', matn: `${o.kod} oqimi yakunlandi — natijani shakllantiring`, izoh: `«${A.versiya(db, o.versiyaId)?.nomi}», ${sana(o.tugash)} da tugagan`, tugma: 'Shakllantirish', to: `/provayder/oqimlar/${o.id}?tab=natija` }))
  if (rahbar && k.kutish) ishlar.push({ ic: <ClipboardCheck />, ton: 'warn', matn: `${k.kutish} natija tasdiqlashni kutmoqda`, izoh: 'ERI bilan tasdiqlang — kredit va sertifikat avtomatik yaratiladi', tugma: 'Tasdiqlash', to: '/provayder/natijalar' })
  if (operator && k.kutish) ishlar.push({ ic: <ClipboardCheck />, ton: 'info', matn: `${k.kutish} natija rahbar tasdigʻida`, izoh: 'Kirituvchi va tasdiqlovchi — turli shaxslar', tugma: 'Holatini koʻrish', to: '/provayder/natijalar' })
  k.kamchilik.forEach((a) => ishlar.push({ ic: <FileWarning />, ton: 'err', matn: `${a.raqam}: kamchilikni toʻldiring`, izoh: a.izoh ?? 'UKR markazi arizani qaytardi', tugma: 'Toʻldirish', to: `/provayder/akkreditatsiya?ariza=${a.id}` }))
  k.qoralamaAriza.forEach((a) => ishlar.push({ ic: <ShieldCheck />, ton: 'brand', matn: `${a.raqam}: ariza qoralamada`, izoh: rahbar ? 'Hujjatlarni yuklab, ERI bilan yuboring' : 'Hujjatlarni yuklang — rahbar ERI bilan yuboradi', tugma: 'Ochish', to: `/provayder/akkreditatsiya?ariza=${a.id}` }))
  k.qoralama.slice(0, 2).forEach((v) => ishlar.push({ ic: <PenLine />, ton: 'brand', matn: `«${v.nomi}» — ${v.holat === 'rad_etilgan' ? 'rad etilgan' : 'qoralama'}`, izoh: 'Pasportni toʻldirib akkreditatsiyaga yuboring', tugma: 'Davom ettirish', to: `/provayder/dasturlar/${v.dasturId}` }))
  if (qolganKun !== undefined && qolganKun < 180) ishlar.push({ ic: <ShieldCheck />, ton: 'err', matn: `Akkreditatsiya muddati ${qolganKun} kunda tugaydi`, izoh: 'Qayta akkreditatsiya arizasini oldindan yuboring', tugma: 'Ariza', to: '/provayder/akkreditatsiya' })

  const grafik = useMemo(() => {
    const oylar: { x: string; kalit: string; tinglovchi: number; sertifikat: number }[] = []
    const d = new Date(bugun + 'T12:00:00')
    for (let i = 11; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
      const kalit = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
      oylar.push({ x: `${OY_QISQA[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`, kalit, tinglovchi: 0, sertifikat: 0 })
    }
    yozilishlar.forEach((y) => {
      if (['rad_etildi', 'chiqdi', 'yuborildi', 'navbatda'].includes(y.holat)) return
      const o = oqimlar.find((x) => x.id === y.oqimId)
      const r = oylar.find((x) => x.kalit === o?.boshlanish.slice(0, 7))
      if (r) r.tinglovchi++
    })
    db.sertifikatlar.filter((s) => s.provider === p.nomi).forEach((s) => {
      const r = oylar.find((x) => x.kalit === s.sana.slice(0, 7))
      if (r) r.sertifikat++
    })
    return oylar
  }, [db, yozilishlar, oqimlar, p.nomi, bugun])

  const kelgusi = oqimlar.filter((o) => o.boshlanish >= bugun && o.holat !== 'bekor').sort((a, b) => a.boshlanish.localeCompare(b.boshlanish)).slice(0, 6)

  return (
    <>
      <PageHeader
        title={`Xush kelibsiz, ${user.fio.split(' ')[1] ?? user.fio}`}
        desc={`${operator ? 'Provayder operatori' : 'Provayder rahbari'}${user.lavozim ? ' · ' + user.lavozim : ''}`}
        source={manba('Provayderlar reestri, ETTP–UKR')}
        actions={
          <>
            <Button v="secondary" icon={<Plus />} onClick={() => nav('/provayder/oqimlar?yangi=1')}>Yangi oqim</Button>
            <Button v="primary" icon={<BookOpen />} onClick={() => nav('/provayder/dasturlar/yangi')}>Yangi dastur</Button>
          </>
        }
      />

      <motion.div className="hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ backgroundImage: `linear-gradient(110deg, rgba(10,58,92,.96) 0%, rgba(11,92,140,.9) 55%, rgba(15,154,154,.72) 100%), url(${IMG('muassasa')})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row wrap between" style={{ position: 'relative', gap: 20 }}>
          <div className="col gap-6" style={{ minWidth: 0, flex: '1 1 300px' }}>
            <div className="row wrap gap-6">
              <span className="chip">{PROV_TURI[p.turi]} provayder</span>
              <span className="chip">{p.mamlakat}</span>
              <span className="chip">{p.turi === 'xorijiy' ? 'ID' : 'STIR'} {p.stir}</span>
            </div>
            <h2 style={{ fontSize: 24, lineHeight: 1.25 }}>{p.nomi}</h2>
            <div className="row wrap gap-6">
              <Holat h={p.holat} />
              {p.qaror && <span className="sub small">Qaror {p.qaror.raqam} · {sana(p.qaror.sana)} · {sana(p.qaror.muddat)} gacha</span>}
            </div>
            <div className="row wrap mt-8">
              <Button v="white" size="sm" icon={<ShieldCheck />} onClick={() => nav('/provayder/akkreditatsiya')}>Akkreditatsiya</Button>
              <Button v="glassb" size="sm" onClick={() => nav('/provayder/tashkilot')}>Tashkilot kartasi</Button>
            </div>
          </div>
          <div className="glass row gap-16" style={{ padding: 16 }}>
            <Ring v={Math.max(0, qolganKun ?? 0)} max={umumiyKun} size={104} stroke={10} light>
              <div className="center">
                <div style={{ font: '800 22px var(--font-head)' }}>{qolganKun !== undefined ? son(Math.max(0, qolganKun)) : '—'}</div>
                <div className="xs" style={{ opacity: 0.8 }}>kun qoldi</div>
              </div>
            </Ring>
            <div className="col gap-4">
              <div className="small" style={{ opacity: 0.85 }}>Akkreditatsiya muddati</div>
              <div className="b">{p.qaror ? sana(p.qaror.muddat) : 'Qaror yoʻq'}</div>
              <div className="xs" style={{ opacity: 0.8 }}>{qolganKun !== undefined && qolganKun < 180 ? 'Qayta akkreditatsiya vaqti keldi' : 'Muddat nazorat ostida'}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <KPI icon={<BookOpen />} label="Faol dasturlar" value={k.faolDastur} hint="Tasdiqlangan versiyalar" onClick={() => nav('/provayder/dasturlar')} />
        <KPI icon={<Layers />} label="Ochiq oqimlar" value={k.ochiq} ton="teal" hint="Eʼlon qilingan va davom etayotgan" delay={0.04} onClick={() => nav('/provayder/oqimlar')} />
        <KPI icon={<GraduationCap />} label="Hozir oʻqimoqda" value={k.hozir} hint="Davom etayotgan oqimlarda" delay={0.08} onClick={() => nav('/provayder/tinglovchilar')} />
        <KPI icon={<Users />} label="Yangi arizalar" value={k.yangi} ton={k.yangi ? 'warn' : undefined} hint="Koʻrib chiqilmagan" delay={0.12} onClick={() => nav('/provayder/tinglovchilar')} />
        <KPI icon={<ClipboardCheck />} label="Tasdiqlash kutilmoqda" value={k.kutish} ton={k.kutish ? 'warn' : 'ok'} hint="Yakuniy natijalar" delay={0.16} onClick={() => nav('/provayder/natijalar')} />
        <KPI icon={<Star />} label="Soʻrovnoma bahosi" value={Math.round(k.reyting * 10) / 10} kasr={1} suffix="/ 5" ton="ok" hint="Tinglovchilar anonim bahosi" delay={0.2} onClick={() => nav('/provayder/hisobotlar')} />
      </div>

      <div className="grid g-main mt-16">
        <Card>
          <CardH icon={<ClipboardCheck />} title="Ish navbati" sub="Eʼtibor talab qiladigan ishlar — bir bosishda bajariladi" right={<Badge ton={ishlar.length ? 'warn' : 'ok'}>{ishlar.length} ta</Badge>} />
          {ishlar.length ? (
            <Stagger className="col gap-4">
              {ishlar.map((x, i) => (
                <motion.div key={i} variants={staggerItem} className="li">
                  <div className={`ic ${x.ton}`}>{x.ic}</div>
                  <div className="grow">
                    <div className="b">{x.matn}</div>
                    <div className="xs muted">{x.izoh}</div>
                  </div>
                  <Button size="sm" v="soft" onClick={() => nav(x.to)}>
                    {x.tugma} <ArrowRight />
                  </Button>
                </motion.div>
              ))}
            </Stagger>
          ) : (
            <Empty title="Navbat boʻsh">Barcha ishlar bajarilgan. Yangi oqim ochish yoki dastur kiritish mumkin.</Empty>
          )}
        </Card>
        <Card delay={0.08}>
          <CardH icon={<CalendarDays />} title="Kelgusi oqimlar" sub="Boshlanish sanasi boʻyicha" right={<Button size="xs" v="ghost" onClick={() => nav('/provayder/oqimlar')}>Barchasi</Button>} />
          {kelgusi.length ? (
            <Timeline
              items={kelgusi.map((o) => ({
                h: (
                  <span style={{ cursor: 'pointer' }} onClick={() => nav(`/provayder/oqimlar/${o.id}`)}>
                    {sana(o.boshlanish)} · {A.versiya(db, o.versiyaId)?.nomi}
                  </span>
                ),
                m: (
                  <span className="row wrap gap-6">
                    <span className="mono">{o.kod}</span> <Holat h={o.holat} /> <span>{A.bandOrinlar(db, o.id)}/{o.orinlar} oʻrin</span>
                  </span>
                ),
                ton: o.holat === 'elon_qilingan' ? ('ok' as const) : ('muted' as const),
              }))}
            />
          ) : (
            <Empty title="Rejalashtirilgan oqim yoʻq">«Oqimlar» boʻlimida tasdiqlangan dastur uchun yangi oqim oching.</Empty>
          )}
        </Card>
      </div>

      <Card className="mt-16" delay={0.12}>
        <CardH icon={<Users />} title="Tinglovchilar va sertifikatlar dinamikasi" sub="Soʻnggi 12 oy · oqim boshlanishi va sertifikat sanasi boʻyicha" />
        <AreaCh data={grafik} keys={['tinglovchi', 'sertifikat']} names={{ tinglovchi: 'Tinglovchilar', sertifikat: 'Sertifikatlar' }} height={260} />
      </Card>
    </>
  )
}
