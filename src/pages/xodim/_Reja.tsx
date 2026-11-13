import { ClipboardList, Plus } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useXodim } from '@/shared/hooks'
import { Alert, Button, Card, Empty } from '@/ui'
import { RejaKarta } from './_RejaKarta'

export function Reja() {
  const { db, shaxs, yil, amal, toast, asosiy } = useXodim()
  const rejalar = db.rejalar.filter((r) => r.personId === shaxs.id)
  const yillar = [yil, yil + 1]
  const yarat = (y: number) => {
    const r = amal(A.rejaYarat, y)
    if (r) toast({ turi: 'ok', sarlavha: `${y}-yil rejasi yaratildi`, matn: `Majburiy modullar oldindan qoʻshildi (${r.bandlar.length} ta). Kurslar qoʻshib, ish beruvchiga yuboring.` })
  }
  return (
    <div className="col gap-16">
      <Alert ton="info" title="Rivojlanish rejasi qanday ishlaydi?">
        Reja yil boshida (yangi xodim — ishga kirgach {db.sozlamalar.muddatlar.rejaYangiXodim} kun ichida) tuziladi va asosiy ish beruvchi tomonidan tasdiqlanadi. Majburiy modullar avtomatik qoʻyiladi va olib tashlanmaydi. Reja kredit bermaydi — kredit faqat kurs natijasidan.
      </Alert>
      {yillar.map((y) => {
        const r = rejalar.find((x) => x.yil === y)
        if (r) return <RejaKarta key={r.id} r={r} />
        return (
          <Card key={y}>
            <Empty icon={<ClipboardList />} title={`${y}-yil uchun reja tuzilmagan`} action={<Button v="primary" icon={<Plus />} disabled={!asosiy} onClick={() => yarat(y)}>Reja yaratish</Button>}>
              {asosiy ? 'Rejani yarating — majburiy modullar avtomatik qoʻshiladi, qolganini katalogdan tanlaysiz.' : 'Asosiy ish joyingiz Reestrda topilmadi — reja ish beruvchisiz tuzilmaydi.'}
            </Empty>
          </Card>
        )
      })}
      {rejalar.filter((r) => !yillar.includes(r.yil)).sort((a, b) => b.yil - a.yil).map((r) => <RejaKarta key={r.id} r={r} />)}
    </div>
  )
}
