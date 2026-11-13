import { useEffect, useRef, useState } from 'react'
import { Camera, Keyboard } from 'lucide-react'
import { Alert, Button, Modal } from '@/ui'

interface Detektor { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type DetektorKlass = new (o: { formats: string[] }) => Detektor

/** QR skaner: BarcodeDetector API (Chrome/Edge/Android). Boʻlmasa — tushuntirish va qoʻlda kiritish. */
export function KameraModal({ open, onClose, onTopildi }: { open: boolean; onClose: () => void; onTopildi: (matn: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [xato, setXato] = useState('')
  const [holat, setHolat] = useState<'kutish' | 'skan' | 'xato'>('kutish')

  useEffect(() => {
    if (!open) return
    let oqim: MediaStream | null = null
    let toxta = false
    let taymer: ReturnType<typeof setTimeout> | undefined
    const BD = (window as unknown as { BarcodeDetector?: DetektorKlass }).BarcodeDetector
    setXato('')
    setHolat('kutish')
    ;(async () => {
      if (!BD) {
        setHolat('xato')
        setXato('Brauzeringiz QR-kodni bevosita oʻqish (BarcodeDetector API) imkoniyatini qoʻllab-quvvatlamaydi. Chrome, Edge yoki Android brauzeridan foydalaning yoki telefon kamerasi bilan QR-kodni skanerlang — havola shu sahifani ochadi. Seriya-raqamni qoʻlda ham kiritishingiz mumkin.')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setHolat('xato')
        setXato('Kameraga kirish imkoni yoʻq (xavfsiz ulanish — HTTPS talab qilinadi). Seriya-raqamni qoʻlda kiriting.')
        return
      }
      try {
        oqim = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (toxta) return oqim.getTracks().forEach((t) => t.stop())
        const v = video.current!
        v.srcObject = oqim
        await v.play()
        setHolat('skan')
        const det = new BD({ formats: ['qr_code'] })
        const aylana = async () => {
          if (toxta) return
          try {
            const r = await det.detect(v)
            if (r[0]?.rawValue) {
              toxta = true
              onTopildi(r[0].rawValue)
              return
            }
          } catch { /* kadr tayyor emas */ }
          taymer = setTimeout(aylana, 280)
        }
        aylana()
      } catch (e) {
        setHolat('xato')
        setXato((e as Error)?.name === 'NotAllowedError' ? 'Kameraga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering yoki seriya-raqamni qoʻlda kiriting.' : 'Kamera topilmadi yoki band. Seriya-raqamni qoʻlda kiriting.')
      }
    })()
    return () => {
      toxta = true
      clearTimeout(taymer)
      oqim?.getTracks().forEach((t) => t.stop())
    }
  }, [open, onTopildi])

  return (
    <Modal open={open} onClose={onClose} title="QR-kodni skanerlash" sub="Sertifikatdagi QR-kodni ramka ichiga joylashtiring"
      footer={<Button v="ghost" icon={<Keyboard />} onClick={onClose}>Qoʻlda kiritish</Button>}>
      {holat === 'xato' ? (
        <Alert ton="warn" title="Kamera orqali skanerlash imkonsiz">{xato}</Alert>
      ) : (
        <div className="tk-cam">
          <video ref={video} muted playsInline />
          <div className="fr" />
          {holat === 'skan' && <div className="scan" />}
          {holat === 'kutish' && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff' }}><span className="row gap-6"><Camera size={18} /> Kamera ishga tushirilmoqda...</span></div>}
        </div>
      )}
      <p className="xs muted mt-12">Tasvir qurilmangizda qayta ishlanadi va serverga yuborilmaydi.</p>
    </Modal>
  )
}
