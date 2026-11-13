import { useEffect, useState } from 'react'
import { Plus, FileSearch, Gavel, ClipboardCheck } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { Alert, Button, Confirm, DL, Field, Holat, Inp, Modal, Sel, Txt } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { SIGNAL } from '@/lib/holat'
import { useMarkaz, provQisqa, userFio, Sec } from './_parts'

export function SignalDrawer({ s, onClose }: { s?: T.Signal; onClose: () => void }) {
  const { db, ijro, ok } = useMarkaz()
  const [dalil, setDalil] = useState('')
  const [xulosa, setXulosa] = useState('')
  const [chora, setChora] = useState({ matn: '', muddat: '' })
  const [asossiz, setAsossiz] = useState(false)
  useEffect(() => {
    setDalil('')
    setXulosa(s?.ish?.xulosa ?? '')
    setChora({ matn: s?.ish?.chora?.matn ?? '', muddat: s?.ish?.chora?.muddat ?? '' })
  }, [s?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return <Modal open={false} onClose={onClose} title=""><span /></Modal>
  const markazUser = db.foydalanuvchilar.filter((u) => u.rol === 'markaz_mutaxassis' || u.rol === 'markaz_rahbar').map((u) => ({ v: u.id, l: u.fio }))
  const yopiq = s.holat === 'yopildi' || s.holat === 'asossiz'
  const yoz = (d: Parameters<typeof A.signalIsh>[3], msg: string) => {
    const r = ijro(A.signalIsh, s.id, d)
    if (r.ok) ok(msg)
    return r.ok
  }
  return (
    <>
      <Modal open onClose={onClose} drawer title={SIGNAL[s.turi] ?? s.turi} sub={<span className="row gap-6"><Holat h={s.holat} /><span className="small">{provQisqa(db, s.providerId)}</span></span>}
        footer={!yopiq && (
          <div className="mk-actions">
            <Button v="danger" onClick={() => setAsossiz(true)}>Asossiz deb yopish</Button>
            <Button v="success" disabled={!s.ish?.xulosa} title={!s.ish?.xulosa ? 'Avval xulosani saqlang' : undefined} onClick={() => yoz({ holat: 'yopildi', ijro: s.ish?.chora ? s.ish.ijro ?? 'kutilmoqda' : 'bajarildi' }, 'Tekshiruv ishi yopildi.')}>Ishni yopish (xulosa bilan)</Button>
          </div>
        )}>
        <Alert ton="warn">Signal huquqbuzarlik isboti emas — u tekshiruv uchun asos. Provayder holati signal tufayli avtomatik oʻzgarmaydi.</Alert>
        <Sec icon={<FileSearch />} title="Signal">
          <DL items={[['Provayder', db.provayderlar.find((p) => p.id === s.providerId)?.nomi], ['Oqim', s.oqimId ? A.oqim(db, s.oqimId)?.kod ?? s.oqimId : '—'], ['Tavsif', s.tavsif], ['Aniqlangan', sanaVaqt(s.aniqlangan)], ['Kalit', <span className="mono xs">{s.qiymat}</span>]]} />
        </Sec>
        <Sec icon={<ClipboardCheck />} title="Tekshiruv ishi">
          <div className="form-grid">
            <Field label="Masʼul" full>
              <Sel value={s.ish?.masul ?? ''} disabled={yopiq} onChange={(e) => yoz({ masul: e.target.value }, `Masʼul: ${userFio(db, e.target.value)}`)} options={markazUser} placeholder="Tayinlanmagan" />
            </Field>
          </div>
          <div className="small b mt-12">Dalillar ({s.ish?.dalillar.length ?? 0})</div>
          <ul className="small" style={{ margin: '6px 0', paddingLeft: 18 }}>{(s.ish?.dalillar ?? []).map((d, i) => <li key={i}>{d}</li>)}</ul>
          {!yopiq && (
            <div className="row">
              <Inp value={dalil} onChange={(e) => setDalil(e.target.value)} placeholder="Dalil: hujjat, jadval, tushuntirish xati..." />
              <Button v="soft" icon={<Plus />} disabled={!dalil.trim()} onClick={() => { if (yoz({ dalillar: [...(s.ish?.dalillar ?? []), dalil.trim()] }, 'Dalil qoʻshildi.')) setDalil('') }}>Qoʻshish</Button>
            </div>
          )}
          <Field label="Xulosa" full>
            <Txt rows={3} value={xulosa} disabled={yopiq} onChange={(e) => setXulosa(e.target.value)} />
          </Field>
          {!yopiq && <Button className="mt-8" size="sm" v="secondary" disabled={!xulosa.trim() || xulosa === s.ish?.xulosa} onClick={() => yoz({ xulosa }, 'Xulosa saqlandi.')}>Xulosani saqlash</Button>}
        </Sec>
        <Sec icon={<Gavel />} title="Chora va ijro">
          <div className="form-grid">
            <Field label="Chora (masalan, tushuntirish xati, joyida tekshiruv)" full><Inp value={chora.matn} disabled={yopiq} onChange={(e) => setChora({ ...chora, matn: e.target.value })} /></Field>
            <Field label="Ijro muddati"><Inp type="date" value={chora.muddat} disabled={yopiq} onChange={(e) => setChora({ ...chora, muddat: e.target.value })} /></Field>
            <Field label="Ijro holati">
              <Sel value={s.ish?.ijro ?? 'kutilmoqda'} disabled={yopiq || !s.ish?.chora} onChange={(e) => yoz({ ijro: e.target.value as 'bajarildi' | 'bajarilmadi' | 'kutilmoqda' }, 'Ijro holati yangilandi.')} options={[{ v: 'kutilmoqda', l: 'Kutilmoqda' }, { v: 'bajarildi', l: 'Bajarildi' }, { v: 'bajarilmadi', l: 'Bajarilmadi' }]} />
            </Field>
          </div>
          {!yopiq && <Button className="mt-8" size="sm" v="secondary" disabled={!chora.matn.trim() || !chora.muddat} onClick={() => yoz({ chora, ijro: s.ish?.ijro ?? 'kutilmoqda' }, `Chora belgilandi, muddat ${sana(chora.muddat)}.`)}>Chorani saqlash</Button>}
        </Sec>
      </Modal>
      <Confirm open={asossiz} onClose={() => setAsossiz(false)} onOk={(iz) => { setAsossiz(false); yoz({ holat: 'asossiz', xulosa: iz }, 'Signal asossiz deb yopildi.') }} title="Asossiz deb yopish" izoh="Asos (nega asossiz)" izohMajburiy ton="danger" okText="Yopish" />
    </>
  )
}
