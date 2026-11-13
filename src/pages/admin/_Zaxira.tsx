import { useState } from 'react'
import { DatabaseBackup, Play, HardDrive, Scale } from 'lucide-react'
import { useStore } from '@/domain/store'
import { useJoriy } from '@/shared/hooks'
import { Alert, Bar, Button, Card, CardH, DL, Holat, Ring } from '@/ui'
import { sana, sanaVaqt, son } from '@/lib/format'
import { solishtirishIshga, tiklashSinovi } from './_amallar'

/** Fayl ombori, kunlik solishtirish va zaxira nusxalar */
export function OmborSolishtirish() {
  const { db, amal, toast, yil } = useJoriy()
  const [natija, setNatija] = useState<ReturnType<typeof solishtirishIshga> | null>(null)
  const foiz = db.sozlamalar.faylOmboriFoiz
  const oxirgi = db.hodisalar.find((h) => h.manbaId === 'solishtirish')
  const ishga = () => {
    const r = amal(solishtirishIshga, yil)
    if (r) {
      setNatija(r)
      toast({ turi: r.farq === 0 && r.takrorlar === 0 ? 'ok' : 'warn', matn: `Solishtirish yakunlandi: ${r.xodimlar} xodim, ${r.yozuvlar} yozuv, farq ${r.farq}, takror ${r.takrorlar}.` })
    }
  }
  return (
    <div className="grid g2">
      <Card>
        <CardH icon={<HardDrive />} title="Fayl ombori" sub="80% dan oshsa — ogohlantirish, katta fayllar vaqtincha cheklanadi" />
        <div className="row gap-16 wrap">
          <Ring v={foiz} max={100} size={120} color={foiz >= 80 ? 'var(--err)' : foiz >= 70 ? 'var(--warn)' : undefined}>
            <div className="center"><div className="b" style={{ fontSize: 24 }}>{foiz}%</div><div className="xs muted">band</div></div>
          </Ring>
          <div className="col grow" style={{ minWidth: 160 }}>
            <DL items={[['Hajm', `${son(Math.round(foiz * 20.48))} GB / 2 048 GB`], ['Sertifikat PDF', `${son(db.sertifikatlar.length)} ta`], ['Ilovalar', `${son(db.akkArizalar.reduce((a, x) => a + Object.keys(x.hujjatlar).length, 0) + db.tanOlish.reduce((a, t) => a + t.fayllar.length, 0))} ta`]]} />
          </div>
        </div>
        <div className="mt-12">{foiz >= 80 ? <Alert ton="err" title="Ombor 80% dan ortiq">Yangi katta fayllar yuklash vaqtincha cheklandi. Hajmni kengaytiring.</Alert> : <Alert ton="ok">Zaxira hajm yetarli. Ogohlantirish chegarasi — 80%.</Alert>}</div>
      </Card>
      <Card delay={0.05}>
        <CardH icon={<Scale />} title="Kunlik solishtirish" sub="Kredit balansi jurnaldan qayta hisoblanadi; farq boʻlsa masʼulga xabar" right={<Button size="sm" v="primary" icon={<Play size={15} />} onClick={ishga}>Hozir ishga tushirish</Button>} />
        <DL items={[
          ['Oxirgi solishtirish', oxirgi ? sanaVaqt(oxirgi.vaqt) : '—'],
          ['Natija', oxirgi?.izoh ?? '—'],
          ...(natija ? [['Xodimlar', son(natija.xodimlar)], ['Yozuvlar', son(natija.yozuvlar)], ['Jami kredit', son(natija.jami)], ['Farq', natija.farq === 0 ? <Holat ton="ok">0 — mos</Holat> : <Holat ton="err">{natija.farq}</Holat>], ['Takror kredit', natija.takrorlar === 0 ? <Holat ton="ok">yoʻq</Holat> : <Holat ton="err">{natija.takrorlar}</Holat>]] as [string, React.ReactNode][] : []),
        ]} />
        <div className="xs muted mt-8">Har kuni 03:00 da avtomatik ishlaydi.</div>
      </Card>
    </div>
  )
}

const nusxalar = (bugun: string) => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(bugun + 'T02:00:00')
  d.setDate(d.getDate() - i)
  return { id: `BK-${d.toISOString().slice(0, 10)}`, sana: d.toISOString().slice(0, 10), hajm: 41.2 - i * 0.18 }
})

export function Zaxira() {
  const { amal, toast, bugun } = useJoriy()
  const [p, setP] = useState(-1)
  const [natija, setNatija] = useState<ReturnType<typeof tiklashSinovi> | null>(null)
  const ns = nusxalar(bugun)
  const sinov = (id: string) => {
    setNatija(null)
    setP(0)
    let x = 0
    const t = setInterval(() => {
      x += 12 + Math.random() * 14
      if (x >= 100) {
        clearInterval(t)
        setP(-1)
        const r = amal(tiklashSinovi, id)
        if (r) {
          setNatija(r)
          toast({ turi: 'ok', sarlavha: 'Tiklash sinovi muvaffaqiyatli', matn: `${id}: kredit jurnali ${r.jurnalYozuvlari} yozuv, balans farqi ${r.balansFarqi}. Audit jurnaliga yozildi.` })
        }
        return
      }
      setP(x)
    }, 220)
  }
  const oxirgiSinov = useStore((s) => s.db.audit.find((a) => a.amal === 'Zaxiradan tiklash sinovi oʻtkazildi'))
  return (
    <Card>
      <CardH icon={<DatabaseBackup />} title="Zaxira nusxalar" sub="Har kuni 02:00 · RPO 15 daqiqa (kredit jurnali va qarorlar, WAL) · RTO 4 soat · oyiga ≥ 1 tiklash sinovi"
        right={<Button size="sm" v="primary" icon={<Play size={15} />} disabled={p >= 0} onClick={() => sinov(ns[0].id)}>Tiklash sinovi</Button>} />
      {p >= 0 && <div className="mb-12"><div className="row between small mb-8"><span>Sinov muhitiga tiklanmoqda: {ns[0].id}</span><b>{Math.round(p)}%</b></div><Bar v={p} /></div>}
      {natija && <div className="mb-12"><Alert ton="ok" title={`Tiklash sinovi: ${natija.nusxa}`}>Jurnal yozuvlari: {natija.jurnalYozuvlari} · audit: {natija.auditYozuvlari} · balans farqi: {natija.balansFarqi} · davomiylik: {natija.davomiylik} (RTO {natija.rto})</Alert></div>}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Nusxa</th><th>Sana</th><th style={{ textAlign: 'right' }}>Hajm</th><th>Holat</th><th /></tr></thead>
          <tbody>
            {ns.map((n) => (
              <tr key={n.id}>
                <td className="mono small">{n.id}</td>
                <td className="small">{sana(n.sana)}, 02:00</td>
                <td style={{ textAlign: 'right' }} className="small">{n.hajm.toFixed(1)} GB</td>
                <td><Holat ton="ok">Tekshirilgan (SHA-256)</Holat></td>
                <td><Button size="xs" v="ghost" disabled={p >= 0} onClick={() => sinov(n.id)}>Sinov</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="xs muted mt-8">Oxirgi tiklash sinovi: {oxirgiSinov ? sanaVaqt(oxirgiSinov.sana) : 'bu oy oʻtkazilmagan'} · Prototipda tiklash imitatsiya qilinadi (haqiqiy maʼlumot oʻzgarmaydi).</div>
    </Card>
  )
}
