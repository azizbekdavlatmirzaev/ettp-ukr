import { useMemo } from 'react'
import { TrendingUp, PieChart, MapPinned, Stethoscope, Wallet } from 'lucide-react'
import type { DB } from '@/domain/db'
import { HUDUDLAR, MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { Card, CardH, Empty } from '@/ui'
import { AreaCh, BarCh, Donut, Legenda } from '@/ui/charts'
import { MOLIYA } from '@/lib/holat'
import { pul } from '@/lib/format'
import { OY, TINGLOVCHI_HOLAT, guruhla, ulush, yilOqimlari, yigma, type Filtr, type ShaxsQator } from './_hisob'

const HOLAT_RANG = ['#3ba776', '#1170a8', '#e8a33d', '#d1495b']
const qisqa = (s: string) => s.replace(' viloyati', '').replace(' Respublikasi', '').replace(' shahri', ' sh.')

export function MonitoringGrafiklar({ db, q, f }: { db: DB; q: ShaxsQator[]; f: Filtr }) {
  const d = useMemo(() => {
    const ids = new Set(q.map((r) => r.s.id))
    const oylik = OY.map((x, i) => ({ x, kredit: 0, yozuvlar: 0, i }))
    db.jurnal.filter((j) => j.yil === f.yil && j.miqdor > 0 && ids.has(j.personId)).forEach((j) => {
      const m = Number(j.sana.slice(5, 7)) - 1
      if (oylik[m]) {
        oylik[m].kredit += j.miqdor
        oylik[m].yozuvlar++
      }
    })
    const st = yigma(q)
    const holat = [{ name: 'Talab bajarildi', value: st.bajarildi }, { name: 'Reja boʻyicha', value: st.yolda }, { name: 'Xavf ostida', value: st.xavf }, { name: 'Qarzdor (yil yakuni)', value: st.qarzdorHolat }]
    const hg = guruhla(q, (r) => r.hudud)
    const hudud = HUDUDLAR.filter((h) => hg.has(h.id)).map((h) => {
      const y = yigma(hg.get(h.id)!)
      return { x: qisqa(h.nomi), bajarildi: y.bajarildi, yolda: y.yolda, xavf: y.xavf + y.qarzdorHolat }
    })
    const mg = guruhla(q, (r) => r.s.mutaxassislikId)
    const mut = MUTAXASSISLIKLAR.filter((m) => mg.has(m.id)).map((m) => {
      const y = yigma(mg.get(m.id)!)
      return { x: m.nomi, ulush: ulush(y.bajarildi, y.n), n: y.n }
    }).sort((a, b) => b.ulush - a.ulush)
    const oqimlar = yilOqimlari(db, f)
    const moliya = (['byudjet', 'ish_beruvchi', 'shaxsiy', 'grant'] as const).map((k) => {
      const os = oqimlar.filter((o) => o.moliya === k)
      const fakt = os.reduce((a, o) => a + db.yozilishlar.filter((y) => y.oqimId === o.id && TINGLOVCHI_HOLAT.includes(y.holat)).length, 0)
      const summa = os.reduce((a, o) => a + o.narx * db.yozilishlar.filter((y) => y.oqimId === o.id && TINGLOVCHI_HOLAT.includes(y.holat)).length, 0)
      return { x: MOLIYA[k], reja: os.reduce((a, o) => a + o.orinlar, 0), fakt, summa, oqim: os.length }
    }).filter((m) => m.oqim > 0)
    return { oylik, holat, hudud, mut, moliya }
  }, [db, q, f])

  return (
    <>
      <div className="grid g-main mb-16">
        <Card>
          <CardH icon={<TrendingUp />} title="Oylar boʻyicha yozilgan kreditlar" sub={`${f.yil}-yil · kredit jurnali (bekor qilishlarsiz)`} />
          <AreaCh data={d.oylik} keys={['kredit', 'yozuvlar']} names={{ kredit: 'Kredit', yozuvlar: 'Yozuvlar soni' }} height={250} />
        </Card>
        <Card delay={0.05}>
          <CardH icon={<PieChart />} title="Yillik holat taqsimoti" sub="Xodimlar soni" />
          <Donut data={d.holat} colors={HOLAT_RANG} height={200} center={<div><div className="stat-big">{q.length}</div><div className="xs muted">xodim</div></div>} />
          <Legenda items={d.holat.map((h) => ({ l: h.name, v: h.value }))} colors={HOLAT_RANG} />
        </Card>
      </div>
      <div className="grid g2 mb-16">
        <Card>
          <CardH icon={<MapPinned />} title="Hududlar kesimida" sub="Xodimlar holati (soni)" />
          {d.hudud.length ? <BarCh data={d.hudud} keys={['bajarildi', 'yolda', 'xavf']} names={{ bajarildi: 'Bajardi', yolda: 'Reja boʻyicha', xavf: 'Xavf / qarzdor' }} stacked horizontal colors={HOLAT_RANG} height={Math.max(220, d.hudud.length * 30)} /> : <Empty title="Maʼlumot yoʻq" />}
        </Card>
        <Card delay={0.05}>
          <CardH icon={<Stethoscope />} title="Mutaxassisliklar kesimida" sub="Talabni bajarganlar ulushi, %" />
          {d.mut.length ? <BarCh data={d.mut} keys={['ulush']} names={{ ulush: 'Bajarganlar, %' }} horizontal colors={['#0fa3a3']} height={Math.max(220, d.mut.length * 28)} /> : <Empty title="Maʼlumot yoʻq" />}
        </Card>
      </div>
      <Card className="mb-16">
        <CardH icon={<Wallet />} title="Moliyalashtirish: reja va fakt" sub={`${f.yil}-yil oqimlari · reja — oʻrinlar, fakt — qabul qilingan tinglovchilar`} />
        {d.moliya.length ? (
          <div className="grid g-main">
            <BarCh data={d.moliya} keys={['reja', 'fakt']} names={{ reja: 'Reja (oʻrinlar)', fakt: 'Fakt (tinglovchilar)' }} height={240} />
            <div className="col">
              {d.moliya.map((m) => (
                <div key={m.x} className="li">
                  <div className="grow"><div className="b small">{m.x}</div><div className="xs muted">{m.oqim} oqim · {m.fakt}/{m.reja} oʻrin ({ulush(m.fakt, m.reja)}%)</div></div>
                  <span className="small b nowrap">{m.summa ? pul(m.summa) : '—'}</span>
                </div>
              ))}
              <div className="xs muted">Summa — shaxsiy mablagʻ hisobidan toʻlangan kurslar (narx × tinglovchi). Byudjet va ish beruvchi summalari billingdan keladi (prototipda yoʻq).</div>
            </div>
          </div>
        ) : <Empty title={`${f.yil}-yilda oqimlar yoʻq`}>Boshqa yil yoki hududni tanlang.</Empty>}
      </Card>
    </>
  )
}
