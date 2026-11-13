import { useEffect, useState } from 'react'
import { MessageSquareWarning, Clock, Gavel, Inbox, MessagesSquare, History, Paperclip } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Button, Confirm, DL, Field, Holat, KPI, Modal, PageHeader, Sel, Timeline, Txt } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { MUROJAAT_TURI, holat as holatMatn } from '@/lib/holat'
import { ROL_NOMI } from '@/domain/malumotnoma'
import { useMarkaz, manba, MuddatBadge, RolTugma, userFio, userQisqa, ishKunlari, Sec, Qulf } from './_parts'

const MH: T.MurojaatHolat[] = ['yuborildi', 'qabul_qilindi', 'korib_chiqilmoqda', 'malumot_soraldi', 'qaror', 'yopildi']
type Natija = NonNullable<T.Murojaat['qaror']>['natija']
const NATIJA: { v: Natija; l: string }[] = [{ v: 'qanoatlantirildi', l: 'Qanoatlantirildi' }, { v: 'qisman', l: 'Qisman qanoatlantirildi' }, { v: 'rad_etildi', l: 'Rad etildi' }, { v: 'qayta_baholash', l: 'Qayta baholashga yuborildi' }]

export default function MarkazMurojaatlar() {
  const { db, user, ijro, ok, bugun } = useMarkaz()
  const [tanl, setTanl] = useState<string>()
  const [oyna, setOyna] = useState<'' | 'sora' | 'qaror' | 'yop' | 'qabul' | 'korib'>('')
  const [matn, setMatn] = useState('')
  const [natija, setNatija] = useState<Natija>('qanoatlantirildi')
  const m = db.murojaatlar.find((x) => x.id === tanl)
  useEffect(() => { setMatn(''); setNatija('qanoatlantirildi') }, [oyna])
  const kun = (x: T.Murojaat) => ishKunlari(bugun, x.muddat, db.sozlamalar.bayramlar) ?? 99
  const ochiq = (x: T.Murojaat) => !['qaror', 'yopildi'].includes(x.holat)
  const rows = [...db.murojaatlar].sort((a, b) => Number(ochiq(b)) - Number(ochiq(a)) || a.muddat.localeCompare(b.muddat))

  const holatga = (h: T.MurojaatHolat, izoh?: string) => {
    if (!m) return
    const r = ijro(A.murojaatHolati, m.id, h, izoh)
    setOyna('')
    if (r.ok) ok(`${m.raqam}: holat «${holatMatn(h)[0]}». Arizachiga xabar yuborildi.`)
  }
  const qaror = () => {
    if (!m) return
    const r = ijro(A.murojaatQaror, m.id, natija, matn)
    setOyna('')
    if (r.ok) ok(`${m.raqam}: qaror chiqarildi va arizachiga yuborildi.`)
  }
  const birinchi = m?.birinchiQarorChiqargan === user.id

  return (
    <>
      <PageHeader title="Murojaatlar va apellyatsiyalar" desc="Kredit, sertifikat, baho, akkreditatsiya va boshqa qarorlar ustidan. Muddat ish kunlarida; ≤ 2 ish kuni qolganlar ajratiladi." source={manba('Arizalar moduli (murojaatlar)')} />
      <div className="grid g4 mb-16">
        <KPI icon={<Inbox />} label="Ochiq murojaatlar" value={db.murojaatlar.filter(ochiq).length} />
        <KPI icon={<Clock />} label="≤ 2 ish kuni qoldi" value={db.murojaatlar.filter((x) => ochiq(x) && kun(x) <= 2 && kun(x) >= 0).length} ton="warn" delay={0.05} />
        <KPI icon={<MessageSquareWarning />} label="Muddati oʻtgan" value={db.murojaatlar.filter((x) => ochiq(x) && kun(x) < 0).length} ton="err" delay={0.1} />
        <KPI icon={<Gavel />} label="Qaror chiqarilgan" value={db.murojaatlar.filter((x) => !ochiq(x)).length} ton="ok" delay={0.15} />
      </div>
      <DataTable
        rows={rows}
        exportName="murojaatlar"
        onRow={(r) => setTanl(r.id)}
        rowClass={(r) => (ochiq(r) && kun(r) <= 2 ? 'mk-urgent' : undefined)}
        search={(r) => `${r.raqam} ${r.obyekt?.nomi ?? ''} ${r.matn} ${userFio(db, r.arizachiId)}`}
        filters={[
          { k: 'h', l: 'Holat', options: MH.map((v) => ({ v, l: holatMatn(v)[0] })), get: (r) => r.holat },
          { k: 't', l: 'Turi', options: Object.entries(MUROJAAT_TURI).map(([v, l]) => ({ v, l })), get: (r) => r.turi },
        ]}
        cols={[
          { k: 'raqam', l: 'Raqam', r: (r) => <span className="mono xs b">{r.raqam}</span>, sort: (r) => r.raqam, excel: (r) => r.raqam },
          { k: 'turi', l: 'Turi', r: (r) => <span className="tag">{MUROJAAT_TURI[r.turi]}</span>, excel: (r) => MUROJAAT_TURI[r.turi] },
          { k: 'obyekt', l: 'Obyekt', r: (r) => <span className="small">{r.obyekt?.nomi ?? '—'}</span>, excel: (r) => r.obyekt?.nomi },
          { k: 'ariz', l: 'Arizachi', r: (r) => <span className="small">{userQisqa(db, r.arizachiId)}</span>, excel: (r) => userQisqa(db, r.arizachiId) },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, excel: (r) => holatMatn(r.holat)[0] },
          { k: 'muddat', l: 'Muddat', r: (r) => <MuddatBadge muddat={r.muddat} yopiq={!ochiq(r)} />, sort: (r) => r.muddat, excel: (r) => r.muddat },
          { k: 'masul', l: 'Masʼul', r: (r) => <span className="small">{r.masulId ? userQisqa(db, r.masulId) : <span className="muted">{ROL_NOMI[r.masulRol]}</span>}</span>, excel: (r) => userQisqa(db, r.masulId) },
        ]}
      />
      <Modal open={!!m} onClose={() => setTanl(undefined)} drawer title={m?.raqam ?? ''} sub={m && <span className="row gap-6"><Holat h={m.holat} /><MuddatBadge muddat={m.muddat} yopiq={!ochiq(m)} /></span>}
        footer={m && (
          <div className="mk-actions">
            {m.holat === 'yuborildi' && <Button v="primary" onClick={() => setOyna('qabul')}>Qabul qilish</Button>}
            {['qabul_qilindi', 'malumot_soraldi'].includes(m.holat) && <Button v="primary" onClick={() => setOyna('korib')}>Koʻrib chiqish</Button>}
            {ochiq(m) && <Button v="soft" onClick={() => setOyna('sora')}>Maʼlumot soʻrash</Button>}
            {ochiq(m) && <RolTugma ruxsat={!birinchi} sabab="Birinchi qarorni chiqargan shaxs apellyatsiyani hal qila olmaydi." v="success" icon={<Gavel />} onClick={() => setOyna('qaror')}>Qaror</RolTugma>}
            {m.holat === 'qaror' && <Button v="secondary" onClick={() => setOyna('yop')}>Yopish</Button>}
          </div>
        )}>
        {m && (
          <>
            {birinchi && ochiq(m) && <Qulf>Siz shikoyat qilinayotgan birinchi qarorni chiqargansiz — apellyatsiya boʻyicha qarorni boshqa vakolatli shaxs chiqaradi (TZ 4.2.14).</Qulf>}
            <DL items={[
              ['Turi', MUROJAAT_TURI[m.turi]],
              ['Obyekt', m.obyekt ? `${m.obyekt.nomi} (${m.obyekt.turi})` : '—'],
              ['Arizachi', userFio(db, m.arizachiId)],
              ['Yuborilgan', sanaVaqt(m.yuborilgan)],
              ['Muddat', sana(m.muddat)],
              ['Masʼul', m.masulId ? userFio(db, m.masulId) : ROL_NOMI[m.masulRol]],
              ['Birinchi qaror muallifi', m.birinchiQarorChiqargan ? userFio(db, m.birinchiQarorChiqargan) : '—'],
            ]} />
            <Sec icon={<MessagesSquare />} title="Yozishmalar">
              <div className="mk-thread">
                <div className="mk-msg"><div className="k">{userFio(db, m.arizachiId)} · {sanaVaqt(m.yuborilgan)}</div>{m.matn}</div>
                {m.yozishmalar.map((y, i) => (
                  <div key={i} className={y.kim === userFio(db, m.arizachiId) ? 'mk-msg' : 'mk-msg biz'}><div className="k">{y.kim} · {sanaVaqt(y.sana)}</div>{y.matn}</div>
                ))}
                {m.qaror && <div className="mk-msg biz"><div className="k">Qaror · {userFio(db, m.qaror.kim)} · {sanaVaqt(m.qaror.sana)}</div><b>{NATIJA.find((n) => n.v === m.qaror!.natija)?.l}.</b> {m.qaror.matn}</div>}
              </div>
            </Sec>
            {m.fayllar.length > 0 && <Sec icon={<Paperclip />} title="Ilovalar">{m.fayllar.map((f) => <div key={f.id} className="mk-doc"><Paperclip size={14} /><span className="grow">{f.nomi}</span><span className="xs muted mono">{f.hash.slice(0, 12)}</span></div>)}</Sec>}
            <Sec icon={<History />} title="Tarix">
              <Timeline items={[...m.tarix].reverse().map((h) => ({ h: <Holat h={h.holat} />, m: `${sanaVaqt(h.sana)} · ${h.kim}${h.izoh ? ' — ' + h.izoh : ''}`, ton: h.holat === 'qaror' ? 'ok' : 'muted' }))} />
            </Sec>
          </>
        )}
      </Modal>
      <Confirm open={oyna === 'qabul'} onClose={() => setOyna('')} onOk={(iz) => holatga('qabul_qilindi', iz || undefined)} title="Murojaatni qabul qilish" izoh="Arizachiga izoh (ixtiyoriy)" okText="Qabul qilish"><p className="small">Siz masʼul etib belgilanasiz.</p></Confirm>
      <Confirm open={oyna === 'korib'} onClose={() => setOyna('')} onOk={(iz) => holatga('korib_chiqilmoqda', iz || undefined)} title="Koʻrib chiqishni boshlash" izoh="Arizachiga izoh (ixtiyoriy)" okText="Boshlash" />
      <Confirm open={oyna === 'yop'} onClose={() => setOyna('')} onOk={(iz) => holatga('yopildi', iz || undefined)} title="Murojaatni yopish" izoh="Yakuniy izoh (ixtiyoriy)" okText="Yopish" />
      <Modal open={oyna === 'sora'} onClose={() => setOyna('')} title="Maʼlumot soʻrash" sub={m?.raqam} footer={<><Button v="ghost" onClick={() => setOyna('')}>Bekor qilish</Button><Button v="primary" disabled={!matn.trim()} onClick={() => holatga('malumot_soraldi', matn)}>Yuborish</Button></>}>
        <Field label="Qanday maʼlumot kerak" req><Txt rows={4} value={matn} onChange={(e) => setMatn(e.target.value)} /></Field>
      </Modal>
      <Modal open={oyna === 'qaror'} onClose={() => setOyna('')} title="Murojaat boʻyicha qaror" sub={m?.raqam} footer={<><Button v="ghost" onClick={() => setOyna('')}>Bekor qilish</Button><Button v="primary" disabled={!matn.trim()} onClick={qaror}>Qarorni yuborish</Button></>}>
        <div className="col gap-16">
          <Field label="Natija" req><Sel value={natija} onChange={(e) => setNatija(e.target.value as Natija)} options={NATIJA} /></Field>
          <Field label="Qaror matni (asoslantirilgan)" req><Txt rows={5} value={matn} onChange={(e) => setMatn(e.target.value)} /></Field>
          <Alert ton="info">Qaror kredit yoki hujjatni avtomatik oʻzgartirmaydi: kerak boʻlsa tuzatish taklifi yoki qayta baholash alohida rasmiylashtiriladi.</Alert>
        </div>
      </Modal>
    </>
  )
}
