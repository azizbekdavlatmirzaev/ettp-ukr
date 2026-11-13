import { useMemo, useState } from 'react'
import { MapPinned, Users, CheckCircle2, CircleAlert } from 'lucide-react'
import { HUDUDLAR } from '@/domain/malumotnoma'
import { DataTable } from '@/ui/DataTable'
import { Bar, Badge, Empty, KPI, Modal, PageHeader, Sel } from '@/ui'
import { BarCh } from '@/ui/charts'
import { useJoriy } from '@/shared/hooks'
import { sanaVaqt } from '@/lib/format'
import { guruhla, oxirgiYangilanish, ulush, useShaxslar, yigma, yilOqimlari, BOSH_FILTR } from './_hisob'

interface HQ { id: string; nomi: string; n: number; bajarildi: number; foiz: number; xavf: number; qarzdor: number; prov: number; kurslar: number; muassasa: number }
const ton = (p: number) => (p >= 60 ? 'ok' : p >= 30 ? 'warn' : 'err') as 'ok' | 'warn' | 'err'

export default function VazirlikHududlar() {
  const { db, bugun, yil } = useJoriy()
  const [y, setY] = useState(yil)
  const [ochiq, setOchiq] = useState<string | null>(null)
  const q = useShaxslar(db, y, bugun)
  const rows = useMemo<HQ[]>(() => {
    const g = guruhla(q, (r) => r.hudud)
    return HUDUDLAR.map((h) => {
      const st = yigma(g.get(h.id) ?? [])
      return { id: h.id, nomi: h.nomi, n: st.n, bajarildi: st.bajarildi, foiz: ulush(st.bajarildi, st.n), xavf: st.xavf, qarzdor: st.qarzdor, prov: db.provayderlar.filter((p) => p.hududId === h.id && (p.holat === 'akkreditatsiyalangan' || p.holat === 'shartli')).length, kurslar: yilOqimlari(db, { ...BOSH_FILTR(y), hudud: h.id }).length, muassasa: db.muassasalar.filter((m) => m.hududId === h.id).length }
    })
  }, [q, db, y])
  const jami = yigma(q)
  const tanlangan = rows.find((r) => r.id === ochiq)
  const muassasalar = useMemo(() => {
    if (!ochiq) return []
    const g = guruhla(q.filter((r) => r.hudud === ochiq), (r) => r.mu?.id ?? '—')
    return db.muassasalar.filter((m) => m.hududId === ochiq).map((m) => ({ m, st: yigma(g.get(m.id) ?? []) }))
  }, [ochiq, q, db.muassasalar])
  const maxN = Math.max(1, ...rows.map((r) => r.n))

  return (
    <>
      <PageHeader title="Hududlar kesimida" desc="14 ta hudud boʻyicha UKR talabi bajarilishi, qarzdorlar, provayderlar va kurslar." source={`Manba: Platforma Reestri, HRM, kredit jurnali · yangilangan: ${sanaVaqt(oxirgiYangilanish(db))}`}
        actions={<Sel style={{ width: 'auto' }} aria-label="Yil" value={String(y)} onChange={(e) => setY(Number(e.target.value))} options={[yil, yil - 1].map((x) => ({ v: String(x), l: `${x}-yil` }))} />} />
      <div className="grid g4 mb-16">
        <KPI icon={<MapPinned />} label="Maʼlumoti bor hududlar" value={rows.filter((r) => r.n > 0).length} suffix="/ 14" />
        <KPI icon={<Users />} label="Xodimlar" value={jami.n} delay={0.05} />
        <KPI icon={<CheckCircle2 />} label="Bajarganlar ulushi" value={ulush(jami.bajarildi, jami.n)} kasr={1} suffix="%" ton="ok" delay={0.1} />
        <KPI icon={<CircleAlert />} label="Qarzdorlar" value={jami.qarzdor} ton="err" delay={0.15} />
      </div>
      <DataTable<HQ>
        rows={rows}
        exportName={`hududlar-kesimi-${y}`}
        search={(r) => r.nomi}
        onRow={(r) => setOchiq(r.id)}
        initialSort={{ k: 'foiz', dir: -1 }}
        pageSize={14}
        cols={[
          { k: 'nomi', l: 'Hudud', r: (r) => <b className="small">{r.nomi}</b>, sort: (r) => r.nomi, excel: (r) => r.nomi },
          { k: 'n', l: 'Xodimlar', w: 150, r: (r) => <div><div className="small">{r.n}</div><Bar v={r.n} max={maxN} thin /></div>, sort: (r) => r.n, excel: (r) => r.n },
          { k: 'foiz', l: 'Bajargan, %', w: 170, r: (r) => (r.n ? <div><div className="small b">{r.foiz}% <span className="xs muted">({r.bajarildi})</span></div><Bar v={r.foiz} ton={ton(r.foiz)} thin /></div> : <span className="xs muted">Maxraj aniqlanmagan</span>), sort: (r) => r.foiz, excel: (r) => (r.n ? r.foiz : 'maxraj aniqlanmagan') },
          { k: 'xavf', l: 'Xavf ostida', align: 'right', r: (r) => r.xavf, sort: (r) => r.xavf, excel: (r) => r.xavf },
          { k: 'qarzdor', l: 'Qarzdor', align: 'right', r: (r) => (r.qarzdor ? <Badge ton="err">{r.qarzdor}</Badge> : '0'), sort: (r) => r.qarzdor, excel: (r) => r.qarzdor },
          { k: 'prov', l: 'Provayderlar', align: 'right', r: (r) => r.prov, sort: (r) => r.prov, excel: (r) => r.prov },
          { k: 'kurslar', l: 'Kurslar', align: 'right', r: (r) => r.kurslar, sort: (r) => r.kurslar, excel: (r) => r.kurslar },
          { k: 'mu', l: 'Muassasalar', align: 'right', r: (r) => r.muassasa, sort: (r) => r.muassasa, excel: (r) => r.muassasa },
        ]}
      />
      <div className="xs muted mt-12">Rang: yashil ≥ 60%, sariq 30–59%, qizil &lt; 30%. Xodim hududi — asosiy ish joyi (muassasa) hududi.</div>

      <Modal open={!!tanlangan} onClose={() => setOchiq(null)} drawer title={tanlangan?.nomi ?? ''} sub={`${y}-yil · muassasalar kesimida`}>
        {tanlangan && (
          <div className="col gap-16">
            <div className="grid g2">
              <KPI icon={<Users />} label="Xodimlar" value={tanlangan.n} />
              <KPI icon={<CheckCircle2 />} label="Bajargan" value={tanlangan.foiz} suffix="%" kasr={1} ton={ton(tanlangan.foiz) === 'err' ? 'err' : ton(tanlangan.foiz) === 'warn' ? 'warn' : 'ok'} />
            </div>
            {muassasalar.length === 0 ? <Empty title="Muassasalar yoʻq">Bu hududda Platformaga ulangan muassasa hali yoʻq.</Empty> : (
              <>
                <BarCh data={muassasalar.map(({ m, st }) => ({ x: m.nomi.length > 28 ? m.nomi.slice(0, 28) + '…' : m.nomi, bajarildi: st.bajarildi, qolgan: st.n - st.bajarildi }))} keys={['bajarildi', 'qolgan']} names={{ bajarildi: 'Bajardi', qolgan: 'Hali bajarmagan' }} stacked horizontal colors={['#3ba776', '#c9d6e3']} height={Math.max(160, muassasalar.length * 44)} />
                {muassasalar.map(({ m, st }) => (
                  <div key={m.id} className="li">
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="b small">{m.nomi}</div>
                      <div className="xs muted">{m.turi} · {st.n} xodim · xavf: {st.xavf} · qarzdor: {st.qarzdor}</div>
                      <Bar v={ulush(st.bajarildi, st.n)} ton={ton(ulush(st.bajarildi, st.n))} thin />
                    </div>
                    <b className="small">{st.n ? `${ulush(st.bajarildi, st.n)}%` : '—'}</b>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
