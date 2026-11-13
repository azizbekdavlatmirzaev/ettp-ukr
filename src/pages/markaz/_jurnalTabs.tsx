import { useMemo, useState } from 'react'
import { RefreshCw, CalendarCheck2 } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Badge, Button, Card, CardH, Confirm, Empty, Holat } from '@/ui'
import { sanaVaqt, son } from '@/lib/format'
import { useMarkaz, RolTugma, RAH_SABAB, shaxsQisqa, userQisqa, Qulf } from './_parts'
import { solishtirishQayd } from './_amallar'

export function TekshiruvTab() {
  const { db, rahbar, ijro, ok } = useMarkaz()
  const [hal, setHal] = useState<{ n: T.YakuniyNatija; q: 'kredit' | 'rad' }>()
  const rows = db.natijalar.filter((n) => n.holat === 'tekshiruvda').map((n) => {
    const y = A.yozilish(db, n.yozilishId)
    const o = A.oqim(db, y?.oqimId)
    return { id: n.id, n, y, o, v: A.versiya(db, o?.versiyaId), p: A.provayder(db, o?.providerId) }
  })
  const bajar = (izoh: string) => {
    if (!hal) return
    const r = ijro(A.tekshiruvniHal, hal.n.id, hal.q, izoh)
    setHal(undefined)
    if (r.ok) ok(hal.q === 'kredit' ? 'Kredit yozildi, sertifikat yaratildi, xodimga xabar yuborildi.' : 'Kredit berilmadi; xodimga murojaat huquqi haqida xabar yuborildi.')
  }
  if (!rows.length) return <Empty title="Tekshiruvdagi natija yoʻq">Avtomatik tekshiruvdan oʻtmagan natijalar shu yerda paydo boʻladi.</Empty>
  return (
    <div className="col gap-12">
      {!rahbar && <Qulf>Tekshiruvdagi natija boʻyicha qarorni faqat qaror qabul qiluvchi chiqaradi.</Qulf>}
      {rows.map((r) => (
        <Card key={r.id}>
          <div className="row between wrap top">
            <div className="grow">
              <div className="b">{shaxsQisqa(db, r.y?.personId)} — {r.v?.nomi}</div>
              <div className="xs muted">{r.p?.qisqa} · {r.o?.kod} · ball {r.n.ball} · tasdiqlangan {sanaVaqt(r.n.tasdiqlangan ?? r.n.kiritilgan)} · {r.v?.tasdiqlanganKredit ?? 0} kredit</div>
              <div className="row wrap gap-6 mt-8">{(r.n.tekshiruvSababi ?? []).map((s) => <Badge key={s} ton="warn">{s}</Badge>)}</div>
            </div>
            <div className="mk-actions">
              <RolTugma ruxsat={rahbar} sabab={RAH_SABAB} v="success" size="sm" onClick={() => setHal({ n: r.n, q: 'kredit' })}>Kredit berish</RolTugma>
              <RolTugma ruxsat={rahbar} sabab={RAH_SABAB} v="danger" size="sm" onClick={() => setHal({ n: r.n, q: 'rad' })}>Rad etish</RolTugma>
            </div>
          </div>
        </Card>
      ))}
      <Confirm open={!!hal} onClose={() => setHal(undefined)} onOk={bajar} eri title={hal?.q === 'kredit' ? 'Vakolatli qaror bilan kredit berish' : 'Kredit berishni rad etish'} izoh="Qaror asosi" izohMajburiy ton={hal?.q === 'kredit' ? 'success' : 'danger'} okText={hal?.q === 'kredit' ? 'Kredit berish' : 'Rad etish'} />
    </div>
  )
}

export function TuzatishTab() {
  const { db, user, rahbar, ijro, ok } = useMarkaz()
  const [q, setQ] = useState<{ t: T.TuzatishSorovi; ok: boolean }>()
  const bajar = () => {
    if (!q) return
    const r = ijro(A.tuzatishQaror, q.t.id, q.ok)
    setQ(undefined)
    if (r.ok) ok(q.ok ? 'Jurnalga bekor qiluvchi (va yangi) yozuv qoʻshildi; sertifikat, Reestr va ish beruvchi yangilandi.' : 'Taklif rad etildi.')
  }
  return (
    <>
      <DataTable
        rows={[...db.tuzatishlar].reverse()}
        exportName="tuzatish-takliflari"
        filters={[{ k: 'h', l: 'Holat', options: [{ v: 'kutilmoqda', l: 'Kutilmoqda' }, { v: 'tasdiqlandi', l: 'Tasdiqlandi' }, { v: 'rad_etildi', l: 'Rad etildi' }], get: (t) => t.holat }]}
        cols={[
          { k: 'sana', l: 'Sana', r: (t) => <span className="small nowrap">{sanaVaqt(t.sana)}</span>, sort: (t) => t.sana, excel: (t) => t.sana },
          { k: 'yozuv', l: 'Yozuv', r: (t) => { const y = db.jurnal.find((j) => j.id === t.yozuvId); return <div><div className="small b">#{y?.seq} {y?.nomi}</div><div className="xs muted">{shaxsQisqa(db, t.personId)}</div></div> }, excel: (t) => db.jurnal.find((j) => j.id === t.yozuvId)?.nomi },
          { k: 'turi', l: 'Tuzatish', r: (t) => { const y = db.jurnal.find((j) => j.id === t.yozuvId); return t.turi === 'bekor' ? <Badge ton="err">Bekor: −{y?.miqdor}</Badge> : <Badge ton="warn">{y?.miqdor} → {t.yangiMiqdor}</Badge> }, excel: (t) => (t.turi === 'bekor' ? 'bekor' : `almashtirish ${t.yangiMiqdor}`) },
          { k: 'sabab', l: 'Sabab va hujjat', r: (t) => <div className="xs" style={{ maxWidth: 280 }}>{t.sabab}<div className="muted">{t.hujjat}</div></div>, excel: (t) => `${t.sabab} (${t.hujjat})` },
          { k: 'kim', l: 'Taklif / tasdiq', r: (t) => <span className="xs">{userQisqa(db, t.taklifQilgan)} / {t.tasdiqlovchi ? userQisqa(db, t.tasdiqlovchi) : '—'}</span>, excel: (t) => `${userQisqa(db, t.taklifQilgan)} / ${userQisqa(db, t.tasdiqlovchi)}` },
          { k: 'holat', l: 'Holat', r: (t) => <Holat h={t.holat} />, excel: (t) => t.holat },
          { k: 'amal', l: '', r: (t) => t.holat !== 'kutilmoqda' ? null : (
            <div className="row gap-6" onClick={(e) => e.stopPropagation()}>
              <RolTugma size="xs" v="success" ruxsat={rahbar && t.taklifQilgan !== user.id} sabab={!rahbar ? RAH_SABAB : 'Taklif qilgan va tasdiqlagan — turli shaxslar.'} onClick={() => setQ({ t, ok: true })}>Tasdiqlash</RolTugma>
              <RolTugma size="xs" v="danger" ruxsat={rahbar && t.taklifQilgan !== user.id} sabab={!rahbar ? RAH_SABAB : 'Taklif qilgan va tasdiqlagan — turli shaxslar.'} onClick={() => setQ({ t, ok: false })}>Rad etish</RolTugma>
            </div>
          ) },
        ]}
      />
      <Confirm open={!!q} onClose={() => setQ(undefined)} onOk={bajar} eri={q?.ok} title={q?.ok ? 'Tuzatishni tasdiqlash' : 'Tuzatishni rad etish'} ton={q?.ok ? 'success' : 'danger'} okText={q?.ok ? 'Tasdiqlash' : 'Rad etish'}>
        <p className="small">{q?.ok ? 'Asl yozuv oʻchirilmaydi: unga qarshi bekor qiluvchi yozuv va (almashtirishda) yangi yozuv qoʻshiladi.' : 'Jurnal oʻzgarmaydi.'}</p>
      </Confirm>
    </>
  )
}

export function SolishtirishTab() {
  const { db, amal, ok } = useMarkaz()
  const yillar = useMemo(() => Array.from(new Set(db.jurnal.map((j) => j.yil))).sort((a, b) => b - a), [db.jurnal])
  const [natija, setNatija] = useState<Record<number, ReturnType<typeof A.solishtirish> & { vaqt: string }>>({})
  const qayta = (y: number) => {
    const r = amal(solishtirishQayd, y)
    if (r) { setNatija({ ...natija, [y]: r }); ok(`${y}: farq ${r.farq}, takrorlar ${r.takrorlar}.`, 'Solishtirish bajarildi') }
  }
  return (
    <div className="grid g3">
      {yillar.map((y) => {
        const r = natija[y] ?? { ...A.solishtirish(db, y), vaqt: '' }
        return (
          <Card key={y}>
            <CardH title={`${y}-yil`} sub={r.vaqt ? `Qayta hisoblandi: ${sanaVaqt(r.vaqt)}` : 'Oxirgi avtomatik: bugun 02:00'} right={<Button size="sm" v="soft" icon={<RefreshCw />} onClick={() => qayta(y)}>Hozir solishtirish</Button>} />
            <div className="mk-big" style={{ color: r.farq === 0 ? 'var(--ok)' : 'var(--err)' }}>Farq: {r.farq}</div>
            <dl className="dl mt-12" style={{ gridTemplateColumns: '1fr auto' }}>
              <dt>Xodimlar</dt><dd>{son(r.xodimlar)}</dd>
              <dt>Yozuvlar</dt><dd>{son(r.yozuvlar)}</dd>
              <dt>Jami kredit (jurnal)</dt><dd>{son(r.jami)}</dd>
              <dt>Takrorlar (bir natija — ikki kredit)</dt><dd>{r.takrorlar === 0 ? <Holat ton="ok">0</Holat> : <Holat ton="err">{r.takrorlar}</Holat>}</dd>
            </dl>
          </Card>
        )
      })}
    </div>
  )
}

export function YilTab() {
  const { db, rahbar, ijro, ok } = useMarkaz()
  const yil = 2026
  const [tasdiq, setTasdiq] = useState(false)
  const [nat, setNat] = useState<{ bajardi: number; yetmaydi: number; otkazildi: number }>()
  const bajarilgan = db.hodisalar.find((h) => h.id === `yil-${yil}`)
  const bajar = () => {
    const r = ijro(A.yilYakunlash, yil)
    setTasdiq(false)
    if (r.ok && r.r) { setNat(r.r); ok(`${r.r.bajardi} bajardi, ${r.r.yetmaydi} yetishmaydi, ${r.r.otkazildi} xodimga kredit oʻtkazildi.`, `${yil}-yil yakunlandi`) }
  }
  return (
    <Card>
      <CardH icon={<CalendarCheck2 />} title={`${yil}-yil yakuni (V9)`} sub="Har bir xodim uchun yillik holat muzlatiladi, ortiqcha kredit qoidaga koʻra keyingi yilga oʻtkaziladi, hisobot nusxasi saqlanadi." />
      <Alert ton="info">Ishlab chiqarishda bu amal yil oxirida fon vazifa sifatida (150 000 xodim) bajariladi; prototipda bir zumda. Takror ishga tushirilmaydi (409).</Alert>
      {bajarilgan && <Alert ton="ok" title="Yakunlangan">{bajarilgan.izoh} · {sanaVaqt(bajarilgan.vaqt)}</Alert>}
      {nat && (
        <div className="grid g3 mt-12">
          <div className="card"><div className="xs muted">Talabni bajardi</div><div className="stat-big" style={{ color: 'var(--ok)' }}>{nat.bajardi}</div></div>
          <div className="card"><div className="xs muted">Yetishmaydi</div><div className="stat-big" style={{ color: 'var(--err)' }}>{nat.yetmaydi}</div></div>
          <div className="card"><div className="xs muted">Kredit oʻtkazildi</div><div className="stat-big">{nat.otkazildi}</div></div>
        </div>
      )}
      <div className="row mt-16 wrap">
        <RolTugma ruxsat={rahbar && !bajarilgan} sabab={!rahbar ? RAH_SABAB : `${yil}-yil allaqachon yakunlangan.`} v="primary" icon={<CalendarCheck2 />} onClick={() => setTasdiq(true)}>{yil}-yilni yakunlash (V9)</RolTugma>
      </div>
      <Confirm open={tasdiq} onClose={() => setTasdiq(false)} onOk={bajar} eri title={`${yil}-yilni yakunlash`} okText="Yakunlash">
        <p className="small">Barcha xodimlar uchun {yil}-yil natijasi hisoblanadi, oʻtkazish yozuvlari jurnalga qoʻshiladi va yillik hisobot nusxalari saqlanadi. Amalni qaytarib boʻlmaydi.</p>
      </Confirm>
    </Card>
  )
}
