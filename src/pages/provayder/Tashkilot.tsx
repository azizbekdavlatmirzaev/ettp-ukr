import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Landmark, FileBadge, GitBranch, UserRound, Globe2, History, MessageSquareWarning, Lock, Phone, ExternalLink } from 'lucide-react'
import { Badge, Button, Card, CardH, DL, Empty, Holat, PageHeader, Timeline, Avatar } from '@/ui'
import { EKG, IMG } from '@/ui/art'
import { sana, sanaVaqt } from '@/lib/format'
import { holat as holatMatn, PROV_TURI } from '@/lib/holat'
import { hududNomi } from '@/shared/hooks'
import { MurojaatModal } from '@/shared/Murojaat'
import { manba, useProv } from './_umumiy'

const Manba = ({ n }: { n: string }) => <Badge ton="info"><Lock size={11} /> {n}</Badge>

export default function ProvayderTashkilot() {
  const { p } = useProv()
  const [mur, setMur] = useState(false)
  const xorijiy = p.turi === 'xorijiy'
  return (
    <>
      <PageHeader title="Tashkilot kartasi" desc="Reestrdagi rekvizitlar davlat tizimlaridan olinadi va faqat oʻqish uchun. Oʻzgartirish — UKR markaziga soʻrov orqali." source={manba(xorijiy ? 'Xorijiy akkreditatsiya reestri, UKR markazi' : 'Soliq tizimi, Litsenziyalash tizimi, Provayderlar reestri')}
        actions={<Button v="primary" icon={<MessageSquareWarning />} onClick={() => setMur(true)}>Maʼlumotni yangilash soʻrovi</Button>} />

      <motion.div className="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundImage: `linear-gradient(110deg, rgba(10,58,92,.95), rgba(11,92,140,.88) 60%, rgba(15,154,154,.7)), url(${IMG(xorijiy ? 'jamoa' : 'muassasa')})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row wrap gap-16" style={{ position: 'relative' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,.3)' }}><Building2 size={30} /></div>
          <div className="grow">
            <div className="row wrap gap-6"><span className="chip">{PROV_TURI[p.turi]}</span><span className="chip">{p.mamlakat}</span><Holat h={p.holat} /></div>
            <h2 className="mt-8" style={{ fontSize: 22 }}>{p.nomi}</h2>
            <div className="sub small">{p.manzil}</div>
          </div>
          {p.reyting !== undefined && <div className="glass center"><div style={{ font: '800 26px var(--font-head)' }}>{p.reyting}</div><div className="xs">tinglovchilar bahosi</div></div>}
        </div>
      </motion.div>

      <div className="grid g2 mt-16">
        <Card>
          <CardH icon={<Landmark />} title="Rekvizitlar" right={<Manba n={xorijiy ? 'UKR markazi' : 'Soliq tizimi'} />} />
          <DL items={[
            [xorijiy ? 'Tashkilot ID' : 'STIR', <span className="mono">{p.stir}</span>],
            ['Toʻliq nomi', p.nomi],
            ['Qisqa nomi', p.qisqa],
            ['Turi', PROV_TURI[p.turi]],
            ['Hudud', p.hududId ? hududNomi(p.hududId) : p.mamlakat],
            ['Manzil', p.manzil],
            ['Sayt', p.sayt ? <a href={p.sayt} target="_blank" rel="noreferrer">{p.sayt}</a> : '—'],
            ['Reestrga kiritilgan', sana(p.yaratilgan)],
          ]} />
        </Card>
        <Card delay={0.05}>
          <CardH icon={<FileBadge />} title={xorijiy ? 'Xorijiy akkreditatsiya' : 'Taʼlim litsenziyasi'} right={<Manba n={xorijiy ? 'Rasmiy manba' : 'Litsenziyalash tizimi'} />} />
          {xorijiy ? (
            p.xorijiyAkk ? (
              <DL items={[
                ['Akkreditatsiya tashkiloti', p.xorijiyAkk.tashkilot],
                ['Identifikator', <span className="mono">{p.xorijiyAkk.id}</span>],
                ['Rasmiy manba', <a href={p.xorijiyAkk.havola} target="_blank" rel="noreferrer" className="row gap-4" style={{ display: 'inline-flex' }}>{p.xorijiyAkk.havola} <ExternalLink size={12} /></a>],
                ['Mamlakat', p.mamlakat],
              ]} />
            ) : <Empty icon={<Globe2 />} title="Xorijiy akkreditatsiya maʼlumoti yoʻq" />
          ) : p.litsenziya ? (
            <DL items={[['Litsenziya raqami', <span className="mono">{p.litsenziya.raqam}</span>], ['Berilgan sana', sana(p.litsenziya.sana)], ['Amal muddati', sana(p.litsenziya.muddat)], ['Holat', <Badge ton="ok">Amalda</Badge>]]} />
          ) : <Empty title="Litsenziya topilmadi" />}
          <div className="divider" style={{ margin: '14px 0', borderTop: '1px solid var(--border)' }} />
          <CardH icon={<Globe2 />} title="UKR akkreditatsiyasi" right={<Holat h={p.holat} />} />
          {p.qaror ? <DL items={[['Qaror', p.qaror.raqam], ['Sana', sana(p.qaror.sana)], ['Amal muddati', sana(p.qaror.muddat)]]} /> : <span className="small muted">Qaror yoʻq</span>}
        </Card>
        <Card delay={0.08}>
          <CardH icon={<GitBranch />} title="Filiallar" sub={`${p.filiallar.length} ta`} />
          {p.filiallar.length ? p.filiallar.map((f) => (
            <div key={f} className="li"><div className="ic brand"><Building2 /></div><div className="grow b small">{f}</div><Badge>filial</Badge></div>
          )) : <div className="small muted">Filiallar roʻyxatda yoʻq.</div>}
        </Card>
        <Card delay={0.1}>
          <CardH icon={<UserRound />} title="Masʼul shaxslar" />
          {p.masullar.map((m) => (
            <div key={m.fio} className="li"><Avatar name={m.fio} /><div className="grow"><div className="b small">{m.fio}</div><div className="xs muted">{m.lavozim}</div></div><span className="small row gap-4"><Phone size={13} /> {m.telefon}</span></div>
          ))}
        </Card>
      </div>

      <Card className="mt-16" delay={0.12}>
        <CardH icon={<History />} title="Reestr holatlari tarixi" sub="Holat faqat UKR markazi qarori asosida oʻzgaradi" />
        <Timeline items={[...p.tarix].reverse().map((t) => ({
          h: <span>{holatMatn(t.holat)[0]}{t.qaror ? ` · qaror ${t.qaror}` : ''}</span>,
          m: `${sanaVaqt(t.sana)} · ${t.kim}${t.izoh ? ' · ' + t.izoh : ''}`,
          ton: ['toxtatilgan', 'bekor', 'muddati_tugagan'].includes(t.holat) ? ('err' as const) : ['akkreditatsiyalangan', 'shartli'].includes(t.holat) ? ('ok' as const) : undefined,
        }))} />
      </Card>
      <MurojaatModal open={mur} onClose={() => setMur(false)} turi="boshqa" obyekt={{ turi: 'Provayder', id: p.id, nomi: `${p.nomi} — reestr maʼlumotlarini yangilash` }} />
    </>
  )
}
