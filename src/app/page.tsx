import SiteHeader from '@/components/layout/SiteHeader'
import AuthRedirect from '@/components/ui/AuthRedirect'
import SiteFooter from '@/components/layout/SiteFooter'
import HeroSection from '@/components/sections/HeroSection'
import BusPhotoStrip from '@/components/sections/BusPhotoStrip'
import ChaosToPipeline from '@/components/sections/ChaosToPipeline'
import PourQuiSection from '@/components/sections/PourQuiSection'
import ScrollTimeline from '@/components/sections/ScrollTimeline'
import TraceableQuoteSection from '@/components/sections/TraceableQuoteSection'
import CorporatePhotoSection from '@/components/sections/CorporatePhotoSection'
import ProductDemoSplit from '@/components/sections/ProductDemoSplit'
import FAQSection from '@/components/sections/FAQSection'
import FinalCTA from '@/components/sections/FinalCTA'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthRedirect />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <BusPhotoStrip />
        <ChaosToPipeline />
        <PourQuiSection />
        <ScrollTimeline />
        <TraceableQuoteSection />
        <CorporatePhotoSection />
        <ProductDemoSplit />
        <FAQSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  )
}
