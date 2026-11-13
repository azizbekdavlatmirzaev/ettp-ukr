import { useMemo, useState } from 'react'
import { ShieldCheck, Clock, Gavel, AlertTriangle } from 'lucide-react'
import { PageHeader, Seg, KPI, Inp, Sel } from '@/ui'
import { useMarkaz, ishKunlari, manba } from './_parts'
import { Doska, Jadval, TURI_NOMI, obyektNomi } from './_akkBoard'
import { ArizaDrawer } from './_akkDrawer'

export default function MarkazAkkreditatsiya() {
  const { db, bugun, rahbar } = useMarkaz()
  const [kor, setKor] = useState<'doska' | 'jadval'>('doska')
  const [tanl, setTanl] = useState<string>()
  const [q, setQ] = useState('')
  const [turi, setTuri] = useState('')
  const rows = useMemo(() => db.akkArizalar.filter((a) => a.holat !== 'qoralama')
    .filter((a) => !turi || a.turi === turi)
    .filter((a) => !q.trim() || `${a.raqam} ${obyektNomi(db, a)} ${db.provayderlar.find((p) => p.id === a.providerId)?.qisqa}`.toLowerCase().includes(q.trim().toLowerCase())), [db, q, turi])
  const ochiq = rows.filter((a) => a.holat !== 'yakunlandi')
  const kech = ochiq.filter((a) => (ishKunlari(bugun, a.muddat, db.sozlamalar.bayramlar) ?? 1) < 0).length
  const a = db.akkArizalar.find((x) => x.id === tanl)

  return (
    <>
      <PageHeader
        title="Akkreditatsiya"
        desc="Elektron ariza → toʻliqlik → ekspertiza → joyida tekshiruv → komissiya → qaror. Muddatlar ish kunlarida hisoblanadi."
        source={manba('Arizalar moduli (akkreditatsiya), ekspertlar reestri')}
        actions={<Seg id="akk-kor" value={kor} onChange={setKor} items={[{ v: 'doska', l: 'Doska' }, { v: 'jadval', l: 'Jadval' }]} />}
      />
      <div className="grid g4 mb-16">
        <KPI icon={<ShieldCheck />} label="Ochiq arizalar" value={ochiq.length} />
        <KPI icon={<Clock />} label="Muddati oʻtgan" value={kech} ton={kech ? 'err' : 'ok'} delay={0.05} hint="Ish kunlarida" />
        <KPI icon={<Gavel />} label="Komissiya kutmoqda" value={rows.filter((x) => x.holat === 'komissiya').length} ton="warn" delay={0.1} hint={rahbar ? 'Sizning qaroringiz kerak' : 'Qaror qabul qiluvchida'} />
        <KPI icon={<AlertTriangle />} label="Kamchilik bilan" value={rows.filter((x) => x.holat === 'kamchilik').length} ton="teal" delay={0.15} hint="Provayder toʻldirmoqda" />
      </div>
      {kor === 'doska' ? (
        <>
          <div className="row wrap mb-12">
            <Inp style={{ maxWidth: 320 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Raqam, provayder yoki dastur..." aria-label="Qidirish" />
            <Sel style={{ maxWidth: 220 }} value={turi} onChange={(e) => setTuri(e.target.value)} options={Object.entries(TURI_NOMI).map(([v, l]) => ({ v, l }))} placeholder="Turi: barchasi" />
          </div>
          <Doska rows={rows} onOpen={setTanl} />
        </>
      ) : (
        <Jadval rows={rows} onOpen={setTanl} />
      )}
      <ArizaDrawer a={a} onClose={() => setTanl(undefined)} />
    </>
  )
}
