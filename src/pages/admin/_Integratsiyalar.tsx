import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plug, RefreshCw } from 'lucide-react'
import { useJoriy } from '@/shared/hooks'
import { Badge, Button, Card, CardH, Holat } from '@/ui'
import { nisbiy } from '@/lib/format'
import { integratsiyaTekshir } from './_amallar'

interface Int { kod: string; nomi: string; vazifa: string; asos: number; oxirgi: string }
// Kechikish qiymatlari — imitatsiya (ishlab chiqarishda monitoring agentidan)
const ROYXAT: Int[] = [
  { kod: 'reestr', nomi: 'Platforma Reestri', vazifa: 'Shaxs, mutaxassislik, toifa; sertifikat va kreditni uzatish', asos: 84, oxirgi: '2026-11-13T09:00:00+05:00' },
  { kod: 'oneid', nomi: 'OneID / MyID', vazifa: 'Kirish, kuchaytirilgan autentifikatsiya (ERI, MyID)', asos: 140, oxirgi: '2026-11-13T09:40:00+05:00' },
  { kod: 'soliq', nomi: 'Soliq qoʻmitasi', vazifa: 'Provayder STIR tekshiruvi', asos: 310, oxirgi: '2026-11-12T16:05:00+05:00' },
  { kod: 'lits', nomi: 'Litsenziyalash tizimi', vazifa: 'Taʼlim litsenziyasi holati', asos: 420, oxirgi: '2026-11-12T11:20:00+05:00' },
  { kod: 'hrm', nomi: 'HRM (Yagona milliy mehnat tizimi)', vazifa: 'Mehnat munosabatlari, ishdan boʻshash', asos: 260, oxirgi: '2026-11-13T06:00:00+05:00' },
  { kod: 'lms', nomi: 'LMS: Moodle / my.tipme.uz', vazifa: 'Onlayn natijalar (event_id bilan), eski kreditlarni koʻchirish', asos: 190, oxirgi: '2026-11-12T23:00:00+05:00' },
  { kod: 'sms', nomi: 'SMS / email shlyuzi', vazifa: 'Bildirishnomalar', asos: 65, oxirgi: '2026-11-13T09:52:00+05:00' },
  { kod: 'iip', nomi: 'IIP (idoralararo integratsiya platformasi)', vazifa: 'PSV, xorijiy soʻrovlar, HEMIS', asos: 520, oxirgi: '2026-11-13T08:30:00+05:00' },
]

export function Integratsiyalar() {
  const { amal, toast } = useJoriy()
  const [holat, setHolat] = useState<Record<string, { ms: number; vaqt: string }>>({})
  const [busy, setBusy] = useState('')
  const tekshir = async (i: Int) => {
    setBusy(i.kod)
    const ms = Math.round(i.asos * (0.7 + Math.random() * 0.9))
    await new Promise((r) => setTimeout(r, Math.min(900, ms)))
    setBusy('')
    const vaqt = new Date().toISOString()
    setHolat((h) => ({ ...h, [i.kod]: { ms, vaqt } }))
    amal(integratsiyaTekshir, i.nomi, ms)
    toast({ turi: ms > 1500 ? 'warn' : 'ok', matn: `${i.nomi}: javob ${ms} ms${ms > 1500 ? ' — sekin' : ''}.` })
  }
  const hammasi = async () => {
    for (const i of ROYXAT) await tekshir(i)
  }
  return (
    <Card>
      <CardH icon={<Plug />} title="Integratsiyalar holati" sub="Javob vaqti — imitatsiya; 30 soniyadan oshsa manba vaqtincha ishlamayotgan deb belgilanadi" right={<Button size="sm" icon={<RefreshCw size={15} />} loading={!!busy} onClick={hammasi}>Hammasini tekshirish</Button>} />
      <div className="grid g2">
        {ROYXAT.map((i, k) => {
          const h = holat[i.kod]
          const ms = h?.ms ?? i.asos
          const ton = ms > 1500 ? 'warn' : 'ok'
          return (
            <motion.div key={i.kod} className="card" style={{ padding: 14, boxShadow: 'none' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }}>
              <div className="row between">
                <div className="b small">{i.nomi}</div>
                <Holat ton={ton}>{ton === 'ok' ? 'Ishlayapti' : 'Sekin'}</Holat>
              </div>
              <div className="xs muted mt-4">{i.vazifa}</div>
              <div className="row between mt-8 wrap">
                <span className="xs">Oxirgi sinxron: <b>{nisbiy(h?.vaqt ?? i.oxirgi)}</b></span>
                <Badge ton={ms > 1500 ? 'warn' : ms > 400 ? 'info' : 'ok'}>{ms} ms</Badge>
                <Button size="xs" v="ghost" loading={busy === i.kod} onClick={() => tekshir(i)}>Tekshirish</Button>
              </div>
            </motion.div>
          )
        })}
      </div>
      <div className="xs muted mt-12">Tashqi tizim javob bermasa, soʻrov navbatda qoladi va avtomatik qayta yuboriladi; foydalanuvchiga «tasdiqlanishi kutilmoqda» va oxirgi maʼlumot sanasi koʻrsatiladi.</div>
    </Card>
  )
}
