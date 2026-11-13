import { useState } from 'react'
import { Globe2, SearchCheck, FileText, History, AlertTriangle, ClipboardCheck } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Badge, Confirm, DL, Holat, KPI, Modal, PageHeader, Timeline } from '@/ui'
import { hajm, sana, sanaVaqt } from '@/lib/format'
import { SHAKL, KURS_TURI, YONALISH, holat as holatMatn } from '@/lib/holat'
import { mutNomi } from '@/shared/hooks'
import { useMarkaz, manba, MuddatBadge, RolTugma, MUT_SABAB, RAH_SABAB, shaxsQisqa, userFio, Sec, Qulf, ishKunlari } from './_parts'
import { TekshiruvModal, XulosaModal, USUL_NOMI } from './_tanModals'

const OCHIQ: T.TanOlishHolat[] = ['yuborildi', 'tekshiruvda', 'kamchilik', 'ekspert_xulosasi', 'qaror']
const TH: T.TanOlishHolat[] = ['yuborildi', 'tekshiruvda', 'kamchilik', 'ekspert_xulosasi', 'qaror', 'tasdiqlandi', 'rad_etildi']

export default function MarkazTanOlish() {
  const { db, user, rahbar, mutaxassis, ijro, ok, bugun } = useMarkaz()
  const [tanl, setTanl] = useState<string>()
  const [oyna, setOyna] = useState<'' | 'tek' | 'kam' | 'xul' | 'tas'>('')
  const t = db.tanOlish.find((x) => x.id === tanl)
  const ochiq = (x: T.TanOlishAriza) => OCHIQ.includes(x.holat)
  const rows = [...db.tanOlish].sort((a, b) => Number(ochiq(b)) - Number(ochiq(a)) || a.muddat.localeCompare(b.muddat))

  const kamchilik = (izoh: string) => {
    if (!t) return
    const r = ijro(A.tanOlishKamchilik, t.id, izoh)
    setOyna('')
    if (r.ok) ok('Arizachiga kamchilik yuborildi; muddat toʻxtatildi.', t.raqam)
  }
  const tasdiqla = () => {
    if (!t) return
    const r = ijro(A.tanOlishTasdiqla, t.id)
    setOyna('')
    if (r.ok) ok(t.xulosa?.turi === 'rad' ? 'Rad etish qarori tasdiqlandi; xodimga murojaat huquqi tushuntirildi.' : `Qaror tasdiqlandi: +${t.xulosa?.milliyKredit} milliy kredit jurnalga yozildi.`, t.raqam)
  }
  const ochiqmi = t && ochiq(t)

  return (
    <>
      <PageHeader title="Xorijiy kreditlarni tan olish" desc="Tekshiruv (QR, xorijiy reestr, rasmiy soʻrov) → xulosa (mutaxassis) → qaror (rahbar, ERI). Muddat ish kunlarida; kamchilikda toʻxtatiladi." source={manba('Arizalar moduli (tan olish)')} />
      <div className="grid g4 mb-16">
        <KPI icon={<Globe2 />} label="Ochiq arizalar" value={db.tanOlish.filter(ochiq).length} />
        <KPI icon={<AlertTriangle />} label="Muddat ≤ 2 ish kuni" value={db.tanOlish.filter((x) => ochiq(x) && !x.toxtatilgan && (ishKunlari(bugun, x.muddat, db.sozlamalar.bayramlar) ?? 9) <= 2).length} ton="err" delay={0.05} />
        <KPI icon={<ClipboardCheck />} label="Tasdiqlash kutmoqda" value={db.tanOlish.filter((x) => x.holat === 'qaror').length} ton="warn" delay={0.1} />
        <KPI icon={<Globe2 />} label="Tan olingan kredit" value={db.tanOlish.filter((x) => x.holat === 'tasdiqlandi').reduce((s, x) => s + (x.xulosa?.milliyKredit ?? 0), 0)} ton="ok" delay={0.15} hint="milliy kredit" />
      </div>
      <DataTable
        rows={rows}
        exportName="tan-olish-arizalari"
        onRow={(r) => setTanl(r.id)}
        search={(r) => `${r.raqam} ${r.tashkilot} ${r.kurs} ${shaxsQisqa(db, r.personId)}`}
        filters={[{ k: 'h', l: 'Holat', options: TH.map((v) => ({ v, l: holatMatn(v)[0] })), get: (r) => r.holat }]}
        cols={[
          { k: 'raqam', l: 'Raqam', r: (r) => <span className="mono xs b">{r.raqam}</span>, sort: (r) => r.raqam, excel: (r) => r.raqam },
          { k: 'xodim', l: 'Xodim', r: (r) => <span className="small">{shaxsQisqa(db, r.personId)}</span>, excel: (r) => shaxsQisqa(db, r.personId) },
          { k: 'tash', l: 'Tashkilot / davlat', r: (r) => <div><div className="small b">{r.tashkilot}</div><div className="xs muted">{r.davlat}</div></div>, excel: (r) => `${r.tashkilot}, ${r.davlat}` },
          { k: 'kurs', l: 'Kurs', r: (r) => <span className="small">{r.kurs}</span>, excel: (r) => r.kurs },
          { k: 'kr', l: 'Xorijiy kredit', align: 'right', r: (r) => <span className="nowrap">{r.xorijiyKredit} {r.kreditTuri}</span>, excel: (r) => `${r.xorijiyKredit} ${r.kreditTuri}` },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, excel: (r) => holatMatn(r.holat)[0] },
          { k: 'muddat', l: 'Muddat', r: (r) => <MuddatBadge muddat={r.muddat} toxtatilgan={r.toxtatilgan} yopiq={!ochiq(r)} />, sort: (r) => r.muddat, excel: (r) => r.muddat },
        ]}
      />
      <Modal open={!!t} onClose={() => setTanl(undefined)} drawer title={t?.raqam ?? ''} sub={t && <span className="row gap-6"><Holat h={t.holat} /><MuddatBadge muddat={t.muddat} toxtatilgan={t.toxtatilgan} yopiq={!ochiqmi} /></span>}
        footer={t && ochiqmi && (
          <div className="mk-actions">
            {t.holat !== 'qaror' && (
              <>
                <RolTugma ruxsat={mutaxassis} sabab={MUT_SABAB} v="soft" icon={<SearchCheck />} onClick={() => setOyna('tek')}>Tekshiruv qoʻshish</RolTugma>
                <RolTugma ruxsat={mutaxassis && t.holat !== 'kamchilik'} sabab={!mutaxassis ? MUT_SABAB : 'Kamchilik allaqachon yuborilgan.'} v="danger" onClick={() => setOyna('kam')}>Kamchilik</RolTugma>
                <RolTugma ruxsat={mutaxassis && t.tekshiruvlar.length > 0} sabab={!mutaxassis ? MUT_SABAB : 'Avval kamida bitta tekshiruv natijasini qoʻshing.'} v="primary" onClick={() => setOyna('xul')}>Xulosa tayyorlash</RolTugma>
              </>
            )}
            {t.holat === 'qaror' && (
              <RolTugma ruxsat={rahbar && t.xulosa?.tayyorlagan !== user.id} sabab={!rahbar ? RAH_SABAB : 'Xulosani tayyorlagan shaxs uni tasdiqlay olmaydi.'} v="success" onClick={() => setOyna('tas')}>Tasdiqlash (ERI)</RolTugma>
            )}
          </div>
        )}>
        {t && (
          <>
            {t.holat === 'qaror' && !rahbar && <Qulf>Xulosa tayyor — qarorni qaror qabul qiluvchi ERI bilan tasdiqlaydi.</Qulf>}
            <Sec icon={<Globe2 />} title="Ariza">
              <DL items={[
                ['Xodim', `${shaxsQisqa(db, t.personId)} · ${mutNomi(t.mutaxassislikId)}`],
                ['Tashkilot', `${t.tashkilot} (${t.davlat})`],
                ['Kurs', t.kurs],
                ['Sana / hajm', `${sana(t.sana)} · ${t.soat} soat · ${SHAKL[t.shakl]}`],
                ['Sertifikat raqami', <span className="mono">{t.sertifikatRaqam}</span>],
                ['Xorijiy kredit', <Badge ton="info">{t.xorijiyKredit} {t.kreditTuri} — milliy emas</Badge>],
                ['Yuborilgan', sanaVaqt(t.yuborilgan)],
                ['Muddat', `${sana(t.muddat)}${t.toxtatilgan ? ' (toʻxtatilgan)' : ''}`],
              ]} />
            </Sec>
            <Sec icon={<FileText />} title={`Fayllar (${t.fayllar.length})`}>
              {t.fayllar.map((f) => <div key={f.id} className="mk-doc"><FileText size={15} /><div className="grow"><div className="b">{f.nomi}</div><div className="xs muted mono">{hajm(f.hajm)} · SHA-256 {f.hash.slice(0, 20)}… · {sanaVaqt(f.yuklangan)}</div></div></div>)}
            </Sec>
            <Sec icon={<SearchCheck />} title="Tekshiruv jurnali">
              {t.tekshiruvlar.length ? <Timeline items={t.tekshiruvlar.map((x) => ({ h: USUL_NOMI[x.usul] ?? x.usul, m: `${sanaVaqt(x.sana)} — ${x.natija}`, ton: 'ok' }))} /> : <div className="small muted">Hali tekshirilmagan. QR, xorijiy reestr yoki rasmiy soʻrov orqali tekshiring.</div>}
            </Sec>
            {t.xulosa && (
              <Sec icon={<ClipboardCheck />} title="Xulosa">
                <DL items={[['Turi', t.xulosa.turi === 'toliq' ? 'Toʻliq tan olish' : t.xulosa.turi === 'qisman' ? 'Qisman tan olish' : 'Rad etish'], ['Milliy kredit', <b>{t.xulosa.milliyKredit}</b>], ['Turi / yoʻnalish', `${KURS_TURI[t.xulosa.kursTuri]} · ${YONALISH[t.xulosa.yonalish]}`], ['Metodika', t.xulosa.metodika], ['Asos', t.xulosa.asos], ['Tayyorlagan', userFio(db, t.xulosa.tayyorlagan)], ['Tasdiqlagan', t.tasdiqlovchi ? userFio(db, t.tasdiqlovchi) : '—']]} />
              </Sec>
            )}
            <Sec icon={<History />} title="Tarix">
              <Timeline items={[...t.tarix].reverse().map((h) => ({ h: <Holat h={h.holat} />, m: `${sanaVaqt(h.sana)} · ${h.kim}${h.izoh ? ' — ' + h.izoh : ''}`, ton: h.holat === 'kamchilik' || h.holat === 'rad_etildi' ? 'err' : h.holat === 'tasdiqlandi' ? 'ok' : 'muted' }))} />
            </Sec>
            {t.holat === 'rad_etildi' && <Alert ton="info">Rad etilgan arizachi murojaat (apellyatsiya) yuborish huquqiga ega.</Alert>}
          </>
        )}
      </Modal>
      <TekshiruvModal t={oyna === 'tek' ? t : undefined} onClose={() => setOyna('')} />
      {oyna === 'xul' && <XulosaModal t={t} onClose={() => setOyna('')} />}
      <Confirm open={oyna === 'kam'} onClose={() => setOyna('')} onOk={kamchilik} title="Kamchilik bilan qaytarish" izoh="Nima yetishmaydi" izohMajburiy ton="danger" okText="Yuborish">
        <p className="small">Koʻrib chiqish muddati toʻxtatiladi; arizachiga {db.sozlamalar.muddatlar.tanOlishToldirish} ish kuni beriladi.</p>
      </Confirm>
      <Confirm open={oyna === 'tas'} onClose={() => setOyna('')} onOk={tasdiqla} eri title="Tan olish qarorini tasdiqlash" ton="success" okText="Tasdiqlash">
        <p className="small">{t?.xulosa?.turi === 'rad' ? 'Rad etish qarori.' : `${t?.xorijiyKredit} ${t?.kreditTuri} oʻrniga ${t?.xulosa?.milliyKredit} milliy kredit jurnalga alohida yozuv sifatida qoʻshiladi.`}</p>
      </Confirm>
    </>
  )
}
