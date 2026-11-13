import { useMemo, useState } from 'react'
import { BarChart3, Download, FileJson, FileText, Hourglass, MessageSquareWarning, TrendingUp } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useXodim } from '@/shared/hooks'
import { MurojaatModal } from '@/shared/Murojaat'
import { Button, Card, CardH, Empty, Holat, PageHeader, Seg } from '@/ui'
import { AreaCh, BarCh } from '@/ui/charts'
import { sana, sanaVaqt } from '@/lib/format'
import { KreditHolat } from './_KreditHolat'
import { KreditJurnal } from './_KreditJurnal'
import { oylikKredit } from './_parts'
import { yillikHisobotSaqla } from './_amallar'
import { portfolioJson, portfolioPdf, yillikPdf } from './_portfolio'

export default function Kreditlar() {
  const { db, shaxs, yil, bugun, amal, toast } = useXodim()
  const [tYil, setTYil] = useState(yil)
  const [busy, setBusy] = useState('')
  const [mur, setMur] = useState(false)
  const yillar = useMemo(() => Array.from(new Set([yil - 1, yil, ...db.jurnal.filter((j) => j.personId === shaxs.id).map((j) => j.yil)])).filter((y) => y <= yil).sort(), [db.jurnal, shaxs.id, yil])
  const h = useMemo(() => A.xodimYillik(db, shaxs.id, tYil, bugun), [db, shaxs.id, tYil, bugun])
  const tarix = useMemo(() => yillar.map((y) => { const x = A.xodimYillik(db, shaxs.id, y, bugun); return { x: String(y), X: x.X, T: x.T } }), [db, shaxs.id, yillar, bugun])
  const oylik = useMemo(() => oylikKredit(db, shaxs.id, tYil), [db, shaxs.id, tYil])
  const tekshiruvda = db.natijalar.filter((n) => n.holat === 'tekshiruvda' && A.yozilish(db, n.yozilishId)?.personId === shaxs.id)
  const tanKutil = db.tanOlish.filter((t) => t.personId === shaxs.id && !['tasdiqlandi', 'rad_etildi'].includes(t.holat))

  const hisobot = async () => {
    const n = amal(yillikHisobotSaqla, tYil)
    if (!n) return
    setBusy('pdf')
    try {
      await yillikPdf(db, shaxs, n)
      toast({ turi: 'ok', sarlavha: 'Yillik hisobot yuklab olindi', matn: 'Nusxa «Hujjatlarim» boʻlimida saqlandi va QR orqali tekshiriladi.' })
    } finally {
      setBusy('')
    }
  }
  const portfolio = async () => {
    setBusy('port')
    try {
      await portfolioPdf(db, shaxs)
      toast({ turi: 'ok', matn: 'Portfolio PDF yuklab olindi.' })
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <PageHeader title="Kreditlarim" desc="Yillik holat, kredit jurnali va hisobotlar. Kredit jurnaliga faqat Kredit xizmati yozadi." source={`Manba: UKR kredit jurnali · yangilangan: ${sanaVaqt(new Date().toISOString())}`}
        actions={<>
          <Seg id="kr-yil" value={String(tYil)} onChange={(v) => setTYil(Number(v))} items={yillar.map((y) => ({ v: String(y), l: String(y) }))} />
          <Button v="primary" icon={<Download />} loading={busy === 'pdf'} onClick={hisobot}>Yillik hisobot (PDF)</Button>
        </>} />

      <KreditHolat h={h} />

      {(tekshiruvda.length > 0 || tanKutil.length > 0) && (
        <Card className="mt-16">
          <CardH icon={<Hourglass />} title="Tekshiruvda va kutilayotgan" sub="Bu natijalar uchun kredit hali yozilmagan" />
          {tekshiruvda.map((n) => {
            const y = A.yozilish(db, n.yozilishId)!
            const v = A.versiya(db, A.oqim(db, y.oqimId)?.versiyaId)
            return (
              <div key={n.id} className="li">
                <span className="ic warn"><Hourglass /></span>
                <div className="grow">
                  <div className="b small">{v?.nomi} · {v?.tasdiqlanganKredit ?? 0} kredit</div>
                  <div className="xs muted">UKR markazi tekshiruvida: {(n.tekshiruvSababi ?? []).join('; ') || 'avtomatik tekshiruv'}</div>
                </div>
                <Holat h="tekshiruvda" />
              </div>
            )
          })}
          {tanKutil.map((t) => (
            <div key={t.id} className="li">
              <span className="ic info"><Hourglass /></span>
              <div className="grow">
                <div className="b small">{t.kurs} ({t.xorijiyKredit} {t.kreditTuri})</div>
                <div className="xs muted">Xorijiy kreditni tan olish {t.raqam} · muddat {sana(t.muddat)}</div>
              </div>
              <Holat h={t.holat} />
            </div>
          ))}
        </Card>
      )}

      <div className="grid g2 mt-16">
        <Card>
          <CardH icon={<TrendingUp />} title={`${tYil}-yil oylar boʻyicha`} sub="Yozilgan kredit va yigʻma" />
          <AreaCh data={oylik} keys={['jami', 'kredit']} names={{ jami: 'Yigʻma', kredit: 'Oy davomida' }} height={220} />
        </Card>
        <Card>
          <CardH icon={<BarChart3 />} title="Yillar boʻyicha" sub="Hisobga olingan (X) va talab (T)" />
          <BarCh data={tarix} keys={['X', 'T']} names={{ X: 'Hisobga olingan', T: 'Talab' }} height={220} />
        </Card>
      </div>

      <div className="mt-16">
        <KreditJurnal yil={tYil} />
      </div>

      <Card className="mt-16">
        <CardH icon={<FileText />} title="Portfolio va murojaat" sub="Kurslar, sertifikatlar, tan olish, rejalar va ish tarixi" />
        <div className="row wrap">
          <Button v="secondary" icon={<FileText />} loading={busy === 'port'} onClick={portfolio}>Portfolio (PDF)</Button>
          <Button v="secondary" icon={<FileJson />} onClick={() => { portfolioJson(db, shaxs); toast({ turi: 'ok', matn: 'Portfolio JSON formatida yuklab olindi (mashina oʻqiydigan).' }) }}>Portfolio (JSON)</Button>
          <Button v="ghost" icon={<MessageSquareWarning />} onClick={() => setMur(true)}>Murojaat yuborish</Button>
        </div>
        {db.jurnal.filter((j) => j.personId === shaxs.id && j.yil === tYil).length === 0 && <Empty title={`${tYil}-yilda kredit yozuvi yoʻq`}>Katalogdan kurs tanlang — tasdiqlangan natijadan soʻng kredit avtomatik yoziladi.</Empty>}
      </Card>
      <MurojaatModal open={mur} onClose={() => setMur(false)} turi="kredit" />
    </>
  )
}
