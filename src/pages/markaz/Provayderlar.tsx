import { useMemo, useState, type ReactNode } from 'react'
import { Plus, Building2, History, BookOpen, Star, Globe2 } from 'lucide-react'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Holat, Modal, PageHeader, Button, DL, Timeline, Badge, Empty, KPI } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { PROV_TURI, holat as holatMatn } from '@/lib/holat'
import { HUDUDLAR } from '@/domain/malumotnoma'
import { hududNomi } from '@/shared/hooks'
import { useMarkaz, RolTugma, RAH_SABAB, manba, Sec, Qulf } from './_parts'
import { RoyxatModal, HolatModal } from './_provModal'

const AKK_H: T.AkkHolat[] = ['ariza', 'korib_chiqilmoqda', 'akkreditatsiyalangan', 'shartli', 'toxtatilgan', 'bekor', 'muddati_tugagan']

export default function MarkazProvayderlar() {
  const { db, rahbar, bugun } = useMarkaz()
  const [tanl, setTanl] = useState<string>()
  const [royxat, setRoyxat] = useState(false)
  const [holatP, setHolatP] = useState<T.Provayder>()
  const p = db.provayderlar.find((x) => x.id === tanl)

  const dasturSoni = useMemo(() => {
    const m = new Map<string, number>()
    db.dasturlar.forEach((d) => m.set(d.providerId, (m.get(d.providerId) ?? 0) + 1))
    return m
  }, [db.dasturlar])
  const pDasturlar = p ? db.dasturlar.filter((d) => d.providerId === p.id).map((d) => ({ d, v: db.versiyalar.find((v) => v.id === d.versiyalar[d.versiyalar.length - 1]) })) : []
  const tugaydi = db.provayderlar.filter((x) => x.qaror?.muddat && x.qaror.muddat >= bugun && x.qaror.muddat <= `${Number(bugun.slice(0, 4)) + 1}${bugun.slice(4)}` && ['akkreditatsiyalangan', 'shartli'].includes(x.holat)).length

  return (
    <>
      <PageHeader
        title="Provayderlar reestri"
        desc="Kim, qaysi dasturni, qaysi muddatgacha oʻtkazish huquqiga ega. Holat faqat UKR markazi qarori asosida oʻzgaradi."
        source={manba('Provayderlar reestri, Soliq va Litsenziyalash tizimlari')}
        actions={<Button v="primary" icon={<Plus />} onClick={() => setRoyxat(true)}>Provayder roʻyxatga olish</Button>}
      />
      <div className="grid g4 mb-16">
        <KPI icon={<Building2 />} label="Jami provayderlar" value={db.provayderlar.length} />
        <KPI icon={<Building2 />} label="Akkreditatsiya amalda" value={db.provayderlar.filter((x) => ['akkreditatsiyalangan', 'shartli'].includes(x.holat)).length} ton="ok" delay={0.05} />
        <KPI icon={<History />} label="12 oyda muddati tugaydi" value={tugaydi} ton="warn" delay={0.1} hint="Qayta akkreditatsiya eslatmasi yuboriladi" />
        <KPI icon={<Globe2 />} label="Xorijiy provayderlar" value={db.provayderlar.filter((x) => x.turi === 'xorijiy').length} ton="teal" delay={0.15} />
      </div>
      <DataTable
        rows={db.provayderlar}
        exportName="provayderlar-reestri"
        onRow={(r) => setTanl(r.id)}
        search={(r) => `${r.stir} ${r.nomi} ${r.qisqa} ${r.qaror?.raqam ?? ''}`}
        filters={[
          { k: 'turi', l: 'Turi', options: Object.entries(PROV_TURI).map(([v, l]) => ({ v, l })), get: (r) => r.turi },
          { k: 'holat', l: 'Holat', options: AKK_H.map((v) => ({ v, l: holatMatn(v)[0] })), get: (r) => r.holat },
          { k: 'hudud', l: 'Hudud', options: [...HUDUDLAR.map((h) => ({ v: h.id, l: h.nomi })), { v: 'xorij', l: 'Xorij' }], get: (r) => r.hududId ?? 'xorij' },
        ]}
        cols={[
          { k: 'stir', l: 'STIR / ID', r: (r) => <span className="mono xs">{r.stir}</span>, excel: (r) => r.stir },
          { k: 'nomi', l: 'Nomi', r: (r) => <div><div className="b small">{r.qisqa}</div><div className="xs muted">{r.nomi}</div></div>, sort: (r) => r.qisqa, excel: (r) => r.nomi },
          { k: 'turi', l: 'Turi', r: (r) => <span className="tag">{PROV_TURI[r.turi]}</span>, excel: (r) => PROV_TURI[r.turi] },
          { k: 'hudud', l: 'Hudud / mamlakat', r: (r) => <span className="small">{r.turi === 'xorijiy' ? r.mamlakat : hududNomi(r.hududId)}</span>, excel: (r) => (r.turi === 'xorijiy' ? r.mamlakat : hududNomi(r.hududId)) },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, sort: (r) => r.holat, excel: (r) => holatMatn(r.holat)[0] },
          { k: 'qaror', l: 'Qaror raqami', r: (r) => <span className="mono xs">{r.qaror?.raqam ?? '—'}</span>, excel: (r) => r.qaror?.raqam },
          { k: 'muddat', l: 'Muddat', r: (r) => <span className="small nowrap" style={{ color: r.qaror?.muddat && r.qaror.muddat < bugun ? 'var(--err)' : undefined }}>{sana(r.qaror?.muddat)}</span>, sort: (r) => r.qaror?.muddat ?? '', excel: (r) => r.qaror?.muddat },
          { k: 'dast', l: 'Dasturlar', align: 'right', r: (r) => dasturSoni.get(r.id) ?? 0, sort: (r) => dasturSoni.get(r.id) ?? 0, excel: (r) => dasturSoni.get(r.id) ?? 0 },
          { k: 'reyting', l: 'Reyting', align: 'right', r: (r) => (r.reyting ? <span className="row gap-4" style={{ justifyContent: 'flex-end' }}><Star size={13} color="var(--amber-500)" />{r.reyting.toFixed(1)}</span> : '—'), sort: (r) => r.reyting ?? 0, excel: (r) => r.reyting },
        ]}
      />

      <Modal open={!!p} onClose={() => setTanl(undefined)} drawer title={p?.qisqa ?? ''} sub={p && <span className="row gap-6"><Holat h={p.holat} /><span className="tag">{PROV_TURI[p.turi]}</span></span>}
        footer={p && (
          <RolTugma ruxsat={rahbar} sabab={RAH_SABAB} v="primary" onClick={() => setHolatP(p)}>Holatni oʻzgartirish (qaror asosida)</RolTugma>
        )}>
        {p && (
          <>
            {!rahbar && <Qulf>Holatni oʻzgartirish — faqat qaror qabul qiluvchi. Mutaxassis tayyorlaydi, rahbar qaror asosida kiritadi.</Qulf>}
            <Sec icon={<Building2 />} title="Provayder kartasi">
              <DL items={[
                ['Toʻliq nomi', p.nomi],
                [p.turi === 'xorijiy' ? 'Tashkilot ID' : 'STIR', <span className="mono">{p.stir}</span>],
                ['Mamlakat / hudud', p.turi === 'xorijiy' ? p.mamlakat : `${p.mamlakat}, ${hududNomi(p.hududId)}`],
                ['Manzil', p.manzil || '—'],
                ['Sayt', p.sayt ?? '—'],
                ['Litsenziya', p.litsenziya ? `№ ${p.litsenziya.raqam}, ${sana(p.litsenziya.sana)} → ${sana(p.litsenziya.muddat)}` : '—'],
                ...(p.xorijiyAkk ? ([['Xorijiy akkreditatsiya', `${p.xorijiyAkk.tashkilot} · ${p.xorijiyAkk.id}`], ['Rasmiy manba', <a href={p.xorijiyAkk.havola} target="_blank" rel="noreferrer">{p.xorijiyAkk.havola}</a>]] as [string, ReactNode][]) : []),
                ['Amaldagi qaror', p.qaror ? `${p.qaror.raqam} (${sana(p.qaror.sana)}) · ${sana(p.qaror.muddat)} gacha` : '—'],
                ['Filiallar', p.filiallar.length ? p.filiallar.join(', ') : '—'],
                ['Masʼul shaxslar', p.masullar.length ? p.masullar.map((m) => `${m.fio} (${m.lavozim}) ${m.telefon}`).join('; ') : '—'],
                ['Reyting', p.reyting ? `${p.reyting} / 5 (anonim soʻrovnoma)` : '—'],
                ['Reestrga kiritilgan', sanaVaqt(p.yaratilgan)],
              ]} />
            </Sec>
            <Sec icon={<BookOpen />} title={`Dasturlar (${pDasturlar.length})`}>
              {pDasturlar.length ? pDasturlar.map(({ d, v }) => (
                <div key={d.id} className="li">
                  <div className="grow">
                    <div className="small b">{v?.nomi}</div>
                    <div className="xs muted">{d.kod} · v{v?.versiya} · {v?.tasdiqlanganKredit ?? v?.soralganKredit} kredit{v?.amalMuddati ? ` · ${sana(v.amalMuddati)} gacha` : ''}</div>
                  </div>
                  {v && <Holat h={v.holat} />}
                </div>
              )) : <Empty title="Dasturlar yoʻq">Provayder dastur akkreditatsiyasi arizasini yuborgach shu yerda koʻrinadi.</Empty>}
            </Sec>
            <Sec icon={<History />} title="Holatlar tarixi">
              <Timeline items={[...p.tarix].reverse().map((t) => ({
                h: <span className="row gap-6 wrap"><Holat h={t.holat} />{t.qaror && <Badge>{t.qaror}</Badge>}</span>,
                m: `${sanaVaqt(t.sana)} · ${t.kim}${t.izoh ? ' — ' + t.izoh : ''}`,
                ton: ['toxtatilgan', 'bekor'].includes(t.holat) ? 'err' : ['akkreditatsiyalangan', 'shartli'].includes(t.holat) ? 'ok' : 'muted',
              }))} />
            </Sec>
          </>
        )}
      </Modal>
      <RoyxatModal open={royxat} onClose={() => setRoyxat(false)} onDone={(n) => setTanl(n.id)} />
      <HolatModal p={holatP} onClose={() => setHolatP(undefined)} />
    </>
  )
}
