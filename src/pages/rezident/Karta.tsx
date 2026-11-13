import { motion } from 'framer-motion'
import { Building2, IdCard, Scale, UserCheck } from 'lucide-react'
import * as A from '@/domain/amallar'
import { mutNomi } from '@/shared/hooks'
import { MurojaatTugma } from '@/shared/Murojaat'
import { Avatar, Badge, Card, CardH, DL, Holat, PageHeader, Stagger, staggerItem } from '@/ui'
import { niqob, sana, sanaVaqt } from '@/lib/format'
import { RezidentYoq, useRezident } from './_rz'

const MOLIYA: Record<string, string> = { davlat: 'Davlat buyurtmasi', maqsadli: 'Maqsadli', kontrakt: 'Toʻlov-kontrakt' }

export default function Karta() {
  const d = useRezident()
  if (!d.r) return <><PageHeader title="Mening kartam" /><RezidentYoq /></>
  const { r, s, db, rahbar } = d
  const kvotalar = db.kvotalar.filter((k) => k.mutaxassislikId === r.mutaxassislikId)
  const mos = kvotalar.find((k) => k.turi === r.moliya)
  return (
    <>
      <PageHeader title="Mening kartam" desc="Rezident profili — qabul buyrugʻi asosida avtomatik ochilgan" source={`Manba: Arizalar moduli, Reestr · ${sanaVaqt(s.reestrYangilangan)}`}
        actions={<MurojaatTugma turi="rezidentura" obyekt={{ turi: 'Rezident', id: r.id, nomi: `Rezident kartasi ${r.id}` }} label="Xatolik haqida murojaat" />} />
      <Stagger className="grid g2">
        <motion.div variants={staggerItem}>
          <Card>
            <div className="row" style={{ gap: 16 }}>
              <Avatar name={`${s.ism} ${s.familiya}`} lg />
              <div>
                <h2>{A.toliqFio(s)}</h2>
                <div className="small muted">{mutNomi(r.mutaxassislikId)} · {r.kurs}-kurs</div>
                <div className="row wrap gap-6 mt-8"><Holat h={r.holat} /><Badge ton="brand">{MOLIYA[r.moliya]}</Badge></div>
              </div>
            </div>
            <div className="divider" />
            <DL items={[
              ['JSHSHIR', <span className="mono">{niqob(s.jshshir)}</span>],
              ['Tugʻilgan sana', sana(s.tugilgan)],
              ['Rezident ID', <span className="mono">{r.id}</span>],
              ['Aloqa', `${s.telefon} · ${s.email}`],
            ]} />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card>
            <CardH icon={<Building2 />} title="Taʼlim tashkiloti" />
            <DL items={[
              ['Tashkilot', r.tashkilot],
              ['Mutaxassislik', mutNomi(r.mutaxassislikId)],
              ['Kurs', `${r.kurs}-kurs`],
              ['Oʻqish davri', `${sana(r.boshlangan)} – ${sana(r.tugash)}`],
              ['Holat', <Holat h={r.holat} />],
            ]} />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card>
            <CardH icon={<UserCheck />} title="Klinik rahbar" />
            <DL items={[
              ['F.I.Sh.', rahbar?.fio],
              ['Lavozim', rahbar?.lavozim],
              ['Biriktirilgan rezidentlar', `${db.rezidentlar.filter((x) => x.rahbarId === r.rahbarId).length} / ${db.sozlamalar.rezidentLimit} (limit)`],
            ]} />
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card>
            <CardH icon={<Scale />} title="Moliyalashtirish va kvota" />
            <DL items={[
              ['Moliyalashtirish manbai', MOLIYA[r.moliya]],
              ['Kvota turi', mos ? `${MOLIYA[mos.turi]} — ${mos.soni} oʻrin (${mos.yil}, v${mos.versiya})` : MOLIYA[r.moliya]],
              ['Kvota tashkiloti', mos?.tashkilot ?? '—'],
              ['Shartnoma', `RZ-${r.boshlangan.slice(0, 4)}/${r.id}`],
            ]} />
            <div className="xs muted mt-12 row gap-6"><IdCard size={14} /> Kvota qabul boshlangach faqat qaror bilan oʻzgaradi.</div>
          </Card>
        </motion.div>
      </Stagger>
    </>
  )
}
