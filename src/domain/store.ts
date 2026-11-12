import { create } from 'zustand'
import type { DB } from './db'
import type { Foydalanuvchi } from './types'
import { seedYarat, DB_VERSIYA } from './seed'
import { QoidaXatosi, audit, type Ctx } from './amallar'

const KALIT = 'ettp-ukr-db'
const SESSIYA = 'ettp-ukr-sessiya'

export interface Toast { id: number; turi: 'ok' | 'err' | 'info' | 'warn'; matn: string; sarlavha?: string }

interface Holat {
  db: DB
  userId: string | null
  toasts: Toast[]
  kirish: (login: string, parol: string) => Foydalanuvchi
  chiqish: () => void
  /** Biznes amalni bajarish: (db, ctx, ...args). Xato boʻlsa toast va audit, natija — undefined. */
  amal: <A extends unknown[], R>(fn: (db: DB, ctx: Ctx, ...args: A) => R, ...args: A) => R | undefined
  /** Xatoni tashlaydigan variant (formalar uchun) */
  amalX: <A extends unknown[], R>(fn: (db: DB, ctx: Ctx, ...args: A) => R, ...args: A) => R
  toast: (t: Omit<Toast, 'id'>) => void
  toastYop: (id: number) => void
  oqildi: (ids: string[]) => void
  tiklash: () => void
}

function yukla(): DB {
  try {
    const s = localStorage.getItem(KALIT)
    if (s) {
      const d = JSON.parse(s) as DB
      if (d.versiya === DB_VERSIYA) return d
    }
  } catch {
    /* boʻsh */
  }
  return seedYarat()
}

let saqlashTaymer: ReturnType<typeof setTimeout> | undefined
function saqla(db: DB) {
  clearTimeout(saqlashTaymer)
  saqlashTaymer = setTimeout(() => {
    try {
      localStorage.setItem(KALIT, JSON.stringify(db))
    } catch {
      /* xotira toʻlgan yoki taqiqlangan — demo ishlashda davom etadi */
    }
  }, 150)
}

function sessiyaUser(): string | null {
  try {
    return sessionStorage.getItem(SESSIYA) ?? localStorage.getItem(SESSIYA)
  } catch {
    return null
  }
}

let tid = 1

export const useStore = create<Holat>((set, get) => {
  const bajar = <A extends unknown[], R>(fn: (db: DB, ctx: Ctx, ...args: A) => R, args: A, tashla: boolean): R | undefined => {
    const { db, userId } = get()
    const user = db.foydalanuvchilar.find((u) => u.id === userId)
    if (!user) throw new QoidaXatosi(403, 'Sessiya tugagan. Qayta kiring.')
    const ctx: Ctx = { user, vaqt: new Date().toISOString() }
    const nusxa = structuredClone(db)
    try {
      const r = fn(nusxa, ctx, ...args)
      set({ db: nusxa })
      saqla(nusxa)
      return r
    } catch (e) {
      if (e instanceof QoidaXatosi) {
        const d2 = structuredClone(db)
        audit(d2, ctx, `Rad etildi: ${fn.name || 'amal'}`, 'Qoida', undefined, undefined, { kod: e.kod, xabar: e.message }, 'rad_etildi')
        set({ db: d2 })
        saqla(d2)
        if (tashla) throw e
        get().toast({ turi: 'err', sarlavha: e.kod === 403 ? 'Ruxsat yoʻq (403)' : e.kod === 409 ? 'Takror (409)' : 'Tekshiruvdan oʻtmadi', matn: e.message })
        return undefined
      }
      console.error(e)
      get().toast({ turi: 'err', sarlavha: 'Kutilmagan xato', matn: String((e as Error).message ?? e) })
      if (tashla) throw e
      return undefined
    }
  }

  return {
    db: yukla(),
    userId: sessiyaUser(),
    toasts: [],
    kirish(login, parol) {
      const db = get().db
      const l = login.trim().toLowerCase().replace(/@.*$/, '')
      const u = db.foydalanuvchilar.find((x) => x.login === l)
      if (!u || u.parol !== parol) {
        const d2 = structuredClone(db)
        audit(d2, null, `Muvaffaqiyatsiz kirish: ${l}`, 'Sessiya', undefined, undefined, undefined, 'rad_etildi')
        set({ db: d2 })
        throw new QoidaXatosi(403, 'Login yoki parol notoʻgʻri.')
      }
      if (!u.faol) throw new QoidaXatosi(403, 'Hisob bloklangan. Administratorga murojaat qiling.')
      const d2 = structuredClone(db)
      audit(d2, { user: u, vaqt: new Date().toISOString() }, 'Kirish', 'Sessiya')
      set({ db: d2, userId: u.id })
      saqla(d2)
      try {
        sessionStorage.setItem(SESSIYA, u.id)
        localStorage.setItem(SESSIYA, u.id)
      } catch {
        /* */
      }
      return u
    },
    chiqish() {
      try {
        sessionStorage.removeItem(SESSIYA)
        localStorage.removeItem(SESSIYA)
      } catch {
        /* */
      }
      set({ userId: null })
    },
    amal: (fn, ...args) => bajar(fn, args, false),
    amalX: (fn, ...args) => bajar(fn, args, true) as never,
    toast(t) {
      const id = tid++
      set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
      setTimeout(() => get().toastYop(id), t.turi === 'err' ? 7000 : 4500)
    },
    toastYop(id) {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
    },
    oqildi(ids) {
      const db = structuredClone(get().db)
      db.bildirishnomalar.forEach((n) => ids.includes(n.id) && (n.oqilgan = true))
      set({ db })
      saqla(db)
    },
    tiklash() {
      const db = seedYarat()
      set({ db })
      saqla(db)
    },
  }
})

/** Joriy foydalanuvchi */
export function useUser() {
  return useStore((s) => s.db.foydalanuvchilar.find((u) => u.id === s.userId)) ?? null
}
export function useDB() {
  return useStore((s) => s.db)
}
