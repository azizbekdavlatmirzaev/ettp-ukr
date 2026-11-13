import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Eye, EyeOff, FileWarning, ShieldCheck, UserRound } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { amaldagiQoida } from '@/domain/kredit'
import { useXodim, mutNomi, hududNomi } from '@/shared/hooks'
import { MurojaatModal } from '@/shared/Murojaat'
import { Alert, Avatar, Badge, Button, Card, CardH, Confirm, Empty, Holat, PageHeader, Stagger, staggerItem } from '@/ui'
import { EKG } from '@/ui/art'
import { niqob, sana, sanaVaqt } from '@/lib/format'
import { TOIFA } from '@/lib/holat'
import { Manba } from './_parts'
import { rozilikBekor } from './_amallar'
import { useBajar } from './_bajar'

const ISTISNO: Record<string, string> = { dekret: 'Dekret taʼtili', kasallik: 'Uzoq muddatli kasallik', harbiy: 'Harbiy xizmat', boshqa: 'Boshqa asos' }

function Maydon({ l, v, m, children }: { l: string; v?: ReactNode; m: string; children?: ReactNode }) {
  return (
    <motion.div variants={staggerItem} className="li" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 190, flex: 'none' }} className="small muted">{l}</div>
      <div className="grow b small" style={{ minWidth: 160 }}>{v ?? children}</div>
      <Manba m={m} />
    </motion.div>
  )
}

export default function Profil() {
  const { db, shaxs: s, mehnat, toast, bugun } = useXodim()
  const bajar = useBajar()
  const [ochiq, setOchiq] = useState(false)
  const [mur, setMur] = useState(false)
  const [bekor, setBekor] = useState<T.PsvIsh | null>(null)
  const q = amaldagiQoida(db.qoidalar, bugun) ?? db.qoidalar[0]
  const talab = s.daraja === 'oliy' ? q.params.talabOliy : q.params.talabOrta
  const roziliklar = db.psv.filter((p) => p.personId === s.id)

  return (
    <>
      <PageHeader title="Profil" desc="Shaxsiy va kasbiy maʼlumotlar Reestr, OneID va HRM tizimlaridan olinadi" source={`Reestr yangilangan: ${sanaVaqt(s.reestrYangilangan)}`}
        actions={<Button v="secondary" icon={<FileWarning />} onClick={() => setMur(true)}>Reestrdagi xatolik haqida xabar berish</Button>} />

      <motion.div className="hero mb-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row wrap" style={{ gap: 18, position: 'relative' }}>
          <Avatar name={`${s.ism} ${s.familiya}`} lg />
          <div className="grow">
            <h2>{A.toliqFio(s)}</h2>
            <div className="sub small mt-4">{mutNomi(s.mutaxassislikId)} · {TOIFA[s.toifa]} · {hududNomi(s.hududId)}</div>
            <div className="row wrap gap-6 mt-12">
              <span className="chip">Maʼlumot darajasi: {s.daraja === 'oliy' ? 'oliy' : 'oʻrta'}</span>
              <span className="chip">Yillik talab: {talab} kredit (qoida v{q.versiya})</span>
              <span className="chip"><ShieldCheck /> Davlat roʻyxati: {s.davlatRoyxati.holat}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <Alert ton="info" title="Maʼlumot faqat manbasida oʻzgartiriladi">Platformada bu maʼlumotlarni tahrirlab boʻlmaydi. Xato boʻlsa — «Reestrdagi xatolik haqida xabar berish» orqali murojaat yuboring; tuzatish manba tizimida bajariladi va avtomatik yangilanadi.</Alert>

      <div className="grid g-main mt-16">
        <Card>
          <CardH icon={<UserRound />} title="Shaxsiy va kasbiy maʼlumotlar" />
          <Stagger>
            <Maydon l="F.I.Sh." v={A.toliqFio(s)} m="OneID" />
            <Maydon l="JSHSHIR" m="OneID">
              <span className="row gap-6"><span className="mono">{ochiq ? s.jshshir : niqob(s.jshshir)}</span>
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setOchiq(!ochiq)} aria-label={ochiq ? 'Yashirish' : 'Koʻrsatish'}>{ochiq ? <EyeOff size={14} /> : <Eye size={14} />}</button></span>
            </Maydon>
            <Maydon l="Tugʻilgan sana / jins" v={`${sana(s.tugilgan)} · ${s.jins === 'E' ? 'erkak' : 'ayol'}`} m="OneID" />
            <Maydon l="Telefon / e-pochta" v={`${s.telefon} · ${s.email}`} m="OneID" />
            <Maydon l="Mutaxassislik" v={mutNomi(s.mutaxassislikId)} m="Reestr" />
            <Maydon l="Malaka toifasi" v={`${TOIFA[s.toifa]}${s.toifaMuddati ? ` · ${sana(s.toifaMuddati)} gacha` : ''}`} m="Reestr" />
            <Maydon l="Davlat roʻyxati" m="Reestr"><span className="row wrap gap-6">{s.davlatRoyxati.raqam} · {sana(s.davlatRoyxati.sana)} <Holat ton={s.davlatRoyxati.holat === 'amalda' ? 'ok' : 'err'}>{s.davlatRoyxati.holat === 'amalda' ? 'Amalda' : 'Toʻxtatilgan'}</Holat></span></Maydon>
            <Maydon l="Maʼlumot darajasi" v={`${s.daraja === 'oliy' ? 'Oliy' : 'Oʻrta'} tibbiy — yillik talab ${talab} kredit`} m="Reestr" />
            <Maydon l="Hudud" v={hududNomi(s.hududId)} m="Reestr" />
          </Stagger>
        </Card>
        <div className="col gap-16">
          <Card>
            <CardH icon={<Briefcase />} title="Ish joylari" sub="Ikki ish beruvchi boʻlsa ham kredit hisobi bitta" />
            {mehnat.map((m) => (
              <div key={m.id} className="li" style={{ alignItems: 'flex-start' }}>
                <span className={`ic ${m.asosiy && !m.gacha ? 'brand' : ''}`}><Briefcase /></span>
                <div className="grow">
                  <div className="b small">{db.muassasalar.find((u) => u.id === m.muassasaId)?.nomi}</div>
                  <div className="xs muted">{m.lavozim} · {m.bolim}</div>
                  <div className="xs muted">{sana(m.dan)} – {m.gacha ? sana(m.gacha) : 'hozirgacha'}</div>
                  <div className="row wrap gap-4 mt-4">{m.asosiy ? <Badge ton="brand">Asosiy</Badge> : <Badge>Oʻrindoshlik</Badge>}{m.gacha && <Badge ton="muted">Boʻshagan</Badge>}<Manba m={m.manba} /></div>
                </div>
              </div>
            ))}
          </Card>
          {s.istisno ? (
            <Alert ton="warn" title={`Istisno: ${ISTISNO[s.istisno.turi]}`}>{sana(s.istisno.dan)} – {sana(s.istisno.gacha)} · hujjat: {s.istisno.hujjat}. Shu davr uchun yillik talab qoida boʻyicha kamaytiriladi.</Alert>
          ) : (
            <Card><div className="small muted">Istisno holati (dekret, uzoq kasallik va h.k.) qayd etilmagan. Manba: HRM.</div></Card>
          )}
        </div>
      </div>

      <Card className="mt-16">
        <CardH icon={<ShieldCheck />} title="Roziliklar (PSV)" sub="Maʼlumotlaringizni uchinchi tashkilotga uzatishga bergan roziliklaringiz" />
        {roziliklar.length === 0 ? <Empty title="Rozilik berilmagan">PSV soʻrovi yaratilganda rozilik shu yerda koʻrinadi.</Empty> : roziliklar.map((p) => (
          <div key={p.id} className="li" style={{ flexWrap: 'wrap' }}>
            <div className="grow" style={{ minWidth: 220 }}>
              <div className="b small">{p.qabulQiluvchi} <span className="xs muted mono">{p.raqam}</span></div>
              <div className="xs muted">Hajm: {p.rozilik.hajm} · berilgan {sana(p.rozilik.berilgan)} · {sana(p.rozilik.muddat)} gacha</div>
            </div>
            {p.rozilik.bekor ? <Holat ton="muted">Bekor qilingan</Holat> : p.rozilik.muddat < bugun ? <Holat ton="muted">Muddati tugagan</Holat> : <Holat ton="ok">Amalda</Holat>}
            {!p.rozilik.bekor && p.rozilik.muddat >= bugun && <Button size="sm" v="danger" onClick={() => setBekor(p)} disabled={p.holat === 'yetkazildi'} title={p.holat === 'yetkazildi' ? 'Hisobot allaqachon yetkazilgan' : undefined}>Bekor qilish</Button>}
          </div>
        ))}
      </Card>

      <MurojaatModal open={mur} onClose={() => setMur(false)} turi="boshqa" obyekt={{ turi: 'Shaxs', id: s.id, nomi: `Reestr maʼlumoti: ${A.qisqaFio(s)}` }} />
      <Confirm open={!!bekor} onClose={() => setBekor(null)} ton="danger" okText="Roziligini bekor qilish" title="Rozilikni bekor qilish"
        onOk={() => { if (bekor && bajar(rozilikBekor, bekor.id)) toast({ turi: 'ok', matn: `${bekor.raqam}: rozilik bekor qilindi — maʼlumot uzatilmaydi.` }); setBekor(null) }}>
        <p className="small">{bekor?.qabulQiluvchi} ga maʼlumot uzatish toʻxtatiladi. Bu amal qaytarilmaydi — kerak boʻlsa yangi PSV soʻrovi yarating.</p>
      </Confirm>
    </>
  )
}
