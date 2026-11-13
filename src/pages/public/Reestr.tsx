import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Code2, FileSpreadsheet, Layers } from 'lucide-react'
import { useStore } from '@/domain/store'
import * as A from '@/domain/amallar'
import type { AkkHolat, DasturVersiya, Provayder } from '@/domain/types'
import { DataTable, type Col } from '@/ui/DataTable'
import { Holat, Tabs, Button } from '@/ui'
import { Raqam } from '@/ui'
import { excelYukla, type Ustun } from '@/lib/eksport'
import { sana } from '@/lib/format'
import { holat, PROV_TURI, SHAKL } from '@/lib/holat'
import { PageBand, PublicLayout, Reveal, yangilanganMatn } from './_parts'
import { ReestrDrawer, apiJson, hududMatn, tasdiqDasturlar } from './_ReestrDrawer'

type PQ = Provayder & { soni: number }
type DQ = DasturVersiya & { prov: Provayder; kod: string }
const HOLATLAR: AkkHolat[] = ['akkreditatsiyalangan', 'shartli', 'korib_chiqilmoqda', 'ariza', 'toxtatilgan', 'bekor', 'muddati_tugagan']

export default function PublicReestr() {
  const db = useStore((s) => s.db)
  const userId = useStore((s) => s.userId)
  const toast = useStore((s) => s.toast)
  const [tab, setTab] = useState<'prov' | 'dastur'>('prov')
  const [tanlangan, setTanlangan] = useState<Provayder | null>(null)

  const provlar = useMemo<PQ[]>(() => db.provayderlar.map((p) => ({ ...p, soni: tasdiqDasturlar(db, p.id).length })), [db])
  const dasturlar = useMemo<DQ[]>(() => db.versiyalar.filter((v) => v.holat === 'tasdiqlangan').map((v) => {
    const d = db.dasturlar.find((x) => x.id === v.dasturId)!
    return { ...v, prov: A.provayder(db, d.providerId)!, kod: d.kod }
  }).filter((x) => x.prov), [db])

  const kpi = [
    { n: provlar.length, l: 'Reestrdagi provayderlar', t: '' },
    { n: provlar.filter((p) => p.holat === 'akkreditatsiyalangan').length, l: 'Akkreditatsiyalangan', t: 'ok' },
    { n: provlar.filter((p) => p.holat === 'shartli' || p.holat === 'korib_chiqilmoqda' || p.holat === 'ariza').length, l: 'Shartli / koʻrib chiqilmoqda', t: 'warn' },
    { n: provlar.filter((p) => ['toxtatilgan', 'bekor', 'muddati_tugagan'].includes(p.holat)).length, l: 'Toʻxtatilgan / muddati tugagan', t: 'err' },
    { n: dasturlar.length, l: 'Tasdiqlangan dasturlar', t: '' },
  ]

  const eksport = <T,>(nomi: string, u: Ustun<T>[], q: T[]) => {
    excelYukla(nomi, nomi, u, q)
    if (userId) useStore.getState().amal(A.eksportQayd, `${nomi} (Excel)`, q.length)
    toast({ turi: 'ok', matn: `${q.length} qator Excel faylga yuklandi.` })
  }

  const pCols: Col<PQ>[] = [
    { k: 'nomi', l: 'Provayder', r: (p) => <div><div className="b">{p.nomi}</div><div className="xs muted">{p.qisqa} · {p.turi === 'xorijiy' ? 'ID' : 'STIR'} {p.stir}</div></div>, sort: (p) => p.nomi },
    { k: 'turi', l: 'Turi', r: (p) => <span className="tag">{PROV_TURI[p.turi]}</span>, sort: (p) => p.turi },
    { k: 'hudud', l: 'Mamlakat / hudud', r: (p) => hududMatn(p), sort: (p) => hududMatn(p) },
    { k: 'holat', l: 'Holat', r: (p) => <Holat h={p.holat} />, sort: (p) => p.holat },
    { k: 'qaror', l: 'Qaror', r: (p) => p.qaror ? <div className="nowrap"><div className="mono small">№ {p.qaror.raqam}</div><div className="xs muted">{sana(p.qaror.sana)}</div></div> : <span className="muted">—</span>, sort: (p) => p.qaror?.sana ?? '' },
    { k: 'muddat', l: 'Muddat', r: (p) => <span className="nowrap">{p.qaror ? sana(p.qaror.muddat) : '—'}</span>, sort: (p) => p.qaror?.muddat ?? '' },
    { k: 'soni', l: 'Dasturlar', r: (p) => <span className="badge nodot brand">{p.soni}</span>, sort: (p) => p.soni, align: 'right' },
  ]
  const pExcel: Ustun<PQ>[] = [
    { kalit: 'nomi', nomi: 'Provayder', qiymat: (p) => p.nomi },
    { kalit: 'stir', nomi: 'STIR / ID', qiymat: (p) => p.stir },
    { kalit: 'turi', nomi: 'Turi', qiymat: (p) => PROV_TURI[p.turi] },
    { kalit: 'hudud', nomi: 'Mamlakat / hudud', qiymat: (p) => hududMatn(p) },
    { kalit: 'holat', nomi: 'Holat', qiymat: (p) => holat(p.holat)[0] },
    { kalit: 'qaror', nomi: 'Qaror raqami', qiymat: (p) => p.qaror?.raqam },
    { kalit: 'sana', nomi: 'Qaror sanasi', qiymat: (p) => sana(p.qaror?.sana) },
    { kalit: 'muddat', nomi: 'Amal qilish muddati', qiymat: (p) => sana(p.qaror?.muddat) },
    { kalit: 'soni', nomi: 'Akkreditatsiyalangan dasturlar', qiymat: (p) => p.soni },
  ]
  const dCols: Col<DQ>[] = [
    { k: 'nomi', l: 'Dastur', r: (v) => <div><div className="b">{v.nomi}</div><div className="xs muted mono">{v.kod} · v{v.versiya}</div></div>, sort: (v) => v.nomi },
    { k: 'prov', l: 'Provayder', r: (v) => <button className="btn ghost xs" onClick={(e) => { e.stopPropagation(); setTanlangan(v.prov) }}>{v.prov.qisqa}</button>, sort: (v) => v.prov.qisqa },
    { k: 'shakl', l: 'Shakl', r: (v) => SHAKL[v.shakl], sort: (v) => v.shakl },
    { k: 'soat', l: 'Soat', r: (v) => v.soatNazariy + v.soatAmaliy, sort: (v) => v.soatNazariy + v.soatAmaliy, align: 'right' },
    { k: 'kredit', l: 'Kredit', r: (v) => <span className="badge nodot brand">{v.tasdiqlanganKredit}</span>, sort: (v) => v.tasdiqlanganKredit ?? 0, align: 'right' },
    { k: 'muddat', l: 'Amal muddati', r: (v) => <span className="nowrap">{sana(v.amalMuddati)}</span>, sort: (v) => v.amalMuddati ?? '' },
    { k: 'pholat', l: 'Provayder holati', r: (v) => <Holat h={v.prov.holat} />, sort: (v) => v.prov.holat },
  ]
  const dExcel: Ustun<DQ>[] = [
    { kalit: 'kod', nomi: 'Kod', qiymat: (v) => v.kod },
    { kalit: 'nomi', nomi: 'Dastur', qiymat: (v) => v.nomi },
    { kalit: 'versiya', nomi: 'Versiya', qiymat: (v) => v.versiya },
    { kalit: 'prov', nomi: 'Provayder', qiymat: (v) => v.prov.nomi },
    { kalit: 'kredit', nomi: 'Kredit', qiymat: (v) => v.tasdiqlanganKredit },
    { kalit: 'muddat', nomi: 'Amal muddati', qiymat: (v) => sana(v.amalMuddati) },
  ]
  const namuna = provlar.find((p) => p.id === 'P01') ?? provlar[0]

  return (
    <PublicLayout>
      <PageBand crumb="Provayderlar reestri" icon={<Building2 />} title="Provayderlar va dasturlar milliy reestri"
        lead="Kim, qaysi dasturni, qaysi muddatgacha oʻtkazish huquqiga ega. Holatni faqat UKR markazining vakolatli xodimi qaror asosida oʻzgartiradi."
        source={`Reestr yangilangan: ${yangilanganMatn()}`} />
      <div className="pb-body">
        <div className="pb-wrap">
          <div className="rs-kpi">
            {kpi.map((k, i) => (
              <motion.div key={k.l} className={'rs-k ' + k.t} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i, duration: 0.5 }}>
                <div className="n"><Raqam n={k.n} /></div>
                <div className="l">{k.l}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24">
            <Tabs id="rs-tab" value={tab} onChange={setTab} tabs={[{ v: 'prov', l: 'Provayderlar', n: provlar.length, icon: <Building2 size={16} /> }, { v: 'dastur', l: 'Dasturlar', n: dasturlar.length, icon: <Layers size={16} /> }]} />
            {tab === 'prov' ? (
              <DataTable rows={provlar} cols={pCols} onRow={setTanlangan} search={(p) => `${p.nomi} ${p.qisqa} ${p.stir} ${p.qaror?.raqam ?? ''}`}
                filters={[
                  { k: 'turi', l: 'Turi', options: Object.entries(PROV_TURI).map(([v, l]) => ({ v, l })), get: (p) => p.turi },
                  { k: 'holat', l: 'Holat', options: HOLATLAR.map((h) => ({ v: h, l: holat(h)[0] })), get: (p) => p.holat },
                  { k: 'hudud', l: 'Hudud', options: Array.from(new Set(provlar.map(hududMatn))).sort().map((h) => ({ v: h, l: h })), get: (p) => hududMatn(p) },
                ]}
                tools={<Button size="sm" icon={<FileSpreadsheet />} onClick={() => eksport('provayderlar-reestri', pExcel, provlar)}>Excel</Button>}
                initialSort={{ k: 'nomi', dir: 1 }} />
            ) : (
              <DataTable rows={dasturlar} cols={dCols} onRow={(v) => setTanlangan(v.prov)} search={(v) => `${v.nomi} ${v.kod} ${v.prov.nomi}`}
                filters={[
                  { k: 'shakl', l: 'Shakl', options: Object.entries(SHAKL).map(([v, l]) => ({ v, l })), get: (v) => v.shakl },
                  { k: 'prov', l: 'Provayder', options: provlar.filter((p) => p.soni).map((p) => ({ v: p.id, l: p.qisqa })), get: (v) => v.prov.id },
                ]}
                tools={<Button size="sm" icon={<FileSpreadsheet />} onClick={() => eksport('dasturlar-reestri', dExcel, dasturlar)}>Excel</Button>}
                initialSort={{ k: 'nomi', dir: 1 }} />
            )}
            <p className="xs muted mt-8">Ochiq reestrda faqat tashkilot rekvizitlari va qarorlar koʻrsatiladi; shaxsga doir maʼlumot yoʻq.</p>
          </div>

          <Reveal className="pb-card mt-24">
            <div className="rs-api">
              <div>
                <div className="pb-kick"><Code2 size={14} /> Ochiq API</div>
                <h2 style={{ fontSize: 22 }}>API orqali ham mavjud</h2>
                <p className="sub mt-8" style={{ lineHeight: 1.6 }}>Ish beruvchilar, axborot tizimlari va jamoatchilik reestrni mashina oʻqiy oladigan formatda oladi. Javobda shaxsga doir maʼlumot yoʻq.</p>
                <div className="col gap-6 mt-16 small">
                  <code className="kbd">GET /api/ukr/v1/registry</code>
                  <code className="kbd">GET /api/ukr/v1/registry/providers/{'{id}'}</code>
                  <code className="kbd">GET /api/ukr/v1/registry/programs?status=approved</code>
                </div>
              </div>
              {namuna && <div className="rs-code"><span className="m">GET</span> /api/ukr/v1/registry?limit=1{'\n\n'}{JSON.stringify({ total: provlar.length, updated_at: new Date().toISOString().slice(0, 16), items: [apiJson(db, namuna)] }, null, 2)}</div>}
            </div>
          </Reveal>
        </div>
      </div>
      <ReestrDrawer db={db} p={tanlangan} onClose={() => setTanlangan(null)} />
    </PublicLayout>
  )
}
