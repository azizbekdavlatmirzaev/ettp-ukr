# ETTP–UKR prototipi — ishlab chiquvchi qoʻllanmasi

Interaktiv prototip: React 18 + TypeScript + Vite, backend'siz. Barcha «baza» brauzerda (`localStorage`),
biznes qoidalar `src/domain/amallar.ts` da. Interfeys tili — **faqat oʻzbek (lotin)**. Maʼlumotlar — sintetik.

## Tuzilma

```
src/domain/types.ts      — barcha obyektlar (TZ 13-jadval)
src/domain/db.ts         — DB interfeysi (jadvallar roʻyxati)
src/domain/amallar.ts    — BIZNES AMALLAR va selectorlar (TZ 4.2.x qoidalari). UI faqat shular orqali yozadi.
src/domain/kredit.ts     — yillik holat hisoblash (TZ 4.3.1)
src/domain/seed.ts       — demo maʼlumotlar + DEMO_HISOBLAR (login/parol)
src/domain/store.ts      — zustand store: useStore, useUser, useDB; amal()/amalX() tranzaksiya
src/domain/malumotnoma.ts— HUDUDLAR, MUTAXASSISLIKLAR, KONIKMALAR, BAHOLASH_MEZONLARI, AKK_HUJJATLAR, ROL_NOMI
src/ui/index.tsx         — UI kit: Button, Holat, Badge, Card, CardH, KPI, Raqam, Bar, Ring, PageHeader, Tabs, Seg,
                           Field, Inp, Txt, Sel, Check, RO, FileDrop, Stepper, Timeline, Alert, Empty, Skeleton, Avatar,
                           Modal (drawer rejimi ham), Confirm (izoh/ERI bilan), DL, Stagger/staggerItem, cx
src/ui/DataTable.tsx     — jadval: qidiruv, filtrlar, saralash, sahifalash, Excel eksport (+audit), tanlash + bulk amallar
src/ui/charts.tsx        — AreaCh, LineCh, BarCh, Donut, Legenda, QR (QR-kod rasmi), RANG
src/ui/art.tsx           — Logo, EKG, Molekula, IMG(nomi), kursRasmi(versiya)
src/shared/hooks.ts      — useJoriy() {user, db, amal, amalX, toast, bugun, yil}; useXodim(); mutNomi; hududNomi
src/shared/Murojaat.tsx  — MurojaatModal, MurojaatTugma (har qanday yozuv ustidan «Murojaat yuborish»)
src/shared/Taqvim.tsx    — oylik taqvim komponenti
src/shared/Audit.tsx     — AuditJadval
src/lib/format.ts        — sana, sanaVaqt, sanaUzun, nisbiy, son, pul, foiz, kunFarq, hajm, niqob
src/lib/holat.ts         — holat(h) → [matn, ton]; MOLIYA, SHAKL, TADBIR, KURS_TURI, YONALISH, MANBA, SIGNAL, PROV_TURI, DARAJA, TOIFA ...
src/lib/eksport.ts       — excelYukla, excelShablon, excelOqi, sertifikatPdf, yillikHisobotPdf, umumiyPdf, jsonYukla, QR_ASOS
src/layout/              — Shell (yon menyu, yuqori panel), nav.ts (rollar menyusi), Toasts
src/pages/<kabinet>/*.tsx — sahifalar (har biri `export default function ...`)
public/img/*.jpg         — tibbiy fotosuratlar (Unsplash): hero, jamoa, kardio, jarrohlik, shoshilinch, diagnostika,
                           nevrologiya, laboratoriya, pediatriya, birlamchi, farmatsiya, hamshira, stomatologiya, onlayn,
                           mobil, shifokor, stetoskop, muassasa, portret, lab2 — IMG('hero') orqali
```

## Asosiy qoidalar

1. **Maʼlumotni faqat amallar orqali oʻzgartiring**: `const { amal } = useJoriy(); amal(A.yozilishYubor, oqimId)`.
   `amal` xato boʻlsa oʻzi toast chiqaradi va `undefined` qaytaradi; muvaffaqiyatda natijani qaytaradi —
   shundan keyin `toast({ turi: 'ok', matn: '...' })` bilan natijani ayting. Formalar uchun `amalX` (xatoni tashlaydi).
   DB obyektlarini toʻgʻridan-toʻgʻri mutatsiya QILMANG. Kerakli amal yoʻq boʻlsa — `amallar.ts` ga emas, oʻz
   sahifangiz yonidagi `_amallar.ts` faylga `(db, ctx, ...)` imzoli funksiya yozing (QoidaXatosi, audit, xabar dan foydalaning).
2. **Har bir tugma ishlashi shart.** Hech qanday «soxta» tugma yoki `alert()` boʻlmasin. Tashqi tizim kerak boʻlsa
   (OneID, ERI, LMS, billing, HEMIS) — tushunarli imitatsiya qiling va ekranda «imitatsiya» deb belgilang.
3. **Holat — matn bilan**: `<Holat h="tasdiqlangan" />` (rang + matn). Ranglarni qoʻlda tanlamang.
4. **Har bir sahifa boshida** `<PageHeader title desc source="Manba: … · yangilangan: …" actions />`.
5. **Roʻyxatlar** — `DataTable` (search + filters + exportName). Qator bosilsa — `Modal drawer` bilan tafsilot.
6. **Boʻsh holat** — `Empty` (nima qilish kerakligini ayting). Xato matni nima qilish kerakligini aytsin.
7. **Ruxsatlar**: rolga qarab tugmalarni koʻrsating/yashiring (masalan, operator «Tasdiqlash»ni koʻrmaydi yoki
   disabled + tooltip), lekin haqiqiy tekshiruv amallarda — UI chetlab oʻtilsa ham 403 qaytadi.
8. **Shaxsga doir maʼlumot**: ochiq sahifalarda F.I.Sh. qisqartiriladi (`qisqaFio`), JSHSHIR koʻrsatilmaydi
   (`niqob` faqat egasiga). Kabinetlarda faqat vakolat doirasidagi maʼlumot.
9. **Dizayn**: rasmiy-zamonaviy, havodor. CSS klasslar `src/styles/app.css` da (`grid g4`, `row`, `col`,
   `card`, `hero`, `glass`, `chip`, `li`, `dl`, `tag`, `kpi`, `course` ...). Inline style minimal.
   Animatsiyalar: `Card` (fade-up), `Stagger`, `KPI` (sanab chiqadi), `Ring`/`Bar` (toʻladi), framer-motion `layoutId`.
   Har bir bosh sahifada `hero` blok (gradient + `hero-pattern` + `<EKG className="hero-ekg" />`) boʻlishi mumkin.
   Mobil 360 px da buzilmasin (`g4` → avtomatik 2/1 ustun).
10. **Sana** — `bugun` (`useJoriy`) joriy sana; demo maʼlumot 2026-11-13 atrofida.
11. TypeScript: `npx tsc -p tsconfig.app.json --noEmit` xatosiz boʻlsin. Faqat oʻzingizga berilgan papkadagi
    fayllarni oʻzgartiring (umumiy fayllarga ehtiyoj boʻlsa — yangi fayl yarating, umumiylarni tahrirlamang).

## Demo hisoblar

| login | parol | rol |
|---|---|---|
| anvar | anvar2026 | Xodim — kardiolog (SH-ANVAR, MU01) |
| dilnoza | dilnoza2026 | Xodim — hamshira (oʻrta) |
| operator | operator2026 | Provayder operatori (P01) |
| rahbar | rahbar2026 | Provayder rahbari (P01) |
| euromed | euromed2026 | Xorijiy provayder rahbari (P14) |
| muassasa | muassasa2026 | Muassasa operatori (MU01) |
| mutaxassis | mutaxassis2026 | UKR markazi mutaxassisi |
| qaror | qaror2026 | UKR markazi qaror qabul qiluvchi |
| ekspert / ekspert2 | ekspert2026 | Ekspert E1 / E2 |
| klinik | klinik2026 | Klinik rahbar (U-KLINIK) |
| rezident | rezident2026 | Rezident (RZ1) |
| vazirlik | vazirlik2026 | Vazirlik tahlilchisi |
| admin | admin2026 | Administrator |
