import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Send, ArrowLeft, ArrowRight, History, ShieldAlert, Lock, BookOpen, Layers, FlaskConical } from 'lucide-react'
import { Alert, Button, Card, CardH, DL, Empty, Holat, Modal, PageHeader, Stepper, Badge } from '@/ui'
import { kursRasmi } from '@/ui/art'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { sana, sanaVaqt } from '@/lib/format'
import { SHAKL } from '@/lib/holat'
import { manba, oxirgiVersiya, useProv } from './_umumiy'
import { QADAMLAR, bosh, payload, tekshir, versiyadan, Qadam0, Qadam1, Qadam2, type Forma } from './_dasturForma'
import { Qadam3, Qadam4, Qadam5, Qadam6 } from './_dasturForma2'

export default function ProvayderDastur() {
  const { id = 'yangi' } = useParams()
  const { db, dasturlar, amal, toast } = useProv()
  const nav = useNavigate()
  const yangi = id === 'yangi'
  const ds = dasturlar.find((d) => d.id === id)
  const v = ds ? oxirgiVersiya(db, ds) : undefined
  const [f, setF] = useState<Forma>(() => (v ? versiyadan(v, ds!.kod) : bosh()))
  const [q, setQ] = useState(0)
  const [e, setE] = useState<Record<string, string>>({})
  const [korVer, setKorVer] = useState<T.DasturVersiya>()
  const [sinov, setSinov] = useState(false)

  useEffect(() => {
    if (v) setF(versiyadan(v, ds!.kod))
    else if (yangi) setF(bosh())
    setE({})
    // faqat dastur yoki versiya almashganda qayta yuklanadi
  }, [v?.id, yangi]) // eslint-disable-line react-hooks/exhaustive-deps

  const versiyalar = useMemo(() => (ds ? ds.versiyalar.map((x) => A.versiya(db, x)!).reverse() : []), [db, ds])
  const ariza = v ? db.akkArizalar.filter((a) => a.versiyaId === v.id).pop() : undefined

  if (!yangi && !ds) {
    return (
      <>
        <PageHeader title="Dastur topilmadi" crumbs={[{ l: 'Dasturlar', to: '/provayder/dasturlar' }, { l: 'Topilmadi' }]} />
        <Empty title="Dastur topilmadi yoki boshqa provayderga tegishli" action={<Button v="primary" onClick={() => nav('/provayder/dasturlar')}>Dasturlar roʻyxatiga qaytish</Button>}>Provayder faqat oʻz tashkiloti dasturlarini koʻradi va tahrirlaydi.</Empty>
      </>
    )
  }

  const ro = v?.holat === 'korib_chiqishda'
  const tasdiqlangan = v?.holat === 'tasdiqlangan' || v?.holat === 'arxiv'
  const set = (p: Partial<Forma>) => setF((x) => ({ ...x, ...p }))
  const otish = (n: number) => {
    setE({})
    setQ(n)
  }
  const keyingi = () => {
    const x = tekshir(f, q)
    setE(x)
    if (Object.keys(x).length) return toast({ turi: 'warn', matn: 'Bosqichdagi xatolarni tuzating: ' + Object.values(x)[0] })
    setQ(Math.min(QADAMLAR.length - 1, q + 1))
  }

  const saqla = () => {
    if (v && tasdiqlangan && JSON.stringify(payload(f)) === JSON.stringify(payload(versiyadan(v, ds!.kod)))) {
      toast({ turi: 'info', matn: 'Oʻzgarish yoʻq — tasdiqlangan versiya oʻzgarmadi. Mazmunni tahrirlasangiz yangi versiya ochiladi.' })
      return v
    }
    const r = amal(A.dasturSaqla, payload(f), ds?.id)
    if (!r) return undefined
    const yangiVer = v && r.id !== v.id
    toast({ turi: 'ok', sarlavha: yangiVer ? `Yangi versiya v${r.versiya} yaratildi` : 'Qoralama saqlandi', matn: yangiVer ? 'Tasdiqlangan versiya oʻzgarmadi; mavjud oqimlar eski versiyada qoladi. Yangi versiyani akkreditatsiyaga yuboring.' : 'Pasport maʼlumotlari saqlandi.' })
    if (yangi) nav(`/provayder/dasturlar/${r.dasturId}`, { replace: true })
    return r
  }

  const akkYubor = () => {
    const all = [0, 1, 2, 3, 4, 5].flatMap((n) => Object.values(tekshir(f, n)))
    if (all.length) {
      setQ(6)
      return toast({ turi: 'warn', sarlavha: 'Pasport toʻliq emas', matn: all[0] })
    }
    const r = saqla()
    if (!r) return
    const a = amal(A.akkArizaYarat, 'dastur', r.id)
    if (a) {
      toast({ turi: 'ok', sarlavha: `Akkreditatsiya arizasi ${a.raqam}`, matn: 'Majburiy hujjatlarni yuklang; rahbar ERI bilan yuboradi.' })
      nav(`/provayder/akkreditatsiya?ariza=${a.id}`)
    }
  }

  const kreditSinov = () => {
    if (!ds || !v) return
    // amal() xatoni (403) toast qiladi va store rad etilgan urinishni auditga yozadi
    const pl = payload(f)
    amal(A.dasturSaqla, { ...pl, mutaxassisliklar: pl.mutaxassisliklar.length ? pl.mutaxassisliklar : ['M01'], soralganKredit: pl.soralganKredit || 1, tasdiqlanganKredit: (v.tasdiqlanganKredit ?? 0) + 4 }, ds.id)
    setSinov(true)
  }
  const radAudit = sinov ? db.audit.find((a) => a.natija === 'rad_etildi' && a.amal.includes('dasturSaqla')) : undefined

  const Qadam = [Qadam0, Qadam1, Qadam2][q]
  const props = { f, set, e, ro }

  return (
    <>
      <PageHeader
        title={yangi ? 'Yangi dastur' : f.nomi || v?.nomi}
        crumbs={[{ l: 'Dasturlar', to: '/provayder/dasturlar' }, { l: yangi ? 'Yangi' : `${ds!.kod} · v${v!.versiya}` }]}
        desc="Dastur pasporti bosqichma-bosqich toʻldiriladi. Har bosqichda tekshiruv va qoralama saqlash mavjud."
        source={manba('Dasturlar reestri')}
        actions={
          <>
            {!ro && <Button v="secondary" icon={<Save />} onClick={saqla}>Qoralama saqlash</Button>}
            {!ro && !tasdiqlangan && <Button v="primary" icon={<Send />} onClick={akkYubor}>Akkreditatsiyaga yuborish</Button>}
          </>
        }
      />
      {ro && <Alert ton="warn" title="Versiya koʻrib chiqishda — tahrirlash yopiq">Ariza {ariza?.raqam} UKR markazida. Qaror chiqqandan keyin yangi versiya ochishingiz mumkin.</Alert>}
      {tasdiqlangan && (
        <Alert ton="info" title={`v${v!.versiya} tasdiqlangan — tahrirlash yangi versiya yaratadi`}>
          Mazmun, soat yoki kreditni oʻzgartirib saqlasangiz <b>v{(versiyalar[0]?.versiya ?? 1) + 1}</b> qoralamasi ochiladi va qayta koʻrib chiqishga yuboriladi. Mavjud oqimlar va berilgan kreditlar eski versiyada qoladi.
        </Alert>
      )}

      <div className="grid g-main mt-16">
        <Card>
          <Stepper steps={QADAMLAR} current={q} />
          <div className="row wrap gap-6 mt-12 mb-16">
            {QADAMLAR.map((s, i) => (
              <button key={s} className={`chip ${i === q ? 'on' : ''}`} style={{ cursor: 'pointer' }} onClick={() => otish(i)}>{i + 1}. {s}</button>
            ))}
          </div>
          <h3 className="mb-12">{QADAMLAR[q]}</h3>
          {q < 3 && <Qadam {...props} />}
          {q === 3 && <Qadam3 {...props} tasdiq={v?.tasdiqlanganKredit} />}
          {q === 4 && <Qadam4 {...props} />}
          {q === 5 && <Qadam5 {...props} />}
          {q === 6 && <Qadam6 {...props} tasdiq={v?.tasdiqlanganKredit} otish={otish} />}
          <div className="card-f row between wrap">
            <Button v="ghost" icon={<ArrowLeft />} disabled={q === 0} onClick={() => otish(q - 1)}>Orqaga</Button>
            <span className="xs muted">{q + 1} / {QADAMLAR.length}</span>
            {q < QADAMLAR.length - 1 ? <Button v="primary" onClick={keyingi}>Keyingi <ArrowRight /></Button> : !ro && <Button v="primary" icon={<Save />} onClick={saqla}>Saqlash</Button>}
          </div>
        </Card>

        <div className="col gap-16">
          <Card className="course" flush delay={0.05}>
            <div className="cover">
              <img src={kursRasmi({ mutaxassisliklar: f.mutaxassisliklar, shakl: f.shakl, tadbirTuri: f.tadbirTuri, nomi: f.nomi || 'dastur', tinglovchi: f.tinglovchi })} alt="" />
              <div className="ov2" />
              <div className="tl2">{v ? <Holat h={v.holat} /> : <Holat h="qoralama" />}</div>
              <div className="cr">{v?.tasdiqlanganKredit ?? f.soralganKredit} kredit</div>
            </div>
            <div className="body">
              <h3>{f.nomi || 'Nomsiz dastur'}</h3>
              <div className="xs muted">{f.soatNazariy + f.soatAmaliy} soat · {SHAKL[f.shakl]} · {f.mutaxassisliklar.length} mutaxassislik</div>
              <div className="ro mt-8"><Lock size={14} /> Tasdiqlangan kredit: <b>{v?.tasdiqlanganKredit ?? '—'}</b></div>
              <div className="xs muted">Tasdiqlangan kredit faqat akkreditatsiya qarori bilan belgilanadi; provayder uni oʻzgartira olmaydi.</div>
              {v?.amalMuddati && <div className="small">Amal muddati: <b>{sana(v.amalMuddati)}</b></div>}
              {ariza && <Button size="sm" v="soft" icon={<ShieldAlert />} onClick={() => nav(`/provayder/akkreditatsiya?ariza=${ariza.id}`)}>Ariza {ariza.raqam} · <Holat h={ariza.holat} /></Button>}
              {v?.holat === 'tasdiqlangan' && <Button size="sm" v="secondary" icon={<Layers />} onClick={() => nav('/provayder/oqimlar?yangi=1&versiya=' + v.id)}>Shu dastur uchun oqim ochish</Button>}
            </div>
          </Card>

          {v?.holat === 'tasdiqlangan' && (
            <Card delay={0.08}>
              <CardH icon={<FlaskConical />} title="Qabul sinovi №4" sub="Provayder tasdiqlangan kreditni oʻzgartira olmasligini tekshirish" right={<Badge ton="brand">sinov</Badge>} />
              <Button v="danger" className="soft" size="sm" icon={<FlaskConical />} onClick={kreditSinov}>Kreditni oʻzgartirishga urinish (sinov)</Button>
              <div className="xs muted mt-8">Tasdiqlangan kredit {v.tasdiqlanganKredit} → {(v.tasdiqlanganKredit ?? 0) + 4} qilib saqlashga urinadi. Kutilgan natija: 403 va audit yozuvi.</div>
              {radAudit && (
                <Alert ton="err" title="403 — rad etildi va auditga yozildi">
                  <div className="xs mono mt-4">{sanaVaqt(radAudit.sana)} · {radAudit.fio} · {radAudit.amal} · natija: {radAudit.natija}</div>
                </Alert>
              )}
            </Card>
          )}

          {ds && (
            <Card delay={0.1}>
              <CardH icon={<History />} title="Versiyalar tarixi" sub={`${versiyalar.length} ta versiya`} />
              {versiyalar.map((x) => (
                <div key={x.id} className="li" style={{ cursor: 'pointer' }} onClick={() => setKorVer(x)}>
                  <div className="ic brand"><BookOpen /></div>
                  <div className="grow">
                    <div className="b">v{x.versiya} · {x.nomi}</div>
                    <div className="xs muted">{sana(x.yaratilgan)} · kredit {x.soralganKredit}{x.tasdiqlanganKredit !== undefined ? ` / ${x.tasdiqlanganKredit}` : ''}</div>
                  </div>
                  <Holat h={x.holat} />
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      <Modal open={!!korVer} onClose={() => setKorVer(undefined)} title={`v${korVer?.versiya} — ${korVer?.nomi}`} sub="Versiya pasporti (faqat oʻqish)">
        {korVer && (
          <DL
            items={[
              ['Holat', <Holat h={korVer.holat} />],
              ['Yaratilgan', sanaVaqt(korVer.yaratilgan)],
              ['Soat', `${korVer.soatNazariy + korVer.soatAmaliy} (nazariy ${korVer.soatNazariy}, amaliy ${korVer.soatAmaliy})`],
              ['Shakl', SHAKL[korVer.shakl]],
              ['Kredit', `soʻralgan ${korVer.soralganKredit} · tasdiqlangan ${korVer.tasdiqlanganKredit ?? '—'}`],
              ['Amal muddati', sana(korVer.amalMuddati)],
              ['Oqimlar', `${db.oqimlar.filter((o) => o.versiyaId === korVer.id).length} ta oqim shu versiyada`],
              ['Natijalar', korVer.natijalar.join('; ')],
            ]}
          />
        )}
      </Modal>
    </>
  )
}
