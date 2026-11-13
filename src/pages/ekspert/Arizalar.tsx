import { useNavigate, useSearchParams } from 'react-router-dom'
import { ClipboardPen, Users } from 'lucide-react'
import { Alert, Badge, Button, Card, Empty, Holat, Modal, PageHeader } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { kunFarq, sana, sanaVaqt } from '@/lib/format'
import { AKK_TURI, ArizaTafsilot, VaraqKor, Yashirin, obyektNomi, useEkspert } from './_umumiy'

export default function EkspertArizalar() {
  const { db, e, arizalar, ozVaraq, bugun } = useEkspert()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const tanl = arizalar.find((a) => a.id === sp.get('ariza'))

  const cols: Col<T.AkkAriza>[] = [
    { k: 'raqam', l: 'Ariza', sort: (a) => a.raqam, excel: (a) => a.raqam, r: (a) => <div><div className="b mono">{a.raqam}</div><div className="xs muted">{AKK_TURI[a.turi]}</div></div> },
    { k: 'obyekt', l: 'Obyekt', sort: (a) => obyektNomi(db, a), excel: (a) => obyektNomi(db, a), r: (a) => <div style={{ maxWidth: 300 }}><div className="small b">{obyektNomi(db, a)}</div><div className="xs muted">{A.provayder(db, a.providerId)?.nomi}</div></div> },
    { k: 'holat', l: 'Bosqich', sort: (a) => a.holat, excel: (a) => a.holat, r: (a) => <Holat h={a.holat} /> },
    { k: 'muddat', l: 'Muddat', sort: (a) => a.muddat, excel: (a) => a.muddat, r: (a) => { const k = a.muddat ? kunFarq(a.muddat, bugun) : undefined; return a.muddat ? <div className="col gap-4"><span className="small">{sana(a.muddat)}</span>{a.holat === 'ekspertiza' && !ozVaraq(a) && k !== undefined && <Badge ton={k <= 7 ? 'warn' : 'muted'}>{k} kun</Badge>}</div> : '—' } },
    { k: 'varaq', l: 'Mening varagʻim', excel: (a) => (ozVaraq(a) ? `${A.varaqBali(ozVaraq(a)!)}%` : 'yoʻq'), r: (a) => { const v = ozVaraq(a); return v ? <Badge ton="ok">Topshirilgan · {A.varaqBali(v)}%</Badge> : a.holat === 'ekspertiza' ? <Badge ton="warn">Kutilmoqda</Badge> : <span className="muted">—</span> } },
  ]

  const own = tanl ? ozVaraq(tanl) : undefined
  const boshqalar = tanl ? tanl.varaqlar.filter((v) => v.ekspertId !== e?.id) : []

  return (
    <>
      <PageHeader title="Arizalarim" desc="Faqat sizga biriktirilgan arizalar. Manfaatlar toʻqnashuvi deklaratsiya qilingan provayderlar arizalari koʻrsatilmaydi." source={`Manba: Akkreditatsiya arizalari · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      {!e ? (
        <Empty title="Ekspert reestrida yozuv topilmadi">UKR markaziga murojaat qiling.</Empty>
      ) : (
        <DataTable
          rows={arizalar}
          cols={cols}
          search={(a) => `${a.raqam} ${obyektNomi(db, a)} ${A.provayder(db, a.providerId)?.nomi}`}
          filters={[{ k: 'h', l: 'Bosqich', options: [{ v: 'ekspertiza', l: 'Ekspertiza' }, { v: 'joyida', l: 'Joyida tekshiruv' }, { v: 'komissiya', l: 'Komissiya' }, { v: 'yakunlandi', l: 'Yakunlandi' }], get: (a) => a.holat }]}
          exportName="ekspert-arizalari"
          onRow={(a) => setSp({ ariza: a.id })}
          empty={<Empty title="Biriktirilgan ariza yoʻq">UKR markazi biriktirganda bu yerda koʻrinadi.</Empty>}
        />
      )}

      <Modal drawer open={!!tanl} onClose={() => setSp({})} title={tanl ? `${tanl.raqam} · ${obyektNomi(db, tanl)}` : ''} sub={tanl ? `${AKK_TURI[tanl.turi]} · ${A.provayder(db, tanl.providerId)?.nomi}` : ''}
        footer={tanl && (
          <>
            <Button v="ghost" onClick={() => setSp({})}>Yopish</Button>
            {tanl.holat === 'ekspertiza' && <Button v="primary" icon={<ClipboardPen />} onClick={() => nav(`/ekspert/varaqlar?ariza=${tanl.id}`)}>{own ? 'Varaqni qayta koʻrib chiqish' : 'Baholash varagʻini toʻldirish'}</Button>}
          </>
        )}>
        {tanl && (
          <div className="col gap-16">
            <div className="row wrap gap-6"><Holat h={tanl.holat} />{tanl.muddat && <Badge>Muddat: {sana(tanl.muddat)}</Badge>}<Badge ton="brand"><Users size={12} /> {tanl.ekspertlar.length} ekspert</Badge></div>
            {tanl.qaror && <Alert ton={tanl.qaror.turi === 'rad' ? 'err' : 'ok'} title={`Qaror ${tanl.qaror.raqam}`}>Komissiya qarori qabul qilingan ({sana(tanl.qaror.sana)}).</Alert>}
            <Card>
              <h3 className="mb-8">Mening varagʻim</h3>
              {own ? <VaraqKor v={own} /> : <div className="small muted">Hali topshirilmagan.{tanl.holat === 'ekspertiza' ? ' Varaqni toʻldiring.' : ''}</div>}
            </Card>
            <Card>
              <h3 className="mb-8">Boshqa ekspertlar varaqlari</h3>
              {own ? (
                boshqalar.length ? boshqalar.map((v) => <div key={v.ekspertId} className="mb-16"><VaraqKor v={v} nom={db.ekspertlar.find((x) => x.id === v.ekspertId)?.fio ?? v.ekspertId} /></div>) : <div className="small muted">Boshqa ekspertlar hali topshirmagan.</div>
              ) : (
                <>
                  <Yashirin />
                  <div className="xs muted mt-8">{boshqalar.length} ta varaq topshirilgan (mazmuni yashirin).</div>
                </>
              )}
            </Card>
            <ArizaTafsilot a={tanl} />
          </div>
        )}
      </Modal>
    </>
  )
}
