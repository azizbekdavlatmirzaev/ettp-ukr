// Oqim → «Natija» bandi: oldindan koʻrish, operator shakllantiradi, rahbar ERI bilan tasdiqlaydi.
import { useMemo, useState } from 'react'
import { ClipboardCheck, FileSignature, Award, AlertTriangle, XCircle, Users } from 'lucide-react'
import { Alert, Badge, Button, Card, CardH, Confirm, Holat, KPI, Empty } from '@/ui'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useProv, Yopiq } from './_umumiy'

export function NatijaTab({ o }: { o: T.Oqim }) {
  const { db, amal, toast, operator, rahbar, user } = useProv()
  const v = A.versiya(db, o.versiyaId)!
  const q = useMemo(() => A.natijaOldindan(db, o.id), [db, o.id])
  const [sh, setSh] = useState(false)
  const [tas, setTas] = useState(false)
  const [hisobot, setHisobot] = useState<{ kredit: number; tekshiruvda: number; otmadi: number }>()

  const shakl = q.filter((x) => !x.mavjud || x.mavjud.holat === 'qoralama')
  const kutish = q.filter((x) => x.mavjud?.holat === 'tasdiqlashda').map((x) => x.mavjud!)
  const ozimniki = kutish.filter((n) => n.kiritgan === user.id).length
  const otdi = q.filter((x) => x.otdi).length
  const jamiKredit = q.reduce((a, x) => a + x.kredit, 0)

  const shakllantir = () => {
    const n = amal(A.natijaShakllantir, o.id)
    if (n !== undefined) toast({ turi: 'ok', sarlavha: `${n} ta natija shakllantirildi`, matn: 'Provayder rahbariga tasdiqlash uchun yuborildi (kirituvchi va tasdiqlovchi — turli shaxslar).' })
  }
  const tasdiqla = () => {
    const r = amal(A.natijaTasdiqla, kutish.map((n) => n.id))
    if (r) {
      setHisobot(r)
      toast({ turi: 'ok', sarlavha: 'Natijalar tasdiqlandi (ERI)', matn: `Kredit va sertifikat: ${r.kredit} · tekshiruvga: ${r.tekshiruvda} · oʻtmadi: ${r.otmadi}` })
    }
  }

  return (
    <div className="col gap-16">
      <div className="grid g4">
        <KPI icon={<Users />} label="Tinglovchilar" value={q.length} />
        <KPI icon={<ClipboardCheck />} label="Oʻtdi" value={otdi} ton="ok" delay={0.04} />
        <KPI icon={<XCircle />} label="Oʻtmadi / dalil yoʻq" value={q.length - otdi} ton={q.length - otdi ? 'err' : undefined} delay={0.08} />
        <KPI icon={<Award />} label="Beriladigan kredit" value={jamiKredit} ton="teal" hint={`${v.tasdiqlanganKredit ?? 0} kredit × ${otdi}`} delay={0.12} />
      </div>

      {hisobot && (
        <Alert ton="ok" title="Tasdiqlash natijasi — «natija tasdiqlandi» hodisasi Kredit xizmatiga yuborildi">
          <div className="row wrap gap-6 mt-4">
            <Badge ton="ok">{hisobot.kredit} ta kredit va QR-sertifikat</Badge>
            <Badge ton="warn">{hisobot.tekshiruvda} ta UKR markazi tekshiruvida</Badge>
            <Badge ton="err">{hisobot.otmadi} ta oʻtmadi</Badge>
          </div>
        </Alert>
      )}

      <Card>
        <CardH
          icon={<ClipboardCheck />}
          title="Yakuniy natija — oldindan koʻrish"
          sub="Kim nechta kredit olishini tasdiqlashdan oldin koʻring. Davomat yoki baholash dalilisiz natija «tugatdi» boʻlmaydi."
          right={
            <div className="row wrap">
              {operator ? (
                <Button v="primary" icon={<ClipboardCheck />} disabled={!shakl.length} onClick={() => setSh(true)}>Natijani shakllantirish ({shakl.length})</Button>
              ) : (
                <Yopiq>Natijani operator shakllantiradi</Yopiq>
              )}
              {rahbar ? (
                <Button v="success" icon={<FileSignature />} disabled={!kutish.length} onClick={() => setTas(true)}>Tasdiqlash (ERI) · {kutish.length}</Button>
              ) : (
                <span className="col gap-4" style={{ alignItems: 'flex-end' }}>
                  <Button v="success" icon={<FileSignature />} disabled title="Kirituvchi va tasdiqlovchi turli shaxslar">Tasdiqlash (ERI)</Button>
                  <Yopiq>Kirituvchi va tasdiqlovchi turli shaxslar — rahbar tasdiqlaydi</Yopiq>
                </span>
              )}
            </div>
          }
        />
        {!v.tasdiqlanganKredit && <Alert ton="warn">Dastur versiyasida tasdiqlangan kredit yoʻq — natijalar UKR markazi tekshiruviga tushadi.</Alert>}
        {q.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Tinglovchi</th><th style={{ textAlign: 'right' }}>Davomat</th><th style={{ textAlign: 'right' }}>Ball</th><th>Natija</th><th>Sabablar</th><th style={{ textAlign: 'right' }}>Kredit</th><th>Holat</th></tr></thead>
              <tbody>
                {q.map((x) => (
                  <tr key={x.y.id}>
                    <td><div className="b small">{A.toliqFio(x.s)}</div></td>
                    <td style={{ textAlign: 'right' }}><span style={{ color: x.df < 75 ? 'var(--err)' : undefined }}>{x.df}%</span></td>
                    <td style={{ textAlign: 'right' }}>{x.ball}</td>
                    <td><Holat h={x.otdi ? 'otdi' : 'otmadi'} /></td>
                    <td className="small">{x.sabablar.length ? x.sabablar.map((s) => <div key={s} className="row gap-4"><AlertTriangle size={12} color="var(--warn)" /> {s}</div>) : <span className="muted">—</span>}</td>
                    <td style={{ textAlign: 'right' }}><b>{x.kredit ? `+${x.kredit}` : '0'}</b></td>
                    <td>{x.mavjud ? <Holat h={x.mavjud.holat} /> : <Badge>shakllantirilmagan</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Natija uchun tinglovchi yoʻq">Tinglovchilarni qabul qiling, davomat va baholarni kiriting.</Empty>
        )}
        {rahbar && ozimniki > 0 && <Alert ton="warn" title="Ikki shaxs qoidasi">{ozimniki} ta natijani siz kiritgansiz — ularni tasdiqlay olmaysiz (403).</Alert>}
      </Card>

      <Confirm open={sh} onClose={() => setSh(false)} title="Yakuniy natijani shakllantirish" okText="Shakllantirish" onOk={() => { setSh(false); shakllantir() }}>
        <p className="small sub">{shakl.length} ta tinglovchi uchun natija «Tasdiqlash kutilmoqda» holatiga oʻtadi: {shakl.filter((x) => x.otdi).length} ta oʻtdi, {shakl.filter((x) => !x.otdi).length} ta oʻtmadi. Provayder rahbariga xabar boradi.</p>
      </Confirm>
      <Confirm open={tas} onClose={() => setTas(false)} title={`${kutish.length} ta natijani tasdiqlash`} okText="Tasdiqlash" ton="success" eri onOk={() => { setTas(false); tasdiqla() }}>
        <p className="small sub">Tasdiqlangan natija kredit va sertifikat uchun yagona asos. Har bir natija bir marta qayta ishlanadi (event_id), takror yuborish yangi kredit yaratmaydi. Tasdiqlangandan soʻng oʻzgartirish faqat UKR markazi orqali.</p>
      </Confirm>
    </div>
  )
}
