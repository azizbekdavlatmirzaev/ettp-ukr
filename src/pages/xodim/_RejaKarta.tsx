import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Lock, Pencil, Plus, Save, Send, Trash2 } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Alert, Badge, Bar, Button, Card, CardH, Confirm, Holat, Sel, Timeline } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { KURS_TURI, YONALISH } from '@/lib/holat'
import { RejaPicker } from './_RejaPicker'
import { useBajar } from './_bajar'

const CHORAK = ['1-chorak', '2-chorak', '3-chorak', '4-chorak']

export function RejaKarta({ r }: { r: T.Reja }) {
  const { db, shaxs, bugun, toast } = useXodim()
  const bajar = useBajar()
  const [draft, setDraft] = useState<T.RejaBandi[]>(r.bandlar)
  const [tahrir, setTahrir] = useState(false)
  const [picker, setPicker] = useState(false)
  const [yuborQ, setYuborQ] = useState(false)
  useEffect(() => setDraft(r.bandlar), [r.bandlar])
  const h = useMemo(() => A.xodimYillik(db, shaxs.id, r.yil, bugun), [db, shaxs.id, r.yil, bugun])
  const jami = draft.reduce((a, b) => a + b.kredit, 0)
  const maj = draft.filter((b) => b.kursTuri === 'majburiy').reduce((a, b) => a + b.kredit, 0)
  const am = draft.filter((b) => b.yonalish === 'amaliy').reduce((a, b) => a + b.kredit, 0)
  const ozgardi = JSON.stringify(draft) !== JSON.stringify(r.bandlar)
  const yuborsaBoladi = ['qoralama', 'qaytarildi'].includes(r.holat)
  const tahrirBoladi = !['yuborildi', 'yopildi'].includes(r.holat)
  const muassasa = db.muassasalar.find((m) => m.id === r.muassasaId)

  const saqla = () => {
    if (bajar(A.rejaBandlar, r.id, draft)) {
      toast({ turi: 'ok', matn: ['qoralama', 'qaytarildi'].includes(r.holat) ? 'Reja saqlandi.' : `Reja oʻzgartirildi — yangi versiya v${r.versiya + 1} qoralama sifatida yaratildi.` })
      setTahrir(false)
    }
  }
  const yubor = () => {
    setYuborQ(false)
    if (ozgardi && !bajar(A.rejaBandlar, r.id, draft)) return
    if (bajar(A.rejaYubor, r.id)) {
      toast({ turi: 'ok', sarlavha: 'Reja yuborildi', matn: `${muassasa?.nomi ?? 'Ish beruvchi'} tasdiqlashi kutilmoqda.` })
      setTahrir(false)
    }
  }
  const tl = [
    ...r.oldingiVersiyalar.map((o) => ({ h: <span className="row gap-6">v{o.versiya} · <Holat h={o.holat} /></span>, m: <>{sana(o.sana)}{o.kim ? ` · ${o.kim}` : ''}{o.izoh ? <div className="small mt-4">«{o.izoh}»</div> : null}</>, ton: (o.holat === 'qaytarildi' ? 'err' : 'muted') as 'err' | 'muted' })),
    { h: <span className="row gap-6">v{r.versiya} (joriy) · <Holat h={r.holat} /></span>, m: <>{sanaVaqt(r.yangilangan)}{r.izoh ? <div className="small mt-4">Ish beruvchi izohi: «{r.izoh}»</div> : null}</>, ton: (r.holat === 'qaytarildi' ? 'err' : ['tasdiqlandi', 'bajarilmoqda'].includes(r.holat) ? 'ok' : 'warn') as 'err' | 'ok' | 'warn' },
  ]

  return (
    <Card>
      <CardH title={<span className="row wrap gap-6">{r.yil}-yil rivojlanish rejasi <Holat h={r.holat} /></span>} sub={`Versiya ${r.versiya} · ${muassasa?.nomi ?? ''} (asosiy ish beruvchi)`} right={
        <>
          {tahrirBoladi && !tahrir && <Button size="sm" v="secondary" icon={<Pencil />} onClick={() => setTahrir(true)}>Tahrirlash</Button>}
          {tahrir && <Button size="sm" v="ghost" onClick={() => { setDraft(r.bandlar); setTahrir(false) }}>Bekor</Button>}
          {tahrir && <Button size="sm" v="secondary" icon={<Save />} disabled={!ozgardi} onClick={saqla}>Saqlash</Button>}
          {yuborsaBoladi && <Button size="sm" v="primary" icon={<Send />} onClick={() => setYuborQ(true)}>Yuborish</Button>}
        </>
      } />
      {r.holat === 'qaytarildi' && <Alert ton="err" title="Reja ish beruvchi tomonidan qaytarildi">{r.izoh} — rejani tuzatib, qayta yuboring.</Alert>}
      {r.holat === 'yuborildi' && <Alert ton="info" title="Tasdiqlash kutilmoqda">Reja ish beruvchiga yuborilgan. Koʻrib chiqilguncha tahrirlab boʻlmaydi.</Alert>}
      {tahrir && ['tasdiqlandi', 'bajarilmoqda'].includes(r.holat) && <Alert ton="warn">Tasdiqlangan rejani oʻzgartirish yangi versiya yaratadi va qayta tasdiqlash talab qilinadi.</Alert>}

      <div className="grid g3 mt-16" style={{ gap: 14 }}>
        {[
          { l: 'Jami reja / talab', v: jami, m: h.T },
          { l: 'Majburiy', v: maj, m: h.majburiyKerak },
          { l: 'Amaliy', v: am, m: h.amaliyKerak },
        ].map((x) => (
          <div key={x.l}>
            <div className="row between small" style={{ marginBottom: 4 }}><span className="muted">{x.l}</span><b>{x.v} / {x.m}</b></div>
            <Bar v={x.v} max={x.m || 1} ton={x.v >= x.m ? 'ok' : 'warn'} />
          </div>
        ))}
      </div>

      <div className="mt-16">
        <AnimatePresence initial={false}>
          {draft.map((b) => (
            <motion.div key={b.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="li wrap" style={{ flexWrap: 'wrap' }}>
              <span className={`ic ${b.bajarildi ? 'ok' : 'brand'}`}>{b.bajarildi ? <CheckCircle2 /> : b.majburiyModul ? <Lock /> : <span className="b small">{b.kredit}</span>}</span>
              <div className="grow" style={{ minWidth: 180 }}>
                <div className="b small">{b.nomi}</div>
                <div className="row wrap gap-6 mt-4">
                  <Badge ton={b.kursTuri === 'majburiy' ? 'brand' : 'teal'}>{KURS_TURI[b.kursTuri]}</Badge>
                  <Badge ton={b.yonalish === 'amaliy' ? 'warn' : 'info'}>{YONALISH[b.yonalish]}</Badge>
                  <span className="xs muted">{b.kredit} kredit</span>
                  {b.majburiyModul && <span className="xs muted">· majburiy modul</span>}
                  {b.bajarildi && <Badge ton="ok">Bajarildi</Badge>}
                </div>
              </div>
              {tahrir ? (
                <div className="row gap-6">
                  <Sel value={b.muddat} onChange={(e) => setDraft(draft.map((x) => (x.id === b.id ? { ...x, muddat: e.target.value } : x)))} options={CHORAK} style={{ width: 130, height: 34, minHeight: 34 }} aria-label="Chorak" />
                  <Button size="xs" v="ghost" icon={<Trash2 />} disabled={b.majburiyModul || b.bajarildi} title={b.majburiyModul ? 'Majburiy modulni olib tashlab boʻlmaydi' : 'Olib tashlash'} onClick={() => setDraft(draft.filter((x) => x.id !== b.id))} />
                </div>
              ) : <span className="tag">{b.muddat}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
        {tahrir && <Button v="soft" size="sm" icon={<Plus />} className="mt-12" onClick={() => setPicker(true)}>Katalogdan kurs qoʻshish</Button>}
      </div>

      <div className="divider" />
      <div className="b small mb-12">Holat tarixi va ish beruvchi izohlari</div>
      <Timeline items={tl} />

      <RejaPicker open={picker} onClose={() => setPicker(false)} mavjud={draft.map((b) => b.versiyaId ?? '')} onTanla={(v) => {
        setDraft([...draft, { id: A.uid('RB'), nomi: v.nomi, versiyaId: v.id, kredit: v.tasdiqlanganKredit ?? v.soralganKredit, kursTuri: v.kursTuri, yonalish: v.yonalish, muddat: '1-chorak', majburiyModul: false, bajarildi: false }])
        setPicker(false)
        toast({ turi: 'info', matn: `«${v.nomi}» rejaga qoʻshildi. Saqlashni unutmang.` })
      }} />
      <Confirm open={yuborQ} onClose={() => setYuborQ(false)} onOk={yubor} title="Rejani tasdiqlashga yuborish" okText="Yuborish">
        <p className="small">Reja asosiy ish beruvchiga ({muassasa?.nomi}) yuboriladi. Jami {jami} kredit (talab {h.T}).</p>
        {jami < h.T && <Alert ton="warn">Rejadagi kreditlar yillik talabdan kam — ish beruvchi rejani qaytarishi mumkin.</Alert>}
      </Confirm>
    </Card>
  )
}
