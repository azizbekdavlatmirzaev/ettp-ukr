import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSignature, Award, ExternalLink, MessageSquareWarning, ClipboardCheck, Clock, SearchCheck } from 'lucide-react'
import { Alert, Badge, Button, Confirm, DL, Holat, KPI, Modal, PageHeader, Tabs, Empty } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { sanaVaqt } from '@/lib/format'
import { MurojaatModal } from '@/shared/Murojaat'
import { manba, useProv, Yopiq } from './_umumiy'

type Tab = 'tasdiqlashda' | 'tasdiqlangan' | 'tekshiruvda'

export default function ProvayderNatijalar() {
  const { db, natijalar, amal, toast, rahbar, user } = useProv()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('tasdiqlashda')
  const [tasIds, setTasIds] = useState<{ ids: string[]; clear?: () => void }>()
  const [hisobot, setHisobot] = useState<{ kredit: number; tekshiruvda: number; otmadi: number; ids: string[] }>()
  const [tanl, setTanl] = useState<string>()
  const [mur, setMur] = useState(false)
  const rows = useMemo(() => natijalar.filter((n) => n.holat === tab).sort((a, b) => (b.tasdiqlangan ?? b.kiritilgan).localeCompare(a.tasdiqlangan ?? a.kiritilgan)), [natijalar, tab])
  const sel = natijalar.find((n) => n.id === tanl)
  const y = (n: T.YakuniyNatija) => A.yozilish(db, n.yozilishId)!
  const o = (n: T.YakuniyNatija) => A.oqim(db, y(n).oqimId)!
  const sert = (n: T.YakuniyNatija) => db.sertifikatlar.find((s) => s.natijaId === n.id)
  const fio = (n: T.YakuniyNatija) => A.toliqFio(A.shaxs(db, y(n).personId)!)

  const tasdiqla = () => {
    if (!tasIds) return
    const r = amal(A.natijaTasdiqla, tasIds.ids)
    if (r) {
      setHisobot({ ...r, ids: tasIds.ids })
      tasIds.clear?.()
      toast({ turi: 'ok', sarlavha: `${tasIds.ids.length} ta natija tasdiqlandi (ERI)`, matn: `Kredit va sertifikat: ${r.kredit} · tekshiruvga: ${r.tekshiruvda} · oʻtmadi: ${r.otmadi}` })
    }
    setTasIds(undefined)
  }

  const cols: Col<T.YakuniyNatija>[] = [
    { k: 'fio', l: 'Tinglovchi', sort: fio, excel: fio, r: (n) => <span className="b">{fio(n)}</span> },
    { k: 'oqim', l: 'Oqim / dastur', sort: (n) => o(n).kod, excel: (n) => o(n).kod, r: (n) => <div style={{ maxWidth: 260 }}><div className="small">{A.versiya(db, o(n).versiyaId)?.nomi}</div><div className="xs muted mono">{o(n).kod}</div></div> },
    { k: 'ball', l: 'Ball', align: 'right', sort: (n) => n.ball, excel: (n) => n.ball, r: (n) => n.ball },
    { k: 'nat', l: 'Natija', sort: (n) => n.natija, excel: (n) => n.natija, r: (n) => <Holat h={n.natija} /> },
    { k: 'kredit', l: 'Kredit', align: 'right', excel: (n) => (n.natija === 'otdi' ? A.versiya(db, o(n).versiyaId)?.tasdiqlanganKredit ?? 0 : 0), r: (n) => (n.natija === 'otdi' ? <b>+{A.versiya(db, o(n).versiyaId)?.tasdiqlanganKredit ?? 0}</b> : '0') },
    tab === 'tasdiqlangan'
      ? { k: 'sert', l: 'Sertifikat', excel: (n) => { const s = sert(n); return s ? `${s.seriya} ${s.raqam}` : '' }, r: (n) => { const s = sert(n); return s ? <Badge ton="ok"><Award size={12} /> {s.seriya} {s.raqam}</Badge> : <span className="muted">—</span> } }
      : { k: 'sabab', l: tab === 'tekshiruvda' ? 'Tekshiruv sababi' : 'Izoh', excel: (n) => n.tekshiruvSababi?.join('; '), r: (n) => <span className="xs">{n.tekshiruvSababi?.join('; ') || <span className="muted">—</span>}</span> },
    { k: 'sana', l: tab === 'tasdiqlashda' ? 'Kiritilgan' : 'Tasdiqlangan', sort: (n) => n.tasdiqlangan ?? n.kiritilgan, excel: (n) => n.tasdiqlangan ?? n.kiritilgan, r: (n) => <span className="small nowrap">{sanaVaqt(n.tasdiqlangan ?? n.kiritilgan)}</span> },
  ]

  return (
    <>
      <PageHeader title="Natijalar" desc="Yakuniy natijalar: operator shakllantiradi, provayder rahbari ERI bilan tasdiqlaydi. Tasdiqlangan natija kredit va sertifikat uchun yagona asos." source={manba('Yakuniy natijalar, Kredit xizmati')} />
      <div className="grid g3 mb-16">
        <KPI icon={<Clock />} label="Tasdiqlash kutilmoqda" value={natijalar.filter((n) => n.holat === 'tasdiqlashda').length} ton="warn" onClick={() => setTab('tasdiqlashda')} />
        <KPI icon={<ClipboardCheck />} label="Tasdiqlangan" value={natijalar.filter((n) => n.holat === 'tasdiqlangan').length} ton="ok" delay={0.04} onClick={() => setTab('tasdiqlangan')} />
        <KPI icon={<SearchCheck />} label="UKR markazi tekshiruvida" value={natijalar.filter((n) => n.holat === 'tekshiruvda').length} delay={0.08} onClick={() => setTab('tekshiruvda')} />
      </div>
      {hisobot && (
        <Alert ton="ok" title="Tasdiqlash yakunlandi — hodisalar Kredit xizmatiga yuborildi" action={<Button size="sm" v="ghost" onClick={() => { setTab('tasdiqlangan'); setHisobot(undefined) }}>Sertifikatlarni koʻrish</Button>}>
          <div className="row wrap gap-6 mt-4">
            <Badge ton="ok">{hisobot.kredit} ta kredit + QR-sertifikat</Badge>
            <Badge ton="warn">{hisobot.tekshiruvda} ta tekshiruvda</Badge>
            <Badge ton="err">{hisobot.otmadi} ta oʻtmadi</Badge>
          </div>
        </Alert>
      )}
      <div className="mt-12">
        <Tabs id="nat-tab" value={tab} onChange={setTab} tabs={[
          { v: 'tasdiqlashda', l: 'Tasdiqlash kutilmoqda', n: natijalar.filter((n) => n.holat === 'tasdiqlashda').length },
          { v: 'tasdiqlangan', l: 'Tasdiqlangan', n: natijalar.filter((n) => n.holat === 'tasdiqlangan').length },
          { v: 'tekshiruvda', l: 'Tekshiruvda', n: natijalar.filter((n) => n.holat === 'tekshiruvda').length },
        ]} />
      </div>
      {tab === 'tasdiqlashda' && !rahbar && <div className="mt-12"><Alert ton="info" title="Kirituvchi va tasdiqlovchi turli shaxslar">Natijani provayder rahbari tasdiqlaydi. Siz holatini kuzatishingiz mumkin.</Alert></div>}
      <div className="mt-16">
        <DataTable
          key={tab}
          rows={rows}
          cols={cols}
          search={(n) => `${fio(n)} ${o(n).kod}`}
          filters={[{ k: 'nat', l: 'Natija', options: [{ v: 'otdi', l: 'Oʻtdi' }, { v: 'otmadi', l: 'Oʻtmadi' }], get: (n) => n.natija }]}
          exportName={`natijalar-${tab}`}
          selectable={tab === 'tasdiqlashda' && rahbar}
          onRow={(n) => setTanl(n.id)}
          bulk={(ids, clear) => (
            <Button size="sm" v="success" icon={<FileSignature />} onClick={() => setTasIds({ ids, clear })}>Tasdiqlash (ERI) · {ids.length}</Button>
          )}
          tools={tab === 'tasdiqlashda' && (rahbar ? <Button size="sm" v="success" icon={<FileSignature />} disabled={!rows.length} onClick={() => setTasIds({ ids: rows.map((r) => r.id) })}>Hammasini tasdiqlash</Button> : <Yopiq>Tasdiqlash — rahbar vakolati</Yopiq>)}
          empty={<Empty title="Natija yoʻq">{tab === 'tasdiqlashda' ? 'Tasdiqlashni kutayotgan natija yoʻq. Operator oqim sahifasida natijani shakllantiradi.' : 'Bu boʻlimda yozuv yoʻq.'}</Empty>}
        />
      </div>

      <Confirm open={!!tasIds} onClose={() => setTasIds(undefined)} title={`${tasIds?.ids.length ?? 0} ta natijani tasdiqlash`} okText="Tasdiqlash" ton="success" eri onOk={tasdiqla}>
        <p className="small sub">Tasdiqlangach «natija tasdiqlandi» hodisasi Kredit xizmatiga yuboriladi: avtomatik tekshiruv → kredit yozuvi → QR-sertifikat → Reestr. Oʻzingiz kiritgan natijani tasdiqlay olmaysiz.</p>
      </Confirm>

      <Modal drawer open={!!sel} onClose={() => setTanl(undefined)} title={sel ? fio(sel) : ''} sub="Yakuniy natija tafsiloti"
        footer={sel && (
          <>
            <Button v="ghost" icon={<ExternalLink />} onClick={() => nav(`/provayder/oqimlar/${o(sel).id}?tab=natija`)}>Oqim</Button>
            {sel.holat === 'tasdiqlangan' && <Button v="secondary" icon={<MessageSquareWarning />} onClick={() => setMur(true)}>Tasdiqlangan natijani oʻzgartirish soʻrovi</Button>}
            {sel.holat === 'tasdiqlashda' && rahbar && <Button v="success" icon={<FileSignature />} disabled={sel.kiritgan === user.id} onClick={() => setTasIds({ ids: [sel.id] })}>Tasdiqlash (ERI)</Button>}
          </>
        )}>
        {sel && (
          <div className="col gap-16">
            <DL items={[
              ['Holat', <Holat h={sel.holat} />],
              ['Natija', <Holat h={sel.natija} />],
              ['Ball', sel.ball],
              ['Dastur', A.versiya(db, o(sel).versiyaId)?.nomi],
              ['Oqim', o(sel).kod],
              ['Davomat', `${A.davomatFoizi(db, y(sel))}%`],
              ['Event ID', <span className="mono xs">{sel.eventId}</span>],
              ['Kiritgan', `${db.foydalanuvchilar.find((u) => u.id === sel.kiritgan)?.fio ?? sel.kiritgan} · ${sanaVaqt(sel.kiritilgan)}`],
              ['Tasdiqlagan', sel.tasdiqlovchi ? `${db.foydalanuvchilar.find((u) => u.id === sel.tasdiqlovchi)?.fio ?? sel.tasdiqlovchi} · ${sanaVaqt(sel.tasdiqlangan)}` : '—'],
              ['Sertifikat', sert(sel) ? `${sert(sel)!.seriya} ${sert(sel)!.raqam} · ${sert(sel)!.kredit} kredit` : '—'],
            ]} />
            {!!sel.tekshiruvSababi?.length && <Alert ton="warn" title="Sabablar">{sel.tekshiruvSababi.join('; ')}</Alert>}
            {sel.holat === 'tasdiqlangan' && <Alert ton="info">Tasdiqlangan natijani provayder oʻzgartira olmaydi. Oʻzgartirish soʻrovi faqat UKR markazi orqali koʻrib chiqiladi (kredit tuzatish tartibi).</Alert>}
          </div>
        )}
      </Modal>
      <MurojaatModal open={mur} onClose={() => setMur(false)} turi="baho" obyekt={sel ? { turi: 'YakuniyNatija', id: sel.id, nomi: `${fio(sel)} — ${A.versiya(db, o(sel).versiyaId)?.nomi} (${o(sel).kod}), ball ${sel.ball}` } : undefined} />
    </>
  )
}
