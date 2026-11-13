import { History, ShieldAlert, Download } from 'lucide-react'
import { useJoriy } from '@/shared/hooks'
import { AuditJadval } from '@/shared/Audit'
import { KPI, PageHeader } from '@/ui'
import { sanaVaqt } from '@/lib/format'

export default function AdminAudit() {
  const { db, bugun } = useJoriy()
  const bugungi = db.audit.filter((a) => a.sana.slice(0, 10) === bugun).length
  return (
    <>
      <PageHeader title="Audit jurnali" desc="Kim, qachon, qayerdan, nima qildi — avval va keyin. Jurnal oʻchirilmaydi va tahrirlanmaydi, jumladan administrator tomonidan ham." source={`Manba: UKR quyi tizimi audit jurnali · oxirgi yozuv: ${sanaVaqt(db.audit[0]?.sana)}`} />
      <div className="grid g3 mb-16">
        <KPI icon={<History />} label="Jami yozuvlar" value={db.audit.length} />
        <KPI icon={<ShieldAlert />} label="Rad etilgan amallar" value={db.audit.filter((a) => a.natija === 'rad_etildi').length} ton="err" delay={0.05} hint="403 / 409 / 422 urinishlar" />
        <KPI icon={<Download />} label="Bugungi yozuvlar" value={bugungi} ton="teal" delay={0.1} hint={`eksportlar: ${db.audit.filter((a) => a.obyekt === 'Eksport').length}`} />
      </div>
      <AuditJadval />
    </>
  )
}
