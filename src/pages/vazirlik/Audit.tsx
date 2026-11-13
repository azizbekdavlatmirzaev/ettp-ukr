import { PageHeader, Alert } from '@/ui'
import { AuditJadval } from '@/shared/Audit'

export default function VazirlikAudit() {
  return (
    <>
      <PageHeader title="Audit jurnali" desc="Kim, qachon, qayerdan, nima qildi — avval va keyin. Jurnal oʻchirilmaydi (faqat oʻqish)." source={`Manba: UKR quyi tizimi audit jurnali · yangilangan: ${new Date().toLocaleString('ru-RU').replace(',', '')}`} />
      <div className="mb-16"><Alert ton="info">Vazirlik tahlilchisi jurnalni faqat koʻradi va eksport qiladi. Eksportning oʻzi ham audit jurnaliga yoziladi.</Alert></div>
      <AuditJadval />
    </>
  )
}
