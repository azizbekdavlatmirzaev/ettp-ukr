import { useMemo, type ReactNode } from 'react'
import { BarChart3, BookOpen, Building2, FileSpreadsheet, Globe2, ShieldCheck, Target, Users, Award, EyeOff } from 'lucide-react'
import { useStore } from '@/domain/store'
import { AreaCh, BarCh, Donut, Legenda } from '@/ui/charts'
import { Button, CardH, Raqam, cx } from '@/ui'
import { excelYukla } from '@/lib/eksport'
import { foiz } from '@/lib/format'
import { Hisob, PageBand, PublicLayout, Reveal, bugunISO, yangilanganMatn, yashir } from './_parts'
import { ochiqStat, type Guruh } from './_statHisob'

const MANBA = 'Reestr (xodimlar, sana bilan), Kredit jurnali, Sertifikatlar moduli'

function KpiK({ icon, l, n, suffix, h, children, i }: { icon: ReactNode; l: string; n: number | string; suffix?: string; h?: string; children: ReactNode; i: number }) {
  return (
    <Reveal delay={(i % 3) * 0.08}>
      <div className="st-k pb-lift">
        <div className="top2"><i>{icon}</i> {l}</div>
        <div className="n">{typeof n === 'number' ? <Raqam n={n} /> : n}{suffix && <small>{suffix}</small>}</div>
        {h && <div className="h">{h}</div>}
        {children}
      </div>
    </Reveal>
  )
}

function Jadval({ rows, min, nomi }: { rows: Guruh[]; min: number; nomi: string }) {
  return (
    <div className="tbl-wrap">
      <table className="st-tbl">
        <thead><tr><th>{nomi}</th><th className="r">Xodimlar</th><th className="r">Talabni bajargan</th><th className="r">Oʻrtacha kredit</th></tr></thead>
        <tbody>
          {rows.map((g) => {
            const kichik = g.n < min
            return (
              <tr key={g.nomi}>
                <td>{g.nomi}</td>
                <td className={cx('r', kichik && 'st-sup')}>{yashir(g.n, min)}</td>
                <td className={cx('r', kichik && 'st-sup')}>{kichik ? '—' : `${foiz(g.bajardi, g.n)}%`}</td>
                <td className={cx('r', kichik && 'st-sup')}>{kichik ? '—' : (g.kredit / g.n).toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PublicStatistika() {
  const db = useStore((s) => s.db)
  const toast = useStore((s) => s.toast)
  const min = db.sozlamalar.ochiqStatistikaMinGuruh
  const yil = new Date().getFullYear()
  const st = useMemo(() => ochiqStat(db, yil, bugunISO()), [db, yil])

  const hududCh = st.hudud.filter((g) => g.n >= min).map((g) => ({ x: g.nomi.replace(' viloyati', ' v.').replace(' Respublikasi', ''), kredit: Math.round((g.kredit / g.n) * 10) / 10 }))
  const guruhKatta = st.mutGuruh.filter((g) => g.n >= min)
  const guruhKichik = st.mutGuruh.filter((g) => g.n < min)
  const boshqa = guruhKichik.reduce((a, g) => a + g.n, 0)
  const donut = [...guruhKatta.map((g) => ({ name: g.nomi, value: g.n })), ...(boshqa >= min ? [{ name: 'Boshqa guruhlar', value: boshqa }] : [])]
  const oyCh = st.oylar.map((o) => ({ x: o.x, kredit: o.kredit, sert: o.sert >= min ? o.sert : 0 }))
  const yashOylar = st.oylar.filter((o) => o.sert > 0 && o.sert < min).map((o) => o.x)

  const eksport = () => {
    const q: { kesim: string; guruh: string; qiymat: string; izoh: string }[] = [
      { kesim: 'Umumiy', guruh: 'Xodimlar UKR hisobida', qiymat: String(st.xodimlar), izoh: '' },
      { kesim: 'Umumiy', guruh: 'Talabni bajarganlar, %', qiymat: String(foiz(st.bajardi, st.xodimlar)), izoh: 'joriy holat' },
      { kesim: 'Umumiy', guruh: 'Akkreditatsiyalangan provayderlar', qiymat: String(st.provayder), izoh: '' },
      { kesim: 'Umumiy', guruh: 'Tasdiqlangan dasturlar', qiymat: String(st.dastur), izoh: '' },
      { kesim: 'Umumiy', guruh: `Sertifikatlar ${yil}`, qiymat: String(st.sert), izoh: '' },
      ...st.hudud.map((g) => ({ kesim: 'Hudud', guruh: g.nomi, qiymat: yashir(g.n, min), izoh: g.n < min ? 'kichik guruh yashirilgan' : `bajargan ${foiz(g.bajardi, g.n)}%` })),
      ...st.mutGuruh.map((g) => ({ kesim: 'Mutaxassislik guruhi', guruh: g.nomi, qiymat: yashir(g.n, min), izoh: g.n < min ? 'kichik guruh yashirilgan' : `bajargan ${foiz(g.bajardi, g.n)}%` })),
      ...st.oylar.map((o) => ({ kesim: 'Oy (sertifikatlar)', guruh: o.x, qiymat: o.sert ? yashir(o.sert, min) : '0', izoh: `kredit: ${o.kredit}` })),
    ]
    excelYukla('ukr-ochiq-statistika', 'Statistika', [
      { kalit: 'kesim', nomi: 'Kesim', qiymat: (r) => r.kesim },
      { kalit: 'guruh', nomi: 'Guruh', qiymat: (r) => r.guruh },
      { kalit: 'qiymat', nomi: 'Qiymat', qiymat: (r) => r.qiymat },
      { kalit: 'izoh', nomi: 'Izoh', qiymat: (r) => r.izoh },
    ], q)
    toast({ turi: 'ok', matn: `Yigʻma koʻrsatkichlar Excel faylga yuklandi (${q.length} qator, kichik guruhlar «<${min}»).` })
  }

  return (
    <PublicLayout>
      <PageBand crumb="Statistika" icon={<BarChart3 />} title={`UKR ochiq statistikasi — ${yil}`}
        lead={`Faqat umumlashtirilgan sonlar. ${min} kishidan kichik guruhlar «<${min}» deb yashiriladi; shaxs darajasidagi maʼlumot chiqarilmaydi.`}
        source={`Manba: ${MANBA} · yangilangan: ${yangilanganMatn()}`}>
        <div className="row wrap mt-16"><Button v="white" icon={<FileSpreadsheet />} onClick={eksport}>Excel yuklab olish</Button></div>
      </PageBand>
      <div className="pb-body">
        <div className="pb-wrap col" style={{ gap: 24 }}>
          <div className="st-kpi">
            <KpiK i={0} icon={<Users />} l="Xodimlar UKR hisobida" n={st.xodimlar} h={`Reestrdagi ${st.reestrJami} ta yozuvdan, qamrov ${foiz(st.xodimlar, st.reestrJami)}%`}>
              <Hisob qanday="Amaldagi mehnat munosabatiga ega xodimlar / Reestrdagi jami xodimlar" manba="Reestr, HRM" holatlar="ishdan boʻshaganlar chiqarilgan" />
            </KpiK>
            <KpiK i={1} icon={<Target />} l="Talabni bajarganlar" n={foiz(st.bajardi, st.xodimlar)} suffix="%" h="Joriy holat; yakuniy natija yil oxirida">
              <Hisob qanday="K ≥ T va majburiy/amaliy ulushlar bajarilgan xodimlar / UKR hisobidagi xodimlar" manba="Kredit jurnali, amaldagi kredit qoidasi" holatlar="tasdiqlangan kredit yozuvlari" />
            </KpiK>
            <KpiK i={2} icon={<Building2 />} l="Akkreditatsiyalangan provayderlar" n={st.provayder} h="Shartli akkreditatsiya bilan birga">
              <Hisob qanday="Holati «akkreditatsiyalangan» yoki «shartli» provayderlar" manba="Provayderlar reestri" />
            </KpiK>
            <KpiK i={3} icon={<BookOpen />} l="Tasdiqlangan dasturlar" n={st.dastur} h="Amaldagi dastur versiyalari">
              <Hisob qanday="Holati «tasdiqlangan» dastur versiyalari" manba="Dasturlar reestri" />
            </KpiK>
            <KpiK i={4} icon={<Award />} l={`Sertifikatlar ${yil}`} n={st.sert} h="QR-kodli elektron sertifikatlar">
              <Hisob qanday={`${yil}-yilda berilgan sertifikatlar (tuzatilgan va bekor qilinganlar ham)`} manba="Sertifikatlar moduli" holatlar="amalda, tuzatilgan, bekor qilingan" />
            </KpiK>
            <KpiK i={5} icon={<Globe2 />} l="Tan olingan xorijiy kreditlar" n={st.tanKredit} suffix="kredit" h={`Tasdiqlangan arizalar: ${yashir(st.tanSoni, min)}`}>
              <Hisob qanday="Tan olish asosidagi kredit yozuvlari yigʻindisi" manba="Kredit jurnali (manba: tan olish)" />
            </KpiK>
          </div>

          <div className="st-g2">
            <Reveal className="pb-card">
              <CardH icon={<BarChart3 />} title="Hududlar kesimida oʻrtacha kredit" sub={`${yil}, bir xodimga · faqat ≥${min} kishilik hududlar`} />
              <BarCh data={hududCh} keys={['kredit']} names={{ kredit: 'Oʻrtacha kredit' }} horizontal height={Math.max(220, hududCh.length * 30)} />
              <Hisob qanday="Hududdagi xodimlar kreditlari yigʻindisi / xodimlar soni" manba={MANBA} holatlar={`${min} kishidan kichik guruhlar grafikda koʻrsatilmaydi`} />
            </Reveal>
            <Reveal className="pb-card" delay={0.08}>
              <CardH icon={<Users />} title="Mutaxassislik guruhlari" sub="Xodimlar soni boʻyicha ulush" />
              <Donut data={donut} height={220} center={<div><div className="stat-big"><Raqam n={st.xodimlar} /></div><div className="xs muted">xodim</div></div>} />
              <div className="mt-12"><Legenda items={donut.map((d) => ({ l: d.name, v: d.value }))} /></div>
              {guruhKichik.length > 0 && <p className="pb-note mt-12"><EyeOff /> «{'<'}{min}» guruhlar: {guruhKichik.map((g) => g.nomi).join(', ')}{boshqa >= min ? ' — «Boshqa guruhlar»ga birlashtirilgan' : ' — yashirilgan'}.</p>}
            </Reveal>
          </div>

          <Reveal className="pb-card">
            <CardH icon={<Award />} title="Oylar boʻyicha dinamika" sub={`${yil}: berilgan kreditlar va sertifikatlar`} />
            <AreaCh data={oyCh} keys={['kredit', 'sert']} names={{ kredit: 'Kreditlar', sert: 'Sertifikatlar' }} height={260} />
            <Legenda items={[{ l: 'Kreditlar' }, { l: 'Sertifikatlar' }]} />
            {yashOylar.length > 0 && <p className="pb-note mt-8"><EyeOff /> {yashOylar.join(', ')}: sertifikatlar soni «{'<'}{min}» — grafikda 0 sifatida koʻrsatilgan.</p>}
            <Hisob qanday="Oy ichida yozilgan musbat kredit yozuvlari (oʻtkazilganlarsiz) va berilgan sertifikatlar" manba="Kredit jurnali, Sertifikatlar moduli" />
          </Reveal>

          <div className="st-g2">
            <Reveal className="pb-card">
              <CardH icon={<ShieldCheck />} title="Hududlar jadvali" sub={`«<${min}» — kichik guruh yashirilgan`} />
              <Jadval rows={st.hudud} min={min} nomi="Hudud" />
            </Reveal>
            <Reveal className="pb-card" delay={0.08}>
              <CardH icon={<ShieldCheck />} title="Mutaxassislik guruhlari va maʼlumot darajasi" sub={`«<${min}» — kichik guruh yashirilgan`} />
              <Jadval rows={st.mutGuruh} min={min} nomi="Guruh" />
              <div className="mt-16"><Jadval rows={st.daraja} min={min} nomi="Maʼlumot darajasi" /></div>
            </Reveal>
          </div>
          <p className="pb-note"><ShieldCheck /> Qamrov maxraji Reestrdan sana bilan olinadi. Ochiq sahifada shaxsga doir maʼlumot koʻrsatilmaydi; batafsil kesimlar faqat vakolatli rollarga (Vazirlik, UKR markazi) ochiq. Prototip — sintetik maʼlumotlar.</p>
        </div>
      </div>
    </PublicLayout>
  )
}
