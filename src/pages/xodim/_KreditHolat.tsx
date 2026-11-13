import { useState } from 'react'
import { Calculator, HelpCircle } from 'lucide-react'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Alert, Bar, Button, Card, CardH, DL, Holat, Modal, Ring } from '@/ui'
import { sana } from '@/lib/format'

export function KreditHolat({ h }: { h: T.YillikHolat }) {
  const [ochiq, setOchiq] = useState(false)
  const Q = ({ l, v, izoh }: { l: string; v: string | number; izoh?: string }) => (
    <div className="card" style={{ padding: '12px 14px', boxShadow: 'none', background: 'var(--surface-2)' }}>
      <div className="xs muted">{l}</div>
      <div style={{ font: '800 22px/1.2 var(--font-head)' }}>{v}</div>
      {izoh && <div className="xs muted">{izoh}</div>}
    </div>
  )
  return (
    <Card>
      <CardH icon={<Calculator />} title={`${h.yil}-yil yillik holati`} sub={`Qoida versiyasi ${h.qoidaVersiya}`} right={<><Holat h={h.xavf} /><Button size="sm" v="ghost" icon={<HelpCircle />} onClick={() => setOchiq(true)}>Kreditlar qanday hisoblanadi</Button></>} />
      <div className="row wrap" style={{ gap: 24, alignItems: 'center' }}>
        <Ring v={h.X} max={h.T || 1} size={170} stroke={14}>
          <div className="center">
            <div style={{ font: '800 34px/1 var(--font-head)' }}>{h.X}</div>
            <div className="xs muted">/ {h.T} kredit</div>
            <div className="xs b mt-4" style={{ color: h.natija === 'bajarildi' ? 'var(--ok)' : 'var(--warn)' }}>{h.natija === 'bajarildi' ? 'Bajarildi' : `−${h.yetishmaydi}`}</div>
          </div>
        </Ring>
        <div className="grow col gap-12" style={{ minWidth: 240 }}>
          <div className="grid g4" style={{ gap: 10 }}>
            <Q l="Talab (T)" v={h.T} izoh={h.T !== h.Tasl ? `asl ${h.Tasl}, kamaytirilgan` : undefined} />
            <Q l="Toʻplangan (K)" v={h.K} />
            <Q l="Oʻtkazilgan (O)" v={h.O} />
            <Q l="Limitdan kesildi" v={h.limitKesildi ? `−${h.limitKesildi}` : 0} />
          </div>
          <div>
            <div className="row between small" style={{ marginBottom: 4 }}><span className="muted">Majburiy kurslar</span><b>{h.majburiy} / {h.majburiyKerak}</b></div>
            <Bar v={h.majburiy} max={h.majburiyKerak || 1} ton={h.majburiy >= h.majburiyKerak ? 'ok' : 'warn'} />
          </div>
          <div>
            <div className="row between small" style={{ marginBottom: 4 }}><span className="muted">Amaliy yoʻnalish</span><b>{h.amaliy} / {h.amaliyKerak}</b></div>
            <Bar v={h.amaliy} max={h.amaliyKerak || 1} ton={h.amaliy >= h.amaliyKerak ? 'ok' : 'warn'} />
          </div>
          <div className="row wrap gap-6 small">
            <span className="chip">Keyingi yilga oʻtkaziladi: <b>{h.otkaziladi}</b></span>
            <span className="chip">Yil oxirigacha: <b>{h.qolganKun} kun</b></span>
            {h.tekshiruvda > 0 && <span className="chip">Tekshiruvda: <b>{h.tekshiruvda}</b></span>}
            <Holat h={h.natija} />
          </div>
          {h.yetmaganUlushlar.length > 0 && <Alert ton="warn">Yetmayotgan ulushlar: {h.yetmaganUlushlar.join('; ')}. Katalogda shu turdagi kurslarni tanlang.</Alert>}
        </div>
      </div>
      <Tushuntirish open={ochiq} onClose={() => setOchiq(false)} h={h} />
    </Card>
  )
}

function Tushuntirish({ open, onClose, h }: { open: boolean; onClose: () => void; h: T.YillikHolat }) {
  const { db, shaxs } = useXodim()
  const q = db.qoidalar.find((x) => x.id === h.qoidaId)
  if (!q) return null
  const p = q.params
  return (
    <Modal open={open} onClose={onClose} title="Kreditlar qanday hisoblanadi" sub={`Qoida ${q.versiya}: ${q.nomi}`} size="lg" footer={<Button v="primary" onClick={onClose}>Tushunarli</Button>}>
      <div className="col gap-16">
        <DL items={[
          ['Meʼyoriy hujjat', `${q.hujjat.nomi} №${q.hujjat.raqam}, ${sana(q.hujjat.sana)}`],
          ['Amal qilish davri', `${sana(q.kuchgaKirish)} — ${q.tugash ? sana(q.tugash) : 'muddatsiz'}`],
          ['Yillik talab', `oliy maʼlumotli — ${p.talabOliy} kredit, oʻrta maʼlumotli — ${p.talabOrta} kredit (sizga: ${shaxs.daraja === 'oliy' ? p.talabOliy : p.talabOrta})`],
          ['Majburiy ulush', `talabning kamida ${Math.round(p.majburiyUlush * 100)}% i majburiy kurslardan`],
          ['Amaliy ulush', `talabning kamida ${Math.round(p.amaliyUlush * 100)}% i amaliy yoʻnalishdan`],
          ['Limitlar', `mustaqil taʼlim — yiliga ${p.mustaqilLimit} kreditgacha, konferensiyalar — ${p.konferensiyaLimit} kreditgacha; ortigʻi hisobga olinmaydi`],
          ['Oʻtkazish', `talab bajarilsa, ortiqcha kreditning T × ${Math.round(p.otkazishUlush * 100)}% gacha qismi keyingi yilga oʻtadi`],
          ['Hisobot yili', `${p.yilBoshi} dan ${p.yilOxiri} gacha`],
          ['Yangi xodim / istisno', `${p.yangiXodimProporsional ? 'yil oʻrtasida ishga kirganlarga talab proporsional kamayadi' : 'kamaytirilmaydi'}; dekret, uzoq kasallik — ${p.istisnoKamaytirish === 'toliq' ? 'toʻliq ozod' : 'proporsional kamaytiriladi'}`],
        ]} />
        <div className="code" style={{ fontSize: 14 }}>X = K − limitdan ortiq + O{'\n'}Talab bajarildi ⇔ X ≥ T va majburiy ≥ {Math.round(p.majburiyUlush * 100)}%·T va amaliy ≥ {Math.round(p.amaliyUlush * 100)}%·T</div>
        <Alert ton="info" title="Sizning misolingiz">
          X = {h.K} − {h.limitKesildi} + {h.O} = <b>{h.X}</b> kredit; talab T = {h.T}. Majburiy: {h.majburiy}/{h.majburiyKerak}, amaliy: {h.amaliy}/{h.amaliyKerak}. Natija: <b>{h.natija === 'bajarildi' ? 'talab bajarildi' : `${h.yetishmaydi} kredit yetishmaydi`}</b>.
        </Alert>
        <div className="xs muted">Kredit faqat Kredit xizmati tomonidan yoziladi: akkreditatsiyalangan provayderning tasdiqlangan natijasi, xorijiy kreditni tan olish qarori yoki tasdiqlangan tuzatish asosida. Hech kim balansni qoʻlda oʻzgartira olmaydi.</div>
      </div>
    </Modal>
  )
}
