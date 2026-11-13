# ETTP · UKR — interaktiv prototip

«Elektron tibbiy taʼlim – Tibbiy malaka va davlat roʻyxatidan oʻtkazish platformasi» tarkibidagi
**«Uzluksiz kasbiy rivojlanish» (UKR) quyi tizimi**ning interaktiv prototipi (vizual konsepsiya, TT 4.9-band).

**Demo:** https://azizbekdavlatmirzaev.github.io/ettp-ukr/

> Prototip. Barcha maʼlumotlar **sintetik** — real shaxslar va tashkilotlar yoʻq. Maʼlumotlar brauzeringizda
> saqlanadi; foydalanuvchi menyusidagi «Demo maʼlumotlarni tiklash» boshlangʻich holatga qaytaradi.

## Demo hisoblar

| Rol | Login | Parol |
|---|---|---|
| Xodim (shifokor) | `anvar` | `anvar2026` |
| Xodim (hamshira) | `dilnoza` | `dilnoza2026` |
| Provayder operatori | `operator` | `operator2026` |
| Provayder rahbari | `rahbar` | `rahbar2026` |
| Muassasa (ish beruvchi) | `muassasa` | `muassasa2026` |
| UKR markazi mutaxassisi | `mutaxassis` | `mutaxassis2026` |
| UKR markazi (qaror qabul qiluvchi) | `qaror` | `qaror2026` |
| Ekspert | `ekspert` | `ekspert2026` |
| Klinik rahbar | `klinik` | `klinik2026` |
| Rezident | `rezident` | `rezident2026` |
| Vazirlik tahlilchisi | `vazirlik` | `vazirlik2026` |
| Administrator | `admin` | `admin2026` |

## Asosiy ssenariy (5 daqiqa)

1. `operator` → Natijalar / Oqimlar → OKS oqimi → **Natijani shakllantirish**.
2. `rahbar` → Natijalar → belgilash → **Tasdiqlash (ERI)** → kreditlar va QR-sertifikatlar avtomatik yaratiladi.
3. `anvar` → Katalog → kursga **Yozilish**; Kreditlarim → yillik hisobot PDF; Hujjatlarim → sertifikat QR.
4. Ochiq sahifa **Sertifikatni tekshirish** → QR kalit → «Haqiqiy» (cheklangan maʼlumot).
5. `mutaxassis` → Akkreditatsiya → ekspert biriktirish (manfaatlar toʻqnashuvi bloklanadi) → `qaror` → komissiya qarori → reestr yangilanadi.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # TT 15-jadvalidagi qabul sinovlari (vitest)
npm run build      # dist/
```

## Tuzilma

- `src/domain/` — maʼlumotlar modeli, **biznes qoidalar** (`amallar.ts`), kredit hisoblash (`kredit.ts`, TT 4.3.1), demo maʼlumotlar, qabul sinovlari
- `src/ui/` — dizayn tizimi komponentlari, jadval, diagrammalar
- `src/pages/<kabinet>/` — xodim, provayder, muassasa, markaz, ekspert, klinik, rezident, vazirlik, admin, ochiq sahifalar
- `docs/` — ishlab chiquvchi qoʻllanmasi

Texnologiya (faqat prototip uchun): React 18, TypeScript, Vite, framer-motion, Recharts, SheetJS, jsPDF.
Ishlab chiqarish versiyasi TT 3-jadvalidagi texnologiyalarda (C#/.NET, Angular, PostgreSQL) quriladi.

Fotosuratlar: [Unsplash](https://unsplash.com) (Unsplash litsenziyasi).
