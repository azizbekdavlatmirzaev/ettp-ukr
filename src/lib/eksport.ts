import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Sertifikat, YillikHolat } from '@/domain/types'
import { sana, sanaVaqt } from './format'

export interface Ustun<T> { kalit: string; nomi: string; qiymat: (r: T) => string | number | undefined | null }

export function excelYukla<T>(fayl: string, varaq: string, ustunlar: Ustun<T>[], qatorlar: T[]) {
  const data = [ustunlar.map((u) => u.nomi), ...qatorlar.map((r) => ustunlar.map((u) => u.qiymat(r) ?? ''))]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = ustunlar.map((u, i) => ({ wch: Math.min(60, Math.max(u.nomi.length, ...qatorlar.slice(0, 200).map((r) => String(ustunlar[i].qiymat(r) ?? '').length)) + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, varaq.slice(0, 30))
  XLSX.writeFile(wb, `${fayl}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function excelShablon(fayl: string, sarlavhalar: string[], namuna: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([sarlavhalar, ...namuna])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Shablon')
  XLSX.writeFile(wb, `${fayl}.xlsx`)
}

export async function excelOqi(f: File): Promise<Record<string, unknown>[]> {
  const buf = await f.arrayBuffer()
  const wb = XLSX.read(buf)
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
}

/** jsPDF standart shriftlari Latin-1 bilan ishlaydi — oʻzbekcha tutuq belgilarini almashtiramiz. */
export function L(s: string | number | undefined | null) {
  return String(s ?? '')
    .replace(/[ʻʼ‘’`]/g, "'")
    .replace(/[«»“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/•/g, '*')
    .replace(/≥/g, '>=')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\xFF]/g, '?')
}

export const QR_ASOS = () => `${location.origin}${location.pathname}#/tekshirish/`

async function qrRasm(matn: string) {
  return QRCode.toDataURL(matn, { margin: 1, width: 320, color: { dark: '#0a3a5c', light: '#ffffff' } })
}

function sarlavhaChiz(doc: jsPDF, w: number, nomi: string) {
  doc.setFillColor(10, 58, 92)
  doc.rect(0, 0, w, 26, 'F')
  doc.setFillColor(15, 163, 163)
  doc.rect(0, 26, w, 1.6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text("O'ZBEKISTON RESPUBLIKASI SOG'LIQNI SAQLASH VAZIRLIGI", 14, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(L('ETTP — Elektron tibbiy taʼlim platformasi · Uzluksiz kasbiy rivojlanish quyi tizimi'), 14, 18)
  doc.setFontSize(8)
  doc.text(L(nomi), w - 14, 18, { align: 'right' })
  doc.setTextColor(15, 30, 46)
}

export async function sertifikatPdf(s: Sertifikat, shablon: { sarlavha: string; imzolovchi: string; matn: string }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const w = 297, h = 210
  doc.setFillColor(247, 250, 252)
  doc.rect(0, 0, w, h, 'F')
  doc.setDrawColor(11, 92, 140)
  doc.setLineWidth(1.2)
  doc.rect(8, 8, w - 16, h - 16)
  doc.setDrawColor(15, 163, 163)
  doc.setLineWidth(0.4)
  doc.rect(11, 11, w - 22, h - 22)
  // EKG chizigʻi
  doc.setDrawColor(15, 163, 163)
  doc.setLineWidth(0.6)
  const y0 = 186
  doc.lines([[30, 0], [4, -8], [4, 16], [4, -14], [4, 6], [40, 0], [3, -5], [3, 10], [3, -5], [60, 0]], 30, y0)
  doc.setTextColor(11, 92, 140)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text("O'ZBEKISTON RESPUBLIKASI SOG'LIQNI SAQLASH VAZIRLIGI", w / 2, 26, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(L('Elektron tibbiy taʼlim platformasi — Uzluksiz kasbiy rivojlanish quyi tizimi'), w / 2, 32, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(10, 58, 92)
  doc.text(L(s.turi === 'UKR' ? shablon.sarlavha : s.turi === 'DIPLOM' ? 'REZIDENTURA DIPLOMI' : s.turi === 'PSV' ? 'PSV HISOBOTI' : "QO'SHIMCHA KOMPETENSIYA SERTIFIKATI"), w / 2, 52, { align: 'center' })
  doc.setFontSize(12)
  doc.setTextColor(15, 163, 163)
  doc.text(`${s.seriya}  No ${s.raqam}`, w / 2, 61, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.text(L(shablon.matn), w / 2, 76, { align: 'center', maxWidth: 200 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(15, 30, 46)
  doc.text(L(s.fio), w / 2, 92, { align: 'center' })
  doc.setFontSize(14)
  doc.setTextColor(11, 92, 140)
  doc.text(L(`«${s.kurs}»`), w / 2, 106, { align: 'center', maxWidth: 230 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  const qatorlar = [`Provayder: ${s.provider}`, `Sana: ${sana(s.sana)}   ·   Hajmi: ${s.soat} soat   ·   Kredit: ${s.kredit}`]
  qatorlar.forEach((q, i) => doc.text(L(q), w / 2, 122 + i * 7, { align: 'center' }))
  if (s.holat !== 'amalda') {
    doc.setTextColor(180, 35, 24)
    doc.setFont('helvetica', 'bold')
    doc.text(L(`HOLATI: ${s.holat === 'bekor_qilingan' ? 'BEKOR QILINGAN' : 'TUZATILGAN'} — ${s.sabab ?? ''}`), w / 2, 140, { align: 'center' })
  }
  if (s.kochirilgan) {
    doc.setTextColor(168, 100, 15)
    doc.setFontSize(9)
    doc.text(L(s.kochirilgan), w / 2, 146, { align: 'center' })
  }
  const qr = await qrRasm(QR_ASOS() + s.qrKalit)
  doc.addImage(qr, 'PNG', w - 62, h - 72, 40, 40)
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('QR orqali tekshirish', w - 42, h - 28, { align: 'center' })
  doc.setFontSize(10)
  doc.setTextColor(15, 30, 46)
  doc.setFont('helvetica', 'bold')
  doc.text(L(shablon.imzolovchi), 30, 160)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(L(`Elektron raqamli imzo va vaqt belgisi bilan tasdiqlangan · Shablon ${s.shablonVersiya} · Kalit ${s.qrKalit}`), 30, 166)
  doc.save(`${s.seriya}-${s.raqam}.pdf`)
}

export async function yillikHisobotPdf(d: { fio: string; jshshirNiqob: string; mutaxassislik: string; ishJoyi: string; holat: YillikHolat; yozuvlar: { sana: string; nomi: string; provider: string; miqdor: number; tur: string; manba: string }[]; qr: string; qoidaNomi: string }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = 210
  sarlavhaChiz(doc, w, `Yillik UKR hisoboti · ${d.holat.yil}`)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(L(`${d.holat.yil}-yil uzluksiz kasbiy rivojlanish hisoboti`), 14, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const info = [`F.I.Sh.: ${d.fio}`, `JSHSHIR: ${d.jshshirNiqob}`, `Mutaxassislik: ${d.mutaxassislik}`, `Asosiy ish joyi: ${d.ishJoyi}`, `Qoida versiyasi: ${d.holat.qoidaVersiya} — ${d.qoidaNomi}`, `Hisobot sanasi: ${sanaVaqt(new Date().toISOString())}`]
  info.forEach((t, i) => doc.text(L(t), 14, 50 + i * 6))
  const qr = await qrRasm(QR_ASOS() + 'hisobot-' + d.qr)
  doc.addImage(qr, 'PNG', w - 46, 34, 32, 32)
  // natija bloki
  const ok = d.holat.natija === 'bajarildi'
  doc.setFillColor(ok ? 230 : 253, ok ? 246 : 236, ok ? 239 : 234)
  doc.roundedRect(14, 90, w - 28, 30, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(ok ? 18 : 180, ok ? 128 : 35, ok ? 92 : 24)
  doc.text(L(ok ? 'NATIJA: TALAB BAJARILDI' : `NATIJA: YETISHMAYDI — ${d.holat.yetishmaydi} kredit`), 20, 100)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(15, 30, 46)
  doc.text(L(`Talab (T): ${d.holat.T}   Tasdiqlangan (K): ${d.holat.K}   Limit: -${d.holat.limitKesildi}   O'tkazilgan (O): ${d.holat.O}   Hisobga olingan (X): ${d.holat.X}`), 20, 108)
  doc.text(L(`Majburiy: ${d.holat.majburiy}/${d.holat.majburiyKerak}   Amaliy: ${d.holat.amaliy}/${d.holat.amaliyKerak}   Keyingi yilga o'tadi: ${d.holat.otkaziladi}`), 20, 114)
  // jadval
  let y = 132
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y - 5, w - 28, 8, 'F')
  ;['Sana', 'Kurs / tadbir', 'Provayder', 'Turi', 'Kredit'].forEach((t, i) => doc.text(t, [16, 38, 112, 160, 184][i], y))
  doc.setFont('helvetica', 'normal')
  y += 8
  for (const r of d.yozuvlar) {
    if (y > 280) {
      doc.addPage()
      y = 20
    }
    doc.text(sana(r.sana), 16, y)
    doc.text(L(r.nomi).slice(0, 44), 38, y)
    doc.text(L(r.provider).slice(0, 28), 112, y)
    doc.text(L(r.tur), 160, y)
    doc.text(String(r.miqdor), 190, y, { align: 'right' })
    y += 6
  }
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(L('Hisobot kredit jurnalidan avtomatik shakllantirildi. Nusxa tizimda saqlandi. Hujjat QR orqali tekshiriladi.'), 14, 290)
  doc.save(`UKR-hisobot-${d.holat.yil}.pdf`)
}

export async function umumiyPdf(nomi: string, sarlavha: string, bloklar: { t?: string; qatorlar: string[] }[], qrMatn?: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = 210
  sarlavhaChiz(doc, w, nomi)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(L(sarlavha), 14, 40, { maxWidth: qrMatn ? 140 : 180 })
  if (qrMatn) doc.addImage(await qrRasm(qrMatn), 'PNG', w - 46, 32, 32, 32)
  let y = 56
  for (const b of bloklar) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    if (b.t) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(11, 92, 140)
      doc.text(L(b.t), 14, y)
      y += 7
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 30, 46)
    for (const q of b.qatorlar) {
      const lines = doc.splitTextToSize(L(q), w - 28)
      if (y + lines.length * 5 > 285) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, 14, y)
      y += lines.length * 5 + 1
    }
    y += 4
  }
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(L(`Yaratildi: ${sanaVaqt(new Date().toISOString())} · ETTP–UKR (prototip, demo maʼlumotlar)`), 14, 292)
  doc.save(`${nomi.replace(/[^a-z0-9-]+/gi, '-')}.pdf`)
}

export function jsonYukla(nomi: string, data: unknown) {
  const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(b)
  a.download = nomi
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
