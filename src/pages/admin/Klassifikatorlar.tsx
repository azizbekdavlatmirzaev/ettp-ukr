import { useMemo, useState } from 'react'
import { RefreshCw, ListTree } from 'lucide-react'
import { HUDUDLAR, MUTAXASSISLIKLAR, BAHOLASH_MEZONLARI, AKK_HUJJATLAR, KONIKMALAR } from '@/domain/malumotnoma'
import { amaldagiQoida } from '@/domain/kredit'
import { useJoriy, hududNomi, mutNomi } from '@/shared/hooks'
import { DataTable, type Col } from '@/ui/DataTable'
import { Alert, Button, PageHeader, Tabs } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { TADBIR } from '@/lib/holat'
import { klassifikatorSinxron } from './_amallar'

type Tab = 'mut' | 'hudud' | 'muassasa' | 'tadbir' | 'mezon' | 'akk' | 'konikma'
type K = { id: string; [k: string]: string | number }

const ust = (k: string, l: string, right = false): Col<K> => ({ k, l, r: (r) => (k === 'id' || k === 'kod' ? <span className="mono small">{r[k]}</span> : r[k]), sort: (r) => r[k], excel: (r) => r[k], align: right ? 'right' : undefined })

export default function AdminKlassifikatorlar() {
  const { db, amal, toast } = useJoriy()
  const [tab, setTab] = useState<Tab>('mut')
  const [sinx, setSinx] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const T = useMemo(() => {
    const q = amaldagiQoida(db.qoidalar, new Date().toISOString()) ?? db.qoidalar[0]
    const xodimSoni = (mid: string) => db.shaxslar.filter((s) => s.mutaxassislikId === mid).length
    const r: Record<Tab, { nomi: string; manba: string; rows: K[]; cols: Col<K>[] }> = {
      mut: { nomi: 'Mutaxassisliklar', manba: 'cs.egov.uz — tibbiy mutaxassisliklar klassifikatori', rows: MUTAXASSISLIKLAR.map((m) => ({ id: m.id, nomi: m.nomi, daraja: m.daraja === 'oliy' ? 'Oliy' : 'Oʻrta', guruh: m.guruh, xodim: xodimSoni(m.id) })), cols: [ust('id', 'Kod'), ust('nomi', 'Nomi'), ust('daraja', 'Maʼlumot darajasi'), ust('guruh', 'Guruh'), ust('xodim', 'Reestrdagi xodimlar', true)] },
      hudud: { nomi: 'Hududlar', manba: 'cs.egov.uz — SOATO', rows: HUDUDLAR.map((h) => ({ id: h.id, nomi: h.nomi, muassasa: db.muassasalar.filter((m) => m.hududId === h.id).length, prov: db.provayderlar.filter((p) => p.hududId === h.id).length })), cols: [ust('id', 'Kod'), ust('nomi', 'Nomi'), ust('muassasa', 'Muassasalar', true), ust('prov', 'Provayderlar', true)] },
      muassasa: { nomi: 'Muassasalar', manba: 'Muassasalar reestri (SSV)', rows: db.muassasalar.map((m) => ({ id: m.id, nomi: m.nomi, turi: m.turi, hudud: hududNomi(m.hududId), bolim: m.bolimlar.length })), cols: [ust('id', 'Kod'), ust('nomi', 'Nomi'), ust('turi', 'Turi'), ust('hudud', 'Hudud'), ust('bolim', 'Boʻlimlar', true)] },
      tadbir: { nomi: 'Tadbir turlari', manba: 'UKR Nizomi; limitlar — amaldagi kredit qoidasi', rows: Object.entries(TADBIR).map(([k, v]) => ({ id: k, nomi: v, limit: k === 'mustaqil' ? `${q.params.mustaqilLimit} kredit/yil` : k === 'konferensiya' ? `${q.params.konferensiyaLimit} kredit/yil` : 'cheklanmagan', qoida: q.versiya })), cols: [ust('id', 'Kod'), ust('nomi', 'Nomi'), ust('limit', 'Yillik limit'), ust('qoida', 'Qoida versiyasi')] },
      mezon: { nomi: 'Baholash mezonlari', manba: 'Akkreditatsiya ekspertizasi reglamenti', rows: BAHOLASH_MEZONLARI.map((m) => ({ id: m.kod, kod: m.kod, nomi: m.nomi, shkala: '1–5 ball' })), cols: [ust('kod', 'Kod'), ust('nomi', 'Mezon'), ust('shkala', 'Shkala')] },
      akk: { nomi: 'Akkreditatsiya hujjatlari', manba: 'Akkreditatsiya reglamenti', rows: (['provayder', 'dastur'] as const).flatMap((t) => AKK_HUJJATLAR[t].map((h) => ({ id: `${t}-${h.kod}`, turi: t === 'provayder' ? 'Provayder' : 'Dastur / qayta', kod: h.kod, nomi: h.nomi, majburiy: h.majburiy ? 'Majburiy' : 'Ixtiyoriy' }))), cols: [ust('turi', 'Ariza turi'), ust('kod', 'Kod'), ust('nomi', 'Hujjat'), ust('majburiy', 'Talab')] },
      konikma: { nomi: 'Koʻnikmalar (logbook)', manba: 'Rezidentura dasturi — kardiologiya', rows: Object.entries(KONIKMALAR).flatMap(([mid, ks]) => ks.map((k) => ({ id: k.kod, kod: k.kod, nomi: k.nomi, mut: mutNomi(mid), minimal: k.minimal, majburiy: k.majburiy ? 'Majburiy' : 'Ixtiyoriy' }))), cols: [ust('kod', 'Kod'), ust('nomi', 'Koʻnikma'), ust('mut', 'Mutaxassislik'), ust('minimal', 'Minimal soni', true), ust('majburiy', 'Talab')] },
    }
    return r
  }, [db])

  const j = T[tab]
  const sinxronla = async () => {
    setBusy(true)
    await new Promise((r) => setTimeout(r, 900))
    setBusy(false)
    amal(klassifikatorSinxron, j.nomi, j.rows.length)
    const vaqt = new Date().toISOString()
    setSinx({ ...sinx, [tab]: vaqt })
    toast({ turi: 'ok', sarlavha: `${j.nomi} sinxronlandi`, matn: `${j.rows.length} ta yozuv tekshirildi, oʻzgarish yoʻq. Amal audit jurnaliga yozildi.` })
  }

  return (
    <>
      <PageHeader title="Klassifikatorlar" desc="UKR maʼlumotnomalari. Davlat klassifikatorlari cs.egov.uz dan sinxronlanadi — qoʻlda tahrirlanmaydi." source={`Manba: ${j.manba} · oxirgi sinxronlash: ${sanaVaqt(sinx[tab] ?? '2026-11-13T03:00:00+05:00')}`}
        actions={<Button v="primary" icon={<RefreshCw size={16} />} loading={busy} onClick={sinxronla}>Sinxronlash</Button>} />
      <Tabs id="kl" value={tab} onChange={setTab} tabs={(Object.keys(T) as Tab[]).map((k) => ({ v: k, l: T[k].nomi, n: T[k].rows.length }))} />
      <div className="mt-16 mb-16"><Alert ton="info" title={<span className="row gap-6"><ListTree size={15} /> {j.nomi}</span>}>Roʻyxat faqat oʻqish uchun: {j.manba}. Oʻzgartirish manba tizimida kiritiladi va keyingi sinxronlashda (har kuni 03:00) yoki «Sinxronlash» tugmasi orqali keladi. Yangi klassifikator qiymati oʻtgan kredit yozuvlarini oʻzgartirmaydi.</Alert></div>
      <DataTable<K> key={tab} rows={j.rows} cols={j.cols} search={(r) => Object.values(r).join(' ')} exportName={`klassifikator-${tab}`} pageSize={15} />
    </>
  )
}
