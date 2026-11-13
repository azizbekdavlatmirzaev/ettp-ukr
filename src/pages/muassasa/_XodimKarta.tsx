import { useMemo, useState } from 'react'
import { Award, BookOpen, Send, ClipboardCheck, ScrollText } from 'lucide-react'
import { useJoriy } from '@/shared/hooks'
import { Bar, Button, DL, Empty, Holat, Modal, Ring, Badge, Alert } from '@/ui'
import { sana, son } from '@/lib/format'
import { MANBA, KURS_TURI, YONALISH, TADBIR } from '@/lib/holat'
import * as A from '@/domain/amallar'
import type { XodimQator } from './_umumiy'
import { EslatmaModal, KursTavsiyaModal } from './_Modallar'

/** Xodim kartasi — faqat UKR qismi (kreditlar, jurnal, sertifikatlar, reja). Boshqa shaxsga doir maʼlumot koʻrsatilmaydi. */
export function XodimKarta({ q, onClose }: { q: XodimQator | null; onClose: () => void }) {
  const { db, bugun, yil } = useJoriy()
  const [esl, setEsl] = useState(false)
  const [kurs, setKurs] = useState(false)
  const pid = q?.s.id ?? ''
  const d = useMemo(() => {
    if (!q) return null
    const jurnal = db.jurnal.filter((j) => j.personId === pid).sort((a, b) => b.seq - a.seq)
    const yillar = Array.from(new Set([yil, yil - 1, ...jurnal.map((j) => j.yil)])).filter((y) => y <= yil).sort((a, b) => b - a)
    const yillik = yillar.map((y) => A.xodimYillik(db, pid, y, bugun))
    const sertlar = db.sertifikatlar.filter((s) => s.personId === pid && s.turi === 'UKR').sort((a, b) => b.sana.localeCompare(a.sana))
    const rejalar = db.rejalar.filter((r) => r.personId === pid && r.muassasaId === q.m.muassasaId && r.holat !== 'qoralama')
    const kurslar = db.yozilishlar.filter((y) => y.personId === pid && ['yuborildi', 'qabul_qilindi', 'oqimoqda'].includes(y.holat)).map((y) => ({ y, o: A.oqim(db, y.oqimId), v: A.versiya(db, A.oqim(db, y.oqimId)?.versiyaId) }))
    return { jurnal, yillik, sertlar, rejalar, kurslar }
  }, [db, q, pid, yil, bugun])
  const h = q?.h
  return (
    <>
      <Modal open={!!q} onClose={onClose} drawer title="Xodim kartasi (faqat UKR qismi)" sub={q ? `${q.fio} · ${q.m.lavozim}` : ''}
        footer={q && <><Button v="secondary" icon={<Send size={16} />} onClick={() => setEsl(true)}>Eslatma</Button><Button v="primary" icon={<BookOpen size={16} />} onClick={() => setKurs(true)}>Kurs tavsiya</Button></>}>
        {q && h && d && (
          <div className="col gap-20">
            <div className="row gap-16 wrap">
              <Ring v={h.X} max={h.T || 1} size={112} stroke={10}>
                <div className="center"><div className="b" style={{ fontSize: 22 }}>{son(h.X)}</div><div className="xs muted">/ {h.T} kredit</div></div>
              </Ring>
              <div className="col gap-6 grow" style={{ minWidth: 180 }}>
                <div className="row wrap"><Holat h={h.xavf} />{q.qarzdor && <Badge ton="err">Oʻtgan yil qarzi</Badge>}</div>
                <DL items={[
                  ['Boʻlim', q.m.bolim],
                  ['Mutaxassislik', q.mut],
                  ['Talab (T)', `${h.T} kredit (qoida ${h.qoidaVersiya})`],
                  ['Yetishmaydi', h.yetishmaydi ? `${h.yetishmaydi} kredit` : '—'],
                  ['Yil oxirigacha', `${h.qolganKun} kun`],
                ]} />
              </div>
            </div>
            <div>
              <div className="row between small"><span>Majburiy ulush</span><b>{h.majburiy} / {h.majburiyKerak}</b></div>
              <Bar v={h.majburiy} max={h.majburiyKerak || 1} ton={h.majburiy >= h.majburiyKerak ? 'ok' : 'warn'} thin />
              <div className="row between small mt-8"><span>Amaliy ulush</span><b>{h.amaliy} / {h.amaliyKerak}</b></div>
              <Bar v={h.amaliy} max={h.amaliyKerak || 1} ton={h.amaliy >= h.amaliyKerak ? 'ok' : 'warn'} thin />
              {h.yetmaganUlushlar.length > 0 && <div className="xs muted mt-8">Yetmagan ulushlar: {h.yetmaganUlushlar.join('; ')}</div>}
            </div>

            <section>
              <h3 className="mb-8 row gap-6"><Award size={16} /> Kreditlar yillar boʻyicha</h3>
              {d.yillik.map((y) => (
                <div key={y.yil} className="li">
                  <span className="ic brand b">{y.yil}</span>
                  <div className="grow">
                    <div className="row between small"><span>{son(y.X)} / {y.T} kredit</span><Holat h={y.yil < yil ? y.natija : y.xavf} /></div>
                    <Bar v={y.X} max={y.T || 1} thin ton={y.natija === 'bajarildi' ? 'ok' : y.yil < yil ? 'err' : undefined} />
                  </div>
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-8 row gap-6"><ScrollText size={16} /> Kredit jurnali yozuvlari</h3>
              {d.jurnal.length === 0 ? <div className="muted small">Kredit yozuvlari yoʻq.</div> : d.jurnal.slice(0, 12).map((j) => (
                <div key={j.id} className="li">
                  <span className={`ic ${j.miqdor < 0 ? 'err' : 'ok'} b`}>{j.miqdor > 0 ? '+' : ''}{j.miqdor}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="b small">{j.nomi}</div>
                    <div className="xs muted">{sana(j.sana)} · {j.yil} · {MANBA[j.manba]} · {KURS_TURI[j.kursTuri]}, {YONALISH[j.yonalish]} · {TADBIR[j.tadbirTuri]}</div>
                  </div>
                </div>
              ))}
              {d.jurnal.length > 12 && <div className="xs muted mt-4">va yana {d.jurnal.length - 12} ta yozuv</div>}
            </section>

            <section>
              <h3 className="mb-8 row gap-6"><Award size={16} /> Sertifikatlar</h3>
              {d.sertlar.length === 0 ? <div className="muted small">UKR sertifikatlari yoʻq.</div> : d.sertlar.map((s) => (
                <div key={s.id} className="li">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="b small">{s.kurs}</div>
                    <div className="xs muted">{s.seriya} {s.raqam} · {sana(s.sana)} · {s.kredit} kredit · {s.provider}</div>
                  </div>
                  <Holat h={s.holat} />
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-8 row gap-6"><ClipboardCheck size={16} /> Rivojlanish rejasi va joriy kurslar</h3>
              {d.rejalar.length === 0 ? <div className="muted small">Yuborilgan reja yoʻq.</div> : d.rejalar.map((r) => {
                const b = r.bandlar.filter((x) => x.bajarildi).length
                return (
                  <div key={r.id} className="li">
                    <span className="ic brand b">{r.yil}</span>
                    <div className="grow"><div className="small b">{r.bandlar.length} band · v{r.versiya}</div><Bar v={b} max={r.bandlar.length || 1} thin /></div>
                    <Holat h={r.holat} />
                  </div>
                )
              })}
              {d.kurslar.map(({ y, o, v }) => (
                <div key={y.id} className="li">
                  <div className="grow"><div className="small b">{v?.nomi}</div><div className="xs muted">{o?.kod} · {sana(o?.boshlanish)} – {sana(o?.tugash)}</div></div>
                  <Holat h={y.holat} />
                </div>
              ))}
            </section>
            <Alert ton="info">Karta faqat UKR maʼlumotlarini koʻrsatadi. Muassasa kreditlarni oʻzgartira olmaydi; xato koʻrinsa, xodim murojaat yuboradi.</Alert>
          </div>
        )}
        {q && !d && <Empty title="Maʼlumot topilmadi" />}
      </Modal>
      <EslatmaModal open={esl} onClose={() => setEsl(false)} personIds={q ? [q.s.id] : []} />
      <KursTavsiyaModal open={kurs} onClose={() => setKurs(false)} personIds={q ? [q.s.id] : []} />
    </>
  )
}
