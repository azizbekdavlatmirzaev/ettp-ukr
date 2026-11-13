// Akkreditatsiya arizasi tahrirchisi: hujjatlar, toʻliqlik, ERI bilan yuborish, kamchilik, qaror va tarix.
import { useState } from 'react'
import { FileSignature, RotateCcw, CheckCircle2, Circle, ShieldCheck } from 'lucide-react'
import { Alert, Badge, Bar, Button, Confirm, DL, FileDrop, Holat, Modal, Stepper, Timeline } from '@/ui'
import * as A from '@/domain/amallar'
import { AKK_HUJJATLAR } from '@/domain/malumotnoma'
import type * as T from '@/domain/types'
import { sana, sanaVaqt, kunFarq } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { AKK_IDX, AKK_TURI, QAROR_TURI, STEP_AKK, useProv, Yopiq } from './_umumiy'

export function AkkTahrir({ a, onClose }: { a?: T.AkkAriza; onClose: () => void }) {
  const { db, amal, toast, rahbar, bugun } = useProv()
  const [yub, setYub] = useState(false)
  if (!a) return <Modal drawer open={false} onClose={onClose} title=""><span /></Modal>
  const roy = AKK_HUJJATLAR[a.turi]
  const majburiy = roy.filter((h) => h.majburiy)
  const yuklangan = majburiy.filter((h) => a.hujjatlar[h.kod]).length
  const tahrir = ['qoralama', 'kamchilik'].includes(a.holat)
  const v = A.versiya(db, a.versiyaId)
  const toliq = yuklangan === majburiy.length

  const fayl = (kod: string, f: T.Fayl | undefined) => {
    const r = amal((d, c) => {
      A.akkFayl(d, c, a.id, kod, f)
      return true
    })
    if (r) toast({ turi: f ? 'ok' : 'info', matn: f ? `${f.nomi} yuklandi · SHA-256 ${f.hash.slice(0, 12)}…` : 'Fayl olib tashlandi' })
  }
  const yubor = () => {
    const r = amal((d, c) => {
      if (a.holat === 'kamchilik') A.akkQaytaYubor(d, c, a.id)
      else A.akkYubor(d, c, a.id)
      return true
    })
    if (r) toast({ turi: 'ok', sarlavha: `${a.raqam} ERI bilan yuborildi`, matn: 'UKR markazi toʻliqlikni tekshiradi. Koʻrib chiqish muddati ish kunlarida hisoblanadi.' })
  }
  const idx = AKK_IDX[a.holat]

  return (
    <Modal drawer open onClose={onClose} title={`${a.raqam} · ${AKK_TURI[a.turi]}`} sub={v ? `${v.nomi} (v${v.versiya})` : 'Provayder (tashkilot) akkreditatsiyasi'}
      footer={
        <>
          <Button v="ghost" onClick={onClose}>Yopish</Button>
          {tahrir && (rahbar ? (
            <Button v="primary" icon={a.holat === 'kamchilik' ? <RotateCcw /> : <FileSignature />} disabled={!toliq} onClick={() => setYub(true)}>{a.holat === 'kamchilik' ? 'Qayta yuborish' : 'ERI bilan yuborish'}</Button>
          ) : (
            <Yopiq>ERI bilan yuborish — provayder rahbari vakolati</Yopiq>
          ))}
        </>
      }>
      <div className="col gap-16">
        <div style={{ overflowX: 'auto' }}><div style={{ minWidth: 640 }}><Stepper steps={STEP_AKK} current={idx === 8 ? 9 : idx} /></div></div>
        <div className="row wrap gap-6"><Holat h={a.holat} />{a.muddat && a.holat !== 'yakunlandi' && <Badge ton={kunFarq(a.muddat, bugun) < 5 ? 'warn' : 'muted'}>Koʻrib chiqish muddati: {sana(a.muddat)}</Badge>}{a.yuborilgan && <Badge>Yuborilgan: {sana(a.yuborilgan)}</Badge>}</div>

        {a.holat === 'kamchilik' && <Alert ton="err" title="UKR markazi kamchilik aniqladi">{a.izoh}<div className="xs mt-4">Hujjatlarni toʻldirib, «Qayta yuborish»ni bosing ({db.sozlamalar.muddatlar.akkToldirish} ish kuni ichida).</div></Alert>}

        {a.qaror && (
          <Alert ton={a.qaror.turi === 'rad' ? 'err' : 'ok'} title={`Qaror: ${QAROR_TURI[a.qaror.turi]} — ${a.qaror.raqam}`}>
            <DL items={[
              ['Sana', sana(a.qaror.sana)],
              ['Amal muddati', sana(a.qaror.muddat)],
              ...(a.qaror.kredit ? ([['Tasdiqlangan kredit', `${a.qaror.kredit} kredit`]] as [string, string][]) : []),
              ['Asos', a.qaror.sabab],
              ['ERI', <span className="mono xs" style={{ wordBreak: 'break-all' }}>{a.qaror.eri}</span>],
            ]} />
          </Alert>
        )}

        {['ekspertiza', 'joyida', 'komissiya'].includes(a.holat) && (
          <Alert ton="info" title="Ekspertiza jarayonida">Biriktirilgan ekspertlar: {a.ekspertlar.length} · topshirilgan varaqlar: {a.varaqlar.length}. Ekspertlar shaxsi va ballari qaror chiqqunga qadar provayderga koʻrsatilmaydi.{a.joyida && <div className="mt-4">Joyida tekshiruv: {sana(a.joyida.sana)}, {a.joyida.manzil}</div>}</Alert>
        )}

        <div>
          <div className="row between mb-8">
            <h3>Majburiy hujjatlar</h3>
            <span className="small b">{yuklangan} / {majburiy.length}</span>
          </div>
          <Bar v={yuklangan} max={majburiy.length} ton={toliq ? 'ok' : 'warn'} />
          <div className="col gap-12 mt-12">
            {roy.map((h) => {
              const f = a.hujjatlar[h.kod]
              return (
                <div key={h.kod}>
                  <div className="row gap-6 small mb-8">
                    {f ? <CheckCircle2 size={15} color="var(--ok)" /> : <Circle size={15} color="var(--text-3)" />}
                    <b>{h.nomi}</b> {h.majburiy ? <Badge ton="err">majburiy</Badge> : <Badge>ixtiyoriy</Badge>}
                  </div>
                  {tahrir ? (
                    <FileDrop value={f} onChange={(x) => fayl(h.kod, x)} />
                  ) : f ? (
                    <div className="ro"><span className="grow">{f.nomi}</span><span className="xs mono muted">SHA-256 {f.hash.slice(0, 16)}…</span></div>
                  ) : (
                    <div className="ro muted">Yuklanmagan</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-8">Ariza tarixi</h3>
          <Timeline items={[...a.tarix].reverse().map((t) => ({
            h: <span>{holatMatn(t.holat)[0]}{t.qaror ? ` · ${t.qaror}` : ''}</span>,
            m: <span>{sanaVaqt(t.sana)} · {t.kim}{t.izoh ? <> · <span style={{ wordBreak: 'break-all' }}>{t.izoh}</span></> : null}</span>,
            ton: t.holat === 'kamchilik' ? ('err' as const) : t.holat === 'yakunlandi' ? ('ok' as const) : undefined,
          }))} />
        </div>
      </div>
      <Confirm open={yub} onClose={() => setYub(false)} title={a.holat === 'kamchilik' ? 'Arizani qayta yuborish' : 'Arizani UKR markaziga yuborish'} okText="Yuborish" eri onOk={() => { setYub(false); yubor() }}>
        <div className="col gap-6 small">
          <div className="row gap-6"><ShieldCheck size={15} /> {AKK_TURI[a.turi]}{v ? ` — ${v.nomi}` : ''}</div>
          <div>{yuklangan} ta majburiy hujjat ilova qilingan. Yuborilgandan soʻng hujjatlarni oʻzgartirib boʻlmaydi (kamchilik qaytarilsa — mumkin).</div>
        </div>
      </Confirm>
    </Modal>
  )
}
