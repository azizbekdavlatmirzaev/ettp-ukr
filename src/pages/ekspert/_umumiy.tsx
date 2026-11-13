// Ekspert kabineti uchun umumiy yordamchilar: joriy ekspert, biriktirilgan arizalar, ariza tafsiloti.
import { useMemo } from 'react'
import { FileText, Lock } from 'lucide-react'
import { Alert, Badge, DL, Holat } from '@/ui'
import { useJoriy, mutNomi } from '@/shared/hooks'
import * as A from '@/domain/amallar'
import { AKK_HUJJATLAR, BAHOLASH_MEZONLARI } from '@/domain/malumotnoma'
import type * as T from '@/domain/types'
import { hajm, sana, sanaVaqt } from '@/lib/format'
import { PROV_TURI, SHAKL, TADBIR } from '@/lib/holat'

export const AKK_TURI: Record<string, string> = { provayder: 'Provayder akkreditatsiyasi', dastur: 'Dastur akkreditatsiyasi', qayta: 'Qayta akkreditatsiya' }
export const TAVSIYA: Record<T.EkspertizaVaraq['tavsiya'], string> = { akkreditatsiya: 'Akkreditatsiya berish', shartli: 'Shartli akkreditatsiya', rad: 'Rad etish', qoshimcha: 'Qoʻshimcha tekshiruv' }

/** Joriy ekspert va unga biriktirilgan arizalar (boshqa arizalar koʻrinmaydi). */
export function useEkspert() {
  const j = useJoriy()
  const e = A.joriyEkspert(j.db, { user: j.user, vaqt: new Date().toISOString() })
  const arizalar = useMemo(() => (e ? j.db.akkArizalar.filter((a) => a.ekspertlar.includes(e.id)).sort((a, b) => (a.muddat || '9').localeCompare(b.muddat || '9')) : []), [j.db, e])
  const ozVaraq = (a: T.AkkAriza) => (e ? a.varaqlar.find((v) => v.ekspertId === e.id) : undefined)
  return { ...j, e, arizalar, ozVaraq }
}

export const obyektNomi = (db: Parameters<typeof A.provayder>[0], a: T.AkkAriza) => {
  const v = A.versiya(db, a.versiyaId)
  return v ? v.nomi : A.provayder(db, a.providerId)?.nomi ?? '—'
}

/** Ariza tafsiloti: provayder, dastur pasporti qisqacha, hujjatlar va nazorat yigʻindilari. */
export function ArizaTafsilot({ a }: { a: T.AkkAriza }) {
  const { db } = useEkspert()
  const p = A.provayder(db, a.providerId)!
  const v = A.versiya(db, a.versiyaId)
  const roy = AKK_HUJJATLAR[a.turi]
  return (
    <div className="col gap-16">
      <div>
        <h3 className="mb-8">Provayder</h3>
        <DL items={[
          ['Nomi', p.nomi],
          ['Turi', `${PROV_TURI[p.turi]} · ${p.mamlakat}`],
          ['Reestr holati', <Holat h={p.holat} />],
          [p.turi === 'xorijiy' ? 'Xorijiy akkreditatsiya' : 'Litsenziya', p.turi === 'xorijiy' ? `${p.xorijiyAkk?.tashkilot ?? '—'} ${p.xorijiyAkk?.id ?? ''}` : p.litsenziya ? `${p.litsenziya.raqam}, ${sana(p.litsenziya.muddat)} gacha` : '—'],
        ]} />
      </div>
      {v && (
        <div>
          <h3 className="mb-8">Dastur pasporti (v{v.versiya})</h3>
          <DL items={[
            ['Nomi', v.nomi],
            ['Tadbir turi', `${TADBIR[v.tadbirTuri]} · ${v.kursTuri === 'majburiy' ? 'majburiy' : 'tanlov'} · ${v.yonalish}`],
            ['Mutaxassisliklar', v.mutaxassisliklar.length ? v.mutaxassisliklar.map(mutNomi).join(', ') : 'Barcha'],
            ['Tinglovchi', v.tinglovchi === 'barchasi' ? 'Barcha' : v.tinglovchi === 'oliy' ? 'Oliy maʼlumotli' : 'Oʻrta maʼlumotli'],
            ['Maqsad', v.maqsad],
            ['Oʻquv natijalari', <ul style={{ margin: 0, paddingLeft: 18 }}>{v.natijalar.map((n) => <li key={n}>{n}</li>)}</ul>],
            ['Soat / shakl', `${v.soatNazariy + v.soatAmaliy} soat (nazariy ${v.soatNazariy}, amaliy ${v.soatAmaliy}) · ${SHAKL[v.shakl]}`],
            ['Baholash', v.baholash.join(', ')],
            ['Oʻqituvchilar', v.oqituvchilar.join(', ')],
            ['Klinik baza', v.klinikBaza ?? '—'],
            ['Soʻralgan kredit', <b>{v.soralganKredit} kredit</b>],
            ['Materiallar', `${v.darslar.length} ta (${v.darslar.map((d) => d.turi).join(', ')})`],
          ]} />
        </div>
      )}
      <div>
        <h3 className="mb-8">Hujjatlar</h3>
        <div className="col gap-6">
          {roy.map((h) => {
            const f = a.hujjatlar[h.kod]
            return (
              <div key={h.kod} className="li" style={{ alignItems: 'flex-start' }}>
                <div className={`ic ${f ? 'ok' : 'err'}`}><FileText /></div>
                <div className="grow">
                  <div className="small b">{h.nomi} {h.majburiy && <Badge ton="muted">majburiy</Badge>}</div>
                  {f ? <div className="xs muted"><span>{f.nomi} · {hajm(f.hajm)} · {sanaVaqt(f.yuklangan)}</span><div className="mono" style={{ wordBreak: 'break-all' }}>SHA-256 {f.hash}</div></div> : <div className="xs" style={{ color: 'var(--err)' }}>Yuklanmagan</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Varaq ballari (faqat oʻqish) */
export function VaraqKor({ v, nom }: { v: T.EkspertizaVaraq; nom?: string }) {
  return (
    <div className="col gap-6">
      {nom && <div className="b small">{nom}</div>}
      {BAHOLASH_MEZONLARI.map((m) => (
        <div key={m.kod} className="row between small">
          <span>{m.nomi}</span>
          <span style={{ color: 'var(--amber-500)', letterSpacing: 2 }}>{'★'.repeat(v.mezonlar[m.kod] ?? 0)}<span style={{ color: 'var(--border-strong)' }}>{'★'.repeat(5 - (v.mezonlar[m.kod] ?? 0))}</span></span>
        </div>
      ))}
      <div className="row wrap gap-6 mt-4"><Badge ton="brand">{A.varaqBali(v)}%</Badge><Badge ton={v.tavsiya === 'rad' ? 'err' : v.tavsiya === 'akkreditatsiya' ? 'ok' : 'warn'}>{TAVSIYA[v.tavsiya]}</Badge>{v.topshirilgan && <span className="xs muted">{sanaVaqt(v.topshirilgan)}</span>}</div>
      <div className="small sub" style={{ whiteSpace: 'pre-wrap' }}>{v.xulosa}</div>
    </div>
  )
}

export function Yashirin() {
  return <Alert ton="info" title="Mustaqillik qoidasi"><span className="row gap-6"><Lock size={14} /> Boshqa ekspert(lar) varagʻi oʻz varagʻingizni topshirgunga qadar yashirin.</span></Alert>
}
