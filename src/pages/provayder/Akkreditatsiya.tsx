import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ShieldCheck, AlertTriangle, RefreshCw, FileText } from 'lucide-react'
import { Alert, Bar, Button, Card, CardH, Field, Holat, Modal, PageHeader, Sel, Seg, Empty, Badge } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import * as A from '@/domain/amallar'
import { AKK_HUJJATLAR } from '@/domain/malumotnoma'
import type * as T from '@/domain/types'
import { kunFarq, sana } from '@/lib/format'
import { AKK_IDX, AKK_TURI, STEP_AKK, manba, oxirgiVersiya, useProv } from './_umumiy'
import { AkkTahrir } from './_AkkTahrir'

export default function ProvayderAkkreditatsiya() {
  const { db, p, dasturlar, versiyalar, amal, toast, bugun } = useProv()
  const [sp, setSp] = useSearchParams()
  const [yangi, setYangi] = useState(false)
  const [turi, setTuri] = useState<T.AkkAriza['turi']>('dastur')
  const [vId, setVId] = useState('')
  const arizalar = useMemo(() => db.akkArizalar.filter((a) => a.providerId === p.id).sort((a, b) => b.yaratilgan.localeCompare(a.yaratilgan)), [db, p.id])
  const tanl = arizalar.find((a) => a.id === sp.get('ariza'))
  const och = (id?: string) => setSp(id ? { ariza: id } : {}, { replace: true })

  const qolgan = p.qaror?.muddat ? kunFarq(p.qaror.muddat, bugun) : undefined
  const tugayotgan = versiyalar.filter((v) => v.holat === 'tasdiqlangan' && v.amalMuddati && kunFarq(v.amalMuddati, bugun) < 180)
  const variantlar = turi === 'dastur'
    ? dasturlar.map((d) => oxirgiVersiya(db, d)).filter((v) => ['qoralama', 'rad_etilgan'].includes(v.holat))
    : versiyalar.filter((v) => v.holat === 'tasdiqlangan')

  const yarat = (t: T.AkkAriza['turi'], versiyaId?: string) => {
    const a = amal(A.akkArizaYarat, t, versiyaId)
    if (a) {
      toast({ turi: 'ok', sarlavha: `Ariza ${a.raqam}`, matn: t === 'qayta' ? 'Oldingi arizadagi hujjatlar nusxalandi — yangilanganlarini almashtiring.' : 'Majburiy hujjatlarni yuklang.' })
      setYangi(false)
      och(a.id)
    }
  }

  const cols: Col<T.AkkAriza>[] = [
    { k: 'raqam', l: 'Ariza', sort: (a) => a.raqam, excel: (a) => a.raqam, r: (a) => <div><div className="b mono">{a.raqam}</div><div className="xs muted">{AKK_TURI[a.turi]}</div></div> },
    { k: 'obyekt', l: 'Obyekt', excel: (a) => A.versiya(db, a.versiyaId)?.nomi ?? p.nomi, r: (a) => <span className="small">{a.versiyaId ? `${A.versiya(db, a.versiyaId)?.nomi} (v${A.versiya(db, a.versiyaId)?.versiya})` : p.qisqa}</span> },
    { k: 'bosq', l: 'Bosqich', sort: (a) => AKK_IDX[a.holat], excel: (a) => a.holat, r: (a) => <div style={{ minWidth: 130 }}><Holat h={a.holat} /><div className="mt-4"><Bar thin v={AKK_IDX[a.holat] + 1} max={STEP_AKK.length} ton={a.holat === 'kamchilik' ? 'err' : a.holat === 'yakunlandi' ? 'ok' : undefined} /></div></div> },
    { k: 'hujjat', l: 'Hujjatlar', align: 'right', r: (a) => { const m = AKK_HUJJATLAR[a.turi].filter((h) => h.majburiy); return `${m.filter((h) => a.hujjatlar[h.kod]).length}/${m.length}` } },
    { k: 'muddat', l: 'Muddat', sort: (a) => a.muddat, excel: (a) => a.muddat, r: (a) => (a.muddat ? <span className="small">{sana(a.muddat)}</span> : <span className="muted">—</span>) },
    { k: 'qaror', l: 'Qaror', excel: (a) => a.qaror?.raqam, r: (a) => (a.qaror ? <Badge ton={a.qaror.turi === 'rad' ? 'err' : 'ok'}>{a.qaror.raqam}</Badge> : <span className="muted">—</span>) },
  ]

  return (
    <>
      <PageHeader title="Akkreditatsiya" desc="Provayder va dastur akkreditatsiyasi: ariza → toʻliqlik → ekspertiza → komissiya → qaror. Ariza ERI bilan yuboriladi; reestr qaror asosida avtomatik yangilanadi." source={manba('Akkreditatsiya arizalari, Provayderlar reestri')}
        actions={<Button v="primary" icon={<Plus />} onClick={() => { setTuri('dastur'); setVId(''); setYangi(true) }}>Yangi ariza</Button>} />

      <div className="grid g2 mb-16">
        <Card>
          <CardH icon={<ShieldCheck />} title="Joriy akkreditatsiya" sub={p.nomi} right={<Holat h={p.holat} />} />
          {p.qaror ? (
            <div className="col gap-6">
              <div className="row wrap between small"><span>Qaror <b>{p.qaror.raqam}</b> · {sana(p.qaror.sana)}</span><span>Muddat: <b>{sana(p.qaror.muddat)}</b></span></div>
              <Bar v={Math.max(0, qolgan ?? 0)} max={Math.max(1, kunFarq(p.qaror.muddat, p.qaror.sana))} ton={qolgan !== undefined && qolgan < 180 ? 'warn' : 'ok'} />
              <div className="xs muted">{qolgan !== undefined && qolgan >= 0 ? `${qolgan} kun qoldi` : 'Muddat tugagan'} · tugashidan 180 kun oldin eslatma yuboriladi</div>
              {qolgan !== undefined && qolgan < 180 && <Alert ton="warn" title="Qayta akkreditatsiya vaqti" action={<Button size="sm" v="primary" icon={<RefreshCw />} onClick={() => yarat('provayder')}>Ariza ochish</Button>}>Muddat tugagach yangi qabul va yangi kreditlar toʻxtaydi; ilgari berilgan sertifikatlar amalda qoladi.</Alert>}
            </div>
          ) : (
            <Empty title="Akkreditatsiya qarori yoʻq" action={<Button v="primary" onClick={() => yarat('provayder')}>Provayder akkreditatsiyasiga ariza</Button>}>Tashkilot akkreditatsiyasiz oqim ocha olmaydi.</Empty>
          )}
        </Card>
        <Card delay={0.05}>
          <CardH icon={<AlertTriangle />} title="Dasturlar muddati" sub="Amal muddati 180 kundan kam qolgan tasdiqlangan dasturlar" />
          {tugayotgan.length ? tugayotgan.map((v) => (
            <div key={v.id} className="li">
              <div className="ic warn"><FileText /></div>
              <div className="grow"><div className="b small">{v.nomi}</div><div className="xs muted">{sana(v.amalMuddati)} · {kunFarq(v.amalMuddati!, bugun)} kun</div></div>
              <Button size="sm" v="soft" icon={<RefreshCw />} onClick={() => yarat('qayta', v.id)}>Qayta akkreditatsiya</Button>
            </div>
          )) : <div className="row gap-6 small muted"><ShieldCheck size={16} color="var(--ok)" /> Barcha tasdiqlangan dasturlar muddati 180 kundan koʻp ({versiyalar.filter((v) => v.holat === 'tasdiqlangan').length} ta).</div>}
        </Card>
      </div>

      <DataTable
        rows={arizalar}
        cols={cols}
        title="Arizalar"
        search={(a) => `${a.raqam} ${A.versiya(db, a.versiyaId)?.nomi ?? ''}`}
        filters={[{ k: 'turi', l: 'Turi', options: Object.entries(AKK_TURI).map(([v, l]) => ({ v, l })), get: (a) => a.turi }]}
        exportName="akkreditatsiya-arizalari"
        onRow={(a) => och(a.id)}
        empty={<Empty title="Ariza yoʻq" action={<Button v="primary" icon={<Plus />} onClick={() => setYangi(true)}>Yangi ariza</Button>}>Dastur pasportini toʻldirib, akkreditatsiyaga yuboring.</Empty>}
      />

      {tanl && <AkkTahrir a={tanl} onClose={() => och()} />}

      <Modal open={yangi} onClose={() => setYangi(false)} title="Yangi akkreditatsiya arizasi" sub="Majburiy hujjatlar roʻyxati ariza turiga qarab avtomatik chiqadi"
        footer={<><Button v="ghost" onClick={() => setYangi(false)}>Bekor qilish</Button><Button v="primary" disabled={turi !== 'provayder' && !vId} onClick={() => yarat(turi, turi === 'provayder' ? undefined : vId)}>Arizani yaratish</Button></>}>
        <div className="col gap-16">
          <Field label="Ariza turi" req>
            <Seg id="akk-turi" value={turi} onChange={(t) => { setTuri(t); setVId('') }} items={[{ v: 'dastur' as const, l: 'Dastur' }, { v: 'provayder' as const, l: 'Provayder' }, { v: 'qayta' as const, l: 'Qayta' }]} />
          </Field>
          {turi !== 'provayder' && (
            <Field label={turi === 'dastur' ? 'Dastur versiyasi (qoralama yoki rad etilgan)' : 'Tasdiqlangan dastur versiyasi'} req help={turi === 'qayta' ? 'Oldingi arizadagi hujjatlar nusxalanadi' : undefined}>
              <Sel value={vId} onChange={(e) => setVId(e.target.value)} placeholder={variantlar.length ? 'Tanlang…' : 'Mos versiya yoʻq'} options={variantlar.map((v) => ({ v: v.id, l: `${v.nomi} (v${v.versiya})` }))} />
            </Field>
          )}
          <div>
            <div className="b small mb-8">Talab qilinadigan hujjatlar</div>
            {AKK_HUJJATLAR[turi].map((h) => <div key={h.kod} className="row gap-6 small mb-8"><Badge ton={h.majburiy ? 'err' : 'muted'}>{h.majburiy ? 'majburiy' : 'ixtiyoriy'}</Badge>{h.nomi}</div>)}
          </div>
        </div>
      </Modal>
    </>
  )
}
