import { useMemo, useState } from 'react'
import { KeyRound, Eye, EyeOff, Copy, RefreshCw, BookText, Plug, RotateCw, ListX, Activity } from 'lucide-react'
import { Alert, Badge, Button, Card, CardH, Confirm, Holat, PageHeader, Sel, Tabs } from '@/ui'
import * as A from '@/domain/amallar'
import { sanaVaqt, nisbiy } from '@/lib/format'
import { manba, useProv } from './_umumiy'
import { apiKalitYangila, lmsSinxron } from './_amallar'
import { ApiTester } from './_ApiTester'

const kalitOl = (pid: string) => {
  try {
    return localStorage.getItem(`ettp-api-${pid}`) ?? `ukr_live_${pid.toLowerCase()}_7f3c9a12be04d5e6a1`
  } catch {
    return `ukr_live_${pid.toLowerCase()}_7f3c9a12be04d5e6a1`
  }
}

type Ep = 'results' | 'cohorts' | 'listeners'
const ENDPOINT: Record<Ep, { m: string; yol: string; izoh: string; sorov?: string; javob: string }> = {
  results: {
    m: 'POST', yol: '/api/ukr/v1/results', izoh: 'Tinglovchi natijasini yuborish (LMS yoki provayder tizimidan). event_id takrorlansa — 409, natija ikki marta yozilmaydi.',
    sorov: '{\n  "event_id": "7f3c2e9a-…",\n  "provider_id": "P01",\n  "cohort_id": "C-2026-0035",\n  "jshshir": "30101851234567",\n  "result": "passed",\n  "score": 86,\n  "completed_at": "2026-11-13T10:00:00+05:00"\n}',
    javob: '{ "status": "accepted | pending | rejected", "reason": "…" }',
  },
  cohorts: { m: 'GET', yol: '/api/ukr/v1/cohorts?status=davom_etmoqda', izoh: 'Provayderning oqimlari roʻyxati (faqat oʻz oqimlari).', javob: '{\n  "items": [{ "cohort_id": "C-2026-0035", "program": "Oʻtkir koronar sindrom…",\n    "start": "2026-11-04", "end": "2026-11-09", "seats": 24, "status": "davom_etmoqda" }],\n  "next": null\n}' },
  listeners: { m: 'GET', yol: '/api/ukr/v1/cohorts/{cohort_id}/listeners', izoh: 'Oqim tinglovchilari (JSHSHIR, holat). Shaxsga doir maʼlumot faqat vakolat doirasida.', javob: '{\n  "cohort_id": "C-2026-0035",\n  "items": [{ "jshshir": "30101851234567", "status": "oqimoqda", "attendance": 92 }]\n}' },
}

export default function ProvayderApi() {
  const { db, p, oqimlar, yozilishlar, amal, toast } = useProv()
  const [kalit, setKalit] = useState(() => kalitOl(p.id))
  const [kor, setKor] = useState(false)
  const [yangilaS, setYangilaS] = useState(false)
  const [ep, setEp] = useState<Ep>('results')
  const onlayn = useMemo(() => oqimlar.filter((o) => A.versiya(db, o.versiyaId)?.shakl !== 'oflayn' && ['davom_etmoqda', 'elon_qilingan'].includes(o.holat)), [db, oqimlar])
  const [sinxOqim, setSinxOqim] = useState<Record<string, string>>({})
  const [oxirgiSinx, setOxirgiSinx] = useState<Record<string, string>>({})
  const lmsLog = db.hodisalar.filter((h) => h.turi === 'lms_natija' && (h.manbaId === '-' || oqimlar.some((o) => o.id === h.manbaId) || yozilishlar.some((y) => y.id === h.manbaId))).slice(0, 8)

  const nusxa = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t)
      toast({ turi: 'ok', matn: 'Buferga nusxalandi' })
    } catch {
      toast({ turi: 'warn', matn: 'Brauzer buferga yozishga ruxsat bermadi — matnni qoʻlda belgilab nusxalang.' })
    }
  }
  const yangila = () => {
    const k = amal(apiKalitYangila)
    if (k) {
      setKalit(k)
      setKor(true)
      try { localStorage.setItem(`ettp-api-${p.id}`, k) } catch { /* */ }
      toast({ turi: 'ok', sarlavha: 'Yangi API kaliti yaratildi', matn: 'Eski kalit darhol bekor qilindi. Yangi kalitni LMS sozlamalariga kiriting. Amal auditga yozildi.' })
    }
  }
  const sinx = (tizim: string) => {
    const oId = sinxOqim[tizim] ?? onlayn[0]?.id
    if (!oId) return toast({ turi: 'warn', matn: 'Sinxronlash uchun onlayn yoki aralash shakldagi faol oqim yoʻq.' })
    const r = amal(lmsSinxron, oId, tizim)
    if (r) {
      setOxirgiSinx({ ...oxirgiSinx, [tizim]: new Date().toISOString() })
      toast({ turi: 'ok', sarlavha: `${tizim}: sinxronlandi (imitatsiya)`, matn: `${r.tinglovchilar} tinglovchi · ${r.darslar} ta dars progressi · ${r.davomat} ta LMS davomati olindi.` })
    }
  }
  const niqobKalit = kalit.slice(0, 14) + '•'.repeat(18) + kalit.slice(-4)

  const LMS = [
    { nomi: 'Moodle (provayder LMS)', url: `https://lms.${p.qisqa.toLowerCase().replace(/[^a-z]/g, '') || 'provider'}.uz`, holat: 'faol', izoh: 'Webhook + soatlik sinxronlash' },
    { nomi: 'my.tipme.uz', url: 'https://my.tipme.uz', holat: 'faol', izoh: 'Tarixiy kurslar va kreditlarni koʻchirish' },
  ]

  return (
    <>
      <PageHeader title="API va LMS integratsiyasi" desc="Provayder va LMS tizimlari uchun API: natija yuborish, oqim va tinglovchilar roʻyxatini olish. Har soʻrovda kalit va yagona event_id boʻladi." source={manba('UKR API v1 · sandbox (imitatsiya)')} />
      <div className="grid g-main">
        <div className="col gap-16">
          <Card>
            <CardH icon={<KeyRound />} title="API kaliti" sub="Bearer token · faqat server tomonida saqlang" right={<Badge ton="ok">faol</Badge>} />
            <div className="row wrap">
              <div className="code grow" style={{ padding: '10px 12px' }}>{kor ? kalit : niqobKalit}</div>
              <Button v="ghost" size="sm" icon={kor ? <EyeOff /> : <Eye />} onClick={() => setKor(!kor)}>{kor ? 'Yashirish' : 'Koʻrsatish'}</Button>
              <Button v="ghost" size="sm" icon={<Copy />} onClick={() => nusxa(kalit)}>Nusxa</Button>
              <Button v="secondary" size="sm" icon={<RefreshCw />} onClick={() => setYangilaS(true)}>Qayta yaratish</Button>
            </div>
            <div className="xs muted mt-8">Limit: 6 soʻrov / 10 soniya (sandbox). Barcha soʻrovlar audit jurnaliga yoziladi.</div>
          </Card>

          <Card delay={0.04}>
            <CardH icon={<BookText />} title="Endpointlar" sub="UKR API v1 hujjati (qisqa)" />
            <Tabs id="api-ep" value={ep} onChange={setEp} tabs={[{ v: 'results', l: 'POST results' }, { v: 'cohorts', l: 'GET cohorts' }, { v: 'listeners', l: 'GET listeners' }]} />
            <div className="col gap-6 mt-12">
              <div className="row gap-6"><Badge ton={ENDPOINT[ep].m === 'POST' ? 'brand' : 'ok'}>{ENDPOINT[ep].m}</Badge><span className="mono small b">{ENDPOINT[ep].yol}</span></div>
              <div className="small sub">{ENDPOINT[ep].izoh}</div>
              {ENDPOINT[ep].sorov && <><div className="xs b muted">Soʻrov</div><div className="code">{ENDPOINT[ep].sorov}</div></>}
              <div className="xs b muted">Javob (200)</div>
              <div className="code">{ENDPOINT[ep].javob}</div>
            </div>
          </Card>

          <ApiTester />
        </div>

        <div className="col gap-16">
          <Card delay={0.06}>
            <CardH icon={<Plug />} title="LMS ulanishlari" sub="Onlayn oqimlar progressi va davomati" />
            {LMS.map((l) => (
              <div key={l.nomi} className="col gap-6" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="row between"><div><div className="b small">{l.nomi}</div><div className="xs muted mono">{l.url}</div></div><Holat h={l.holat} /></div>
                <div className="xs muted">{l.izoh} · oxirgi: {oxirgiSinx[l.nomi] ? nisbiy(oxirgiSinx[l.nomi]) : 'bugun 03:00'}</div>
                <div className="row">
                  <Sel value={sinxOqim[l.nomi] ?? onlayn[0]?.id ?? ''} onChange={(e) => setSinxOqim({ ...sinxOqim, [l.nomi]: e.target.value })} options={onlayn.map((o) => ({ v: o.id, l: `${o.kod} · ${A.versiya(db, o.versiyaId)?.nomi.slice(0, 22)}` }))} placeholder={onlayn.length ? undefined : 'Onlayn oqim yoʻq'} aria-label="Oqim" />
                  <Button size="sm" v="soft" icon={<RotateCw />} onClick={() => sinx(l.nomi)}>Sinxronlash</Button>
                </div>
              </div>
            ))}
            <div className="xs muted mt-8">Imitatsiya: real LMS oʻrniga progress va davomat sintetik tarzda olinadi.</div>
          </Card>

          <Card delay={0.08}>
            <CardH icon={<ListX />} title="Xato kodlari" />
            <table className="tbl"><tbody>
              {[[200, 'ok', 'Qabul qilindi (pending — rahbar tasdigʻi kutiladi)'], [409, 'warn', 'Takror event_id — avval qabul qilingan, qayta yozilmaydi'], [422, 'err', 'Notoʻgʻri maʼlumot: oqim, shaxs yoki tinglovchi topilmadi'], [429, 'err', 'Soʻrovlar limiti oshdi — Retry-After sarlavhasiga qarang'], [403, 'err', 'Kalit yaroqsiz yoki boshqa provayder maʼlumoti']].map(([k, t, m]) => (
                <tr key={k as number}><td><Badge ton={t as 'ok'}>{k}</Badge></td><td className="small">{m}</td></tr>
              ))}
            </tbody></table>
          </Card>

          <Card delay={0.1}>
            <CardH icon={<Activity />} title="Hodisalar jurnali" sub="LMS va API orqali kelgan soʻnggi hodisalar" />
            {lmsLog.length ? lmsLog.map((h) => (
              <div key={h.id} className="li" style={{ alignItems: 'flex-start' }}>
                <div className="grow"><div className="xs mono" style={{ wordBreak: 'break-all' }}>{h.id}</div><div className="xs muted">{h.izoh} · {sanaVaqt(h.vaqt)}</div></div>
                <Holat h={h.holat} />
              </div>
            )) : <div className="small muted">Hodisa yoʻq.</div>}
          </Card>
          <Alert ton="info">Integratsiya real sinovdan oʻtmaguncha «tayyor» deb qabul qilinmaydi. Tashqi API tayyor boʻlmasa, Excel orqali yuklash ishlatiladi.</Alert>
        </div>
      </div>
      <Confirm open={yangilaS} onClose={() => setYangilaS(false)} title="API kalitini qayta yaratish" ton="danger" okText="Qayta yaratish" onOk={() => { setYangilaS(false); yangila() }}>
        <p className="small sub">Joriy kalit darhol bekor qilinadi — LMS va boshqa tizimlar yangi kalit kiritilgunga qadar 403 oladi.</p>
      </Confirm>
    </>
  )
}
