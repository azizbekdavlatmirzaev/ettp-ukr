import { lazy, Suspense, type ReactNode, type ComponentType } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useUser } from '@/domain/store'
import type { Rol } from '@/domain/types'
import Shell from '@/layout/Shell'
import { ROL_YOL } from '@/layout/nav'
import { Toasts } from '@/layout/Toasts'
import { Skeleton } from '@/ui'

const kesh = new Map<string, ComponentType>()
const L = (k: string, f: () => Promise<{ default: ComponentType }>) => {
  if (!kesh.has(k)) kesh.set(k, lazy(f))
  const C = kesh.get(k)!
  return <C />
}

function Yuklanmoqda() {
  return (
    <div className="col gap-16" style={{ padding: 8 }}>
      <Skeleton h={28} w={320} />
      <Skeleton h={14} w={480} />
      <div className="grid g4 mt-12">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} h={110} />
        ))}
      </div>
      <Skeleton h={300} />
    </div>
  )
}

/** Rol chegarasi: boshqa kabinet yoʻliga kirish oʻz kabinetiga qaytaradi (haqiqiy himoya — server va RLS). */
function Himoya({ rollar, children }: { rollar: Rol[]; children: ReactNode }) {
  const u = useUser()
  const loc = useLocation()
  if (!u) return <Navigate to="/kirish" state={{ qayt: loc.pathname }} replace />
  if (!rollar.includes(u.rol)) return <Navigate to={ROL_YOL[u.rol]} replace />
  return <>{children}</>
}


export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div className="content"><Yuklanmoqda /></div>}>
        <Routes>
          {/* Ochiq sahifalar (kirishsiz, faqat oʻqish) */}
          <Route path="/" element={L('landing', () => import('@/pages/public/Landing'))} />
          <Route path="/kirish" element={L('kirish', () => import('@/pages/public/Kirish'))} />
          <Route path="/reestr" element={L('reestr', () => import('@/pages/public/Reestr'))} />
          <Route path="/katalog" element={L('okatalog', () => import('@/pages/public/OchiqKatalog'))} />
          <Route path="/tekshirish" element={L('tekshir', () => import('@/pages/public/Tekshirish'))} />
          <Route path="/tekshirish/:kalit" element={L('tekshir', () => import('@/pages/public/Tekshirish'))} />
          <Route path="/statistika" element={L('stat', () => import('@/pages/public/Statistika'))} />

          <Route element={<Himoya rollar={['xodim']}><Shell /></Himoya>}>
            <Route path="/xodim" element={L('x-bosh', () => import('@/pages/xodim/Bosh'))} />
            <Route path="/xodim/oquv" element={L('x-oquv', () => import('@/pages/xodim/Oquv'))} />
            <Route path="/xodim/oquv/:tab" element={L('x-oquv', () => import('@/pages/xodim/Oquv'))} />
            <Route path="/xodim/kurs/:oqimId" element={L('x-kurs', () => import('@/pages/xodim/Kurs'))} />
            <Route path="/xodim/kreditlar" element={L('x-kredit', () => import('@/pages/xodim/Kreditlar'))} />
            <Route path="/xodim/hujjatlar" element={L('x-hujjat', () => import('@/pages/xodim/Hujjatlar'))} />
            <Route path="/xodim/arizalar" element={L('x-ariza', () => import('@/pages/xodim/Arizalar'))} />
            <Route path="/xodim/taqvim" element={L('x-taqvim', () => import('@/pages/xodim/Taqvim'))} />
            <Route path="/xodim/profil" element={L('x-profil', () => import('@/pages/xodim/Profil'))} />
          </Route>

          <Route element={<Himoya rollar={['provayder_operator', 'provayder_rahbar']}><Shell /></Himoya>}>
            <Route path="/provayder" element={L('p-bosh', () => import('@/pages/provayder/Bosh'))} />
            <Route path="/provayder/dasturlar" element={L('p-dasturlar', () => import('@/pages/provayder/Dasturlar'))} />
            <Route path="/provayder/dasturlar/:id" element={L('p-dastur', () => import('@/pages/provayder/Dastur'))} />
            <Route path="/provayder/oqimlar" element={L('p-oqimlar', () => import('@/pages/provayder/Oqimlar'))} />
            <Route path="/provayder/oqimlar/:id" element={L('p-oqim', () => import('@/pages/provayder/Oqim'))} />
            <Route path="/provayder/tinglovchilar" element={L('p-ting', () => import('@/pages/provayder/Tinglovchilar'))} />
            <Route path="/provayder/natijalar" element={L('p-nat', () => import('@/pages/provayder/Natijalar'))} />
            <Route path="/provayder/akkreditatsiya" element={L('p-akk', () => import('@/pages/provayder/Akkreditatsiya'))} />
            <Route path="/provayder/hisobotlar" element={L('p-his', () => import('@/pages/provayder/Hisobotlar'))} />
            <Route path="/provayder/tashkilot" element={L('p-tash', () => import('@/pages/provayder/Tashkilot'))} />
            <Route path="/provayder/api" element={L('p-api', () => import('@/pages/provayder/Api'))} />
          </Route>

          <Route element={<Himoya rollar={['muassasa']}><Shell /></Himoya>}>
            <Route path="/muassasa" element={L('m-ukr', () => import('@/pages/muassasa/Ukr'))} />
            <Route path="/muassasa/xodimlar" element={L('m-xod', () => import('@/pages/muassasa/Xodimlar'))} />
            <Route path="/muassasa/rejalar" element={L('m-rej', () => import('@/pages/muassasa/Rejalar'))} />
            <Route path="/muassasa/hisobotlar" element={L('m-his', () => import('@/pages/muassasa/Hisobotlar'))} />
            <Route path="/muassasa/taqvim" element={L('m-taq', () => import('@/pages/muassasa/Taqvim'))} />
            <Route path="/muassasa/karta" element={L('m-kar', () => import('@/pages/muassasa/Karta'))} />
          </Route>

          <Route element={<Himoya rollar={['markaz_mutaxassis', 'markaz_rahbar']}><Shell /></Himoya>}>
            <Route path="/markaz" element={L('k-bosh', () => import('@/pages/markaz/Bosh'))} />
            <Route path="/markaz/provayderlar" element={L('k-prov', () => import('@/pages/markaz/Provayderlar'))} />
            <Route path="/markaz/dasturlar" element={L('k-dast', () => import('@/pages/markaz/Dasturlar'))} />
            <Route path="/markaz/akkreditatsiya" element={L('k-akk', () => import('@/pages/markaz/Akkreditatsiya'))} />
            <Route path="/markaz/ekspertlar" element={L('k-eksp', () => import('@/pages/markaz/Ekspertlar'))} />
            <Route path="/markaz/qoidalar" element={L('k-qoida', () => import('@/pages/markaz/Qoidalar'))} />
            <Route path="/markaz/jurnal" element={L('k-jurnal', () => import('@/pages/markaz/Jurnal'))} />
            <Route path="/markaz/tanolish" element={L('k-tan', () => import('@/pages/markaz/TanOlish'))} />
            <Route path="/markaz/murojaatlar" element={L('k-mur', () => import('@/pages/markaz/Murojaatlar'))} />
            <Route path="/markaz/psv" element={L('k-psv', () => import('@/pages/markaz/Psv'))} />
            <Route path="/markaz/sifat" element={L('k-sifat', () => import('@/pages/markaz/Sifat'))} />
            <Route path="/markaz/rezidentura" element={L('k-rez', () => import('@/pages/markaz/Rezidentura'))} />
            <Route path="/markaz/hisobotlar" element={L('k-his', () => import('@/pages/markaz/Hisobotlar'))} />
          </Route>

          <Route element={<Himoya rollar={['ekspert']}><Shell /></Himoya>}>
            <Route path="/ekspert" element={L('e-bosh', () => import('@/pages/ekspert/Bosh'))} />
            <Route path="/ekspert/arizalar" element={L('e-ariza', () => import('@/pages/ekspert/Arizalar'))} />
            <Route path="/ekspert/varaqlar" element={L('e-varaq', () => import('@/pages/ekspert/Varaqlar'))} />
          </Route>

          <Route element={<Himoya rollar={['klinik_rahbar']}><Shell /></Himoya>}>
            <Route path="/klinik" element={L('kl-rez', () => import('@/pages/klinik/Rezidentlar'))} />
            <Route path="/klinik/logbook" element={L('kl-log', () => import('@/pages/klinik/Logbook'))} />
            <Route path="/klinik/baholar" element={L('kl-bah', () => import('@/pages/klinik/Baholar'))} />
          </Route>

          <Route element={<Himoya rollar={['rezident']}><Shell /></Himoya>}>
            <Route path="/rezident" element={L('r-bosh', () => import('@/pages/rezident/Bosh'))} />
            <Route path="/rezident/karta" element={L('r-karta', () => import('@/pages/rezident/Karta'))} />
            <Route path="/rezident/reja" element={L('r-reja', () => import('@/pages/rezident/Reja'))} />
            <Route path="/rezident/logbook" element={L('r-log', () => import('@/pages/rezident/Logbook'))} />
            <Route path="/rezident/baholar" element={L('r-bah', () => import('@/pages/rezident/Baholar'))} />
          </Route>

          <Route element={<Himoya rollar={['vazirlik']}><Shell /></Himoya>}>
            <Route path="/vazirlik" element={L('v-ukr', () => import('@/pages/vazirlik/Ukr'))} />
            <Route path="/vazirlik/hududlar" element={L('v-hud', () => import('@/pages/vazirlik/Hududlar'))} />
            <Route path="/vazirlik/provayderlar" element={L('v-prov', () => import('@/pages/vazirlik/Provayderlar'))} />
            <Route path="/vazirlik/hisobotlar" element={L('v-his', () => import('@/pages/vazirlik/Hisobotlar'))} />
            <Route path="/vazirlik/audit" element={L('v-aud', () => import('@/pages/vazirlik/Audit'))} />
          </Route>

          <Route element={<Himoya rollar={['admin']}><Shell /></Himoya>}>
            <Route path="/admin" element={L('a-foy', () => import('@/pages/admin/Foydalanuvchilar'))} />
            <Route path="/admin/klassifikatorlar" element={L('a-kl', () => import('@/pages/admin/Klassifikatorlar'))} />
            <Route path="/admin/sozlamalar" element={L('a-soz', () => import('@/pages/admin/Sozlamalar'))} />
            <Route path="/admin/tizim" element={L('a-tiz', () => import('@/pages/admin/Tizim'))} />
            <Route path="/admin/audit" element={L('a-aud', () => import('@/pages/admin/Audit'))} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <OchiqToasts />
    </HashRouter>
  )
}

/** Shell tashqarisidagi sahifalar (kirish, ochiq) uchun toastlar */
function OchiqToasts() {
  const u = useUser()
  const loc = useLocation()
  const shellIchida = u && /^\/(xodim|provayder|muassasa|markaz|ekspert|klinik|rezident|vazirlik|admin)/.test(loc.pathname)
  return shellIchida ? null : <Toasts />
}

