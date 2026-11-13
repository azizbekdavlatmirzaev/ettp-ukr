import { useMemo } from 'react'
import { Building2, Database, UserCog, Layers } from 'lucide-react'
import * as A from '@/domain/amallar'
import { Avatar, Badge, Card, CardH, DL, Holat, PageHeader, Empty } from '@/ui'
import { BarCh, Donut, Legenda, RANG } from '@/ui/charts'
import { sanaVaqt } from '@/lib/format'
import { hududNomi } from '@/shared/hooks'
import { useMuassasa, statistika } from './_umumiy'

export default function MuassasaKarta() {
  const { db, mid, muassasa, qatorlar, bugun } = useMuassasa()
  const operatorlar = db.foydalanuvchilar.filter((u) => u.muassasaId === mid)
  const bolimData = useMemo(() => (muassasa?.bolimlar ?? []).map((b) => {
    const q = qatorlar.filter((r) => r.m.bolim === b)
    return { x: b, xodimlar: q.length, bajardi: q.filter((r) => r.h.xavf === 'bajarildi').length }
  }), [muassasa, qatorlar])
  const daraja = [{ name: 'Oliy maʼlumotli', value: qatorlar.filter((r) => r.s.daraja === 'oliy').length }, { name: 'Oʻrta maʼlumotli', value: qatorlar.filter((r) => r.s.daraja === 'orta').length }]
  const mehnat = A.muassasaXodimlari(db, mid, bugun)
  const st = statistika(qatorlar)
  if (!muassasa) return <Empty title="Muassasa topilmadi" />

  const manbalar: [string, string, string][] = [
    ['Platforma Reestri', 'Shaxs, mutaxassislik, toifa, maʼlumot darajasi', sanaVaqt(db.shaxslar[0]?.reestrYangilangan)],
    ['HRM (Yagona milliy mehnat tizimi)', `Mehnat munosabatlari: ${mehnat.filter((m) => m.manba === 'HRM').length} ta`, sanaVaqt(db.shaxslar[0]?.reestrYangilangan)],
    ['Muassasa kabineti', `Qoʻlda tasdiqlangan: ${mehnat.filter((m) => m.manba === 'Muassasa kabineti').length} ta`, '—'],
    ['UKR kredit jurnali', 'Kreditlar, sertifikatlar, yillik holat', sanaVaqt(db.jurnal.map((j) => j.sana).sort().pop())],
  ]

  return (
    <>
      <PageHeader title="Muassasa kartasi" desc="Muassasa rekvizitlari, boʻlimlar, operatorlar va maʼlumot manbalari." source={`Manba: Platforma Reestri, HRM · yangilangan: ${sanaVaqt(db.shaxslar[0]?.reestrYangilangan)}`} />
      <div className="grid g-main mb-16">
        <Card>
          <CardH icon={<Building2 />} title={muassasa.nomi} sub={muassasa.turi} />
          <DL items={[
            ['Identifikator', <span className="mono">{muassasa.id}</span>],
            ['Turi', muassasa.turi],
            ['Hudud', hududNomi(muassasa.hududId)],
            ['Manzil', muassasa.manzil],
            ['Faol xodimlar', `${st.n} ta (asosiy: ${mehnat.filter((m) => m.asosiy).length}, oʻrindosh: ${mehnat.filter((m) => !m.asosiy).length})`],
            ['UKR talabini bajarganlar', `${st.bajarildi} ta · oʻrtacha ${st.ortacha}%`],
          ]} />
          <div className="divider" />
          <div className="small b mb-8">Boʻlimlar</div>
          <div className="row wrap gap-6">
            {muassasa.bolimlar.map((b) => <span key={b} className="chip">{b} <b>{qatorlar.filter((r) => r.m.bolim === b).length}</b></span>)}
          </div>
        </Card>
        <Card delay={0.05}>
          <CardH icon={<UserCog />} title="Muassasa operatorlari" sub="Kabinetga kirish huquqi bor foydalanuvchilar" />
          {operatorlar.length === 0 ? <div className="small muted">Operator biriktirilmagan.</div> : operatorlar.map((u) => (
            <div key={u.id} className="li">
              <Avatar name={u.fio} />
              <div className="grow"><div className="b small">{u.fio}</div><div className="xs muted">{u.lavozim} · login: {u.login}</div></div>
              <Holat h={u.faol ? 'faol' : 'nofaol'} />
            </div>
          ))}
          <div className="xs muted mt-12">Operator qoʻshish va bloklash — Administrator (UZINFOCOM) orqali.</div>
        </Card>
      </div>
      <div className="grid g-main mb-16">
        <Card>
          <CardH icon={<Layers />} title="Xodimlar soni boʻlimlar boʻyicha" sub="Jami va talabni bajarganlar" />
          <BarCh data={bolimData} keys={['xodimlar', 'bajardi']} names={{ xodimlar: 'Xodimlar', bajardi: 'Talabni bajargan' }} height={260} />
        </Card>
        <Card delay={0.05}>
          <CardH title="Maʼlumot darajasi" sub="Yillik talab darajaga bogʻliq" />
          <Donut data={daraja} colors={[RANG[0], RANG[1]]} height={190} center={<div className="stat-big">{st.n}</div>} />
          <Legenda items={daraja.map((d) => ({ l: d.name, v: d.value }))} colors={[RANG[0], RANG[1]]} />
        </Card>
      </div>
      <Card>
        <CardH icon={<Database />} title="Maʼlumot manbalari" sub="Kabinetdagi raqamlar qayerdan olinadi" />
        {manbalar.map(([n, t, s]) => (
          <div key={n} className="li">
            <span className="ic brand"><Database size={16} /></span>
            <div className="grow"><div className="b small">{n}</div><div className="xs muted">{t}</div></div>
            <div className="col gap-4" style={{ alignItems: 'flex-end' }}><Badge ton="ok">ulangan</Badge><span className="xs muted nowrap">{s}</span></div>
          </div>
        ))}
      </Card>
    </>
  )
}
