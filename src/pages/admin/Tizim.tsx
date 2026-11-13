import { useState } from 'react'
import { Activity, ListChecks, CopyX, AlertOctagon, CalendarCheck, RotateCw } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useStore } from '@/domain/store'
import type { Hodisa } from '@/domain/types'
import { useJoriy } from '@/shared/hooks'
import { DataTable } from '@/ui/DataTable'
import { Alert, Button, Card, CardH, Confirm, DL, Holat, KPI, PageHeader, Sel } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { hodisaQaytaYubor } from './_amallar'
import { Integratsiyalar } from './_Integratsiyalar'
import { OmborSolishtirish, Zaxira } from './_Zaxira'

const TURI: Record<Hodisa['turi'], string> = { natija_tasdiqlandi: 'Natija tasdiqlandi', kredit_yozildi: 'Kredit yozildi', sertifikat_yaratildi: 'Sertifikat yaratildi', reestrga_uzatildi: 'Reestrga uzatildi', qaror_tasdiqlandi: 'Qaror tasdiqlandi', lms_natija: 'LMS natijasi' }

export default function AdminTizim() {
  const { db, amal, toast, yil } = useJoriy()
  const [yy, setYy] = useState(yil - 1)
  const [tasdiq, setTasdiq] = useState(false)
  const h = db.hodisalar
  const yakunlangan = (y: number) => h.some((x) => x.id === `yil-${y}`)
  const qaytaYubor = (id: string) => {
    amal(hodisaQaytaYubor, id)
    if (useStore.getState().db.hodisalar.find((x) => x.id === id)?.holat === 'qayta_ishlandi') toast({ turi: 'ok', matn: `${id}: hodisa qayta yuborildi va qayta ishlandi.` })
  }
  const yakunla = () => {
    setTasdiq(false)
    const r = amal(A.yilYakunlash, yy)
    if (r) toast({ turi: 'ok', sarlavha: `${yy}-yil yakunlandi`, matn: `Bajardi: ${r.bajardi}, yetishmaydi: ${r.yetmaydi}, keyingi yilga oʻtkazildi: ${r.otkazildi}. Reestr va ish beruvchilarga uzatildi.` })
  }

  return (
    <>
      <PageHeader title="Tizim holati" desc="Hodisalar navbati, integratsiyalar, fayl ombori, solishtirish, zaxira va yil yakuni." source={`Manba: monitoring (UZINFOCOM) · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <div className="grid g4 mb-16">
        <KPI icon={<Activity />} label="Hodisalar (jami)" value={h.length} />
        <KPI icon={<ListChecks />} label="Navbatda / xato" value={h.filter((x) => x.holat === 'navbatda' || x.holat === 'xato').length} ton="warn" delay={0.05} hint="Avtomatik qayta yuboriladi" />
        <KPI icon={<CopyX />} label="Takror — eʼtiborsiz" value={h.filter((x) => x.holat === 'takror_eʼtiborsiz').length} ton="teal" delay={0.1} hint="Bir event_id bir marta qayta ishlanadi" />
        <KPI icon={<AlertOctagon />} label="Ishlashga yaroqlilik (oy)" value={99.93} kasr={2} suffix="%" ton="ok" delay={0.15} hint="Talab ≥ 99,5% · imitatsiya" />
      </div>

      <DataTable<Hodisa>
        rows={h}
        title="Hodisalar navbati"
        exportName="hodisalar-navbati"
        search={(x) => `${x.id} ${x.izoh ?? ''} ${x.manbaId}`}
        pageSize={10}
        filters={[
          { k: 'turi', l: 'Turi', options: Object.entries(TURI).map(([v, l]) => ({ v, l })), get: (x) => x.turi },
          { k: 'holat', l: 'Holat', options: ['navbatda', 'qayta_ishlandi', 'takror_eʼtiborsiz', 'xato'].map((v) => ({ v, l: holatMatn(v)[0] })), get: (x) => x.holat },
        ]}
        cols={[
          { k: 'vaqt', l: 'Vaqt', r: (x) => <span className="xs nowrap">{sanaVaqt(x.vaqt)}</span>, sort: (x) => x.vaqt, excel: (x) => sanaVaqt(x.vaqt) },
          { k: 'id', l: 'event_id', r: (x) => <span className="mono xs">{x.id.length > 34 ? x.id.slice(0, 34) + '…' : x.id}</span>, excel: (x) => x.id },
          { k: 'turi', l: 'Turi', r: (x) => <span className="tag">{TURI[x.turi]}</span>, excel: (x) => TURI[x.turi] },
          { k: 'izoh', l: 'Izoh', r: (x) => <span className="xs muted">{x.izoh ?? '—'}</span>, excel: (x) => x.izoh ?? '' },
          { k: 'holat', l: 'Holat', r: (x) => <Holat h={x.holat} />, sort: (x) => x.holat, excel: (x) => holatMatn(x.holat)[0] },
          { k: 'amal', l: '', r: (x) => (x.holat === 'navbatda' || x.holat === 'xato' ? <Button size="xs" v="ghost" icon={<RotateCw size={13} />} onClick={(e) => { e.stopPropagation(); qaytaYubor(x.id) }}>Qayta yuborish</Button> : null) },
        ]}
      />

      <div className="mt-16"><Integratsiyalar /></div>
      <div className="mt-16"><OmborSolishtirish /></div>
      <div className="grid g-main mt-16">
        <Zaxira />
        <Card delay={0.05}>
          <CardH icon={<CalendarCheck />} title="Yil yakunini ishga tushirish" sub="Kredit xizmati: yillik holat, oʻtkaziladigan kredit, Reestr va ish beruvchiga uzatish" />
          <div className="col gap-16">
            <Sel aria-label="Yil" value={String(yy)} onChange={(e) => setYy(Number(e.target.value))} options={[yil - 1, yil].map((y) => ({ v: String(y), l: `${y}-yil${yakunlangan(y) ? ' (yakunlangan)' : ''}` }))} />
            <DL items={[['Holati', yakunlangan(yy) ? <Holat ton="ok">Yakunlangan</Holat> : <Holat ton="warn">Yakunlanmagan</Holat>], ['Qoida', 'yil oxirida amalda boʻlgan versiya'], ['Bajarilish vaqti', '150 000 xodim — 2 soatgacha (fon rejimi)']]} />
            {yy === yil && <Alert ton="warn">Joriy yil hali tugamagan ({yil}-12-31). Yakunlash faqat yil oxirida yoki favqulodda qaror bilan.</Alert>}
            <Button v="primary" icon={<CalendarCheck size={16} />} disabled={yakunlangan(yy)} onClick={() => setTasdiq(true)}>{yy}-yil yakunini ishga tushirish</Button>
            <div className="xs muted">Takroriy ishga tushirish 409 bilan bloklanadi. Administrator kreditlarni qoʻlda oʻzgartirmaydi — hisob Kredit xizmati tomonidan.</div>
          </div>
        </Card>
      </div>
      <Confirm open={tasdiq} onClose={() => setTasdiq(false)} title={`${yy}-yil yakunini ishga tushirish`} okText="Ishga tushirish" ton="primary" onOk={yakunla}>
        <div className="small">Barcha xodimlar uchun {yy}-yil holati muzlatiladi, ortiqcha kredit (qoida boʻyicha ulushgacha) {yy + 1}-yilga oʻtkaziladi va talabni bajarmaganlarga xabar boradi. Amal qaytarilmaydi.</div>
      </Confirm>
    </>
  )
}
