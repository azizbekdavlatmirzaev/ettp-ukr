import { useMemo } from 'react'
import { useStore, useUser } from '@/domain/store'
import * as A from '@/domain/amallar'
import { MUTAXASSISLIKLAR, HUDUDLAR } from '@/domain/malumotnoma'

export const bugunISO = () => new Date().toISOString().slice(0, 10)
export const joriyYil = () => new Date().getFullYear()

/** Joriy foydalanuvchi + DB + amal funksiyalari — har bir sahifa uchun */
export function useJoriy() {
  const user = useUser()!
  const db = useStore((s) => s.db)
  const amal = useStore((s) => s.amal)
  const amalX = useStore((s) => s.amalX)
  const toast = useStore((s) => s.toast)
  return { user, db, amal, amalX, toast, bugun: bugunISO(), yil: joriyYil() }
}

/** Xodim (shaxs) va uning joriy yil holati */
export function useXodim() {
  const j = useJoriy()
  const shaxs = A.shaxs(j.db, j.user.personId)!
  const holat = useMemo(() => A.xodimYillik(j.db, shaxs.id, j.yil, j.bugun), [j.db, shaxs.id, j.yil, j.bugun])
  const mehnat = j.db.mehnat.filter((m) => m.personId === shaxs.id)
  const asosiy = mehnat.find((m) => m.asosiy && !m.gacha)
  return { ...j, shaxs, holat, mehnat, asosiy, muassasa: j.db.muassasalar.find((m) => m.id === asosiy?.muassasaId) }
}

export const mutNomi = (id?: string) => MUTAXASSISLIKLAR.find((m) => m.id === id)?.nomi ?? '—'
export const hududNomi = (id?: string) => HUDUDLAR.find((m) => m.id === id)?.nomi ?? '—'
