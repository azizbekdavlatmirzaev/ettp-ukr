import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, ClipboardCheck, AlarmClock, ShieldAlert, BadgeCheck, ArrowRight, Scale, Building2 } from 'lucide-react'
import { Alert, Badge, Button, Card, CardH, Empty, Holat, KPI, PageHeader, Ring, Stagger, staggerItem } from '@/ui'
import { EKG, IMG } from '@/ui/art'
import * as A from '@/domain/amallar'
import { kunFarq, sana, sanaVaqt } from '@/lib/format'
import { AKK_TURI, obyektNomi, useEkspert } from './_umumiy'

export default function EkspertBosh() {
  const { db, user, e, arizalar, ozVaraq, bugun } = useEkspert()
  const nav = useNavigate()
  if (!e) return <Empty title="Ekspert reestrida yozuv topilmadi">UKR markaziga murojaat qiling — hisobingiz ekspertlar reestriga bogʻlanmagan.</Empty>

  const faol = arizalar.filter((a) => a.holat === 'ekspertiza')
  const topshirilgan = arizalar.filter((a) => ozVaraq(a)).length
  const kutilmoqda = faol.filter((a) => !ozVaraq(a))
  const yaqin = kutilmoqda.filter((a) => a.muddat && kunFarq(a.muddat, bugun) <= 7)
  const mandat = kunFarq(e.vakolatMuddati, bugun)

  return (
    <>
      <PageHeader title={`Xush kelibsiz, ${user.fio.split(' ')[1] ?? user.fio}`} desc="Ekspert kabineti: faqat sizga biriktirilgan akkreditatsiya arizalari koʻrinadi." source={`Manba: Ekspertlar reestri, UKR markazi · yangilangan: ${sanaVaqt(new Date().toISOString())}`}
        actions={<Button v="primary" icon={<ClipboardCheck />} onClick={() => nav('/ekspert/varaqlar')}>Baholash varaqlari</Button>} />

      <motion.div className="hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundImage: `linear-gradient(110deg, rgba(10,58,92,.96), rgba(11,92,140,.88) 60%, rgba(15,154,154,.7)), url(${IMG('shifokor')})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row wrap between gap-16" style={{ position: 'relative' }}>
          <div className="col gap-6" style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div className="row wrap gap-6"><span className="chip">Ekspert {e.id}</span><span className="chip">{e.mutaxassislik}</span>{e.faol && <span className="chip">Faol</span>}</div>
            <h2 style={{ fontSize: 24 }}>{e.fio}</h2>
            <div className="sub small row gap-6"><Building2 size={14} /> {e.ishJoyi}</div>
            <div className="row wrap mt-8">
              <Button v="white" size="sm" icon={<ClipboardList />} onClick={() => nav('/ekspert/arizalar')}>Arizalarim</Button>
              {kutilmoqda[0] && <Button v="glassb" size="sm" onClick={() => nav(`/ekspert/varaqlar?ariza=${kutilmoqda[0].id}`)}>Varaqni toʻldirish</Button>}
            </div>
          </div>
          <div className="glass row gap-16" style={{ padding: 16 }}>
            <Ring v={Math.max(0, mandat)} max={365 * 3} size={100} stroke={10} light>
              <div className="center"><div style={{ font: '800 20px var(--font-head)' }}>{Math.max(0, mandat)}</div><div className="xs" style={{ opacity: 0.8 }}>kun</div></div>
            </Ring>
            <div className="col gap-4"><div className="small" style={{ opacity: 0.85 }}>Vakolat muddati</div><div className="b">{sana(e.vakolatMuddati)}</div><div className="xs" style={{ opacity: 0.8 }}>{mandat < 90 ? 'Vakolatni uzaytirish kerak' : 'Vakolat amalda'}</div></div>
          </div>
        </div>
      </motion.div>

      <div className="grid g3 mt-16">
        <KPI icon={<ClipboardList />} label="Biriktirilgan arizalar" value={arizalar.length} hint={`${faol.length} tasi ekspertiza bosqichida`} onClick={() => nav('/ekspert/arizalar')} />
        <KPI icon={<ClipboardCheck />} label="Topshirilgan varaqlar" value={topshirilgan} ton="ok" delay={0.04} onClick={() => nav('/ekspert/varaqlar')} />
        <KPI icon={<AlarmClock />} label="Muddati yaqin" value={yaqin.length} ton={yaqin.length ? 'warn' : undefined} hint="7 kundan kam qolgan, varaq topshirilmagan" delay={0.08} />
      </div>

      <div className="grid g-main mt-16">
        <Card>
          <CardH icon={<ClipboardList />} title="Biriktirilgan arizalar" sub="Muddat boʻyicha tartiblangan" />
          {arizalar.length ? (
            <Stagger className="col gap-4">
              {arizalar.map((a) => {
                const own = ozVaraq(a)
                const k = a.muddat ? kunFarq(a.muddat, bugun) : undefined
                return (
                  <motion.div key={a.id} variants={staggerItem} className="li">
                    <div className={`ic ${own ? 'ok' : a.holat === 'ekspertiza' ? 'warn' : 'brand'}`}>{own ? <BadgeCheck /> : <Scale />}</div>
                    <div className="grow">
                      <div className="b small">{obyektNomi(db, a)}</div>
                      <div className="xs muted"><span className="mono">{a.raqam}</span> · {AKK_TURI[a.turi]} · {A.provayder(db, a.providerId)?.qisqa}</div>
                      <div className="row wrap gap-6 mt-4">
                        <Holat h={a.holat} />
                        {own ? <Badge ton="ok">Varaq topshirilgan</Badge> : a.holat === 'ekspertiza' && k !== undefined && <Badge ton={k <= 7 ? 'warn' : 'muted'}>Muddat: {sana(a.muddat)} · {k} kun</Badge>}
                      </div>
                    </div>
                    {a.holat === 'ekspertiza' && !own ? (
                      <Button size="sm" v="primary" onClick={() => nav(`/ekspert/varaqlar?ariza=${a.id}`)}>Baholash <ArrowRight /></Button>
                    ) : (
                      <Button size="sm" v="soft" onClick={() => nav(`/ekspert/arizalar?ariza=${a.id}`)}>Koʻrish</Button>
                    )}
                  </motion.div>
                )
              })}
            </Stagger>
          ) : (
            <Empty title="Biriktirilgan ariza yoʻq">UKR markazi sizni ariza ekspertizasiga biriktirganda bu yerda koʻrinadi va xabar keladi.</Empty>
          )}
        </Card>
        <div className="col gap-16">
          <Card delay={0.06}>
            <CardH icon={<ShieldAlert />} title="Manfaatlar toʻqnashuvi deklaratsiyasi" sub="Biriktirishda avtomatik tekshiriladi" />
            {e.ishJoyiProviderId && <Alert ton="warn">Ish joyingiz provayder: {A.provayder(db, e.ishJoyiProviderId)?.nomi} — uning arizalariga biriktirilmaysiz.</Alert>}
            {e.deklaratsiya.length ? e.deklaratsiya.map((d) => (
              <div key={d.providerId} className="li">
                <div className="ic err"><ShieldAlert /></div>
                <div className="grow"><div className="b small">{A.provayder(db, d.providerId)?.nomi ?? d.providerId}</div><div className="xs muted">{d.sabab}</div></div>
                <Badge ton="err">bloklangan</Badge>
              </div>
            )) : <div className="small muted">Deklaratsiya qilingan toʻqnashuv yoʻq.</div>}
            <div className="xs muted mt-8">Deklaratsiyani oʻzgartirish uchun UKR markaziga yozma murojaat qiling. Manfaatdor arizalar sizga koʻrsatilmaydi.</div>
          </Card>
          <Alert ton="info" title="Ekspert xulosasi qaror emas">Siz mustaqil ekspertiza varagʻini toʻldirasiz. Qarorni komissiya yoki vakolatli shaxs qabul qiladi.</Alert>
        </div>
      </div>
    </>
  )
}
