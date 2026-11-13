import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Save } from 'lucide-react'
import * as A from '@/domain/amallar'
import type { Sozlamalar } from '@/domain/types'
import { useJoriy } from '@/shared/hooks'
import { Button, Card, CardH, Field, Inp, Txt } from '@/ui'
import { Logo } from '@/ui/art'
import { QR } from '@/ui/charts'

type Sh = Sozlamalar['sertifikatShablon']

/** Sertifikat shabloni — jonli mini-koʻrinish bilan */
export function ShablonBolim() {
  const { db, amal, toast } = useJoriy()
  const [s, setS] = useState<Sh>(db.sozlamalar.sertifikatShablon)
  useEffect(() => setS(db.sozlamalar.sertifikatShablon), [db.sozlamalar.sertifikatShablon])
  const ozgardi = JSON.stringify(s) !== JSON.stringify(db.sozlamalar.sertifikatShablon)
  const saqla = () => {
    if (!s.sarlavha.trim() || !s.imzolovchi.trim() || !s.versiya.trim()) return toast({ turi: 'err', matn: 'Sarlavha, imzolovchi va versiyani toʻldiring.' })
    if (s.versiya === db.sozlamalar.sertifikatShablon.versiya) return toast({ turi: 'warn', sarlavha: 'Versiyani oshiring', matn: 'Shablon matni oʻzgarsa yangi versiya raqami kerak — avval berilgan sertifikatlar eski versiyada qoladi.' })
    amal(A.sozlamaSaqla, { sertifikatShablon: s })
    toast({ turi: 'ok', matn: `Sertifikat shabloni ${s.versiya} saqlandi. Yangi sertifikatlar shu versiyada yaratiladi.` })
  }
  return (
    <Card>
      <CardH icon={<Award />} title="Sertifikat shabloni" sub={`Joriy versiya: ${db.sozlamalar.sertifikatShablon.versiya} · berilgan sertifikatlar oʻzgarmaydi`} right={<Button v="primary" size="sm" icon={<Save size={15} />} disabled={!ozgardi} onClick={saqla}>Saqlash</Button>} />
      <div className="grid g2">
        <div className="col gap-16">
          <Field label="Sarlavha" req><Inp value={s.sarlavha} onChange={(e) => setS({ ...s, sarlavha: e.target.value })} /></Field>
          <Field label="Imzolovchi" req><Inp value={s.imzolovchi} onChange={(e) => setS({ ...s, imzolovchi: e.target.value })} /></Field>
          <Field label="Asosiy matn"><Txt rows={3} value={s.matn} onChange={(e) => setS({ ...s, matn: e.target.value })} /></Field>
          <Field label="Versiya" req help="Masalan: SH-2026.2"><Inp value={s.versiya} onChange={(e) => setS({ ...s, versiya: e.target.value })} /></Field>
        </div>
        <motion.div key={s.sarlavha + s.versiya} initial={{ opacity: 0.6, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: '#fff', color: '#0f1e2e', alignSelf: 'start' }}>
          <div style={{ background: '#0a3a5c', color: '#fff', padding: '10px 14px', borderBottom: '3px solid #0fa3a3' }} className="row">
            <Logo size={26} mono />
            <div><div style={{ fontSize: 10.5, fontWeight: 700 }}>OʻZBEKISTON RESPUBLIKASI SOGʻLIQNI SAQLASH VAZIRLIGI</div><div style={{ fontSize: 9, opacity: 0.8 }}>ETTP — Uzluksiz kasbiy rivojlanish</div></div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0b5c8c', textAlign: 'center' }}>{s.sarlavha || '—'}</div>
            <div style={{ fontSize: 11, textAlign: 'center', marginTop: 4, color: '#64748b' }}>UKR 2026-000123</div>
            <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'center', margin: '12px 0 6px' }}>Karimov Anvar Baxtiyorovich</div>
            <div style={{ fontSize: 11.5, textAlign: 'center' }}>{s.matn}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'center', margin: '8px 0' }}>«Oʻtkir koronar sindrom: zamonaviy yondashuvlar» · 12 kredit</div>
            <div className="row between" style={{ marginTop: 12, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 10.5 }}><div style={{ borderTop: '1px solid #94a3b8', paddingTop: 3 }}>{s.imzolovchi}</div><div style={{ color: '#64748b' }}>ERI bilan imzolangan · shablon {s.versiya}</div></div>
              <QR matn={`ETTP-UKR namuna ${s.versiya}`} size={58} />
            </div>
          </div>
        </motion.div>
      </div>
    </Card>
  )
}
