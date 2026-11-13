import { useMemo, useState } from 'react'
import { ShieldAlert, Database, Users, UserMinus, UserCheck, UserPlus } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useStore } from '@/domain/store'
import { DataTable } from '@/ui/DataTable'
import { Alert, Badge, Button, Card, CardH, Holat, KPI, PageHeader } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { TOIFA } from '@/lib/holat'
import { mutNomi } from '@/shared/hooks'
import type { AuditYozuv, MehnatMunosabati } from '@/domain/types'
import { useMuassasa } from './_umumiy'

export default function MuassasaXodimlar() {
  const { db, mid, muassasa, bugun, amal, user } = useMuassasa()
  const [sinov, setSinov] = useState<AuditYozuv | null>(null)
  const faol = useMemo(() => A.muassasaXodimlari(db, mid, bugun), [db, mid, bugun])
  const ketganlar = db.mehnat.filter((m) => m.muassasaId === mid && m.gacha && m.gacha < bugun).length
  const asosiy = faol.filter((m) => m.asosiy).length
  const fio = (m: MehnatMunosabati) => {
    const s = A.shaxs(db, m.personId)
    return s ? A.toliqFio(s) : '—'
  }

  const sinash = () => {
    const begona = db.mehnat.find((m) => m.muassasaId === 'MU05' && (!m.gacha || m.gacha >= bugun))
    if (!begona) return
    amal(A.eslatmaYubor, [begona.personId], 'Sinov: boshqa muassasa xodimiga eslatma')
    const a = useStore.getState().db.audit.find((x) => x.userId === user.id && x.natija === 'rad_etildi')
    setSinov(a ?? null)
  }

  return (
    <>
      <PageHeader title="Xodimlar" desc="Muassasada hozir ishlayotgan xodimlar — tasdiqlangan mehnat munosabatlari asosida." source={`Manba: HRM / Muassasa kabineti · yangilangan: ${sanaVaqt(db.shaxslar[0]?.reestrYangilangan)}`} />
      <div className="grid g4 mb-16">
        <KPI icon={<Users />} label="Faol xodimlar" value={faol.length} />
        <KPI icon={<UserCheck />} label="Asosiy ish joyi" value={asosiy} ton="ok" delay={0.05} />
        <KPI icon={<UserPlus />} label="Oʻrindoshlar" value={faol.length - asosiy} ton="teal" delay={0.1} />
        <KPI icon={<UserMinus />} label="Ishdan boʻshaganlar" value={ketganlar} ton="warn" delay={0.15} hint="Ularning maʼlumoti koʻrsatilmaydi" />
      </div>
      <Alert ton="info" title="Roʻyxat qayerdan olinadi">
        Xodimlar roʻyxati HRM (Yagona milliy mehnat tizimi) va Muassasa kabinetidagi tasdiqlangan mehnat munosabatlaridan olinadi.
        Muassasa faqat oʻzida ishlayotgan xodimlarni koʻradi; xodim ishdan boʻshagan sanadan keyingi maʼlumotlari koʻrinmaydi.
        Oʻrindosh xodimning kredit hisobi bitta — rejani faqat asosiy ish beruvchi tasdiqlaydi.
      </Alert>
      <div className="mt-16">
        <DataTable<MehnatMunosabati>
          rows={faol}
          title={muassasa?.nomi}
          exportName="muassasa-xodimlar"
          search={(m) => `${fio(m)} ${m.lavozim} ${m.bolim}`}
          filters={[
            { k: 'bolim', l: 'Boʻlim', options: (muassasa?.bolimlar ?? []).map((b) => ({ v: b, l: b })), get: (m) => m.bolim },
            { k: 'turi', l: 'Ish turi', options: [{ v: 'asosiy', l: 'Asosiy' }, { v: 'orindosh', l: 'Oʻrindosh' }], get: (m) => (m.asosiy ? 'asosiy' : 'orindosh') },
            { k: 'manba', l: 'Manba', options: [{ v: 'HRM', l: 'HRM' }, { v: 'Muassasa kabineti', l: 'Muassasa kabineti' }], get: (m) => m.manba },
          ]}
          cols={[
            { k: 'fio', l: 'F.I.Sh.', r: (m) => <b className="small">{fio(m)}</b>, sort: (m) => fio(m), excel: (m) => fio(m) },
            { k: 'lavozim', l: 'Lavozim', r: (m) => m.lavozim, sort: (m) => m.lavozim, excel: (m) => m.lavozim },
            { k: 'bolim', l: 'Boʻlim', r: (m) => <span className="tag">{m.bolim}</span>, sort: (m) => m.bolim, excel: (m) => m.bolim },
            { k: 'mut', l: 'Mutaxassislik', r: (m) => mutNomi(A.shaxs(db, m.personId)?.mutaxassislikId), excel: (m) => mutNomi(A.shaxs(db, m.personId)?.mutaxassislikId) },
            { k: 'toifa', l: 'Toifa', r: (m) => TOIFA[A.shaxs(db, m.personId)?.toifa ?? 'yoq'], excel: (m) => TOIFA[A.shaxs(db, m.personId)?.toifa ?? 'yoq'] },
            { k: 'asosiy', l: 'Ish turi', r: (m) => (m.asosiy ? <Badge ton="ok">Asosiy</Badge> : <Badge ton="info">Oʻrindosh</Badge>), sort: (m) => (m.asosiy ? 0 : 1), excel: (m) => (m.asosiy ? 'Asosiy' : 'Oʻrindosh') },
            { k: 'dan', l: 'Sanadan', r: (m) => <span className="nowrap">{sana(m.dan)}</span>, sort: (m) => m.dan, excel: (m) => sana(m.dan) },
            { k: 'manba', l: 'Manba', r: (m) => <span className="tag">{m.manba}</span>, excel: (m) => m.manba },
            { k: 'holat', l: 'Holat', r: () => <Holat h="tasdiqlangan" />, excel: () => 'Tasdiqlangan' },
          ]}
        />
      </div>

      <Card className="mt-16">
        <CardH icon={<ShieldAlert />} title="Qabul sinovi: vakolatdan tashqari maʼlumot" sub="Muassasa boshqa muassasa xodimiga amal bajara olmasligini tekshiradi (TZ 4.2.8)" />
        <div className="small muted mb-12">Tugma Buxoro viloyat perinatal markazi (MU05) xodimiga eslatma yuborishga urinadi. Server ruxsatni muassasa–xodim bogʻlanishi boʻyicha tekshiradi va 403 qaytaradi; urinish audit jurnaliga «rad etildi» bilan yoziladi.</div>
        <Button v="danger" className="soft" icon={<ShieldAlert size={16} />} onClick={sinash}>Boshqa muassasa xodimini ochishga urinish (sinov)</Button>
        {sinov && (
          <div className="mt-12">
            <Alert ton="err" title="403 — Ruxsat yoʻq. Urinish audit jurnaliga yozildi">
              <div className="small">{sanaVaqt(sinov.sana)} · {sinov.fio} · {sinov.amal} · <span className="mono xs">{sinov.ip}</span></div>
              <div className="xs muted mt-4">{sinov.keyin}</div>
            </Alert>
          </div>
        )}
        <div className="row gap-6 mt-12 xs muted"><Database size={14} /> Cheklov maʼlumotlar bazasi darajasida ham tekshiriladi (prototipda — biznes amallar qatlamida).</div>
      </Card>
    </>
  )
}
