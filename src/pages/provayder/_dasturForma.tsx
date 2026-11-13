// Dastur pasporti ustasi: forma turi, tekshiruv va 1–3 qadamlar.
import { Plus, Trash2, CheckSquare } from 'lucide-react'
import { Button, Field, Inp, Sel, Txt, Check, Alert, Seg } from '@/ui'
import { MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { TADBIR, KURS_TURI } from '@/lib/holat'
import type * as T from '@/domain/types'

export interface Forma {
  nomi: string
  kod: string
  mutaxassisliklar: string[]
  tinglovchi: T.DasturVersiya['tinglovchi']
  maqsad: string
  natijalar: string[]
  soatNazariy: number
  soatAmaliy: number
  shakl: T.Shakl
  tadbirTuri: T.TadbirTuri
  kursTuri: T.KursTuri
  yonalish: T.Yonalish
  baholash: string[]
  oqituvchilar: string[]
  klinikBaza: string
  til: string
  soralganKredit: number
  darslar: T.Dars[]
}

export const QADAMLAR = ['Asosiy', 'Mutaxassisliklar va tinglovchi', 'Mazmun va natijalar', 'Soat, shakl, baholash', 'Oʻqituvchilar va baza', 'Materiallar', 'Koʻrib chiqish']

export const bosh = (): Forma => ({
  nomi: '', kod: '', mutaxassisliklar: [], tinglovchi: 'oliy', maqsad: '', natijalar: ['', ''], soatNazariy: 12, soatAmaliy: 0, shakl: 'oflayn', tadbirTuri: 'kurs', kursTuri: 'tanlov', yonalish: 'nazariy',
  baholash: ['test'], oqituvchilar: [''], klinikBaza: '', til: 'oʻzbek', soralganKredit: 4, darslar: [{ id: 'L1', nomi: 'Kirish va oʻquv maqsadlari', turi: 'video', davomiylik: 15 }],
})

export const versiyadan = (v: T.DasturVersiya, kod: string): Forma => ({
  nomi: v.nomi, kod, mutaxassisliklar: [...v.mutaxassisliklar], tinglovchi: v.tinglovchi, maqsad: v.maqsad, natijalar: [...v.natijalar], soatNazariy: v.soatNazariy, soatAmaliy: v.soatAmaliy, shakl: v.shakl,
  tadbirTuri: v.tadbirTuri, kursTuri: v.kursTuri, yonalish: v.yonalish, baholash: [...v.baholash], oqituvchilar: v.oqituvchilar.length ? [...v.oqituvchilar] : [''], klinikBaza: v.klinikBaza ?? '', til: v.til,
  soralganKredit: v.soralganKredit, darslar: v.darslar.map((d) => ({ ...d })),
})

/** Amalga yuboriladigan maʼlumot — tasdiqlangan kredit YOʻQ (provayder uni oʻzgartira olmaydi). */
export const payload = (f: Forma) => ({
  nomi: f.nomi.trim(), kod: f.kod.trim() || undefined, mutaxassisliklar: f.mutaxassisliklar, tinglovchi: f.tinglovchi, maqsad: f.maqsad.trim(), natijalar: f.natijalar.map((x) => x.trim()).filter(Boolean),
  soatNazariy: f.soatNazariy, soatAmaliy: f.soatAmaliy, shakl: f.shakl, tadbirTuri: f.tadbirTuri, kursTuri: f.kursTuri, yonalish: f.yonalish, baholash: f.baholash,
  oqituvchilar: f.oqituvchilar.map((x) => x.trim()).filter(Boolean), klinikBaza: f.klinikBaza.trim() || undefined, til: f.til, soralganKredit: f.soralganKredit, darslar: f.darslar,
})

export function tekshir(f: Forma, q: number): Record<string, string> {
  const e: Record<string, string> = {}
  if (q === 0) {
    if (f.nomi.trim().length < 5) e.nomi = 'Dastur nomi kamida 5 belgidan iborat boʻlsin'
  }
  if (q === 1 && !f.mutaxassisliklar.length) e.mut = 'Kamida bitta mutaxassislikni tanlang'
  if (q === 2) {
    if (f.maqsad.trim().length < 20) e.maqsad = 'Maqsadni batafsilroq yozing (kamida 20 belgi)'
    if (f.natijalar.filter((x) => x.trim()).length < 2) e.natijalar = 'Kamida 2 ta oʻquv natijasini kiriting'
  }
  if (q === 3) {
    if (f.soatNazariy + f.soatAmaliy <= 0) e.soat = 'Umumiy soat 0 dan katta boʻlsin'
    if (f.yonalish === 'amaliy' && f.soatAmaliy <= 0) e.soat = 'Amaliy yoʻnalishdagi dasturda amaliy soat boʻlishi shart'
    if (!(f.soralganKredit > 0)) e.kredit = 'Soʻralgan kredit musbat son boʻlsin'
    if (!f.baholash.length) e.baholash = 'Kamida bitta baholash usulini tanlang'
  }
  if (q === 4) {
    if (!f.oqituvchilar.some((x) => x.trim())) e.oqituvchilar = 'Kamida bitta oʻqituvchini kiriting'
    if (f.soatAmaliy > 0 && !f.klinikBaza.trim()) e.baza = 'Amaliy mashgʻulotlar uchun klinik baza / simulyatsiya zalini kiriting'
  }
  if (q === 5) {
    if (!f.darslar.length) e.darslar = 'Kamida bitta material qoʻshing'
    else if (f.darslar.some((d) => !d.nomi.trim() || !(d.davomiylik > 0))) e.darslar = 'Har bir materialning nomi va davomiyligi (daqiqa) boʻlsin'
  }
  return e
}

export interface QProps { f: Forma; set: (p: Partial<Forma>) => void; e: Record<string, string>; ro: boolean }

export function Qadam0({ f, set, e, ro }: QProps) {
  return (
    <div className="form-grid">
      <Field label="Dastur nomi" req err={e.nomi} full>
        <Inp value={f.nomi} disabled={ro} bad={!!e.nomi} onChange={(x) => set({ nomi: x.target.value })} placeholder="Masalan: Oʻtkir koronar sindrom: zamonaviy yondashuvlar" />
      </Field>
      <Field label="Ichki kod" help="Boʻsh qoldirilsa avtomatik beriladi">
        <Inp value={f.kod} disabled={ro || !!f.kod} onChange={(x) => set({ kod: x.target.value })} placeholder="P01-1xx" />
      </Field>
      <Field label="Tadbir turi" req>
        <Sel value={f.tadbirTuri} disabled={ro} onChange={(x) => set({ tadbirTuri: x.target.value as T.TadbirTuri })} options={Object.entries(TADBIR).map(([v, l]) => ({ v, l }))} />
      </Field>
      <Field label="Kurs turi" req help="Majburiy kurslar yillik majburiy ulushga kiradi">
        <Seg id="kt" value={f.kursTuri} onChange={(v) => !ro && set({ kursTuri: v })} items={Object.entries(KURS_TURI).map(([v, l]) => ({ v: v as T.KursTuri, l }))} />
      </Field>
      <Field label="Oʻqitish tili" req>
        <Sel value={f.til} disabled={ro} onChange={(x) => set({ til: x.target.value })} options={['oʻzbek', 'rus', 'ingliz', 'qoraqalpoq']} />
      </Field>
    </div>
  )
}

export function Qadam1({ f, set, e, ro }: QProps) {
  const roy = MUTAXASSISLIKLAR.filter((m) => f.tinglovchi === 'barchasi' || m.daraja === f.tinglovchi)
  const tog = (id: string) => set({ mutaxassisliklar: f.mutaxassisliklar.includes(id) ? f.mutaxassisliklar.filter((x) => x !== id) : [...f.mutaxassisliklar, id] })
  return (
    <div className="col gap-16">
      <Field label="Tinglovchi toifasi" req help="Reestrdagi maʼlumot darajasi bilan solishtiriladi — mos boʻlmagan xodim yozila olmaydi">
        <Seg id="tt" value={f.tinglovchi} onChange={(v) => !ro && set({ tinglovchi: v, mutaxassisliklar: f.mutaxassisliklar.filter((id) => v === 'barchasi' || MUTAXASSISLIKLAR.find((m) => m.id === id)?.daraja === v) })} items={[{ v: 'oliy' as const, l: 'Oliy maʼlumotli' }, { v: 'orta' as const, l: 'Oʻrta maʼlumotli' }, { v: 'barchasi' as const, l: 'Barchasi' }]} />
      </Field>
      <div>
        <div className="row between mb-8">
          <span className="lbl-t b small">Mutaxassisliklar <span className="req" style={{ color: 'var(--err)' }}>*</span> · {f.mutaxassisliklar.length} ta tanlandi</span>
          {!ro && (
            <Button size="xs" v="ghost" icon={<CheckSquare />} onClick={() => set({ mutaxassisliklar: f.mutaxassisliklar.length === roy.length ? [] : roy.map((m) => m.id) })}>
              {f.mutaxassisliklar.length === roy.length ? 'Tozalash' : 'Hammasini tanlash'}
            </Button>
          )}
        </div>
        <div className="grid g3" style={{ gap: 6 }}>
          {roy.map((m) => (
            <Check key={m.id} label={<span className="small">{m.nomi} <span className="xs muted">· {m.guruh}</span></span>} checked={f.mutaxassisliklar.includes(m.id)} disabled={ro} onChange={() => tog(m.id)} />
          ))}
        </div>
        {e.mut && <Alert ton="err">{e.mut}</Alert>}
      </div>
    </div>
  )
}

export function Qadam2({ f, set, e, ro }: QProps) {
  return (
    <div className="col gap-16">
      <Field label="Dastur maqsadi" req err={e.maqsad}>
        <Txt rows={3} value={f.maqsad} disabled={ro} onChange={(x) => set({ maqsad: x.target.value })} placeholder="Tinglovchilarning … boʻyicha bilim va koʻnikmalarini takomillashtirish" />
      </Field>
      <div className="col gap-6">
        <span className="b small">Oʻquv natijalari (tinglovchi kurs oxirida nimani bajara oladi) <span style={{ color: 'var(--err)' }}>*</span></span>
        {f.natijalar.map((n, i) => (
          <div key={i} className="row">
            <span className="tag">{i + 1}</span>
            <Inp value={n} disabled={ro} onChange={(x) => set({ natijalar: f.natijalar.map((y, k) => (k === i ? x.target.value : y)) })} placeholder="Masalan: Diagnostik algoritmni qoʻllash" />
            {!ro && <Button v="ghost" size="sm" aria-label="Oʻchirish" icon={<Trash2 />} onClick={() => set({ natijalar: f.natijalar.filter((_, k) => k !== i) })} />}
          </div>
        ))}
        {e.natijalar && <span className="errt small" style={{ color: 'var(--err)' }}>{e.natijalar}</span>}
        {!ro && <div><Button size="sm" v="soft" icon={<Plus />} onClick={() => set({ natijalar: [...f.natijalar, ''] })}>Natija qoʻshish</Button></div>}
      </div>
    </div>
  )
}
