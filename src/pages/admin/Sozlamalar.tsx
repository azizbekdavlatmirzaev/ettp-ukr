import { useState, type ReactNode } from 'react'
import { CalendarX, Radar, Timer, SlidersHorizontal, Plus, X, Save, History } from 'lucide-react'
import * as A from '@/domain/amallar'
import type { AuditYozuv, Sozlamalar } from '@/domain/types'
import { useJoriy } from '@/shared/hooks'
import { AuditJadval } from '@/shared/Audit'
import { Alert, Button, Card, CardH, Field, Inp, PageHeader } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { ShablonBolim } from './_Shablon'

const sozlamaAudit = (a: AuditYozuv) => a.obyekt === 'Sozlamalar'
type Md = Sozlamalar['muddatlar']
const MUDDAT: [keyof Md, string, string][] = [
  ['akkKorib', 'Akkreditatsiya arizasini koʻrib chiqish', 'ish kuni'],
  ['akkToldirish', 'Akkreditatsiya kamchiligini toʻldirish', 'ish kuni'],
  ['tanOlishKorib', 'Tan olish arizasini koʻrib chiqish', 'ish kuni'],
  ['tanOlishToldirish', 'Tan olish hujjatini toʻldirish', 'ish kuni'],
  ['tanOlishUzaytirish', 'Tan olish muddatini uzaytirish (rasmiy soʻrov)', 'ish kuni'],
  ['murojaatKorib', 'Murojaatni koʻrib chiqish', 'ish kuni'],
  ['rejaYangiXodim', 'Yangi xodim rejasi', 'kalendar kun'],
]

function Bolim({ icon, title, sub, ozgardi, onSave, children }: { icon: ReactNode; title: string; sub: string; ozgardi: boolean; onSave: () => void; children: ReactNode }) {
  return (
    <Card>
      <CardH icon={icon} title={title} sub={sub} right={<Button v="primary" size="sm" icon={<Save size={15} />} disabled={!ozgardi} onClick={onSave}>Saqlash</Button>} />
      {children}
    </Card>
  )
}

export default function AdminSozlamalar() {
  const { db, amal, toast } = useJoriy()
  const s = db.sozlamalar
  const [f, setF] = useState<Sozlamalar>(s)
  const [yangiSana, setYangiSana] = useState('')
  const farq = (k: keyof Sozlamalar) => JSON.stringify(f[k]) !== JSON.stringify(s[k])
  const saqla = (d: Partial<Sozlamalar>, matn: string) => {
    amal(A.sozlamaSaqla, d)
    toast({ turi: 'ok', matn: `${matn} saqlandi. Oʻzgarish audit jurnaliga yozildi (avval → keyin).` })
  }
  const son = (v: string, min = 0) => Math.max(min, Number(v) || 0)

  return (
    <>
      <PageHeader title="Sozlamalar" desc="Texnik sozlamalar: bayramlar, signal chegaralari, muddatlar, sertifikat shabloni va limitlar. Har bir oʻzgarish auditga yoziladi." source={`Manba: UKR quyi tizimi konfiguratsiyasi · oxirgi oʻzgarish: ${sanaVaqt(db.audit.find(sozlamaAudit)?.sana)}`} />
      <div className="grid g2 mb-16">
        <Bolim icon={<CalendarX />} title="Bayram va dam olish kunlari" sub="Ish kunlarida hisoblanadigan muddatlardan chiqariladi" ozgardi={farq('bayramlar')} onSave={() => saqla({ bayramlar: [...f.bayramlar].sort() }, 'Bayramlar roʻyxati')}>
          <div className="row wrap gap-6 mb-12">
            {[...f.bayramlar].sort().map((b) => (
              <span key={b} className="chip">{sana(b)}<button type="button" className="btn ghost xs" style={{ padding: 0, height: 18 }} aria-label="Oʻchirish" onClick={() => setF({ ...f, bayramlar: f.bayramlar.filter((x) => x !== b) })}><X size={12} /></button></span>
            ))}
          </div>
          <div className="row">
            <Inp type="date" value={yangiSana} onChange={(e) => setYangiSana(e.target.value)} aria-label="Yangi bayram sanasi" />
            <Button icon={<Plus size={15} />} disabled={!yangiSana || f.bayramlar.includes(yangiSana)} onClick={() => { setF({ ...f, bayramlar: [...f.bayramlar, yangiSana] }); setYangiSana('') }}>Qoʻshish</Button>
          </div>
        </Bolim>
        <Bolim icon={<Radar />} title="Sifat signallari chegaralari" sub="Signal provayder holatini avtomatik oʻzgartirmaydi" ozgardi={farq('signalChegaralari')} onSave={() => saqla({ signalChegaralari: f.signalChegaralari }, 'Signal chegaralari')}>
          <div className="form-grid">
            <Field label="Bir kunda sertifikatlar soni (≥)" help="«Qisqa vaqtda koʻp sertifikat» signali"><Inp type="number" min={1} value={f.signalChegaralari.kopSertifikatKunda} onChange={(e) => setF({ ...f, signalChegaralari: { ...f.signalChegaralari, kopSertifikatKunda: son(e.target.value, 1) } })} /></Field>
            <Field label="Bir xil ball ulushi, % (≥)" help="«Bir xil ball va 100% davomat» signali"><Inp type="number" min={50} max={100} value={f.signalChegaralari.birXilBallFoiz} onChange={(e) => setF({ ...f, signalChegaralari: { ...f.signalChegaralari, birXilBallFoiz: Math.min(100, son(e.target.value, 1)) } })} /></Field>
          </div>
        </Bolim>
      </div>
      <div className="grid g2 mb-16">
        <Bolim icon={<Timer />} title="Muddatlar" sub="Ish kunlari bayramlarsiz hisoblanadi" ozgardi={farq('muddatlar')} onSave={() => {
          if (!/^\d{2}-\d{2}$/.test(f.muddatlar.rejaYillik)) return toast({ turi: 'err', matn: 'Yillik reja muddatini OO-KK shaklida kiriting (masalan, 12-31).' })
          saqla({ muddatlar: f.muddatlar }, 'Muddatlar')
        }}>
          <div className="form-grid">
            {MUDDAT.map(([k, l, b]) => (
              <Field key={k} label={l} help={b}><Inp type="number" min={1} value={f.muddatlar[k] as number} onChange={(e) => setF({ ...f, muddatlar: { ...f.muddatlar, [k]: son(e.target.value, 1) } })} /></Field>
            ))}
            <Field label="Keyingi yil rejasi muddati" help="OO-KK (oy-kun)"><Inp value={f.muddatlar.rejaYillik} onChange={(e) => setF({ ...f, muddatlar: { ...f.muddatlar, rejaYillik: e.target.value } })} /></Field>
          </div>
        </Bolim>
        <Bolim icon={<SlidersHorizontal />} title="Limitlar" sub="Rezidentura va ochiq statistika" ozgardi={farq('rezidentLimit') || farq('ochiqStatistikaMinGuruh')} onSave={() => saqla({ rezidentLimit: f.rezidentLimit, ochiqStatistikaMinGuruh: f.ochiqStatistikaMinGuruh }, 'Limitlar')}>
          <div className="form-grid">
            <Field label="Klinik rahbarga rezidentlar limiti" help="Bir rahbarga biriktiriladigan maksimal rezident"><Inp type="number" min={1} value={f.rezidentLimit} onChange={(e) => setF({ ...f, rezidentLimit: son(e.target.value, 1) })} /></Field>
            <Field label="Ochiq statistika: minimal guruh" help="Bundan kichik guruhlar «<N» deb yashiriladi"><Inp type="number" min={5} value={f.ochiqStatistikaMinGuruh} onChange={(e) => setF({ ...f, ochiqStatistikaMinGuruh: son(e.target.value, 5) })} /></Field>
          </div>
          <Alert ton="info">Kredit talablari va ulushlar bu yerda emas — UKR markazi «Kredit qoidalari» versiyalarida boshqariladi.</Alert>
        </Bolim>
      </div>
      <div className="mb-16"><ShablonBolim /></div>
      <h3 className="row gap-6 mb-12"><History size={17} /> Sozlamalar oʻzgarishlari tarixi <span className="xs muted" style={{ fontWeight: 400 }}>audit jurnalidan: avval → keyin</span></h3>
      <AuditJadval filtr={sozlamaAudit} />
    </>
  )
}
