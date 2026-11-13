import type { ReactNode } from 'react'
import { ExternalLink, Globe2, ShieldCheck } from 'lucide-react'
import type { DB } from '@/domain/db'
import type { DasturVersiya, Provayder } from '@/domain/types'
import { HUDUDLAR } from '@/domain/malumotnoma'
import { DL, Empty, Holat, Modal, Timeline } from '@/ui'
import { sana } from '@/lib/format'
import { holat, PROV_TURI, SHAKL } from '@/lib/holat'

export const hududMatn = (p: Provayder) => (p.turi === 'xorijiy' ? p.mamlakat : HUDUDLAR.find((h) => h.id === p.hududId)?.nomi ?? '—')

/** Provayderning tasdiqlangan (amaldagi) dastur versiyalari */
export function tasdiqDasturlar(db: DB, pid: string): DasturVersiya[] {
  const ds = new Set(db.dasturlar.filter((d) => d.providerId === pid).map((d) => d.id))
  return db.versiyalar.filter((v) => ds.has(v.dasturId) && v.holat === 'tasdiqlangan')
}

/** Ochiq API javobi namunasi — shaxsga doir maʼlumotsiz */
export function apiJson(db: DB, p: Provayder) {
  return {
    id: p.id,
    tin: p.stir,
    name: p.nomi,
    type: p.turi,
    country: p.mamlakat,
    region: p.turi === 'xorijiy' ? null : hududMatn(p),
    status: p.holat,
    decision: p.qaror ? { number: p.qaror.raqam, date: p.qaror.sana, valid_until: p.qaror.muddat } : null,
    programs: tasdiqDasturlar(db, p.id).map((v) => ({ code: db.dasturlar.find((d) => d.id === v.dasturId)?.kod, version: v.versiya, title: v.nomi, credits: v.tasdiqlanganKredit, valid_until: v.amalMuddati })),
  }
}

export function ReestrDrawer({ db, p, onClose }: { db: DB; p: Provayder | null; onClose: () => void }) {
  if (!p) return null
  const dasturlar = tasdiqDasturlar(db, p.id)
  const tarix = [...p.tarix].sort((a, b) => b.sana.localeCompare(a.sana))
  return (
    <Modal open drawer onClose={onClose} title={p.nomi} sub={`${PROV_TURI[p.turi]} provayder · ${hududMatn(p)}`}>
      <div className="row wrap gap-6 mb-16">
        <Holat h={p.holat} />
        {p.reyting && <span className="badge nodot muted">Tinglovchilar bahosi: {p.reyting} / 5</span>}
      </div>
      <DL items={[
        [p.turi === 'xorijiy' ? 'Tashkilot ID' : 'STIR', <span className="mono">{p.stir}</span>],
        ['Qisqa nomi', p.qisqa],
        ['Manzil', p.manzil],
        ['Sayt', p.sayt ? <a href={p.sayt} target="_blank" rel="noreferrer">{p.sayt.replace('https://', '')} <ExternalLink size={12} /></a> : '—'],
        ['Litsenziya', p.litsenziya ? `${p.litsenziya.raqam} · ${sana(p.litsenziya.sana)} — ${sana(p.litsenziya.muddat)}` : '—'],
        ...(p.xorijiyAkk ? [['Xorijiy akkreditatsiya', <span><Globe2 size={13} /> {p.xorijiyAkk.tashkilot} · {p.xorijiyAkk.id}</span>] as [string, ReactNode]] : []),
        ['Filiallar', p.filiallar.length ? p.filiallar.join(', ') : '—'],
        ['Qaror', p.qaror ? `№ ${p.qaror.raqam}, ${sana(p.qaror.sana)}` : '—'],
        ['Amal qilish muddati', p.qaror ? sana(p.qaror.muddat) : '—'],
      ]} />

      <h3 className="mt-24 mb-8 row gap-6"><ShieldCheck size={17} color="var(--primary)" /> Akkreditatsiyalangan dasturlar ({dasturlar.length})</h3>
      {dasturlar.length ? (
        <div className="tbl-wrap" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
          <table className="tbl">
            <thead><tr><th>Dastur</th><th style={{ textAlign: 'right' }}>Kredit</th><th>Amal muddati</th></tr></thead>
            <tbody>
              {dasturlar.map((v) => (
                <tr key={v.id}>
                  <td><div className="b">{v.nomi}</div><div className="xs muted">v{v.versiya} · {SHAKL[v.shakl]} · {v.soatNazariy + v.soatAmaliy} soat</div></td>
                  <td style={{ textAlign: 'right' }}><span className="badge nodot brand">{v.tasdiqlanganKredit}</span></td>
                  <td className="nowrap">{sana(v.amalMuddati)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Tasdiqlangan dastur yoʻq">Provayder hali dastur akkreditatsiyasidan oʻtmagan.</Empty>
      )}
      {p.holat === 'muddati_tugagan' || p.holat === 'toxtatilgan' ? (
        <p className="xs muted mt-8">Akkreditatsiya tugashi yoki toʻxtatilishi ilgari qonuniy berilgan sertifikatlarni bekor qilmaydi — faqat yangi qabul va yangi kreditlar toʻxtaydi.</p>
      ) : null}

      <h3 className="mt-24 mb-12">Holatlar tarixi</h3>
      <Timeline items={tarix.map((t) => {
        const [m, ton] = holat(t.holat)
        return { h: m, m: `${sana(t.sana)}${t.qaror ? ` · qaror № ${t.qaror}` : ''}${t.izoh ? ` · ${t.izoh}` : ''}`, ton: ton === 'ok' || ton === 'teal' ? 'ok' : ton === 'err' ? 'err' : ton === 'warn' ? 'warn' : 'muted' }
      })} />
      <p className="xs muted mt-8">Ochiq reestrda shaxsga doir maʼlumot (masʼul shaxslar, qaror qabul qilgan xodimlar) koʻrsatilmaydi.</p>

      <h3 className="mt-24 mb-8">API javobi</h3>
      <div className="rs-code"><span className="m">GET</span> /api/ukr/v1/registry/providers/{p.id}{'\n\n'}{JSON.stringify(apiJson(db, p), null, 2)}</div>
    </Modal>
  )
}
