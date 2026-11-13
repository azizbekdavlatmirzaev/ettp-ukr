import { ShieldCheck } from 'lucide-react'
import { Card, CardH } from '@/ui'

// TZ 10-jadval: rollar va ruxsatlar
const MATRITSA: [string, string, string, string][] = [
  ['Xodim', 'Xodim', 'Kursga yozilish, oʻqish, oʻz kreditlarini koʻrish, reja, ariza va murojaat', 'Kreditni oʻzgartirish, boshqa xodimni koʻrish'],
  ['Provayder operatori', 'Provayder', 'Dastur, oqim, tinglovchi, davomat va baholarni kiritish', 'Natijani tasdiqlash, kredit qiymatini oʻzgartirish'],
  ['Provayder rahbari', 'Provayder', 'Natija va hujjatlarni tasdiqlash, akkreditatsiya arizasi', 'Boshqa provayder maʼlumotini koʻrish'],
  ['Muassasa operatori (ish beruvchi)', 'Muassasa', 'Oʻz xodimlari UKR holati, rejani tasdiqlash, hisobot', 'Kreditni oʻzgartirish, boshqa muassasa xodimini koʻrish'],
  ['UKR markazi mutaxassisi', 'UKR markazi', 'Reestr, arizalarni tekshirish, tuzatish taklifi', 'Oʻzi tayyorlagan ish boʻyicha yakuniy qaror'],
  ['UKR markazi qaror qabul qiluvchisi', 'UKR markazi', 'Akkreditatsiya, tan olish, tuzatish va qoida versiyasini tasdiqlash', 'Oʻzi kiritgan narsani oʻzi tasdiqlash'],
  ['Ekspert', 'Ekspert', 'Biriktirilgan arizani baholash', 'Qaror qabul qilish, manfaatdor arizani koʻrish'],
  ['Vazirlik tahlilchisi', 'Vazirlik', 'Monitoring va hisobotlar', 'Maʼlumotni oʻzgartirish'],
  ['Administrator (UZINFOCOM)', 'Administrator', 'Foydalanuvchi, rol, maʼlumotnoma va texnik sozlamalar', 'Kredit, natija va qarorlarni oʻzgartirish'],
  ['Rezident', 'Talaba', 'Oʻz rejasi va logbook yozuvlari', 'Oʻz koʻnikmasini tasdiqlash'],
  ['Klinik rahbar', 'Klinik rahbar', 'Oʻz rezidentlarining logbooki va baholari', 'Boshqa rahbar rezidentlarini koʻrish'],
  ['Xorijiy tashkilot', 'API, PSV', 'Ariza berish, ruxsat etilgan maʼlumotni olish', 'Roziligi yoʻq maʼlumotni olish'],
  ['Omma', 'Ochiq sahifalar', 'Reestr, QR-tekshiruv, statistika (faqat oʻqish)', 'Shaxsga doir maʼlumotni koʻrish'],
]

export function RolMatritsa() {
  return (
    <Card>
      <CardH icon={<ShieldCheck />} title="Rollar va ruxsatlar matritsasi" sub="TZ 10-jadval · ruxsatlar rolga va tashkilotga bogʻlanadi, amallar qatlamida tekshiriladi" />
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Rol</th><th>Kabinet</th><th>Nima qila oladi</th><th>Nima qila olmaydi</th></tr></thead>
          <tbody>
            {MATRITSA.map(([r, k, ha, yoq]) => (
              <tr key={r}>
                <td className="b small">{r}</td>
                <td><span className="tag">{k}</span></td>
                <td className="small" style={{ color: 'var(--ok)' }}>✓ {ha}</td>
                <td className="small" style={{ color: 'var(--err)' }}>✕ {yoq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
