import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Download, Loader } from 'lucide-react'
import * as A from '@/domain/amallar'
import { HUDUDLAR, MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { useJoriy } from '@/shared/hooks'
import { excelYukla } from '@/lib/eksport'
import { Bar, Button, Card, CardH, Holat } from '@/ui'
import { guruhla, shaxsQatorlari, ulush, yigma } from './_hisob'

interface Qator { id: string; hudud: string; muassasa: string; turi: string; mut: string; n: number; bajarildi: number; xavf: number; qarzdor: number; foiz: number; kredit: number }
const BOSQICH = ['Navbatga qoʻyildi', 'Reestrdan maxraj olinmoqda', 'Kredit jurnali agregatsiyasi', 'Kesimlar hisoblanmoqda', 'Fayl shakllantirilmoqda']

/** Katta hisobot — fon rejimida tayyorlanadi, tayyor boʻlgach xabar beriladi (TZ: katta hisobotlar fon rejimida). */
export function FonHisobot() {
  const { db, bugun, yil, amal, toast } = useJoriy()
  const [p, setP] = useState(0)
  const [ish, setIsh] = useState(false)
  const [tayyor, setTayyor] = useState<Qator[] | null>(null)
  const t = useRef<ReturnType<typeof setInterval>>()
  useEffect(() => () => clearInterval(t.current), [])

  const boshla = () => {
    setTayyor(null)
    setIsh(true)
    setP(0)
    amal(A.eksportQayd, 'Katta hisobot: muassasa × mutaxassislik (fon vazifasi boshlandi)', 0)
    toast({ turi: 'info', matn: 'Hisobot fon rejimida tayyorlanmoqda. Sahifada ishlashda davom etishingiz mumkin.' })
    let x = 0
    t.current = setInterval(() => {
      x += 4 + Math.random() * 9
      if (x >= 100) {
        clearInterval(t.current)
        const q = shaxsQatorlari(db, yil, bugun)
        const g = guruhla(q, (r) => `${r.mu?.id ?? '-'}|${r.s.mutaxassislikId}`)
        const rows: Qator[] = Array.from(g.entries()).map(([k, v]) => {
          const [muId, mutId] = k.split('|')
          const mu = db.muassasalar.find((m) => m.id === muId)
          const st = yigma(v)
          return { id: k, hudud: HUDUDLAR.find((h) => h.id === mu?.hududId)?.nomi ?? '—', muassasa: mu?.nomi ?? '—', turi: mu?.turi ?? '—', mut: MUTAXASSISLIKLAR.find((m) => m.id === mutId)?.nomi ?? mutId, n: st.n, bajarildi: st.bajarildi, xavf: st.xavf, qarzdor: st.qarzdor, foiz: ulush(st.bajarildi, st.n), kredit: st.kredit }
        }).sort((a, b) => a.hudud.localeCompare(b.hudud) || a.muassasa.localeCompare(b.muassasa))
        setP(100)
        setIsh(false)
        setTayyor(rows)
        toast({ turi: 'ok', sarlavha: 'Katta hisobot tayyor', matn: `${rows.length} qator. «Yuklab olish» tugmasini bosing.` })
        return
      }
      setP(x)
    }, 260)
  }

  const yukla = () => {
    if (!tayyor) return
    excelYukla(`katta-hisobot-${yil}`, 'Muassasa x mutaxassislik', [
      { kalit: 'hudud', nomi: 'Hudud', qiymat: (r: Qator) => r.hudud },
      { kalit: 'muassasa', nomi: 'Muassasa', qiymat: (r) => r.muassasa },
      { kalit: 'turi', nomi: 'Muassasa turi', qiymat: (r) => r.turi },
      { kalit: 'mut', nomi: 'Mutaxassislik', qiymat: (r) => r.mut },
      { kalit: 'n', nomi: 'Xodimlar', qiymat: (r) => (r.n < 10 ? '<10' : r.n) },
      { kalit: 'bajarildi', nomi: 'Bajarganlar', qiymat: (r) => r.bajarildi },
      { kalit: 'foiz', nomi: 'Bajarganlar, %', qiymat: (r) => r.foiz },
      { kalit: 'xavf', nomi: 'Xavf ostida', qiymat: (r) => r.xavf },
      { kalit: 'qarzdor', nomi: 'Qarzdorlar', qiymat: (r) => r.qarzdor },
      { kalit: 'kredit', nomi: 'Jami kredit', qiymat: (r) => r.kredit },
    ], tayyor)
    amal(A.eksportQayd, 'Katta hisobot: muassasa × mutaxassislik (Excel)', tayyor.length)
    toast({ turi: 'ok', matn: 'Fayl yuklab olindi. Eksport audit jurnaliga yozildi.' })
  }

  const bosqich = BOSQICH[Math.min(BOSQICH.length - 1, Math.floor(p / 20))]
  return (
    <Card>
      <CardH icon={<Cpu />} title="Katta hisobot (fon rejimida)" sub={`Muassasa × mutaxassislik kesimi, ${yil}-yil · 100 000 qatorgacha — 30 soniyagacha`}
        right={<Button v="primary" icon={ish ? <Loader size={16} /> : <Cpu size={16} />} disabled={ish} onClick={boshla}>{ish ? 'Tayyorlanmoqda…' : tayyor ? 'Qayta shakllantirish' : 'Fon rejimida boshlash'}</Button>} />
      <AnimatePresence mode="wait">
        {ish && (
          <motion.div key="ish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="row between small mb-8"><span>{bosqich}</span><b>{Math.round(p)}%</b></div>
            <Bar v={p} />
            <div className="xs muted mt-8">Vazifa navbatda bajarilmoqda; tayyor boʻlgach bildirishnoma chiqadi.</div>
          </motion.div>
        )}
        {!ish && tayyor && (
          <motion.div key="tayyor" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="row between wrap">
            <div className="row"><Holat h="ok">Tayyor</Holat><span className="small">{tayyor.length} qator · 10 dan kichik guruhlar «&lt;10» deb belgilangan</span></div>
            <Button v="success" icon={<Download size={16} />} onClick={yukla}>Yuklab olish (Excel)</Button>
          </motion.div>
        )}
        {!ish && !tayyor && <motion.div key="bosh" className="small muted">Hisobot hali shakllantirilmagan. Boshlash tugmasini bosing — jarayon fon rejimida bajariladi.</motion.div>}
      </AnimatePresence>
    </Card>
  )
}
