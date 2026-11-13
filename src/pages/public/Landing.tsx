import { useEffect } from 'react'
import { PublicLayout } from './_parts'
import { LandingHero, LandingStat } from './_LandingHero'
import { QandayIshlaydi, Rollar } from './_LandingQadam'
import { Faq, Ishonch, TanlanganKurslar, YakuniyCta, YillikTalab } from './_LandingBloklar'

export default function PublicLanding() {
  useEffect(() => {
    const h = document.documentElement
    const old = h.style.scrollBehavior
    h.style.scrollBehavior = 'smooth'
    return () => { h.style.scrollBehavior = old }
  }, [])
  return (
    <PublicLayout>
      <LandingHero />
      <LandingStat />
      <QandayIshlaydi />
      <Rollar />
      <TanlanganKurslar />
      <Ishonch />
      <YillikTalab />
      <Faq />
      <YakuniyCta />
    </PublicLayout>
  )
}
