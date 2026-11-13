import { useStore } from '@/domain/store'
import { QoidaXatosi, type Ctx } from '@/domain/amallar'
import type { DB } from '@/domain/db'

/**
 * void qaytaradigan amallar uchun: muvaffaqiyat boʻlsa true, xato boʻlsa toast va false.
 * (store.amal void amalda ham undefined qaytaradi, shuning uchun natijani ajratib boʻlmaydi.)
 */
export function useBajar() {
  const amalX = useStore((s) => s.amalX)
  const toast = useStore((s) => s.toast)
  return <A extends unknown[], R>(fn: (db: DB, ctx: Ctx, ...args: A) => R, ...args: A): boolean => {
    try {
      amalX(fn, ...args)
      return true
    } catch (e) {
      if (e instanceof QoidaXatosi)
        toast({ turi: 'err', sarlavha: e.kod === 403 ? 'Ruxsat yoʻq (403)' : e.kod === 409 ? 'Takror (409)' : 'Tekshiruvdan oʻtmadi', matn: e.message })
      return false
    }
  }
}
