// Dastur pasporti ustasi: 4–7 qadamlar.
import { Plus, Trash2, Lock, ArrowUp, ArrowDown } from 'lucide-react'
import { Button, Field, Inp, Sel, Check, Alert, Seg, RO, DL, Badge } from '@/ui'
import { SHAKL, TADBIR, KURS_TURI, YONALISH } from '@/lib/holat'
import { mutNomi } from '@/shared/hooks'
import type * as T from '@/domain/types'
import { BAHO_TURLARI } from './_umumiy'
import { QADAMLAR, tekshir, type QProps } from './_dasturForma'

const DARS_TURI: { v: T.Dars['turi']; l: string }[] = [
  { v: 'video', l: 'Video' }, { v: 'pdf', l: 'PDF material' }, { v: 'vebinar', l: 'Vebinar' }, { v: 'topshiriq', l: 'Topshiriq' }, { v: 'test', l: 'Test' },
]

export function Qadam3({ f, set, e, ro, tasdiq }: QProps & { tasdiq?: number }) {
  const son = (s: string) => Math.max(0, Number(s) || 0)
  return (
    <div className="form-grid">
      <Field label="Nazariy soat" req err={e.soat}>
        <Inp type="number" min={0} value={f.soatNazariy} disabled={ro} onChange={(x) => set({ soatNazariy: son(x.target.value) })} />
      </Field>
      <Field label="Amaliy soat" req>
        <Inp type="number" min={0} value={f.soatAmaliy} disabled={ro} onChange={(x) => set({ soatAmaliy: son(x.target.value) })} />
      </Field>
      <Field label="Oʻqitish shakli" req>
        <Seg id="shakl" value={f.shakl} onChange={(v) => !ro && set({ shakl: v })} items={Object.entries(SHAKL).map(([v, l]) => ({ v: v as T.Shakl, l }))} />
      </Field>
      <Field label="Kredit yoʻnalishi" req help="Amaliy kreditlar yillik amaliy ulushga kiradi">
        <Seg id="yon" value={f.yonalish} onChange={(v) => !ro && set({ yonalish: v })} items={Object.entries(YONALISH).map(([v, l]) => ({ v: v as T.Yonalish, l }))} />
      </Field>
      <Field label="Soʻralgan kredit" req err={e.kredit} help="Ekspertiza va komissiya asosida tasdiqlanadi">
        <Inp type="number" min={1} value={f.soralganKredit} disabled={ro} onChange={(x) => set({ soralganKredit: son(x.target.value) })} />
      </Field>
      <Field label="Tasdiqlangan kredit" help="Faqat akkreditatsiya qarori bilan belgilanadi. Provayder oʻzgartira olmaydi — oʻzgartirish faqat qayta akkreditatsiya orqali.">
        <RO icon={<Lock size={15} />}>{tasdiq !== undefined ? <b>{tasdiq} kredit</b> : 'Hali tasdiqlanmagan'} <span className="xs muted" style={{ marginLeft: 'auto' }}>faqat oʻqish</span></RO>
      </Field>
      <Field label="Baholash usullari" req err={e.baholash} full>
        <div className="row wrap gap-16">
          {BAHO_TURLARI.map((b) => (
            <Check key={b.v} label={b.l} checked={f.baholash.includes(b.v)} disabled={ro} onChange={() => set({ baholash: f.baholash.includes(b.v) ? f.baholash.filter((x) => x !== b.v) : [...f.baholash, b.v] })} />
          ))}
        </div>
      </Field>
    </div>
  )
}

export function Qadam4({ f, set, e, ro }: QProps) {
  return (
    <div className="col gap-16">
      <div className="col gap-6">
        <span className="b small">Oʻqituvchilar (F.I.Sh., ilmiy daraja) <span style={{ color: 'var(--err)' }}>*</span></span>
        {f.oqituvchilar.map((o, i) => (
          <div key={i} className="row">
            <Inp value={o} disabled={ro} onChange={(x) => set({ oqituvchilar: f.oqituvchilar.map((y, k) => (k === i ? x.target.value : y)) })} placeholder="prof. Rahimov B." />
            {!ro && <Button v="ghost" size="sm" aria-label="Oʻchirish" icon={<Trash2 />} onClick={() => set({ oqituvchilar: f.oqituvchilar.filter((_, k) => k !== i) })} />}
          </div>
        ))}
        {e.oqituvchilar && <span className="small" style={{ color: 'var(--err)' }}>{e.oqituvchilar}</span>}
        {!ro && <div><Button size="sm" v="soft" icon={<Plus />} onClick={() => set({ oqituvchilar: [...f.oqituvchilar, ''] })}>Oʻqituvchi qoʻshish</Button></div>}
      </div>
      <Field label="Klinik baza / simulyatsiya zali" req={f.soatAmaliy > 0} err={e.baza} help="Amaliy mashgʻulotlar oʻtkaziladigan joy (shartnoma akkreditatsiya arizasiga ilova qilinadi)">
        <Inp value={f.klinikBaza} disabled={ro} onChange={(x) => set({ klinikBaza: x.target.value })} placeholder="Masalan: TXKRI simulyatsiya zali" />
      </Field>
    </div>
  )
}

export function Qadam5({ f, set, e, ro }: QProps) {
  const upd = (i: number, p: Partial<T.Dars>) => set({ darslar: f.darslar.map((d, k) => (k === i ? { ...d, ...p } : d)) })
  const kochir = (i: number, j: number) => {
    if (j < 0 || j >= f.darslar.length) return
    const a = [...f.darslar]
    ;[a[i], a[j]] = [a[j], a[i]]
    set({ darslar: a })
  }
  const jami = f.darslar.reduce((a, d) => a + (d.davomiylik || 0), 0)
  return (
    <div className="col gap-10">
      <div className="row between wrap">
        <span className="b small">Darslar va materiallar · {f.darslar.length} ta · {Math.round(jami / 6) / 10} soat</span>
        {!ro && <Button size="sm" v="soft" icon={<Plus />} onClick={() => set({ darslar: [...f.darslar, { id: `L${Date.now().toString(36)}`, nomi: '', turi: 'video', davomiylik: 20 }] })}>Material qoʻshish</Button>}
      </div>
      {f.darslar.map((d, i) => (
        <div key={d.id} className="card" style={{ padding: 12 }}>
          <div className="row wrap">
            <span className="tag">{i + 1}</span>
            <Inp style={{ flex: '2 1 220px' }} value={d.nomi} disabled={ro} onChange={(x) => upd(i, { nomi: x.target.value })} placeholder="Material nomi" aria-label="Material nomi" />
            <Sel style={{ flex: '1 1 130px' }} value={d.turi} disabled={ro} onChange={(x) => upd(i, { turi: x.target.value as T.Dars['turi'] })} options={DARS_TURI} aria-label="Turi" />
            <Inp style={{ flex: '0 1 100px' }} type="number" min={1} value={d.davomiylik} disabled={ro} onChange={(x) => upd(i, { davomiylik: Math.max(0, Number(x.target.value) || 0) })} aria-label="Davomiylik (daqiqa)" title="Davomiylik, daqiqa" />
            {!ro && (
              <div className="row gap-4">
                <Button v="ghost" size="xs" aria-label="Yuqoriga" icon={<ArrowUp />} onClick={() => kochir(i, i - 1)} />
                <Button v="ghost" size="xs" aria-label="Pastga" icon={<ArrowDown />} onClick={() => kochir(i, i + 1)} />
                <Button v="ghost" size="xs" aria-label="Oʻchirish" icon={<Trash2 />} onClick={() => set({ darslar: f.darslar.filter((_, k) => k !== i) })} />
              </div>
            )}
          </div>
        </div>
      ))}
      {e.darslar && <Alert ton="err">{e.darslar}</Alert>}
      <div className="xs muted">Material koʻrish kredit bermaydi — faqat progress sifatida hisoblanadi. Kredit tasdiqlangan yakuniy natija asosida yoziladi.</div>
    </div>
  )
}

export function Qadam6({ f, tasdiq, otish }: QProps & { tasdiq?: number; otish: (q: number) => void }) {
  const xatolar = [0, 1, 2, 3, 4, 5].map((q) => ({ q, e: Object.values(tekshir(f, q)) })).filter((x) => x.e.length)
  return (
    <div className="col gap-16">
      {xatolar.length ? (
        <Alert ton="warn" title="Toʻldirilmagan bosqichlar bor">
          {xatolar.map((x) => (
            <div key={x.q} className="row wrap gap-6 mt-4">
              <b>{QADAMLAR[x.q]}:</b> {x.e.join('; ')} <Button size="xs" v="ghost" onClick={() => otish(x.q)}>Tuzatish</Button>
            </div>
          ))}
        </Alert>
      ) : (
        <Alert ton="ok" title="Pasport toʻliq">Qoralamani saqlang va akkreditatsiyaga yuboring.</Alert>
      )}
      <DL
        items={[
          ['Nomi', f.nomi || '—'],
          ['Tadbir / kurs turi', `${TADBIR[f.tadbirTuri]} · ${KURS_TURI[f.kursTuri]} · ${f.til}`],
          ['Tinglovchi', f.tinglovchi === 'barchasi' ? 'Barcha' : f.tinglovchi === 'oliy' ? 'Oliy maʼlumotli' : 'Oʻrta maʼlumotli'],
          ['Mutaxassisliklar', <span className="row wrap gap-4">{f.mutaxassisliklar.map((m) => <span key={m} className="tag">{mutNomi(m)}</span>)}</span>],
          ['Maqsad', f.maqsad || '—'],
          ['Oʻquv natijalari', f.natijalar.filter(Boolean).join('; ') || '—'],
          ['Soat', `${f.soatNazariy + f.soatAmaliy} (nazariy ${f.soatNazariy}, amaliy ${f.soatAmaliy}) · ${SHAKL[f.shakl]} · ${YONALISH[f.yonalish]}`],
          ['Baholash', f.baholash.map((b) => BAHO_TURLARI.find((x) => x.v === b)?.l ?? b).join(', ')],
          ['Kredit', <span className="row wrap gap-6">soʻralgan {f.soralganKredit} {tasdiq !== undefined && <Badge ton="ok"><Lock size={11} /> tasdiqlangan {tasdiq}</Badge>}</span>],
          ['Oʻqituvchilar', f.oqituvchilar.filter(Boolean).join(', ') || '—'],
          ['Klinik baza', f.klinikBaza || '—'],
          ['Materiallar', `${f.darslar.length} ta`],
        ]}
      />
    </div>
  )
}
