import { useEffect, useState } from 'react'
import { Users, UserCheck, UserX, ShieldAlert, Lock, Unlock, Save } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useStore } from '@/domain/store'
import { ROL_NOMI } from '@/domain/malumotnoma'
import type { AuditYozuv, Foydalanuvchi, Rol } from '@/domain/types'
import { useJoriy } from '@/shared/hooks'
import { DataTable } from '@/ui/DataTable'
import { Alert, Avatar, Button, Card, CardH, Confirm, DL, Field, Holat, KPI, Modal, PageHeader, Sel } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { RolMatritsa } from './_RolMatritsa'

export default function AdminFoydalanuvchilar() {
  const { db, amal, toast, user } = useJoriy()
  const [ochiq, setOchiq] = useState<string | null>(null)
  const [rol, setRol] = useState<Rol>('xodim')
  const [blok, setBlok] = useState(false)
  const [sinov, setSinov] = useState<AuditYozuv | null>(null)
  const u = db.foydalanuvchilar.find((x) => x.id === ochiq)
  useEffect(() => { if (u) setRol(u.rol) }, [u?.id])

  const tashkilot = (x: Foydalanuvchi) => x.providerId ? db.provayderlar.find((p) => p.id === x.providerId)?.qisqa ?? x.providerId : x.muassasaId ? db.muassasalar.find((m) => m.id === x.muassasaId)?.nomi ?? x.muassasaId : x.rol.startsWith('markaz') ? 'UKR markazi' : x.rol === 'vazirlik' ? 'SSV' : x.rol === 'admin' ? 'UZINFOCOM' : '—'
  const oxirgiKirish = (x: Foydalanuvchi) => db.audit.find((a) => a.userId === x.id && a.amal.startsWith('Kirish'))?.sana

  const rolSaqla = () => {
    if (!u) return
    amal(A.foydalanuvchiOzgartir, u.id, { rol })
    if (useStore.getState().db.foydalanuvchilar.find((x) => x.id === u.id)?.rol === rol) toast({ turi: 'ok', matn: `Rol oʻzgartirildi: ${ROL_NOMI[rol]}. Amal audit jurnaliga yozildi.` })
  }
  const faolOzgartir = () => {
    if (!u) return
    amal(A.foydalanuvchiOzgartir, u.id, { faol: !u.faol })
    setBlok(false)
    toast({ turi: u.faol ? 'warn' : 'ok', matn: u.faol ? `${u.login} bloklandi — tizimga kira olmaydi.` : `${u.login} blokdan chiqarildi.` })
  }
  const kreditSinov = () => {
    amal(A.taqiqlanganKreditOzgartirish, 'SH-ANVAR', 10)
    setSinov(useStore.getState().db.audit.find((a) => a.userId === user.id && a.natija === 'rad_etildi') ?? null)
  }

  return (
    <>
      <PageHeader title="Foydalanuvchilar" desc="Foydalanuvchilar, rollar va bloklash. Administrator kredit, natija va qarorlarni oʻzgartira olmaydi." source={`Manba: OneID / Platforma foydalanuvchilari · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <div className="grid g4 mb-16">
        <KPI icon={<Users />} label="Foydalanuvchilar" value={db.foydalanuvchilar.length} />
        <KPI icon={<UserCheck />} label="Faol" value={db.foydalanuvchilar.filter((x) => x.faol).length} ton="ok" delay={0.05} />
        <KPI icon={<UserX />} label="Bloklangan" value={db.foydalanuvchilar.filter((x) => !x.faol).length} ton="err" delay={0.1} />
        <KPI icon={<ShieldAlert />} label="Rad etilgan urinishlar (audit)" value={db.audit.filter((a) => a.natija === 'rad_etildi').length} ton="warn" delay={0.15} />
      </div>
      <DataTable<Foydalanuvchi>
        rows={db.foydalanuvchilar}
        exportName="foydalanuvchilar"
        onRow={(x) => setOchiq(x.id)}
        search={(x) => `${x.login} ${x.fio} ${tashkilot(x)}`}
        filters={[
          { k: 'rol', l: 'Rol', options: Object.entries(ROL_NOMI).map(([v, l]) => ({ v, l })), get: (x) => x.rol },
          { k: 'faol', l: 'Holat', options: [{ v: 'faol', l: 'Faol' }, { v: 'nofaol', l: 'Bloklangan' }], get: (x) => (x.faol ? 'faol' : 'nofaol') },
        ]}
        cols={[
          { k: 'login', l: 'Login', r: (x) => <span className="mono small">{x.login}</span>, sort: (x) => x.login, excel: (x) => x.login },
          { k: 'fio', l: 'F.I.Sh.', r: (x) => <div className="row gap-6"><Avatar name={x.fio} /><div><div className="b small">{x.fio}</div><div className="xs muted">{x.lavozim}</div></div></div>, sort: (x) => x.fio, excel: (x) => x.fio },
          { k: 'rol', l: 'Rol', r: (x) => <span className="tag">{ROL_NOMI[x.rol]}</span>, sort: (x) => x.rol, excel: (x) => ROL_NOMI[x.rol] },
          { k: 'tash', l: 'Tashkilot', r: (x) => <span className="small">{tashkilot(x)}</span>, sort: tashkilot, excel: tashkilot },
          { k: 'kir', l: 'Oxirgi kirish', r: (x) => <span className="xs nowrap">{sanaVaqt(oxirgiKirish(x))}</span>, excel: (x) => sanaVaqt(oxirgiKirish(x)) },
          { k: 'faol', l: 'Holat', r: (x) => <Holat h={x.faol ? 'faol' : 'nofaol'} />, sort: (x) => (x.faol ? 0 : 1), excel: (x) => (x.faol ? 'Faol' : 'Bloklangan') },
        ]}
      />

      <div className="grid g-main mt-16">
        <RolMatritsa />
        <Card delay={0.05}>
          <CardH icon={<ShieldAlert />} title="Vazifalar ajratilishi sinovi" sub="Administrator kreditni bevosita oʻzgartira oladimi?" />
          <div className="small muted mb-12">Tugma Karimov A. B. (SH-ANVAR) balansiga +10 kredit yozishga urinadi. Kredit jurnaliga faqat Kredit xizmati yozadi — soʻrov 403 bilan rad etiladi va auditga tushadi.</div>
          <Button v="danger" className="soft" icon={<ShieldAlert size={16} />} onClick={kreditSinov}>Kreditni bevosita oʻzgartirishga urinish (sinov)</Button>
          {sinov && <div className="mt-12"><Alert ton="err" title="403 Forbidden — audit jurnaliga yozildi"><div className="small">{sanaVaqt(sinov.sana)} · {sinov.amal} · <span className="mono xs">{sinov.ip}</span></div><div className="xs muted mt-4">{sinov.keyin}</div></Alert></div>}
        </Card>
      </div>

      <Modal open={!!u} onClose={() => setOchiq(null)} drawer title={u?.fio ?? ''} sub={u ? `${u.login} · ${ROL_NOMI[u.rol]}` : ''}
        footer={u && <Button v={u.faol ? 'danger' : 'success'} icon={u.faol ? <Lock size={16} /> : <Unlock size={16} />} disabled={u.id === user.id} title={u.id === user.id ? 'Oʻz hisobingizni bloklay olmaysiz' : undefined} onClick={() => setBlok(true)}>{u.faol ? 'Bloklash' : 'Blokdan chiqarish'}</Button>}>
        {u && (
          <div className="col gap-16">
            <div className="row"><Avatar name={u.fio} lg /><div><div className="b">{u.fio}</div><Holat h={u.faol ? 'faol' : 'nofaol'} /></div></div>
            <DL items={[['Login', <span className="mono">{u.login}</span>], ['Lavozim', u.lavozim], ['Tashkilot', tashkilot(u)], ['Shaxs (Reestr)', u.personId ? 'bogʻlangan' : '—'], ['Oxirgi kirish', sanaVaqt(oxirgiKirish(u))]]} />
            <Field label="Rol" help="Rol oʻzgarishi keyingi kirishda kuchga kiradi va auditga yoziladi.">
              <Sel value={rol} onChange={(e) => setRol(e.target.value as Rol)} options={Object.entries(ROL_NOMI).map(([v, l]) => ({ v, l }))} disabled={u.id === user.id} />
            </Field>
            <Button v="primary" icon={<Save size={16} />} disabled={rol === u.rol} onClick={rolSaqla}>Rolni saqlash</Button>
            <Alert ton="warn">Administrator kredit, natija va qarorlarni oʻzgartira olmaydi — bunday soʻrovlar 403 bilan rad etiladi.</Alert>
            <section>
              <h3 className="mb-8">Oxirgi amallari</h3>
              {db.audit.filter((a) => a.userId === u.id).slice(0, 6).map((a) => (
                <div key={a.id} className="li"><div className="grow"><div className="small">{a.amal}</div><div className="xs muted">{sanaVaqt(a.sana)} · {a.ip}</div></div><Holat ton={a.natija === 'ok' ? 'ok' : 'err'}>{a.natija === 'ok' ? 'Bajarildi' : 'Rad etildi'}</Holat></div>
              ))}
              {!db.audit.some((a) => a.userId === u.id) && <div className="small muted">Amallar yoʻq.</div>}
            </section>
          </div>
        )}
      </Modal>
      <Confirm open={blok} onClose={() => setBlok(false)} title={u?.faol ? 'Foydalanuvchini bloklash' : 'Blokdan chiqarish'} okText={u?.faol ? 'Bloklash' : 'Blokdan chiqarish'} ton={u?.faol ? 'danger' : 'success'} onOk={faolOzgartir}>
        <div className="small">{u?.fio} ({u?.login}) — {u?.faol ? 'tizimga kira olmaydi, faol sessiyalari yakunlanadi.' : 'yana tizimga kira oladi.'}</div>
      </Confirm>
    </>
  )
}
