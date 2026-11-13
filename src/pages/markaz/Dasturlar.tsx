import { useMemo, useState } from 'react'
import { FileDown, BookOpen, History, Layers, ShieldCheck } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Holat, Modal, PageHeader, Button, DL, Timeline, Badge, KPI } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { SHAKL, TADBIR, KURS_TURI, YONALISH, holat as holatMatn } from '@/lib/holat'
import { umumiyPdf } from '@/lib/eksport'
import { mutNomi } from '@/shared/hooks'
import { useMarkaz, manba, Sec } from './_parts'

interface Qator { id: string; v: T.DasturVersiya; d: T.Dastur; p?: T.Provayder; oxirgi: boolean }
const DH: T.DasturHolat[] = ['qoralama', 'korib_chiqishda', 'tasdiqlangan', 'rad_etilgan', 'arxiv']

export default function MarkazDasturlar() {
  const { db, amal, ok } = useMarkaz()
  const [tanl, setTanl] = useState<string>()
  const rows: Qator[] = useMemo(() => db.versiyalar.map((v) => {
    const d = db.dasturlar.find((x) => x.id === v.dasturId)!
    return { id: v.id, v, d, p: A.provayder(db, d?.providerId), oxirgi: d?.versiyalar[d.versiyalar.length - 1] === v.id }
  }).filter((r) => r.d), [db])
  const q = rows.find((r) => r.id === tanl)
  const tarix = q ? q.d.versiyalar.map((id) => A.versiya(db, id)!).filter(Boolean).reverse() : []
  const arizalar = q ? db.akkArizalar.filter((a) => a.versiyaId && q.d.versiyalar.includes(a.versiyaId)) : []
  const oqimlar = q ? db.oqimlar.filter((o) => o.versiyaId === q.v.id) : []

  const pdf = async () => {
    if (!q) return
    const v = q.v
    await umumiyPdf(`dastur-${q.d.kod}-v${v.versiya}`, `Dastur pasporti: ${v.nomi}`, [
      { t: 'Asosiy maʼlumot', qatorlar: [`Provayder: ${q.p?.nomi}`, `Kod: ${q.d.kod}, versiya ${v.versiya}`, `Holat: ${holatMatn(v.holat)[0]}`, `Kredit: soʻralgan ${v.soralganKredit}, tasdiqlangan ${v.tasdiqlanganKredit ?? '—'}`, `Amal muddati: ${sana(v.amalMuddati)}`] },
      { t: 'Tavsif', qatorlar: [`Maqsad: ${v.maqsad}`, `Tinglovchilar: ${v.tinglovchi}; mutaxassisliklar: ${v.mutaxassisliklar.map(mutNomi).join(', ') || 'barcha'}`, `Hajm: ${v.soatNazariy} soat nazariy + ${v.soatAmaliy} soat amaliy; shakl: ${SHAKL[v.shakl]}; tadbir: ${TADBIR[v.tadbirTuri]}`, `Turi: ${KURS_TURI[v.kursTuri]}, ${YONALISH[v.yonalish]}`] },
      { t: 'Oʻquv natijalari', qatorlar: v.natijalar.map((n, i) => `${i + 1}. ${n}`) },
    ])
    amal(A.eksportQayd, `Dastur pasporti ${q.d.kod} (PDF)`, 1)
    ok('Dastur pasporti PDF yuklandi. Eksport auditga yozildi.')
  }

  return (
    <>
      <PageHeader title="Dasturlar milliy reestri" desc="Barcha dasturlar va versiyalar: tasdiqlangan kredit, amal qilish muddati, holat. Tasdiqlangan kreditni provayder oʻzgartira olmaydi." source={manba('Dasturlar reestri (akkreditatsiya qarorlari)')} />
      <div className="grid g4 mb-16">
        <KPI icon={<BookOpen />} label="Dasturlar" value={db.dasturlar.length} />
        <KPI icon={<ShieldCheck />} label="Tasdiqlangan versiyalar" value={rows.filter((r) => r.v.holat === 'tasdiqlangan').length} ton="ok" delay={0.05} />
        <KPI icon={<Layers />} label="Koʻrib chiqishda" value={rows.filter((r) => r.v.holat === 'korib_chiqishda').length} ton="warn" delay={0.1} />
        <KPI icon={<History />} label="Jami versiyalar" value={rows.length} ton="teal" delay={0.15} />
      </div>
      <DataTable
        rows={rows}
        exportName="dasturlar-reestri"
        onRow={(r) => setTanl(r.id)}
        search={(r) => `${r.v.nomi} ${r.d.kod} ${r.p?.qisqa ?? ''}`}
        filters={[
          { k: 'holat', l: 'Holat', options: DH.map((v) => ({ v, l: holatMatn(v)[0] })), get: (r) => r.v.holat },
          { k: 'prov', l: 'Provayder', options: db.provayderlar.map((p) => ({ v: p.id, l: p.qisqa })), get: (r) => r.p?.id ?? '' },
          { k: 'tadbir', l: 'Tadbir', options: Object.entries(TADBIR).map(([v, l]) => ({ v, l })), get: (r) => r.v.tadbirTuri },
          { k: 'kt', l: 'Kurs turi', options: Object.entries(KURS_TURI).map(([v, l]) => ({ v, l })), get: (r) => r.v.kursTuri },
        ]}
        cols={[
          { k: 'prov', l: 'Provayder', r: (r) => <span className="small b">{r.p?.qisqa}</span>, sort: (r) => r.p?.qisqa ?? '', excel: (r) => r.p?.nomi },
          { k: 'kod', l: 'Kod', r: (r) => <span className="mono xs">{r.d.kod}</span>, excel: (r) => r.d.kod },
          { k: 'nomi', l: 'Nomi', r: (r) => <div><div className="small b">{r.v.nomi}</div><div className="xs muted">{TADBIR[r.v.tadbirTuri]} · {KURS_TURI[r.v.kursTuri]} · {YONALISH[r.v.yonalish]}</div></div>, sort: (r) => r.v.nomi, excel: (r) => r.v.nomi },
          { k: 'ver', l: 'Versiya', r: (r) => <span className="row gap-4">v{r.v.versiya}{!r.oxirgi && <span className="tag">eski</span>}</span>, excel: (r) => r.v.versiya },
          { k: 'kredit', l: 'Kredit (tasdiqlangan)', align: 'right', r: (r) => r.v.tasdiqlanganKredit ? <b>{r.v.tasdiqlanganKredit}</b> : <span className="muted" title="Soʻralgan">({r.v.soralganKredit})</span>, sort: (r) => r.v.tasdiqlanganKredit ?? 0, excel: (r) => r.v.tasdiqlanganKredit ?? '' },
          { k: 'muddat', l: 'Amal muddati', r: (r) => <span className="small nowrap">{sana(r.v.amalMuddati)}</span>, sort: (r) => r.v.amalMuddati ?? '', excel: (r) => r.v.amalMuddati },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.v.holat} />, sort: (r) => r.v.holat, excel: (r) => holatMatn(r.v.holat)[0] },
        ]}
      />
      <Modal open={!!q} onClose={() => setTanl(undefined)} drawer title={q?.v.nomi ?? ''} sub={q && <span className="row gap-6 wrap"><Holat h={q.v.holat} /><span className="tag">{q.d.kod} · v{q.v.versiya}</span><span className="xs muted">{q.p?.qisqa}</span></span>}
        footer={<Button v="secondary" icon={<FileDown />} onClick={pdf}>Pasport PDF</Button>}>
        {q && (
          <>
            <Sec icon={<BookOpen />} title="Dastur pasporti">
              <DL items={[
                ['Provayder', q.p?.nomi],
                ['Tasdiqlangan kredit', q.v.tasdiqlanganKredit ? <b>{q.v.tasdiqlanganKredit} kredit</b> : <span className="muted">Tasdiqlanmagan (soʻralgan: {q.v.soralganKredit})</span>],
                ['Amal muddati', sana(q.v.amalMuddati)],
                ['Maqsad', q.v.maqsad],
                ['Mutaxassisliklar', q.v.mutaxassisliklar.length ? q.v.mutaxassisliklar.map(mutNomi).join(', ') : 'Barcha mutaxassisliklar'],
                ['Tinglovchilar', q.v.tinglovchi === 'barchasi' ? 'Oliy va oʻrta' : q.v.tinglovchi === 'oliy' ? 'Oliy maʼlumotli' : 'Oʻrta maʼlumotli'],
                ['Hajm', `${q.v.soatNazariy} soat nazariy + ${q.v.soatAmaliy} soat amaliy`],
                ['Shakl / tadbir', `${SHAKL[q.v.shakl]} · ${TADBIR[q.v.tadbirTuri]}`],
                ['Kurs turi / yoʻnalish', `${KURS_TURI[q.v.kursTuri]} · ${YONALISH[q.v.yonalish]}`],
                ['Baholash', q.v.baholash.join(', ')],
                ['Oʻqituvchilar', q.v.oqituvchilar.join(', ')],
                ['Klinik baza', q.v.klinikBaza ?? '—'],
                ['Til', q.v.til],
                ['Oqimlar (shu versiyada)', `${oqimlar.length} ta`],
              ]} />
              <div className="mt-12 small b">Oʻquv natijalari</div>
              <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>{q.v.natijalar.map((n) => <li key={n}>{n}</li>)}</ul>
            </Sec>
            <Sec icon={<History />} title={`Versiyalar tarixi (${tarix.length})`}>
              <Timeline items={tarix.map((v) => ({
                h: <span className="row gap-6 wrap"><b>v{v.versiya}</b><Holat h={v.holat} />{v.tasdiqlanganKredit && <Badge ton="ok">{v.tasdiqlanganKredit} kredit</Badge>}{v.id === q.v.id && <Badge ton="brand">ochiq</Badge>}</span>,
                m: <span>{sanaVaqt(v.yaratilgan)}{v.amalMuddati ? ` · amal muddati ${sana(v.amalMuddati)}` : ''}{v.id !== q.v.id && <> · <a href="#" onClick={(e) => { e.preventDefault(); setTanl(v.id) }}>koʻrish</a></>}</span>,
                ton: v.holat === 'tasdiqlangan' ? 'ok' : v.holat === 'rad_etilgan' ? 'err' : 'muted',
              }))} />
              <div className="xs muted mt-8">Tasdiqlangan versiya mazmuni oʻzgarsa — yangi versiya yaratiladi; eski oqimlar eski versiyada qoladi.</div>
            </Sec>
            {arizalar.length > 0 && (
              <Sec icon={<ShieldCheck />} title="Akkreditatsiya arizalari">
                {arizalar.map((a) => (
                  <div key={a.id} className="li">
                    <div className="grow"><div className="small b">{a.raqam}</div><div className="xs muted">{a.qaror ? `Qaror ${a.qaror.raqam} — ${a.qaror.turi}` : `Muddat: ${sana(a.muddat)}`}</div></div>
                    <Holat h={a.holat} />
                  </div>
                ))}
              </Sec>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
