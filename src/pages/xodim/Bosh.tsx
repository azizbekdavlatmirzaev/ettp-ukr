import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, Bell, BookOpen, CalendarClock, ClipboardList, FileText, PlayCircle, Sparkles, TrendingUp } from 'lucide-react'
import { useStore } from '@/domain/store'
import { useXodim } from '@/shared/hooks'
import { Button, Card, CardH, Empty, Holat, KPI, PageHeader, Stagger, staggerItem } from '@/ui'
import { AreaCh } from '@/ui/charts'
import { nisbiy, sana, sanaVaqt } from '@/lib/format'
import { MANBA } from '@/lib/holat'
import { BoshHero } from './_BoshHero'
import { FAOL_HOLAT, KursKarta, OYLAR, QrDavomatModal, keyingiMashgulotlar, oylikKredit, tavsiyalar } from './_parts'

export default function XodimBosh() {
  const { db, user, shaxs, holat, yil, bugun } = useXodim()
  const oqildi = useStore((s) => s.oqildi)
  const nav = useNavigate()
  const [qr, setQr] = useState(false)

  const keyingi = useMemo(() => keyingiMashgulotlar(db, shaxs.id, bugun), [db, shaxs.id, bugun])
  const tavsiya = useMemo(() => tavsiyalar(db, shaxs, holat, bugun), [db, shaxs, holat, bugun])
  const oylik = useMemo(() => oylikKredit(db, shaxs.id, yil), [db, shaxs.id, yil])
  const faol = db.yozilishlar.filter((y) => y.personId === shaxs.id && FAOL_HOLAT.includes(y.holat)).length
  const sertlar = db.sertifikatlar.filter((s) => s.personId === shaxs.id && s.holat !== 'bekor_qilingan').length
  const reja = db.rejalar.filter((r) => r.personId === shaxs.id).sort((a, b) => b.yil - a.yil)[0]
  const arizalar =
    db.tanOlish.filter((t) => t.personId === shaxs.id && !['tasdiqlandi', 'rad_etildi'].includes(t.holat)).length +
    db.murojaatlar.filter((m) => m.arizachiId === user.id && !['qaror', 'yopildi'].includes(m.holat)).length +
    db.psv.filter((p) => p.personId === shaxs.id && !['yetkazildi', 'rad_etildi'].includes(p.holat)).length
  const yozuvlar = db.jurnal.filter((j) => j.personId === shaxs.id).sort((a, b) => b.seq - a.seq).slice(0, 6)
  const xabarlar = db.bildirishnomalar.filter((n) => n.userId === user.id).slice(0, 6)
  const k = keyingi[0]

  return (
    <>
      <PageHeader title="Bosh sahifa" desc="UKR holatingiz, yaqin mashgʻulotlar va tavsiya etilgan kurslar" source={`Reestr yangilangan: ${sanaVaqt(shaxs.reestrYangilangan)} · Kredit jurnali — real vaqtda`} />
      <BoshHero onQr={() => setQr(true)} />

      <div className="grid g4 mt-20">
        <KPI icon={<BookOpen />} label="Faol kurslar" value={faol} hint="Ariza, qabul va oʻqish bosqichida" onClick={() => nav('/xodim/oquv/kurslarim')} />
        <KPI icon={<Award />} label="Sertifikatlar" value={sertlar} ton="ok" hint="QR orqali tekshiriladi" delay={0.05} onClick={() => nav('/xodim/hujjatlar')} />
        <KPI icon={<ClipboardList />} label="Rivojlanish rejasi" value={reja ? `${reja.yil}` : '—'} hint={reja ? <Holat h={reja.holat} /> : 'Reja tuzilmagan'} ton="teal" delay={0.1} onClick={() => nav('/xodim/oquv/reja')} />
        <KPI icon={<FileText />} label="Ochiq arizalar" value={arizalar} ton={arizalar ? 'warn' : undefined} hint="Tan olish, murojaat, PSV" delay={0.15} onClick={() => nav('/xodim/arizalar')} />
      </div>

      <div className="grid g-main mt-20">
        <div className="col gap-16">
          <Card>
            <CardH icon={<CalendarClock />} title="Keyingi mashgʻulot" sub={k ? k.v.nomi : 'Faol kursingiz yoʻq'} right={keyingi.length > 1 && <span className="xs muted">yana {keyingi.length - 1} ta</span>} />
            {k ? (
              <div className="row wrap between" style={{ gap: 16 }}>
                <div className="row" style={{ gap: 14 }}>
                  <div className="center" style={{ width: 64, padding: '8px 0', borderRadius: 14, background: 'var(--primary-soft)', color: 'var(--primary)', flex: 'none' }}>
                    <div style={{ font: '800 22px/1 var(--font-head)' }}>{Number(k.m.sana.slice(8, 10))}</div>
                    <div className="xs b">{OYLAR[Number(k.m.sana.slice(5, 7)) - 1]}</div>
                  </div>
                  <div>
                    <div className="b">{k.m.mavzu}</div>
                    <div className="small muted">{sanaVaqt(k.m.sana)} · {k.o.joy}</div>
                    <div className="xs muted mt-4">Oqim {k.o.kod} · oʻqituvchi {k.o.oqituvchi}</div>
                  </div>
                </div>
                <Button v="primary" icon={<PlayCircle />} onClick={() => nav(`/xodim/kurs/${k.o.id}`)}>Darsga kirish</Button>
              </div>
            ) : (
              <Empty title="Rejalashtirilgan mashgʻulot yoʻq" action={<Button v="primary" onClick={() => nav('/xodim/oquv')}>Katalogni ochish</Button>}>Katalogdan mutaxassisligingizga mos kursni tanlang.</Empty>
            )}
          </Card>
          <Card>
            <CardH icon={<TrendingUp />} title={`${yil}-yil kreditlari dinamikasi`} sub="Oylar boʻyicha yozilgan kredit va yigʻma" />
            <AreaCh data={oylik} keys={['jami', 'kredit']} names={{ jami: 'Yigʻma', kredit: 'Oy davomida' }} height={230} />
          </Card>
        </div>
        <div className="col gap-16">
          <Card>
            <CardH icon={<Award />} title="Soʻnggi kredit yozuvlari" right={<Button size="xs" v="ghost" onClick={() => nav('/xodim/kreditlar')}>Barchasi</Button>} />
            {yozuvlar.length === 0 ? <div className="muted small">Hali yozuv yoʻq.</div> : yozuvlar.map((j) => (
              <div key={j.id} className="li">
                <span className={`ic ${j.miqdor < 0 ? 'err' : 'ok'}`} style={{ fontWeight: 800, fontSize: 13 }}>{j.miqdor > 0 ? '+' : ''}{j.miqdor}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="b small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.nomi}</div>
                  <div className="xs muted">{sana(j.sana)} · {MANBA[j.manba]}</div>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <CardH icon={<Bell />} title="Bildirishnomalar" right={xabarlar.some((x) => !x.oqilgan) && <Button size="xs" v="ghost" onClick={() => oqildi(xabarlar.map((x) => x.id))}>Hammasi oʻqildi</Button>} />
            {xabarlar.length === 0 ? <div className="muted small">Yangi xabar yoʻq.</div> : xabarlar.map((n) => (
              <div key={n.id} className={`notif ${n.oqilgan ? '' : 'new'}`} style={{ margin: '0 -8px', borderRadius: 10 }} onClick={() => { oqildi([n.id]); if (n.havola) nav(n.havola) }}>
                <span className={`d ${n.turi}`} />
                <div className="grow">
                  <div className="small">{n.matn}</div>
                  <div className="xs muted">{nisbiy(n.sana)}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div className="row between mt-24 mb-12">
        <h2 className="row gap-6"><Sparkles size={18} color="var(--teal-500)" /> Siz uchun tavsiya</h2>
        <Button v="ghost" size="sm" onClick={() => nav('/xodim/oquv')}>Butun katalog</Button>
      </div>
      {tavsiya.length === 0 ? (
        <Card><Empty title="Hozircha mos kurs topilmadi">Qabul ochiq oqimlar paydo boʻlganda shu yerda koʻrinadi.</Empty></Card>
      ) : (
        <Stagger className="grid g3">
          {tavsiya.map((t) => (
            <motion.div key={t.o.id} variants={staggerItem}>
              <KursKarta o={t.o} onOpen={() => nav(`/xodim/oquv?kurs=${t.o.id}`)} izoh={t.sabab.length > 0 && <div className="xs" style={{ color: 'var(--teal-600)' }}>✓ {t.sabab.join(', ')}</div>} />
            </motion.div>
          ))}
        </Stagger>
      )}
      <QrDavomatModal open={qr} onClose={() => setQr(false)} />
    </>
  )
}
