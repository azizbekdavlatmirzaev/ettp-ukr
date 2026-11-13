import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Download, ExternalLink, FileBarChart, FolderOpen } from 'lucide-react'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { MurojaatTugma } from '@/shared/Murojaat'
import { Badge, Button, Card, CardH, Empty, Holat, PageHeader, Stagger, Tabs, staggerItem } from '@/ui'
import { QR } from '@/ui/charts'
import { sana, sanaVaqt } from '@/lib/format'
import { QR_ASOS, sertifikatPdf } from '@/lib/eksport'
import { yillikPdf } from './_portfolio'

type F = 'barchasi' | T.HujjatTuri
const TUR_NOMI: Record<string, string> = { UKR: 'UKR sertifikati', DIPLOM: 'Rezidentura diplomi', PSV: 'PSV hisoboti', KOMPETENSIYA: 'Kompetensiya sertifikati' }

export default function Hujjatlar() {
  const { db, shaxs, toast } = useXodim()
  const [f, setF] = useState<F>('barchasi')
  const [busy, setBusy] = useState('')
  const hammasi = db.sertifikatlar.filter((s) => s.personId === shaxs.id).sort((a, b) => b.sana.localeCompare(a.sana))
  const rows = f === 'barchasi' ? hammasi : hammasi.filter((s) => s.turi === f)
  const nusxalar = db.yillikHisobotlar.filter((n) => n.personId === shaxs.id).sort((a, b) => b.sana.localeCompare(a.sana))
  const n = (t: T.HujjatTuri) => hammasi.filter((s) => s.turi === t).length

  const pdf = async (s: T.Sertifikat) => {
    setBusy(s.id)
    try {
      await sertifikatPdf(s, db.sozlamalar.sertifikatShablon)
      toast({ turi: 'ok', matn: `${s.seriya} ${s.raqam} PDF yuklab olindi. Qayta chop etish yangi sertifikat yaratmaydi.` })
    } finally {
      setBusy('')
    }
  }
  const nusxala = async (s: T.Sertifikat) => {
    const url = QR_ASOS() + s.qrKalit
    try {
      await navigator.clipboard.writeText(url)
      toast({ turi: 'ok', matn: 'Tekshiruv havolasi nusxalandi.' })
    } catch {
      toast({ turi: 'warn', sarlavha: 'Nusxalab boʻlmadi', matn: url })
    }
  }

  return (
    <>
      <PageHeader title="Hujjatlarim" desc="UKR sertifikatlari, rezidentura diplomi, PSV hisobotlari va yillik hisobot nusxalari — har biri QR orqali tekshiriladi" source={`Manba: Sertifikatlar moduli · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <div className="mb-16">
        <Tabs id="hujjat" value={f} onChange={setF} tabs={[
          { v: 'barchasi', l: 'Barchasi', n: hammasi.length },
          { v: 'UKR', l: 'UKR', n: n('UKR') },
          { v: 'DIPLOM', l: 'Diplom', n: n('DIPLOM') },
          { v: 'PSV', l: 'PSV', n: n('PSV') },
        ]} />
      </div>
      {rows.length === 0 ? (
        <Card><Empty icon={<FolderOpen />} title="Bu turdagi hujjat yoʻq">Kursni muvaffaqiyatli tugatganingizda sertifikat avtomatik yaratiladi.</Empty></Card>
      ) : (
        <Stagger className="grid g2">
          {rows.map((s) => (
            <motion.div key={s.id} variants={staggerItem}>
              <Card hover>
                <div className="row top" style={{ gap: 16 }}>
                  <div className="col gap-6" style={{ alignItems: 'center', flex: 'none' }}>
                    <QR matn={QR_ASOS() + s.qrKalit} size={104} />
                    <span className="xs muted mono">{s.qrKalit.slice(0, 10)}…</span>
                  </div>
                  <div className="grow col gap-6" style={{ minWidth: 0 }}>
                    <div className="row wrap gap-6">
                      <Badge ton={s.turi === 'UKR' ? 'brand' : s.turi === 'DIPLOM' ? 'teal' : 'info'}>{TUR_NOMI[s.turi]}</Badge>
                      <Holat h={s.holat} />
                      {s.kochirilgan && <Badge ton="muted">{s.kochirilgan}</Badge>}
                    </div>
                    <div className="b">{s.kurs}</div>
                    <div className="small muted">{s.provider}</div>
                    <div className="mono small">{s.seriya} {s.raqam}</div>
                    <div className="row wrap gap-6 xs muted">
                      <span>{sana(s.sana)}</span>
                      {s.soat > 0 && <span>· {s.soat} soat</span>}
                      {s.kredit > 0 && <span>· <b style={{ color: 'var(--ok)' }}>{s.kredit} kredit</b></span>}
                      <span>· shablon v{s.shablonVersiya}</span>
                    </div>
                    {s.sabab && <div className="xs" style={{ color: 'var(--warn)' }}>Sabab: {s.sabab}</div>}
                  </div>
                </div>
                <div className="card-f row wrap gap-6">
                  <Button size="sm" v="primary" icon={<Download />} loading={busy === s.id} onClick={() => pdf(s)}>PDF yuklab olish</Button>
                  <Button size="sm" v="secondary" icon={<ExternalLink />} onClick={() => window.open(QR_ASOS() + s.qrKalit, '_blank', 'noopener')}>QR sahifani ochish</Button>
                  <Button size="sm" v="ghost" icon={<Copy />} onClick={() => nusxala(s)}>Havolani nusxalash</Button>
                  <MurojaatTugma size="sm" turi="sertifikat" obyekt={{ turi: 'Sertifikat', id: s.id, nomi: `${s.seriya} ${s.raqam} — ${s.kurs}` }} label="Murojaat" />
                </div>
              </Card>
            </motion.div>
          ))}
        </Stagger>
      )}

      <Card className="mt-20">
        <CardH icon={<FileBarChart />} title="Yillik hisobot nusxalari" sub="«Kreditlarim» boʻlimidan yuklab olingan hisobotlar tizimda saqlanadi" />
        {nusxalar.length === 0 ? <div className="small muted">Hali yillik hisobot yuklab olinmagan. «Kreditlarim» → «Yillik hisobot (PDF)».</div> : nusxalar.map((n) => (
          <div key={n.id} className="li">
            <span className={`ic ${n.holat.natija === 'bajarildi' ? 'ok' : 'warn'}`}><FileBarChart /></span>
            <div className="grow">
              <div className="b small">{n.yil}-yil UKR hisoboti · {n.holat.X}/{n.holat.T} kredit</div>
              <div className="xs muted">Yaratilgan {sanaVaqt(n.sana)} · qoida v{n.holat.qoidaVersiya} · QR {n.qr}</div>
            </div>
            <Holat h={n.holat.natija} />
            <Button size="xs" v="ghost" icon={<Download />} onClick={async () => { await yillikPdf(db, shaxs, n); toast({ turi: 'ok', matn: 'Hisobot nusxasi yuklab olindi.' }) }}>PDF</Button>
          </div>
        ))}
      </Card>
    </>
  )
}
