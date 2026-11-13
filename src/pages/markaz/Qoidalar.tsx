import { useState } from 'react'
import { Plus, FlaskConical, Send, Pencil, Scale } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Button, Card, CardH, Confirm, DL, Holat, Modal, PageHeader, cx } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { useMarkaz, manba, RolTugma, MUT_SABAB, RAH_SABAB, userFio, Qulf, Sec } from './_parts'
import { QoidaForm, SimModal, paramMatn } from './_qoidaForm'

export default function MarkazQoidalar() {
  const { db, user, rahbar, mutaxassis, ijro, ok } = useMarkaz()
  const [tanl, setTanl] = useState<string>()
  const [forma, setForma] = useState<{ open: boolean; q?: T.KreditQoidasi }>({ open: false })
  const [sim, setSim] = useState<T.KreditQoidasi>()
  const [oyna, setOyna] = useState<'' | 'yubor' | 'tasdiq' | 'rad'>('')
  const q = db.qoidalar.find((x) => x.id === tanl)
  const tartib = [...db.qoidalar].sort((a, b) => a.kuchgaKirish.localeCompare(b.kuchgaKirish) || a.versiya.localeCompare(b.versiya, undefined, { numeric: true }))
  const muallifmi = q?.muallif === user.id

  const yubor = () => {
    if (!q) return
    const r = ijro(A.qoidaYubor, q.id)
    setOyna('')
    if (r.ok) ok(`Qoida ${q.versiya} qaror qabul qiluvchiga yuborildi.`)
  }
  const tasdiq = (okmi: boolean, izoh: string) => {
    if (!q) return
    const r = ijro(A.qoidaTasdiqla, q.id, okmi, izoh)
    setOyna('')
    if (r.ok) ok(okmi ? `Qoida ${q.versiya} tasdiqlandi.` : `Qoida ${q.versiya} rad etildi — muallifga qaytarildi.`)
  }

  return (
    <>
      <PageHeader title="Kredit qoidalari" desc="Yillik talablar va hisoblash parametrlari — versiyalar bilan, dasturchisiz. Qonunchilik oʻzgarsa kod emas, qoida versiyasi oʻzgaradi."
        source={manba('Kredit qoidalari (versiyalar)')}
        actions={<RolTugma ruxsat={mutaxassis} sabab={MUT_SABAB} v="primary" icon={<Plus />} onClick={() => setForma({ open: true })}>Yangi versiya</RolTugma>} />
      <Card className="mb-16">
        <CardH icon={<Scale />} title="Versiyalar vaqt chizigʻi" sub="Kuchga kirish sanasi boʻyicha. Yangi versiya oʻtgan davrni qayta yozmaydi." />
        <div className="mk-tline">
          {tartib.map((x) => (
            <div key={x.id} className={cx('v', x.holat, x.id === tanl && 'on')} onClick={() => setTanl(x.id)} role="button" tabIndex={0}>
              <div className="row between"><b>v{x.versiya}</b><Holat h={x.holat} /></div>
              <div className="small mt-4">{x.nomi}</div>
              <div className="xs muted mt-4">{sana(x.kuchgaKirish)} → {x.tugash ? sana(x.tugash) : '…'}</div>
              <div className="xs muted">Oliy {x.params.talabOliy} / oʻrta {x.params.talabOrta}</div>
            </div>
          ))}
        </div>
      </Card>
      <DataTable
        rows={tartib.slice().reverse()}
        exportName="kredit-qoidalari"
        onRow={(r) => setTanl(r.id)}
        cols={[
          { k: 'v', l: 'Versiya', r: (r) => <b>{r.versiya}</b>, excel: (r) => r.versiya },
          { k: 'nomi', l: 'Nomi', r: (r) => <span className="small">{r.nomi}</span>, excel: (r) => r.nomi },
          { k: 'huj', l: 'Hujjat', r: (r) => <span className="xs">{r.hujjat.nomi} № {r.hujjat.raqam}, {sana(r.hujjat.sana)}</span>, excel: (r) => `${r.hujjat.nomi} № ${r.hujjat.raqam}` },
          { k: 'kk', l: 'Kuchga kirish', r: (r) => <span className="small nowrap">{sana(r.kuchgaKirish)}</span>, sort: (r) => r.kuchgaKirish, excel: (r) => r.kuchgaKirish },
          { k: 'tug', l: 'Tugash', r: (r) => <span className="small nowrap">{sana(r.tugash)}</span>, excel: (r) => r.tugash },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, excel: (r) => holatMatn(r.holat)[0] },
          { k: 'mu', l: 'Muallif / tasdiqlovchi', r: (r) => <span className="xs">{userFio(db, r.muallif)}<br /><span className="muted">{r.tasdiqlovchi ? userFio(db, r.tasdiqlovchi) : '—'}</span></span>, excel: (r) => `${userFio(db, r.muallif)} / ${userFio(db, r.tasdiqlovchi)}` },
        ]}
      />
      <Modal open={!!q} onClose={() => setTanl(undefined)} drawer title={`Qoida ${q?.versiya ?? ''}`} sub={q && <span className="row gap-6"><Holat h={q.holat} /><span className="small">{q.nomi}</span></span>}
        footer={q && (
          <div className="mk-actions">
            <Button v="secondary" icon={<FlaskConical />} onClick={() => setSim(q)}>Simulyatsiya</Button>
            {(q.holat === 'qoralama' || q.holat === 'rad_etilgan') && <RolTugma ruxsat={mutaxassis} sabab={MUT_SABAB} v="soft" icon={<Pencil />} onClick={() => setForma({ open: true, q })}>Tahrirlash</RolTugma>}
            {q.holat === 'qoralama' && <RolTugma ruxsat={mutaxassis} sabab={MUT_SABAB} v="primary" icon={<Send />} onClick={() => setOyna('yubor')}>Koʻrib chiqishga yuborish</RolTugma>}
            {q.holat === 'korib_chiqishda' && (
              <>
                <RolTugma ruxsat={rahbar && !muallifmi} sabab={!rahbar ? RAH_SABAB : 'Qoidani yaratgan va tasdiqlagan — turli shaxslar boʻlishi shart.'} v="success" onClick={() => setOyna('tasdiq')}>Tasdiqlash (ERI)</RolTugma>
                <RolTugma ruxsat={rahbar && !muallifmi} sabab={!rahbar ? RAH_SABAB : 'Muallif oʻz qoidasini koʻrib chiqa olmaydi.'} v="danger" onClick={() => setOyna('rad')}>Rad etish</RolTugma>
              </>
            )}
          </div>
        )}>
        {q && (
          <>
            {q.holat === 'korib_chiqishda' && muallifmi && <Qulf>Siz bu versiyaning muallifisiz — tasdiqlash boshqa vakolatli shaxs tomonidan bajariladi.</Qulf>}
            {q.holat === 'rad_etilgan' && q.izoh && <Alert ton="err" title="Rad etilgan">{q.izoh}. Tahrirlab qayta saqlang — qoralamaga qaytadi.</Alert>}
            <Sec title="Meʼyoriy asos">
              <DL items={[
                ['Hujjat', `${q.hujjat.nomi} № ${q.hujjat.raqam}`],
                ['Hujjat sanasi', sana(q.hujjat.sana)],
                ['Kuchga kirish', sana(q.kuchgaKirish)],
                ['Tugash', q.tugash ? sana(q.tugash) : 'Belgilanmagan'],
                ['Muallif', userFio(db, q.muallif)],
                ['Tasdiqlovchi', q.tasdiqlovchi ? userFio(db, q.tasdiqlovchi) : '—'],
                ['Yaratilgan', sanaVaqt(q.yaratilgan)],
                ['Izoh', q.izoh ?? '—'],
              ]} />
            </Sec>
            <Sec title="Parametrlar">
              <DL items={paramMatn(q.params)} />
            </Sec>
            <Alert ton="info">Yangi versiya oʻtgan davr natijalarini oʻzgartirmaydi; orqaga tatbiq faqat alohida vakolatli qaror bilan. Bir xil maʼlumot va bir xil versiya — har doim bir xil natija.</Alert>
          </>
        )}
      </Modal>
      <QoidaForm open={forma.open} tahrir={forma.q} onClose={() => setForma({ open: false })} />
      <SimModal q={sim} onClose={() => setSim(undefined)} />
      <Confirm open={oyna === 'yubor'} onClose={() => setOyna('')} onOk={yubor} title="Koʻrib chiqishga yuborish" okText="Yuborish">
        <p className="small">Qoida {q?.versiya} qaror qabul qiluvchiga yuboriladi. Yuborilgandan keyin tahrirlab boʻlmaydi.</p>
      </Confirm>
      <Confirm open={oyna === 'tasdiq'} onClose={() => setOyna('')} onOk={(iz) => tasdiq(true, iz)} eri title={`Qoida ${q?.versiya ?? ''} ni tasdiqlash`} okText="Tasdiqlash" ton="success">
        <p className="small">Kuchga kirish: {sana(q?.kuchgaKirish)}. Sana kelgach amaldagi versiya yopiladi; oʻtgan davr qayta yozilmaydi.</p>
      </Confirm>
      <Confirm open={oyna === 'rad'} onClose={() => setOyna('')} onOk={(iz) => tasdiq(false, iz)} title="Qoidani rad etish" izoh="Rad etish sababi" izohMajburiy ton="danger" okText="Rad etish" />
    </>
  )
}
