import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, UserCheck, Gavel, Globe2, MessageSquareWarning, ClipboardList, PenLine, Scale, Radar, FileSearch, Building2, BookOpen, ScrollText, Award, Activity, CheckCircle2 } from 'lucide-react'
import * as A from '@/domain/amallar'
import { Card, CardH, Holat, KPI, Badge, Button, Stagger, staggerItem, cx } from '@/ui'
import { Donut, Legenda } from '@/ui/charts'
import { EKG } from '@/ui/art'
import { sanaUzun, sanaVaqt, son } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { ROL_NOMI } from '@/domain/malumotnoma'
import { useMarkaz, ishKunlari, manba } from './_parts'
import { solishtirishQayd } from './_amallar'

interface Navbat { k: string; nomi: string; icon: ReactNode; n: number; muddatlar: string[]; to: string; rol: 'mut' | 'rah' | 'ikki'; izoh: string }

export default function MarkazBosh() {
  const { db, user, bugun, yil, rahbar, amal, ok } = useMarkaz()
  const nav = useNavigate()
  const bay = db.sozlamalar.bayramlar
  const [sol, setSol] = useState<(ReturnType<typeof A.solishtirish> & { vaqt?: string }) | null>(null)
  const solJoriy = sol ?? A.solishtirish(db, yil)

  const navbatlar: Navbat[] = useMemo(() => {
    const akk = db.akkArizalar
    const bos = (h: string) => akk.filter((a) => a.holat === h)
    const ekspBir = bos('ekspertiza').filter((a) => a.ekspertlar.length < 2)
    const tanOch = db.tanOlish.filter((t) => ['yuborildi', 'tekshiruvda', 'kamchilik'].includes(t.holat))
    const murOch = db.murojaatlar.filter((m) => !['qaror', 'yopildi'].includes(m.holat))
    return [
      { k: 'toliq', nomi: 'Toʻliqlik tekshiruvi', icon: <ShieldCheck />, n: bos('toliqlik').length, muddatlar: bos('toliqlik').map((a) => a.muddat), to: '/markaz/akkreditatsiya', rol: 'mut', izoh: 'Yangi akkreditatsiya arizalari' },
      { k: 'eksp', nomi: 'Ekspert biriktirish', icon: <UserCheck />, n: ekspBir.length, muddatlar: ekspBir.map((a) => a.muddat), to: '/markaz/akkreditatsiya', rol: 'ikki', izoh: 'Ekspertiza bosqichida, 2 ekspert yoʻq' },
      { k: 'kom', nomi: 'Komissiya qarori', icon: <Gavel />, n: bos('komissiya').length, muddatlar: bos('komissiya').map((a) => a.muddat), to: '/markaz/akkreditatsiya', rol: 'rah', izoh: 'Komissiya va ERI bilan qaror' },
      { k: 'tan', nomi: 'Tan olish arizalari', icon: <Globe2 />, n: tanOch.length, muddatlar: tanOch.filter((t) => !t.toxtatilgan).map((t) => t.muddat), to: '/markaz/tanolish', rol: 'mut', izoh: 'Tekshiruv va xulosa tayyorlash' },
      { k: 'tanq', nomi: 'Tan olish — tasdiqlash', icon: <Globe2 />, n: db.tanOlish.filter((t) => t.holat === 'qaror').length, muddatlar: db.tanOlish.filter((t) => t.holat === 'qaror').map((t) => t.muddat), to: '/markaz/tanolish', rol: 'rah', izoh: 'Tayyor xulosalarni ERI bilan tasdiqlash' },
      { k: 'mur', nomi: 'Murojaatlar', icon: <MessageSquareWarning />, n: murOch.length, muddatlar: murOch.map((m) => m.muddat), to: '/markaz/murojaatlar', rol: 'ikki', izoh: 'Apellyatsiya va shikoyatlar (≤2 ish kuni — ajratiladi)' },
      { k: 'tek', nomi: 'Tekshiruvdagi natijalar', icon: <ClipboardList />, n: db.natijalar.filter((x) => x.holat === 'tekshiruvda').length, muddatlar: [], to: '/markaz/jurnal', rol: 'rah', izoh: 'Avtomatik tekshiruvdan oʻtmagan' },
      { k: 'tuz', nomi: 'Tuzatish takliflari', icon: <PenLine />, n: db.tuzatishlar.filter((x) => x.holat === 'kutilmoqda').length, muddatlar: [], to: '/markaz/jurnal', rol: 'rah', izoh: 'Kredit jurnali tuzatishlari' },
      { k: 'qoida', nomi: 'Qoida versiyalari', icon: <Scale />, n: db.qoidalar.filter((q) => (rahbar ? q.holat === 'korib_chiqishda' : ['qoralama', 'rad_etilgan'].includes(q.holat))).length, muddatlar: [], to: '/markaz/qoidalar', rol: 'ikki', izoh: rahbar ? 'Tasdiqlash kutilmoqda' : 'Qoralama va qaytarilganlar' },
      { k: 'sig', nomi: 'Yangi signallar', icon: <Radar />, n: db.signallar.filter((s) => s.holat === 'yangi').length, muddatlar: [], to: '/markaz/sifat', rol: 'ikki', izoh: 'Sifat nazorati' },
      { k: 'psv', nomi: 'PSV soʻrovlari', icon: <FileSearch />, n: db.psv.filter((p) => !['yetkazildi', 'rad_etildi'].includes(p.holat)).length, muddatlar: [], to: '/markaz/psv', rol: 'mut', izoh: 'Manbalardan tasdiq' },
    ]
  }, [db, rahbar])

  const meniki = navbatlar.filter((n) => n.rol === 'ikki' || n.rol === (rahbar ? 'rah' : 'mut'))
  const boshqa = navbatlar.filter((n) => !meniki.includes(n))

  const provHolat = useMemo(() => {
    const m = new Map<string, number>()
    db.provayderlar.forEach((p) => m.set(p.holat, (m.get(p.holat) ?? 0) + 1))
    return Array.from(m.entries()).map(([h, v]) => ({ name: holatMatn(h)[0], value: v }))
  }, [db.provayderlar])
  const bugungi = db.jurnal.filter((j) => j.sana.slice(0, 10) === bugun)
  const dasturSoni = db.versiyalar.filter((v) => v.holat === 'tasdiqlangan').length
  const sertSoni = db.sertifikatlar.filter((s) => s.holat === 'amalda').length

  const solQayta = () => {
    const r = amal(solishtirishQayd, yil)
    if (r) {
      setSol(r)
      ok(`${yil}: ${r.yozuvlar} yozuv qayta hisoblandi. Farq: ${r.farq}, takrorlar: ${r.takrorlar}.`, 'Solishtirish bajarildi')
    }
  }

  const navKarta = (q: Navbat) => {
    const kunlar = q.muddatlar.map((m) => ishKunlari(bugun, m, bay)).filter((x): x is number => x !== undefined)
    const kech = kunlar.filter((k) => k < 0).length
    const eng = kunlar.length ? Math.min(...kunlar) : undefined
    const shosh = eng !== undefined && eng <= 2
    return (
      <motion.div key={q.k} variants={staggerItem} className={cx('mk-q', shosh && q.n > 0 && 'urgent', q.n === 0 && 'zero')} onClick={() => nav(q.to)} role="button" tabIndex={0}>
        <div className="ic">{q.icon}</div>
        <div className="grow">
          <div className="row between">
            <div className="b small">{q.nomi}</div>
            <div className="n">{q.n}</div>
          </div>
          <div className="xs muted mt-4">{q.izoh}</div>
          <div className="row wrap gap-6 mt-8">
            {kech > 0 && <Badge ton="err">Kechikkan: {kech}</Badge>}
            {eng !== undefined && eng >= 0 && <Badge ton={eng <= 2 ? 'warn' : 'info'}>Eng yaqin: {eng} ish kuni</Badge>}
            {q.n === 0 && <Badge ton="ok">Navbat boʻsh</Badge>}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="col gap-20">
      <motion.div className="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row between wrap" style={{ position: 'relative', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: '1 1 320px' }}>
            <div className="sub small">{sanaUzun(bugun)} · {ROL_NOMI[user.rol]}</div>
            <h1 style={{ marginTop: 6 }}>UKR markazi — ish navbatlari</h1>
            <p className="sub mt-8" style={{ maxWidth: 620 }}>
              {user.fio}. {rahbar ? 'Siz qaror qabul qilasiz: komissiya qarorlari, tan olish, tuzatish va qoida versiyalarini ERI bilan tasdiqlaysiz.' : 'Siz arizalarni tekshirasiz, tayyorlaysiz va taklif qilasiz. Tasdiqlash — boshqa vakolatli shaxs tomonidan.'}
            </p>
          </div>
          <div className="glass">
            <div className="xs sub">Sizning navbatingizda</div>
            <div className="mk-big" style={{ color: '#fff' }}>{meniki.reduce((a, q) => a + q.n, 0)}</div>
            <div className="xs sub">ta ish · muddatlar ish kunlarida</div>
          </div>
        </div>
      </motion.div>

      <Stagger className="grid g4">{meniki.map(navKarta)}</Stagger>

      <div className="grid g4">
        <KPI icon={<Building2 />} label="Provayderlar" value={db.provayderlar.length} hint={`${db.provayderlar.filter((p) => A.akkFaolmi(p)).length} tasi akkreditatsiyasi amalda`} onClick={() => nav('/markaz/provayderlar')} />
        <KPI icon={<BookOpen />} label="Tasdiqlangan dasturlar" value={dasturSoni} ton="teal" hint={`${db.versiyalar.length} versiya reestrda`} delay={0.05} onClick={() => nav('/markaz/dasturlar')} />
        <KPI icon={<ScrollText />} label="Bugungi kredit yozuvlari" value={bugungi.length} ton="ok" hint={`${son(bugungi.reduce((a, j) => a + j.miqdor, 0))} kredit · jami ${db.jurnal.length} yozuv`} delay={0.1} onClick={() => nav('/markaz/jurnal')} />
        <KPI icon={<Award />} label="Amaldagi sertifikatlar" value={sertSoni} hint={`${db.sertifikatlar.length - sertSoni} tasi tuzatilgan/bekor`} delay={0.15} />
      </div>

      <div className="grid g3">
        <Card>
          <CardH icon={<Building2 />} title="Provayderlar holati" sub="Reestr boʻyicha" />
          <Donut data={provHolat} height={190} center={<div><div className="stat-big">{db.provayderlar.length}</div><div className="xs muted">jami</div></div>} />
          <Legenda items={provHolat.map((p) => ({ l: p.name, v: p.value }))} />
        </Card>
        <Card delay={0.05}>
          <CardH icon={<Activity />} title="Hodisalar navbati" sub="Oxirgi 8 ta (eventId boʻyicha idempotent)" />
          <div>
            {db.hodisalar.slice(0, 8).map((h, i) => (
              <div key={h.id + i} className="li" style={{ padding: '7px 0' }}>
                <div className="grow">
                  <div className="small b">{h.turi.replace(/_/g, ' ')}</div>
                  <div className="xs muted" title={h.izoh}>{sanaVaqt(h.vaqt)} · <span className="mono">{h.id.slice(0, 22)}</span></div>
                </div>
                <Holat h={h.holat} />
              </div>
            ))}
          </div>
        </Card>
        <Card delay={0.1}>
          <CardH icon={<CheckCircle2 />} title="Kunlik solishtirish" sub={`${yil}-yil · balans jurnaldan qayta hisoblanadi`} />
          <div className="xs muted">Natija</div>
          <div className="mk-big" style={{ color: solJoriy.farq === 0 ? 'var(--ok)' : 'var(--err)' }}>Farq: {solJoriy.farq}</div>
          <dl className="dl mt-12" style={{ gridTemplateColumns: '1fr auto' }}>
            <dt>Xodimlar</dt><dd>{son(solJoriy.xodimlar)}</dd>
            <dt>Yozuvlar</dt><dd>{son(solJoriy.yozuvlar)}</dd>
            <dt>Jami kredit</dt><dd>{son(solJoriy.jami)}</dd>
            <dt>Takroriy natijalar</dt><dd>{solJoriy.takrorlar === 0 ? <Holat ton="ok">0</Holat> : <Holat ton="err">{solJoriy.takrorlar}</Holat>}</dd>
          </dl>
          <div className="row between mt-12 wrap">
            <span className="xs muted">{sol?.vaqt ? `Qayta hisoblandi: ${sanaVaqt(sol.vaqt)}` : 'Avtomatik: har kuni 02:00'}</span>
            <Button size="sm" v="soft" onClick={solQayta}>Hozir solishtirish</Button>
          </div>
        </Card>
      </div>

      {boshqa.length > 0 && (
        <Card>
          <CardH title="Hamkasblar navbati" sub={`${rahbar ? 'Mutaxassis' : 'Qaror qabul qiluvchi'} vakolatidagi ishlar — kuzatish uchun`} />
          <div className="row wrap gap-6">
            {boshqa.map((q) => (
              <button key={q.k} className="chip" style={{ cursor: 'pointer' }} onClick={() => nav(q.to)}>
                {q.nomi}: <b>{q.n}</b>
              </button>
            ))}
          </div>
        </Card>
      )}
      <div className="xs muted">{manba('UKR quyi tizimi (kredit jurnali, arizalar, hodisalar navbati)')}</div>
    </div>
  )
}
