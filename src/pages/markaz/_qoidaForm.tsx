import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import * as A from '@/domain/amallar'
import { amaldagiQoida } from '@/domain/kredit'
import type * as T from '@/domain/types'
import { Alert, Button, Check, Field, Inp, Modal, Sel } from '@/ui'
import { BarCh } from '@/ui/charts'
import { useMarkaz } from './_parts'
import { simulyatsiyaQayd } from './_amallar'

export type QoidaDraft = Omit<T.KreditQoidasi, 'id' | 'holat' | 'muallif' | 'yaratilgan'>

export function paramMatn(p: T.KreditParametrlar): [string, string][] {
  return [
    ['Yillik talab — oliy maʼlumotli', `${p.talabOliy} kredit`],
    ['Yillik talab — oʻrta maʼlumotli', `${p.talabOrta} kredit`],
    ['Majburiy kurslar ulushi', `kamida ${Math.round(p.majburiyUlush * 100)}% (T dan)`],
    ['Amaliy yoʻnalish ulushi', `kamida ${Math.round(p.amaliyUlush * 100)}% (T dan)`],
    ['Keyingi yilga oʻtkazish', `ortiqcha kreditning T ning ${Math.round(p.otkazishUlush * 100)}% igacha`],
    ['Mustaqil taʼlim limiti', `yiliga ${p.mustaqilLimit} kreditgacha`],
    ['Konferensiyalar limiti', `yiliga ${p.konferensiyaLimit} kreditgacha`],
    ['Hisobot yili', `${p.yilBoshi.replace('-', '.')} — ${p.yilOxiri.replace('-', '.')}`],
    ['Istisno (dekret, kasallik ...)', p.istisnoKamaytirish === 'proporsional' ? 'Talab istisno kunlariga proporsional kamayadi' : 'Istisno boʻlsa — yil uchun talab qoʻyilmaydi'],
    ['Yil davomida ishga kirgan', p.yangiXodimProporsional ? 'Talab ishlagan davrga proporsional' : 'Toʻliq talab'],
  ]
}

export function QoidaForm({ open, onClose, tahrir }: { open: boolean; onClose: () => void; tahrir?: T.KreditQoidasi }) {
  const { db, bugun, ijro, ok } = useMarkaz()
  const [d, setD] = useState<QoidaDraft | null>(null)
  const [sim, setSim] = useState<T.KreditQoidasi>()
  useEffect(() => {
    if (!open) return
    if (tahrir) {
      const { id: _i, holat: _h, muallif: _m, yaratilgan: _y, ...qolgan } = tahrir
      setD(structuredClone(qolgan))
    } else {
      const j = amaldagiQoida(db.qoidalar, bugun) ?? db.qoidalar[db.qoidalar.length - 1]
      const oxirgi = [...db.qoidalar].sort((a, b) => b.versiya.localeCompare(a.versiya, undefined, { numeric: true }))[0]
      const nv = (Number(oxirgi?.versiya ?? '1') + 0.1).toFixed(1)
      setD({ versiya: nv, nomi: `${j.nomi} (yangi tahrir)`, hujjat: { nomi: '', raqam: '', sana: bugun }, kuchgaKirish: `${Number(bugun.slice(0, 4)) + 1}-01-01`, params: structuredClone(j.params), izoh: `${j.versiya} versiyasidan nusxa` })
    }
  }, [open, tahrir]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!d) return null
  const p = d.params
  const setP = (k: keyof T.KreditParametrlar, v: number | string | boolean) => setD({ ...d, params: { ...p, [k]: v } })
  const foiz = (k: 'majburiyUlush' | 'amaliyUlush' | 'otkazishUlush') => <Inp type="number" min={0} max={100} value={Math.round(p[k] * 100)} onChange={(e) => setP(k, Number(e.target.value) / 100)} />
  const son = (k: 'talabOliy' | 'talabOrta' | 'mustaqilLimit' | 'konferensiyaLimit') => <Inp type="number" min={0} value={p[k]} onChange={(e) => setP(k, Number(e.target.value))} />
  const saqla = () => {
    const r = ijro(A.qoidaSaqla, { ...d, tugash: d.tugash || undefined }, tahrir?.id)
    if (r.ok && r.r) { ok(`Qoida ${r.r.versiya} qoralama sifatida saqlandi. Endi «Koʻrib chiqishga yuborish» mumkin.`); onClose() }
  }
  return (
    <>
      <Modal open={open} onClose={onClose} size="lg" title={tahrir ? `Qoida ${tahrir.versiya} — tahrirlash` : 'Yangi qoida versiyasi'} sub="Amaldagi versiyadan nusxa. Yangi versiya oʻtgan davr natijalarini oʻzgartirmaydi."
        footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="secondary" icon={<FlaskConical />} onClick={() => setSim({ ...d, id: 'draft', holat: 'qoralama', muallif: '', yaratilgan: '' })}>Simulyatsiya</Button><Button v="primary" onClick={saqla}>Qoralamani saqlash</Button></>}>
        <div className="form-grid">
          <Field label="Versiya" req><Inp value={d.versiya} onChange={(e) => setD({ ...d, versiya: e.target.value })} /></Field>
          <Field label="Nomi" req><Inp value={d.nomi} onChange={(e) => setD({ ...d, nomi: e.target.value })} /></Field>
          <Field label="Meʼyoriy hujjat nomi" req full><Inp value={d.hujjat.nomi} onChange={(e) => setD({ ...d, hujjat: { ...d.hujjat, nomi: e.target.value } })} placeholder="Sogʻliqni saqlash vazirining buyrugʻi" /></Field>
          <Field label="Hujjat raqami" req><Inp value={d.hujjat.raqam} onChange={(e) => setD({ ...d, hujjat: { ...d.hujjat, raqam: e.target.value } })} /></Field>
          <Field label="Hujjat sanasi" req><Inp type="date" value={d.hujjat.sana} onChange={(e) => setD({ ...d, hujjat: { ...d.hujjat, sana: e.target.value } })} /></Field>
          <Field label="Kuchga kirish" req help="Hujjat kuchga kirmaguncha versiya hisobga qoʻllanmaydi"><Inp type="date" value={d.kuchgaKirish} onChange={(e) => setD({ ...d, kuchgaKirish: e.target.value })} /></Field>
          <Field label="Tugash (ixtiyoriy)"><Inp type="date" value={d.tugash ?? ''} onChange={(e) => setD({ ...d, tugash: e.target.value })} /></Field>
          <Field label="Talab — oliy (kredit)">{son('talabOliy')}</Field>
          <Field label="Talab — oʻrta (kredit)">{son('talabOrta')}</Field>
          <Field label="Majburiy ulush, %">{foiz('majburiyUlush')}</Field>
          <Field label="Amaliy ulush, %">{foiz('amaliyUlush')}</Field>
          <Field label="Oʻtkazish ulushi, %">{foiz('otkazishUlush')}</Field>
          <Field label="Mustaqil taʼlim limiti">{son('mustaqilLimit')}</Field>
          <Field label="Konferensiya limiti">{son('konferensiyaLimit')}</Field>
          <Field label="Istisno rejimi"><Sel value={p.istisnoKamaytirish} onChange={(e) => setP('istisnoKamaytirish', e.target.value)} options={[{ v: 'proporsional', l: 'Proporsional kamaytirish' }, { v: 'toliq', l: 'Toʻliq ozod qilish' }]} /></Field>
          <Field label="Yangi xodim" full><Check label="Yil davomida ishga kirganlarga talab proporsional" checked={p.yangiXodimProporsional} onChange={(e) => setP('yangiXodimProporsional', e.target.checked)} /></Field>
          <Field label="Izoh" full><Inp value={d.izoh ?? ''} onChange={(e) => setD({ ...d, izoh: e.target.value })} /></Field>
        </div>
      </Modal>
      <SimModal q={sim} onClose={() => setSim(undefined)} />
    </>
  )
}

export function SimModal({ q, onClose }: { q?: T.KreditQoidasi; onClose: () => void }) {
  const { amal, yil } = useMarkaz()
  const [y, setY] = useState(yil)
  const [r, setR] = useState<ReturnType<typeof A.simulyatsiya>>()
  useEffect(() => {
    if (q) setR(amal(simulyatsiyaQayd, q, y))
  }, [q, y]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal open={!!q} onClose={onClose} size="lg" title={`Simulyatsiya: qoida ${q?.versiya ?? ''}`} sub="Yangi versiya kuchga kirsa, xodimlar yillik holati qanday oʻzgaradi (fon vazifa imitatsiyasi)"
      footer={<Button v="primary" onClick={onClose}>Yopish</Button>}>
      <div className="col gap-16">
        <div className="row">
          <span className="small">Hisob yili:</span>
          <Sel style={{ maxWidth: 140 }} value={String(y)} onChange={(e) => setY(Number(e.target.value))} options={[String(yil - 1), String(yil), String(yil + 1)]} />
        </div>
        {r && (
          <>
            <div className="grid g4">
              <div className="card"><div className="xs muted">Xodimlar</div><div className="stat-big">{r.jami}</div></div>
              <div className="card"><div className="xs muted">Bajargan (oldin)</div><div className="stat-big">{r.bajarganOldin}</div></div>
              <div className="card"><div className="xs muted">Bajargan (keyin)</div><div className="stat-big" style={{ color: r.bajarganKeyin < r.bajarganOldin ? 'var(--err)' : 'var(--ok)' }}>{r.bajarganKeyin}</div></div>
              <div className="card"><div className="xs muted">Holati oʻzgardi</div><div className="stat-big" style={{ color: 'var(--warn)' }}>{r.ozgardi}</div></div>
            </div>
            <BarCh height={200} data={[{ x: 'Bajargan', oldin: r.bajarganOldin, keyin: r.bajarganKeyin }, { x: 'Bajarmagan', oldin: r.jami - r.bajarganOldin, keyin: r.jami - r.bajarganKeyin }]} keys={['oldin', 'keyin']} names={{ oldin: 'Amaldagi qoida', keyin: `Qoida ${q?.versiya}` }} />
            {r.misollar.length ? (
              <table className="tbl"><thead><tr><th>Xodim</th><th>Oldin (X/T)</th><th>Keyin (X/T)</th></tr></thead>
                <tbody>{r.misollar.map((m) => <tr key={m.fio}><td>{m.fio}</td><td className="small">{m.oldin}</td><td className="small b">{m.keyin}</td></tr>)}</tbody></table>
            ) : <Alert ton="ok">Hech bir xodimning holati oʻzgarmaydi.</Alert>}
            <Alert ton="info">Simulyatsiya hisobni oʻzgartirmaydi. Qoida faqat tasdiqlanib, kuchga kirgach qoʻllanadi; oʻtgan davr natijalari qayta yozilmaydi.</Alert>
          </>
        )}
      </div>
    </Modal>
  )
}
