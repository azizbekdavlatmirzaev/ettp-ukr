import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Download, FileUp, Send } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { MurojaatTugma } from '@/shared/Murojaat'
import { Alert, Button, DL, Field, FileDrop, Holat, Modal, Timeline, Txt } from '@/ui'
import { hajm, pul, sana, sanaVaqt } from '@/lib/format'
import { MUROJAAT_TURI, PSV_HUJJAT, SHAKL, holat as holatM } from '@/lib/holat'
import { sertifikatPdf } from '@/lib/eksport'
import { useBajar } from './_bajar'

export type ArizaRow =
  | { id: string; tur: 'tan_olish'; raqam: string; nomi: string; holat: string; sana: string; muddat?: string; x: T.TanOlishAriza }
  | { id: string; tur: 'murojaat'; raqam: string; nomi: string; holat: string; sana: string; muddat?: string; x: T.Murojaat }
  | { id: string; tur: 'psv'; raqam: string; nomi: string; holat: string; sana: string; muddat?: string; x: T.PsvIsh }
  | { id: string; tur: 'kurs'; raqam: string; nomi: string; holat: string; sana: string; muddat?: string; x: T.Yozilish }

const tl = (t: T.HolatTarixi[]) => t.map((h) => ({ h: <span className="row wrap gap-6"><Holat h={h.holat} /> <span className="small muted">{h.kim}</span></span>, m: <>{sanaVaqt(h.sana)}{h.izoh ? <div className="small mt-4">{h.izoh}</div> : null}</>, ton: (['rad_etildi', 'kamchilik', 'otmadi'].includes(h.holat) ? 'err' : ['tasdiqlandi', 'qabul_qilindi', 'tugatdi', 'qaror'].includes(h.holat) ? 'ok' : 'muted') as 'err' | 'ok' | 'muted' }))
const Fayllar = ({ f }: { f: T.Fayl[] }) => f.length ? <div className="col gap-4">{f.map((x) => <div key={x.id} className="small">📎 {x.nomi} <span className="xs muted mono">({hajm(x.hajm)}, SHA-256 {x.hash.slice(0, 12)}…)</span></div>)}</div> : <span className="muted">—</span>

export function ArizaDrawer({ r, onClose }: { r: ArizaRow | null; onClose: () => void }) {
  return (
    <Modal open={!!r} onClose={onClose} drawer title={r?.nomi ?? ''} sub={r ? `${r.raqam} · ${holatM(r.holat)[0]}` : ''}>
      {r?.tur === 'tan_olish' && <TanOlish t={r.x} />}
      {r?.tur === 'murojaat' && <Murojaat m={r.x} />}
      {r?.tur === 'psv' && <Psv p={r.x} />}
      {r?.tur === 'kurs' && <Kurs y={r.x} onClose={onClose} />}
    </Modal>
  )
}

function TanOlish({ t }: { t: T.TanOlishAriza }) {
  const { toast } = useXodim()
  const bajar = useBajar()
  const [f, setF] = useState<T.Fayl | undefined>()
  return (
    <div className="col gap-16">
      {t.holat === 'kamchilik' && (
        <Alert ton="err" title="Hujjatlarni toʻldiring">
          {t.tarix.filter((h) => h.holat === 'kamchilik').pop()?.izoh}
          <div className="mt-12"><FileDrop value={f} onChange={setF} label="Yetishmayotgan hujjatni yuklang" /></div>
          <Button className="mt-12" v="primary" size="sm" icon={<FileUp />} disabled={!f} onClick={() => { if (f && bajar(A.tanOlishToldir, t.id, f)) { toast({ turi: 'ok', matn: 'Hujjat qoʻshildi — muddat davom etmoqda.' }); setF(undefined) } }}>Hujjat toʻldirish</Button>
        </Alert>
      )}
      {t.xulosa && (
        <Alert ton={t.xulosa.turi === 'rad' ? 'err' : 'ok'} title={`Qaror: ${t.xulosa.turi === 'toliq' ? 'toʻliq tan olindi' : t.xulosa.turi === 'qisman' ? 'qisman tan olindi' : 'rad etildi'}${t.holat === 'qaror' ? ' (tasdiqlash kutilmoqda)' : ''}`}>
          {t.xorijiyKredit} {t.kreditTuri} → <b>{t.xulosa.milliyKredit} milliy kredit</b> · metodika {t.xulosa.metodika}<div className="small mt-4">Asos: {t.xulosa.asos}</div>
        </Alert>
      )}
      <DL items={[
        ['Tashkilot', `${t.tashkilot} (${t.davlat})`], ['Kurs', t.kurs], ['Sana / hajm', `${sana(t.sana)} · ${t.soat} soat · ${SHAKL[t.shakl]}`],
        ['Sertifikat', t.sertifikatRaqam], ['Xorijiy kredit', `${t.xorijiyKredit} ${t.kreditTuri}`], ['Koʻrib chiqish muddati', `${sana(t.muddat)}${t.toxtatilgan ? ' (toʻxtatilgan)' : ''}`],
        ['Fayllar', <Fayllar f={t.fayllar} />],
        ['Tekshiruvlar', t.tekshiruvlar.length ? t.tekshiruvlar.map((x) => `${x.usul}: ${x.natija}`).join('; ') : 'Hali tekshirilmagan'],
      ]} />
      <div><div className="b small mb-12">Holat tarixi</div><Timeline items={tl(t.tarix)} /></div>
      {t.holat === 'rad_etildi' && <MurojaatTugma turi="tan_olish" obyekt={{ turi: 'TanOlish', id: t.id, nomi: `${t.raqam} — ${t.kurs}` }} label="Qaror ustidan murojaat" />}
    </div>
  )
}

function Murojaat({ m }: { m: T.Murojaat }) {
  const { toast } = useXodim()
  const bajar = useBajar()
  const [j, setJ] = useState('')
  return (
    <div className="col gap-16">
      {m.qaror && <Alert ton={m.qaror.natija === 'rad_etildi' ? 'err' : 'ok'} title={`Qaror: ${m.qaror.natija.replace('_', ' ')}`}>{m.qaror.matn} <div className="xs muted mt-4">{sanaVaqt(m.qaror.sana)}</div></Alert>}
      <DL items={[['Turi', MUROJAAT_TURI[m.turi]], ['Obyekt', m.obyekt?.nomi], ['Yuborilgan', sanaVaqt(m.yuborilgan)], ['Muddat', `${sana(m.muddat)} (ish kunlarida)`], ['Matn', m.matn], ['Ilovalar', <Fayllar f={m.fayllar} />]]} />
      {m.yozishmalar.length > 0 && (
        <div className="col gap-6">
          <div className="b small">Yozishmalar</div>
          {m.yozishmalar.map((y, i) => (
            <div key={i} className="card" style={{ padding: '10px 12px', boxShadow: 'none', background: 'var(--surface-2)' }}>
              <div className="xs muted">{y.kim} · {sanaVaqt(y.sana)}</div>
              <div className="small">{y.matn}</div>
            </div>
          ))}
        </div>
      )}
      {m.holat === 'malumot_soraldi' && (
        <div className="card" style={{ boxShadow: 'none', borderColor: 'var(--warn-border)' }}>
          <Field label="Qoʻshimcha maʼlumot (javobingiz)" req><Txt rows={3} value={j} onChange={(e) => setJ(e.target.value)} placeholder="Soʻralgan maʼlumotni yozing…" /></Field>
          <Button className="mt-12" v="primary" size="sm" icon={<Send />} disabled={j.trim().length < 3} onClick={() => { if (bajar(A.murojaatJavob, m.id, j)) { toast({ turi: 'ok', matn: 'Javobingiz yuborildi.' }); setJ('') } }}>Javob yuborish</Button>
        </div>
      )}
      <div><div className="b small mb-12">Holat tarixi</div><Timeline items={tl(m.tarix)} /></div>
    </div>
  )
}

function Psv({ p }: { p: T.PsvIsh }) {
  const { db, toast } = useXodim()
  const bajar = useBajar()
  const [tol, setTol] = useState(false)
  const sert = p.hisobotId ? db.sertifikatlar.find((s) => s.id === p.hisobotId) : undefined
  const tola = () => {
    setTol(true)
    setTimeout(() => {
      setTol(false)
      if (bajar(A.psvBillingCallback, p.id)) toast({ turi: 'ok', sarlavha: 'Yagona billing: toʻlov tasdiqlandi', matn: `${pul(p.tolov.tarif)} · hisob ${p.tolov.hisob ?? ''}` })
    }, 1200)
  }
  return (
    <div className="col gap-16">
      <div className="card row wrap between" style={{ boxShadow: 'none', background: 'var(--surface-2)' }}>
        <div>
          <div className="small">Toʻlov: <Holat h={p.tolov.holat} /> · {pul(p.tolov.tarif)}</div>
          <div className="xs muted mt-4">Hisob-varaq {p.tolov.hisob ?? '—'}. Toʻlovni qoʻlda «toʻlandi» deb belgilab boʻlmaydi — faqat billing javobi bilan.</div>
        </div>
        {p.tolov.holat === 'kutilmoqda' && <Button v="primary" size="sm" icon={<CreditCard />} loading={tol} onClick={tola}>Toʻlash (Yagona billing — imitatsiya)</Button>}
      </div>
      {p.rozilik.bekor && <Alert ton="warn" title="Rozilik bekor qilingan">Maʼlumot qabul qiluvchiga uzatilmaydi.</Alert>}
      <DL items={[['Qabul qiluvchi', p.qabulQiluvchi], ['Maqsad', p.maqsad || '—'], ['Rozilik', `${p.rozilik.hajm} · ${sana(p.rozilik.muddat)} gacha`], ['Yaratilgan', sanaVaqt(p.yaratilgan)], ['Yetkazish', p.yetkazish ? `${p.yetkazish.usul}, ${sanaVaqt(p.yetkazish.sana)}` : '—']]} />
      <div className="col gap-6">
        <div className="b small">Hujjatlar va manbalar</div>
        {p.hujjatlar.map((h) => (
          <div key={h.turi} className="li">
            <div className="grow">
              <div className="b small">{PSV_HUJJAT[h.turi]}</div>
              <div className="xs muted">Manba: {h.manba}{h.javob ? ` · ${h.javob}` : ''}{h.sana ? ` · ${sana(h.sana)}` : ''}</div>
            </div>
            <Holat h={h.holat} />
          </div>
        ))}
      </div>
      {sert && <Button v="primary" icon={<Download />} onClick={async () => { await sertifikatPdf(sert, db.sozlamalar.sertifikatShablon); toast({ turi: 'ok', matn: 'PSV hisoboti yuklab olindi.' }) }}>PSV hisobotini yuklab olish ({sert.raqam})</Button>}
      <MurojaatTugma turi="psv" obyekt={{ turi: 'PSV', id: p.id, nomi: p.raqam }} label="PSV boʻyicha murojaat" />
    </div>
  )
}

function Kurs({ y, onClose }: { y: T.Yozilish; onClose: () => void }) {
  const { db } = useXodim()
  const nav = useNavigate()
  const o = A.oqim(db, y.oqimId)!
  return (
    <div className="col gap-16">
      <DL items={[['Oqim', o.kod], ['Sanalar', `${sana(o.boshlanish)} – ${sana(o.tugash)}`], ['Provayder', A.provayder(db, o.providerId)?.nomi], ['Sabab', y.sabab]]} />
      <div><div className="b small mb-12">Holat tarixi</div><Timeline items={tl(y.tarix)} /></div>
      <Button v="secondary" onClick={() => { onClose(); nav('/xodim/oquv/kurslarim') }}>Mening kurslarimda ochish</Button>
    </div>
  )
}
