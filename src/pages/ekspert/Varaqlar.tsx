import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardPen, Star, Send, FileText, Scale } from 'lucide-react'
import { Alert, Badge, Button, Card, CardH, Confirm, Empty, Field, Holat, Inp, Modal, PageHeader, Ring, Sel, Txt, cx } from '@/ui'
import * as A from '@/domain/amallar'
import { BAHOLASH_MEZONLARI } from '@/domain/malumotnoma'
import type * as T from '@/domain/types'
import { sana, sanaVaqt } from '@/lib/format'
import { ArizaTafsilot, TAVSIYA, VaraqKor, obyektNomi, useEkspert } from './_umumiy'

const BAHO_MATN = ['', 'Juda past', 'Past', 'Qoniqarli', 'Yaxshi', 'Aʼlo']

function Yulduz({ v, onChange }: { v: number; onChange: (n: number) => void }) {
  const [h, setH] = useState(0)
  return (
    <div className="row gap-4" role="radiogroup" onMouseLeave={() => setH(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button key={n} type="button" role="radio" aria-checked={v === n} aria-label={`${n} ball`} whileTap={{ scale: 0.85 }} onMouseEnter={() => setH(n)} onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: n <= (h || v) ? 'var(--amber-500)' : 'var(--border-strong)' }}>
          <Star size={24} fill={n <= (h || v) ? 'currentColor' : 'none'} />
        </motion.button>
      ))}
      <span className="xs muted" style={{ minWidth: 70 }}>{BAHO_MATN[h || v] || 'baholanmagan'}</span>
    </div>
  )
}

export default function EkspertVaraqlar() {
  const { db, e, arizalar, ozVaraq, amal, toast } = useEkspert()
  const [sp, setSp] = useSearchParams()
  const faol = arizalar.filter((a) => a.holat === 'ekspertiza')
  const a = faol.find((x) => x.id === sp.get('ariza'))
  const [m, setM] = useState<Record<string, number>>({})
  const [izoh, setIzoh] = useState<Record<string, string>>({})
  const [tavsiya, setTavsiya] = useState<T.EkspertizaVaraq['tavsiya']>('akkreditatsiya')
  const [xulosa, setXulosa] = useState('')
  const [tas, setTas] = useState(false)
  const [tafsil, setTafsil] = useState(false)

  useEffect(() => {
    const own = a ? ozVaraq(a) : undefined
    setM(own ? { ...own.mezonlar } : {})
    setIzoh({})
    setTavsiya(own?.tavsiya ?? 'akkreditatsiya')
    setXulosa(own?.xulosa ?? '')
  }, [a?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const baholangan = BAHOLASH_MEZONLARI.filter((x) => m[x.kod] >= 1).length
  const foiz = Math.round((BAHOLASH_MEZONLARI.reduce((s, x) => s + (m[x.kod] ?? 0), 0) / (BAHOLASH_MEZONLARI.length * 5)) * 100)
  const tayyor = baholangan === BAHOLASH_MEZONLARI.length && xulosa.trim().length > 0
  const topshirilgan = arizalar.filter((x) => ozVaraq(x))

  const topshir = () => {
    if (!a) return
    const qoshimcha = BAHOLASH_MEZONLARI.filter((x) => izoh[x.kod]?.trim()).map((x) => `• ${x.nomi}: ${izoh[x.kod].trim()}`)
    const r = amal((d, c) => {
      A.varaqTopshir(d, c, a.id, { mezonlar: Object.fromEntries(BAHOLASH_MEZONLARI.map((x) => [x.kod, m[x.kod] ?? 0])), tavsiya, xulosa: xulosa.trim() + (qoshimcha.length ? `\n\nMezonlar boʻyicha izohlar:\n${qoshimcha.join('\n')}` : '') })
      return true
    })
    if (r) {
      toast({ turi: 'ok', sarlavha: `${a.raqam}: varaq topshirildi`, matn: `Umumiy ball ${foiz}%. UKR markazi mutaxassisiga xabar yuborildi. Endi boshqa ekspert varaqlarini koʻrishingiz mumkin.` })
      setSp({})
    }
  }

  return (
    <>
      <PageHeader title="Baholash varaqlari" desc="Elektron ekspertiza varagʻi: 6 mezon boʻyicha 1–5 ball, umumiy foiz, tavsiya va xulosa. Ikki ekspert mustaqil baholaydi; farq katta boʻlsa uchinchi ekspert jalb qilinadi." source={`Manba: Ekspertiza varaqlari · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <Alert ton="warn" title="Ekspert xulosasi qaror emas">Varaq — tavsiya. Akkreditatsiya qarorini komissiya yoki vakolatli shaxs qabul qiladi.</Alert>

      {!e ? <Empty title="Ekspert reestrida yozuv topilmadi" /> : a ? (
        <div className="grid g-main mt-16">
          <Card>
            <CardH icon={<ClipboardPen />} title={`${a.raqam} · ${obyektNomi(db, a)}`} sub={`${A.provayder(db, a.providerId)?.nomi} · muddat ${sana(a.muddat)}`} right={<Button size="sm" v="ghost" icon={<FileText />} onClick={() => setTafsil(true)}>Ariza materiallari</Button>} />
            {ozVaraq(a) && <Alert ton="info">Siz bu arizaga varaq topshirgansiz ({sanaVaqt(ozVaraq(a)!.topshirilgan)}). Ekspertiza bosqichi tugaguncha qayta topshirish mumkin — oldingisi almashtiriladi.</Alert>}
            <div className="col gap-16 mt-12">
              {BAHOLASH_MEZONLARI.map((x, i) => (
                <div key={x.kod} className={cx('card')} style={{ padding: 14, borderColor: m[x.kod] ? 'var(--ok-border)' : undefined }}>
                  <div className="row wrap between">
                    <div className="b small">{i + 1}. {x.nomi}</div>
                    <Yulduz v={m[x.kod] ?? 0} onChange={(n) => setM({ ...m, [x.kod]: n })} />
                  </div>
                  <Inp className="mt-8" value={izoh[x.kod] ?? ''} onChange={(ev) => setIzoh({ ...izoh, [x.kod]: ev.target.value })} placeholder="Izoh (ixtiyoriy): asos, kamchilik, tavsiya" aria-label={`${x.nomi} izohi`} />
                </div>
              ))}
              <Field label="Tavsiya" req>
                <Sel value={tavsiya} onChange={(ev) => setTavsiya(ev.target.value as T.EkspertizaVaraq['tavsiya'])} options={Object.entries(TAVSIYA).map(([v, l]) => ({ v, l }))} />
              </Field>
              <Field label="Xulosa" req help="Kredit qiymatining asosliligi, kuchli va zaif tomonlar">
                <Txt rows={5} value={xulosa} onChange={(ev) => setXulosa(ev.target.value)} placeholder="Masalan: Dastur dolzarb, oʻquv natijalari aniq. Soʻralgan kredit asosli…" />
              </Field>
            </div>
            <div className="card-f row between wrap">
              <Button v="ghost" onClick={() => setSp({})}>Roʻyxatga qaytish</Button>
              <Button v="primary" icon={<Send />} disabled={!tayyor} onClick={() => setTas(true)}>Varaqni topshirish</Button>
            </div>
          </Card>
          <div className="col gap-16">
            <Card delay={0.05}>
              <CardH icon={<Scale />} title="Umumiy baho" />
              <div className="col" style={{ alignItems: 'center' }}>
                <Ring v={foiz} max={100} size={150}><div className="center"><div className="stat-big">{foiz}%</div><div className="xs muted">{baholangan}/{BAHOLASH_MEZONLARI.length} mezon</div></div></Ring>
                <Badge ton={tavsiya === 'rad' ? 'err' : tavsiya === 'akkreditatsiya' ? 'ok' : 'warn'}>{TAVSIYA[tavsiya]}</Badge>
                {!tayyor && <div className="xs muted center">Barcha mezonlarni baholang va xulosa yozing — keyin topshirish ochiladi.</div>}
              </div>
            </Card>
            <Alert ton="info" title="Mustaqillik">Boshqa ekspert varagʻi siz topshirgunga qadar yashirin. Manfaatlar toʻqnashuvi yuzaga kelsa — baholamang va UKR markaziga xabar bering.</Alert>
          </div>
        </div>
      ) : (
        <div className="col gap-16 mt-16">
          <Card>
            <CardH icon={<ClipboardPen />} title="Toʻldirilishi kerak" sub="Ekspertiza bosqichidagi arizalar" />
            {faol.length ? faol.map((x) => (
              <div key={x.id} className="li">
                <div className={`ic ${ozVaraq(x) ? 'ok' : 'warn'}`}><ClipboardPen /></div>
                <div className="grow"><div className="b small">{obyektNomi(db, x)}</div><div className="xs muted"><span className="mono">{x.raqam}</span> · muddat {sana(x.muddat)}</div></div>
                <Button size="sm" v={ozVaraq(x) ? 'soft' : 'primary'} onClick={() => setSp({ ariza: x.id })}>{ozVaraq(x) ? 'Qayta koʻrib chiqish' : 'Toʻldirish'}</Button>
              </div>
            )) : <Empty title="Ekspertiza bosqichidagi ariza yoʻq">Yangi ariza biriktirilganda xabar keladi.</Empty>}
          </Card>
          <Card delay={0.05}>
            <CardH icon={<Star />} title="Topshirilgan varaqlar" sub="Faqat oʻqish" />
            {topshirilgan.length ? (
              <div className="grid g2">
                {topshirilgan.map((x) => (
                  <div key={x.id} className="card" style={{ padding: 14 }}>
                    <div className="row between mb-8"><div><div className="b small">{obyektNomi(db, x)}</div><div className="xs muted mono">{x.raqam}</div></div><Holat h={x.holat} /></div>
                    <VaraqKor v={ozVaraq(x)!} />
                  </div>
                ))}
              </div>
            ) : <Empty title="Hali varaq topshirilmagan" />}
          </Card>
        </div>
      )}

      <Confirm open={tas} onClose={() => setTas(false)} title="Ekspertiza varagʻini topshirish" okText="Topshirish" eri onOk={() => { setTas(false); topshir() }}>
        <p className="small sub">Umumiy ball: <b>{foiz}%</b> · tavsiya: <b>{TAVSIYA[tavsiya]}</b>. Varaq UKR markazi mutaxassisiga yuboriladi. Ekspert xulosasi qaror emas.</p>
      </Confirm>
      <Modal drawer open={tafsil && !!a} onClose={() => setTafsil(false)} title={a ? `${a.raqam} materiallari` : ''}>{a && <ArizaTafsilot a={a} />}</Modal>
    </>
  )
}
