import { Filter, RotateCcw } from 'lucide-react'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import * as A from '@/domain/amallar'
import { HUDUDLAR, MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { Button, Card, Check, Field, Inp, Sel } from '@/ui'
import { MOLIYA, SHAKL } from '@/lib/holat'

export interface KFiltr {
  mut: string
  kursTuri: string
  yonalish: string
  shakl: string
  kMin: string
  kMax: string
  prov: string
  hudud: string
  til: string
  dan: string
  moliya: string
  mos: boolean
}
export const BOSH_FILTR: KFiltr = { mut: '', kursTuri: '', yonalish: '', shakl: '', kMin: '', kMax: '', prov: '', hudud: '', til: '', dan: '', moliya: '', mos: true }

export function filtrla(db: DB, s: T.Shaxs, rows: T.Oqim[], f: KFiltr) {
  return rows.filter((o) => {
    const v = A.versiya(db, o.versiyaId)!
    const kr = v.tasdiqlanganKredit ?? v.soralganKredit
    if (f.mos && !A.mosmi(db, s, v).ok) return false
    if (f.mut && !(v.mutaxassisliklar.includes(f.mut) || v.mutaxassisliklar.length === 0)) return false
    if (f.kursTuri && v.kursTuri !== f.kursTuri) return false
    if (f.yonalish && v.yonalish !== f.yonalish) return false
    if (f.shakl && v.shakl !== f.shakl) return false
    if (f.kMin && kr < Number(f.kMin)) return false
    if (f.kMax && kr > Number(f.kMax)) return false
    if (f.prov && o.providerId !== f.prov) return false
    if (f.hudud && o.hududId !== f.hudud) return false
    if (f.til && v.til !== f.til) return false
    if (f.dan && o.boshlanish < f.dan) return false
    if (f.moliya && o.moliya !== f.moliya) return false
    return true
  })
}

export function KatalogFiltr({ f, set, rows, db }: { f: KFiltr; set: (f: KFiltr) => void; rows: T.Oqim[]; db: DB }) {
  const provs = Array.from(new Set(rows.map((o) => o.providerId))).map((id) => A.provayder(db, id)!).filter(Boolean)
  const tillar = Array.from(new Set(rows.map((o) => A.versiya(db, o.versiyaId)!.til)))
  const hududlar = HUDUDLAR.filter((h) => rows.some((o) => o.hududId === h.id))
  const u = (k: keyof KFiltr, v: string | boolean) => set({ ...f, [k]: v })
  const sm = { minHeight: 38, height: 38 }
  return (
    <Card className="col gap-16" >
      <div className="row between">
        <h3 className="row gap-6"><Filter size={16} /> Filtrlar</h3>
        <Button v="ghost" size="xs" icon={<RotateCcw />} onClick={() => set({ ...BOSH_FILTR, mos: f.mos })}>Tozalash</Button>
      </div>
      <Check label={<span><b>Mos kurslar</b> — faqat menga mos</span>} checked={f.mos} onChange={(e) => u('mos', e.target.checked)} />
      <Field label="Mutaxassislik">
        <Sel style={sm} value={f.mut} onChange={(e) => u('mut', e.target.value)} placeholder="Barchasi" options={MUTAXASSISLIKLAR.map((m) => ({ v: m.id, l: m.nomi }))} />
      </Field>
      <div className="grid g2" style={{ gap: 10 }}>
        <Field label="Kurs turi">
          <Sel style={sm} value={f.kursTuri} onChange={(e) => u('kursTuri', e.target.value)} placeholder="Barchasi" options={[{ v: 'majburiy', l: 'Majburiy' }, { v: 'tanlov', l: 'Tanlov' }]} />
        </Field>
        <Field label="Yoʻnalish">
          <Sel style={sm} value={f.yonalish} onChange={(e) => u('yonalish', e.target.value)} placeholder="Barchasi" options={[{ v: 'nazariy', l: 'Nazariy' }, { v: 'amaliy', l: 'Amaliy' }]} />
        </Field>
      </div>
      <Field label="Shakl">
        <Sel style={sm} value={f.shakl} onChange={(e) => u('shakl', e.target.value)} placeholder="Barchasi" options={Object.entries(SHAKL).map(([v, l]) => ({ v, l }))} />
      </Field>
      <Field label="Kredit oraligʻi">
        <div className="row gap-6">
          <Inp style={sm} type="number" min={0} placeholder="dan" value={f.kMin} onChange={(e) => u('kMin', e.target.value)} />
          <span className="muted">–</span>
          <Inp style={sm} type="number" min={0} placeholder="gacha" value={f.kMax} onChange={(e) => u('kMax', e.target.value)} />
        </div>
      </Field>
      <Field label="Provayder">
        <Sel style={sm} value={f.prov} onChange={(e) => u('prov', e.target.value)} placeholder="Barchasi" options={provs.map((p) => ({ v: p.id, l: p.qisqa }))} />
      </Field>
      <Field label="Hudud">
        <Sel style={sm} value={f.hudud} onChange={(e) => u('hudud', e.target.value)} placeholder="Barchasi" options={hududlar.map((h) => ({ v: h.id, l: h.nomi }))} />
      </Field>
      <div className="grid g2" style={{ gap: 10 }}>
        <Field label="Til">
          <Sel style={sm} value={f.til} onChange={(e) => u('til', e.target.value)} placeholder="Barchasi" options={tillar} />
        </Field>
        <Field label="Moliyalashtirish">
          <Sel style={sm} value={f.moliya} onChange={(e) => u('moliya', e.target.value)} placeholder="Barchasi" options={Object.entries(MOLIYA).map(([v, l]) => ({ v, l }))} />
        </Field>
      </div>
      <Field label="Boshlanish (dan)">
        <Inp style={sm} type="date" value={f.dan} onChange={(e) => u('dan', e.target.value)} />
      </Field>
    </Card>
  )
}
