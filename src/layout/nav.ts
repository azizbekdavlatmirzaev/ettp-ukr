import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, GraduationCap, Award, FolderOpen, FileText, CalendarDays, UserRound, BookOpen, Layers, Users, ClipboardCheck, ShieldCheck, BarChart3,
  Building2, Scale, ScrollText, Globe2, MessageSquareWarning, Radar, UserCheck, Stethoscope, NotebookPen, ClipboardList, MapPinned, FileBarChart, History,
  Settings, ListTree, ServerCog, Plug, FileSearch, Hospital, Route as RouteIcon, ClipboardPen,
} from 'lucide-react'
import type { Rol } from '@/domain/types'

export interface NavItem { to: string; l: string; icon: LucideIcon; grp?: string; end?: boolean; badge?: string }

export const ROL_YOL: Record<Rol, string> = {
  xodim: '/xodim',
  rezident: '/rezident',
  klinik_rahbar: '/klinik',
  muassasa: '/muassasa',
  provayder_operator: '/provayder',
  provayder_rahbar: '/provayder',
  markaz_mutaxassis: '/markaz',
  markaz_rahbar: '/markaz',
  ekspert: '/ekspert',
  vazirlik: '/vazirlik',
  admin: '/admin',
}

export const KABINET_NOMI: Record<Rol, string> = {
  xodim: 'Xodim kabineti',
  rezident: 'Rezident kabineti',
  klinik_rahbar: 'Klinik rahbar kabineti',
  muassasa: 'Muassasa kabineti',
  provayder_operator: 'Provayder kabineti',
  provayder_rahbar: 'Provayder kabineti',
  markaz_mutaxassis: 'UKR markazi kabineti',
  markaz_rahbar: 'UKR markazi kabineti',
  ekspert: 'Ekspert kabineti',
  vazirlik: 'Vazirlik monitoringi',
  admin: 'Administrator',
}

const XODIM: NavItem[] = [
  { to: '/xodim', l: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/xodim/oquv', l: 'Oʻquv tadbirlari', icon: GraduationCap, badge: 'oquv' },
  { to: '/xodim/kreditlar', l: 'Kreditlarim', icon: Award },
  { to: '/xodim/hujjatlar', l: 'Hujjatlarim', icon: FolderOpen },
  { to: '/xodim/arizalar', l: 'Arizalarim', icon: FileText },
  { to: '/xodim/taqvim', l: 'Taqvim', icon: CalendarDays },
  { to: '/xodim/profil', l: 'Profil', icon: UserRound },
]

const PROVAYDER: NavItem[] = [
  { to: '/provayder', l: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/provayder/dasturlar', l: 'Dasturlar', icon: BookOpen, grp: 'Oʻquv jarayoni' },
  { to: '/provayder/oqimlar', l: 'Oqimlar', icon: Layers },
  { to: '/provayder/tinglovchilar', l: 'Tinglovchilar', icon: Users, badge: 'arizalar' },
  { to: '/provayder/natijalar', l: 'Natijalar', icon: ClipboardCheck, badge: 'natijalar' },
  { to: '/provayder/akkreditatsiya', l: 'Akkreditatsiya', icon: ShieldCheck, grp: 'Tashkilot' },
  { to: '/provayder/hisobotlar', l: 'Hisobotlar', icon: BarChart3 },
  { to: '/provayder/tashkilot', l: 'Tashkilot kartasi', icon: Building2 },
  { to: '/provayder/api', l: 'API va LMS', icon: Plug },
]

const MARKAZ: NavItem[] = [
  { to: '/markaz', l: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/markaz/provayderlar', l: 'Provayderlar', icon: Building2, grp: 'Reestr' },
  { to: '/markaz/dasturlar', l: 'Dasturlar', icon: BookOpen },
  { to: '/markaz/akkreditatsiya', l: 'Akkreditatsiya', icon: ShieldCheck, badge: 'akk' },
  { to: '/markaz/ekspertlar', l: 'Ekspertlar', icon: UserCheck },
  { to: '/markaz/qoidalar', l: 'Kredit qoidalari', icon: Scale, grp: 'Kredit' },
  { to: '/markaz/jurnal', l: 'Kredit jurnali', icon: ScrollText, badge: 'jurnal' },
  { to: '/markaz/tanolish', l: 'Tan olish', icon: Globe2, badge: 'tanolish', grp: 'Arizalar' },
  { to: '/markaz/murojaatlar', l: 'Murojaatlar', icon: MessageSquareWarning, badge: 'murojaat' },
  { to: '/markaz/psv', l: 'PSV', icon: FileSearch },
  { to: '/markaz/sifat', l: 'Sifat nazorati', icon: Radar, badge: 'signal', grp: 'Nazorat' },
  { to: '/markaz/rezidentura', l: 'Rezidentura', icon: Hospital },
  { to: '/markaz/hisobotlar', l: 'Hisobotlar', icon: FileBarChart },
]

const EKSPERT: NavItem[] = [
  { to: '/ekspert', l: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/ekspert/arizalar', l: 'Arizalarim', icon: ClipboardList, badge: 'ekspert' },
  { to: '/ekspert/varaqlar', l: 'Baholash varaqlari', icon: ClipboardPen },
]

const MUASSASA: NavItem[] = [
  { to: '/muassasa', l: 'UKR holati', icon: LayoutDashboard, end: true },
  { to: '/muassasa/xodimlar', l: 'Xodimlar', icon: Users },
  { to: '/muassasa/rejalar', l: 'Rejalar', icon: ClipboardCheck, badge: 'rejalar' },
  { to: '/muassasa/hisobotlar', l: 'Hisobotlar', icon: FileBarChart },
  { to: '/muassasa/taqvim', l: 'Taqvim', icon: CalendarDays },
  { to: '/muassasa/karta', l: 'Muassasa kartasi', icon: Building2 },
]

const KLINIK: NavItem[] = [
  { to: '/klinik', l: 'Rezidentlarim', icon: Users, end: true },
  { to: '/klinik/logbook', l: 'Logbook tasdiqlash', icon: NotebookPen, badge: 'logbook' },
  { to: '/klinik/baholar', l: 'Baholashlar', icon: ClipboardCheck },
]

const REZIDENT: NavItem[] = [
  { to: '/rezident', l: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/rezident/karta', l: 'Mening kartam', icon: UserRound },
  { to: '/rezident/reja', l: 'Oʻquv reja', icon: RouteIcon },
  { to: '/rezident/logbook', l: 'Logbook', icon: NotebookPen },
  { to: '/rezident/baholar', l: 'Baholashlar', icon: ClipboardCheck },
]

const VAZIRLIK: NavItem[] = [
  { to: '/vazirlik', l: 'UKR monitoringi', icon: LayoutDashboard, end: true },
  { to: '/vazirlik/hududlar', l: 'Hududlar', icon: MapPinned },
  { to: '/vazirlik/provayderlar', l: 'Provayderlar', icon: Building2 },
  { to: '/vazirlik/hisobotlar', l: 'Hisobotlar', icon: FileBarChart },
  { to: '/vazirlik/audit', l: 'Audit', icon: History },
]

const ADMIN: NavItem[] = [
  { to: '/admin', l: 'Foydalanuvchilar', icon: Users, end: true },
  { to: '/admin/klassifikatorlar', l: 'Klassifikatorlar', icon: ListTree },
  { to: '/admin/sozlamalar', l: 'Sozlamalar', icon: Settings },
  { to: '/admin/tizim', l: 'Tizim holati', icon: ServerCog },
  { to: '/admin/audit', l: 'Audit jurnali', icon: History },
]

export const NAV: Record<Rol, NavItem[]> = {
  xodim: XODIM,
  rezident: REZIDENT,
  klinik_rahbar: KLINIK,
  muassasa: MUASSASA,
  provayder_operator: PROVAYDER,
  provayder_rahbar: PROVAYDER,
  markaz_mutaxassis: MARKAZ,
  markaz_rahbar: MARKAZ,
  ekspert: EKSPERT,
  vazirlik: VAZIRLIK,
  admin: ADMIN,
}

export { Stethoscope }
