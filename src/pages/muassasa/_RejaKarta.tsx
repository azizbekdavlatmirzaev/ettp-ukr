import { useState } from 'react'
import { Check, Undo2 } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useStore } from '@/domain/store'
import { amaldagiQoida, talab } from '@/domain/kredit'
import type { Reja } from '@/domain/types'
import { useJoriy, mutNomi } from '@/shared/hooks'
import { Alert, Bar, Badge, Button, Confirm, DL, Holat, Modal, Timeline } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { KURS_TURI, YONALISH, holat as holatMatn } from '@/lib/holat'

/** Reja qoplashi: rejadagi kreditlar yillik talabni va ulushlarni qoplaydimi */
export function rejaQoplash(db: ReturnType<typeof useJoriy>['db'], r: Reja) {
  const s = A.shaxs(db, r.personId)!
  const q = amaldagiQoida(db.qoidalar, `${r.yil}-12-31`) ?? amaldagiQoida(db.qoidalar, `${r.yil}-01-01`) ?? db.qoidalar[0]
  const { T } = talab(s, r.yil, q, db.mehnat.filter((m) => m.personId === s.id))
  const jami = r.bandlar.reduce((a, b) => a + b.kredit, 0)
  const majburiy = r.bandlar.filter((b) => b.kursTuri === 'majburiy').reduce((a, b) => a + b.kredit, 0)
  const amaliy = r.bandlar.filter((b) => b.yonalish === 'amaliy').reduce((a, b) => a + b.kredit, 0)
  return { s, q, T, jami, majburiy, amaliy, majKerak: Math.ceil(T * q.params.majburiyUlush), amKerak: Math.ceil(T * q.params.amaliyUlush), bajarildi: r.bandlar.filter((b) => b.bajarildi).length }
}

export function RejaKarta({ r, onClose }: { r: Reja | null; onClose: () => void }) {
  const { db, amal, toast, user } = useJoriy()
  const [tas, setTas] = useState(false)
  const [qayt, setQayt] = useState(false)
  if (!r) return <Modal open={false} onClose={onClose} title=""><div /></Modal>
  const k = rejaQoplash(db, r)
  const kimNomi = (id?: string) => db.foydalanuvchilar.find((u) => u.id === id)?.fio ?? id ?? '—'
  const asosiy = db.mehnat.find((m) => m.personId === r.personId && m.asosiy && !m.gacha)
  const asosiyBiz = asosiy?.muassasaId === user.muassasaId
  const qaror = (ok: boolean, izoh: string) => {
    amal(A.rejaQaror, r.id, ok, izoh)
    setTas(false)
    setQayt(false)
    if (useStore.getState().db.rejalar.find((x) => x.id === r.id)?.holat !== 'yuborildi') {
      toast({ turi: ok ? 'ok' : 'info', matn: ok ? 'Reja tasdiqlandi. Xodimga xabar yuborildi.' : 'Reja izoh bilan qaytarildi. Xodim tuzatib qayta yuboradi.' })
      onClose()
    }
  }
  return (
    <>
      <Modal open onClose={onClose} drawer title={`Rivojlanish rejasi ${r.yil}`} sub={`${A.toliqFio(k.s)} · ${mutNomi(k.s.mutaxassislikId)} · versiya ${r.versiya}`}
        footer={r.holat === 'yuborildi' ? <>
          <Button v="ghost" icon={<Undo2 size={16} />} disabled={!asosiyBiz} onClick={() => setQayt(true)}>Izoh bilan qaytarish</Button>
          <Button v="success" icon={<Check size={16} />} disabled={!asosiyBiz} title={asosiyBiz ? undefined : 'Rejani faqat asosiy ish beruvchi tasdiqlaydi'} onClick={() => setTas(true)}>Tasdiqlash</Button>
        </> : undefined}>
        <div className="col gap-20">
          <div className="row wrap"><Holat h={r.holat} /><Badge>{r.bandlar.length} band</Badge><Badge ton="info">{k.jami} kredit</Badge></div>
          {!asosiyBiz && r.holat === 'yuborildi' && <Alert ton="warn">Bu xodim uchun muassasangiz asosiy ish joyi emas — rejani faqat asosiy ish beruvchi tasdiqlaydi.</Alert>}
          <section>
            <h3 className="mb-8">Talabni qoplash (qoida {k.q.versiya})</h3>
            {[['Jami kredit', k.jami, k.T], ['Majburiy kurslar', k.majburiy, k.majKerak], ['Amaliy yoʻnalish', k.amaliy, k.amKerak]].map(([l, v, m]) => (
              <div key={l as string} className="mb-8">
                <div className="row between small"><span>{l}</span><b>{v} / {m}</b></div>
                <Bar v={v as number} max={(m as number) || 1} thin ton={(v as number) >= (m as number) ? 'ok' : 'warn'} />
              </div>
            ))}
            <div className="xs muted">Reja tasdiqlanmagani xodimning qonuniy olgan kreditlarini bekor qilmaydi; rejadan tashqari kurs ham kredit beradi.</div>
          </section>
          <section>
            <h3 className="mb-8">Bandlar</h3>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Kurs</th><th style={{ textAlign: 'right' }}>Kredit</th><th>Turi</th><th>Chorak</th><th>Majburiy</th></tr></thead>
                <tbody>
                  {r.bandlar.map((b) => (
                    <tr key={b.id}>
                      <td><div className="small b">{b.nomi}</div>{b.bajarildi && <span className="xs" style={{ color: 'var(--ok)' }}>✓ bajarildi</span>}</td>
                      <td style={{ textAlign: 'right' }}>{b.kredit}</td>
                      <td className="small nowrap">{KURS_TURI[b.kursTuri]}, {YONALISH[b.yonalish]}</td>
                      <td className="small nowrap">{b.muddat}</td>
                      <td>{b.majburiyModul ? <Badge ton="brand">Majburiy modul</Badge> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h3 className="mb-8">Versiyalar tarixi</h3>
            <DL items={[['Tashabbuskor', kimNomi(r.tashabbuskor)], ['Tasdiqlovchi', kimNomi(r.tasdiqlovchi)], ['Yangilangan', sanaVaqt(r.yangilangan)], ['Izoh', r.izoh || '—']]} />
            <div className="mt-12">
              <Timeline items={[
                ...r.oldingiVersiyalar.map((v) => ({ h: <span>v{v.versiya} — {holatMatn(v.holat)[0]} · {v.bandlar.length} band</span>, m: `${sana(v.sana)} · ${v.kim}${v.izoh ? ' · ' + v.izoh : ''}`, ton: (v.holat === 'qaytarildi' ? 'err' : 'muted') as 'err' | 'muted' })),
                { h: <span>v{r.versiya} — {holatMatn(r.holat)[0]} (joriy)</span>, m: sanaVaqt(r.yangilangan), ton: (r.holat === 'tasdiqlandi' || r.holat === 'bajarilmoqda' ? 'ok' : 'warn') as 'ok' | 'warn' },
              ]} />
            </div>
          </section>
        </div>
      </Modal>
      <Confirm open={tas} onClose={() => setTas(false)} title="Rejani tasdiqlash" okText="Tasdiqlash" ton="success" onOk={(iz) => qaror(true, iz)} izoh="Izoh (ixtiyoriy)">
        <div className="small mb-12">{A.toliqFio(k.s)} — {r.yil}-yil rejasi, {r.bandlar.length} band, {k.jami} kredit.</div>
      </Confirm>
      <Confirm open={qayt} onClose={() => setQayt(false)} title="Rejani izoh bilan qaytarish" okText="Qaytarish" ton="danger" izoh="Qaytarish sababi" izohMajburiy onOk={(iz) => qaror(false, iz)}>
        <div className="small mb-12">Xodim izohni koʻrib, rejani tuzatadi va qayta yuboradi. Yangi versiya ochiladi, avvalgisi saqlanadi.</div>
      </Confirm>
    </>
  )
}
