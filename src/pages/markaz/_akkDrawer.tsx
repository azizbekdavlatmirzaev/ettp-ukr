import { useState } from 'react'
import { FileCheck2, FileX2, Users, History, MapPin, Gavel, FileText, FileDown } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { Alert, Badge, Button, Confirm, DL, Holat, Modal, Stepper, Timeline } from '@/ui'
import { hajm, sana, sanaVaqt } from '@/lib/format'
import { umumiyPdf } from '@/lib/eksport'
import { AKK_HUJJATLAR, BAHOLASH_MEZONLARI } from '@/domain/malumotnoma'
import { useMarkaz, MuddatBadge, RolTugma, MUT_SABAB, RAH_SABAB, Sec, Qulf } from './_parts'
import { TURI_NOMI, obyektNomi } from './_akkBoard'
import { EkspertModal, JoyidaModal, QarorModal } from './_akkModals'

const QADAM: Record<string, number> = { yuborildi: 0, toliqlik: 1, kamchilik: 1, ekspertiza: 2, joyida: 3, komissiya: 4, qaror: 4, yakunlandi: 6 }

export function ArizaDrawer({ a, onClose }: { a?: T.AkkAriza; onClose: () => void }) {
  const { db, rahbar, mutaxassis, ijro, ok, amal } = useMarkaz()
  const [oyna, setOyna] = useState<'' | 'toliq' | 'kamchilik' | 'ekspert' | 'joyida' | 'komissiya' | 'qaror'>('')
  if (!a) return <Modal open={false} onClose={onClose} title=""><span /></Modal>
  const p = A.provayder(db, a.providerId)
  const v = a.versiyaId ? A.versiya(db, a.versiyaId) : undefined
  const balllar = a.varaqlar.map(A.varaqBali)
  const farq = balllar.length >= 2 ? Math.max(...balllar) - Math.min(...balllar) : 0
  const komissiyagaTayyor = a.varaqlar.length >= 2 && (farq <= 25 || a.varaqlar.length >= 3)

  const toliq = (okmi: boolean, izoh: string) => {
    const r = ijro(A.akkToliqlik, a.id, okmi, izoh)
    setOyna('')
    if (r.ok) ok(okmi ? 'Ariza ekspertiza bosqichiga oʻtdi. Provayder xabardor qilindi.' : 'Ariza kamchilik bilan qaytarildi; provayder toʻldirgach qayta yuboradi.', a.raqam)
  }
  const komissiyaga = () => {
    const r = ijro(A.komissiyagaYubor, a.id)
    setOyna('')
    if (r.ok) ok('Ariza komissiya qaroriga yuborildi. Qaror qabul qiluvchiga xabar ketdi.', a.raqam)
  }
  const pdf = async () => {
    if (!a.qaror) return
    await umumiyPdf(`qaror-${a.qaror.raqam}`, `Akkreditatsiya qarori ${a.qaror.raqam}`, [
      { t: 'Ariza', qatorlar: [`${a.raqam} (${TURI_NOMI[a.turi]})`, `Provayder: ${p?.nomi}`, `Obyekt: ${obyektNomi(db, a)}`] },
      { t: 'Qaror', qatorlar: [`Turi: ${a.qaror.turi}`, `Sana: ${sana(a.qaror.sana)}`, `Muddat: ${sana(a.qaror.muddat)}`, `Tasdiqlangan kredit: ${a.qaror.kredit ?? '—'}`, `Asos: ${a.qaror.sabab}`, `ERI: ${a.qaror.eri}`] },
      ...(a.komissiya ? [{ t: 'Komissiya', qatorlar: [`Aʼzolar: ${a.komissiya.azolar.join(', ')}`, `Ovozlar: za ${a.komissiya.ovozlar.za}, qarshi ${a.komissiya.ovozlar.qarshi}, betaraf ${a.komissiya.ovozlar.betaraf}`, a.komissiya.bayonnoma] }] : []),
    ], `${location.origin}/#/tekshirish/${a.id}`)
    amal(A.eksportQayd, `Akkreditatsiya qarori ${a.qaror.raqam} (PDF)`, 1)
    ok('Qaror PDF yuklandi.')
  }

  const amallar = (
    <div className="mk-actions">
      {a.holat === 'toliqlik' && (
        <>
          <RolTugma ruxsat={mutaxassis} sabab={MUT_SABAB} v="success" onClick={() => setOyna('toliq')}>Toʻliq — ekspertizaga</RolTugma>
          <RolTugma ruxsat={mutaxassis} sabab={MUT_SABAB} v="danger" onClick={() => setOyna('kamchilik')}>Kamchilik bilan qaytarish</RolTugma>
        </>
      )}
      {a.holat === 'ekspertiza' && <Button v="primary" icon={<Users />} onClick={() => setOyna('ekspert')}>Ekspert biriktirish</Button>}
      {(a.holat === 'ekspertiza' || a.holat === 'joyida') && <RolTugma ruxsat={mutaxassis} sabab={MUT_SABAB} v="secondary" icon={<MapPin />} onClick={() => setOyna('joyida')}>Joyida tekshiruv</RolTugma>}
      {(a.holat === 'ekspertiza' || a.holat === 'joyida') && (
        <RolTugma ruxsat={mutaxassis && komissiyagaTayyor} sabab={!mutaxassis ? MUT_SABAB : a.varaqlar.length < 2 ? 'Ikki ekspert varagʻi topshirilmagan.' : 'Ballar farqi > 25% — uchinchi ekspert kerak.'} v="primary" icon={<Gavel />} onClick={() => setOyna('komissiya')}>Komissiyaga yuborish</RolTugma>
      )}
      {(a.holat === 'komissiya' || a.holat === 'qaror') && <RolTugma ruxsat={rahbar} sabab={RAH_SABAB} v="primary" icon={<Gavel />} onClick={() => setOyna('qaror')}>Komissiya qarori</RolTugma>}
      {a.holat === 'yakunlandi' && <Button v="secondary" icon={<FileDown />} onClick={pdf}>Qaror PDF</Button>}
    </div>
  )

  return (
    <>
      <Modal open onClose={onClose} drawer title={`${a.raqam} · ${TURI_NOMI[a.turi]}`} sub={<span className="row gap-6 wrap"><Holat h={a.holat} />{a.holat !== 'yakunlandi' && <MuddatBadge muddat={a.muddat} />}</span>} footer={amallar}>
        <Stepper steps={['Yuborildi', 'Toʻliqlik', 'Ekspertiza', 'Joyida', 'Komissiya', 'Qaror']} current={QADAM[a.holat] ?? 0} />
        {a.holat === 'kamchilik' && <Alert ton="warn" title="Provayder kamchilikni toʻldirmoqda">{a.izoh} — toʻldirish muddati {db.sozlamalar.muddatlar.akkToldirish} ish kuni; provayder qayta yuborgach ariza toʻliqlik navbatiga qaytadi.</Alert>}
        {a.holat === 'komissiya' && !rahbar && <Qulf>Komissiya qarorini faqat qaror qabul qiluvchi ERI bilan tasdiqlaydi. Ekspert xulosasi qaror emas.</Qulf>}
        <Sec icon={<FileText />} title="Ariza">
          <DL items={[
            ['Provayder', `${p?.nomi} (${p?.stir})`],
            ['Obyekt', a.versiyaId ? `${v?.nomi} · v${v?.versiya}` : 'Provayder akkreditatsiyasi'],
            ...(v ? ([['Soʻralgan kredit', `${v.soralganKredit} kredit · ${v.soatNazariy + v.soatAmaliy} soat`]] as [string, string][]) : []),
            ['Yuborilgan', sanaVaqt(a.yuborilgan)],
            ['Koʻrib chiqish muddati', <span className="row gap-6">{sana(a.muddat)} <MuddatBadge muddat={a.muddat} yopiq={a.holat === 'yakunlandi'} /></span>],
            ['Izoh', a.izoh ?? '—'],
          ]} />
        </Sec>
        <Sec icon={<FileCheck2 />} title="Hujjatlar (majburiy roʻyxat avtomatik)">
          {(AKK_HUJJATLAR[a.turi] ?? []).map((h) => {
            const f = a.hujjatlar[h.kod]
            return (
              <div key={h.kod} className="mk-doc">
                {f ? <FileCheck2 size={16} className="ok" /> : <FileX2 size={16} className="no" />}
                <div className="grow">
                  <div className="b">{h.nomi} {h.majburiy && <span className="tag">majburiy</span>}</div>
                  {f ? <div className="xs muted mono">{f.nomi} · {hajm(f.hajm)} · SHA-256 {f.hash.slice(0, 20)}…</div> : <div className="xs" style={{ color: h.majburiy ? 'var(--err)' : 'var(--text-3)' }}>Yuklanmagan</div>}
                </div>
              </div>
            )
          })}
        </Sec>
        <Sec icon={<Users />} title={`Ekspertiza (${a.varaqlar.length}/${a.ekspertlar.length} varaq)`} right={farq > 25 ? <Badge ton="err">Farq {farq}% &gt; 25%</Badge> : balllar.length >= 2 ? <Badge ton="ok">Farq {farq}%</Badge> : undefined}>
          {!a.ekspertlar.length ? <div className="small muted">Ekspertlar hali biriktirilmagan.</div> : (
            <>
              <div className="mk-score" style={{ ['--n' as string]: a.ekspertlar.length }}>
                <span className="h">Mezon</span>
                {a.ekspertlar.map((id) => <span key={id} className="h center">{db.ekspertlar.find((e) => e.id === id)?.fio.split(' ')[0]}</span>)}
                {BAHOLASH_MEZONLARI.map((m) => (
                  <div key={m.kod} style={{ display: 'contents' }}>
                    <span>{m.nomi}</span>
                    {a.ekspertlar.map((id) => <span key={id} className="center b">{a.varaqlar.find((x) => x.ekspertId === id)?.mezonlar[m.kod] ?? '—'}</span>)}
                  </div>
                ))}
                <span className="b">Jami ball</span>
                {a.ekspertlar.map((id) => {
                  const x = a.varaqlar.find((y) => y.ekspertId === id)
                  return <span key={id} className="center">{x ? <Badge ton={A.varaqBali(x) >= 70 ? 'ok' : 'warn'}>{A.varaqBali(x)}%</Badge> : <Badge>kutilmoqda</Badge>}</span>
                })}
              </div>
              {a.varaqlar.map((x) => (
                <div key={x.ekspertId} className="xs muted mt-8">«{x.xulosa}» — {db.ekspertlar.find((e) => e.id === x.ekspertId)?.fio}, tavsiya: <b>{x.tavsiya}</b> ({sana(x.topshirilgan)})</div>
              ))}
              {farq > 25 && a.varaqlar.length < 3 && <Alert ton="warn">Ballar orasidagi farq {farq}% — uchinchi ekspertni biriktiring yoki masalani komissiyaga koʻtaring.</Alert>}
            </>
          )}
        </Sec>
        {a.joyida && (
          <Sec icon={<MapPin />} title="Joyida tekshiruv">
            <DL items={[['Sana', sana(a.joyida.sana)], ['Manzil', a.joyida.manzil], ['Tekshiruvchilar', a.joyida.tekshiruvchilar.join(', ')], ['Dalolatnoma', a.joyida.dalolatnoma ?? '—'], ['Xulosa', a.joyida.xulosa ?? 'Kutilmoqda']]} />
          </Sec>
        )}
        {a.qaror && (
          <Sec icon={<Gavel />} title="Qaror">
            <DL items={[['Turi', <Holat h={a.qaror.turi === 'rad' ? 'rad_etilgan' : 'tasdiqlangan'}>{a.qaror.turi}</Holat>], ['Raqam / sana', `${a.qaror.raqam} · ${sana(a.qaror.sana)}`], ['Muddat', sana(a.qaror.muddat)], ['Tasdiqlangan kredit', a.qaror.kredit ?? '—'], ['Asos', a.qaror.sabab], ['Komissiya', a.komissiya ? `${a.komissiya.azolar.length} aʼzo · za ${a.komissiya.ovozlar.za} / qarshi ${a.komissiya.ovozlar.qarshi} / betaraf ${a.komissiya.ovozlar.betaraf} · ${a.komissiya.bayonnoma}` : '—'], ['ERI', <span className="mono xs">{a.qaror.eri}</span>]]} />
          </Sec>
        )}
        <Sec icon={<History />} title="Tarix">
          <Timeline items={[...a.tarix].reverse().map((t) => ({ h: <span className="row gap-6"><Holat h={t.holat} />{t.qaror && <Badge>{t.qaror}</Badge>}</span>, m: `${sanaVaqt(t.sana)} · ${t.kim}${t.izoh ? ' — ' + t.izoh : ''}`, ton: t.holat === 'kamchilik' ? 'err' : t.holat === 'yakunlandi' ? 'ok' : 'muted' }))} />
        </Sec>
      </Modal>
      <Confirm open={oyna === 'toliq'} onClose={() => setOyna('')} onOk={(iz) => toliq(true, iz)} title="Toʻliqlik tekshiruvi: oʻtdi" izoh="Izoh (ixtiyoriy)" ton="success" okText="Ekspertizaga yuborish">
        <p className="small">Barcha majburiy hujjatlar mavjud va yaroqli. Ariza ekspertiza bosqichiga oʻtadi.</p>
      </Confirm>
      <Confirm open={oyna === 'kamchilik'} onClose={() => setOyna('')} onOk={(iz) => toliq(false, iz)} title="Kamchilik bilan qaytarish" izoh="Kamchiliklar roʻyxati" izohMajburiy ton="danger" okText="Qaytarish">
        <p className="small">Provayderga {db.sozlamalar.muddatlar.akkToldirish} ish kuni ichida toʻldirish uchun qaytariladi.</p>
      </Confirm>
      <Confirm open={oyna === 'komissiya'} onClose={() => setOyna('')} onOk={komissiyaga} title="Komissiyaga yuborish" okText="Yuborish">
        <p className="small">{a.varaqlar.length} ta ekspertiza varagʻi (farq {farq}%). Ariza qaror qabul qiluvchiga yuboriladi.</p>
      </Confirm>
      {oyna === 'ekspert' && <EkspertModal a={a} onClose={() => setOyna('')} />}
      <JoyidaModal a={oyna === 'joyida' ? a : undefined} onClose={() => setOyna('')} />
      {oyna === 'qaror' && <QarorModal a={a} onClose={() => setOyna('')} />}
    </>
  )
}
