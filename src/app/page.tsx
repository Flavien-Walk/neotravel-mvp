import SiteHeader from '@/components/layout/SiteHeader'
import AuthRedirect from '@/components/ui/AuthRedirect'
import SiteFooter from '@/components/layout/SiteFooter'
import HeroSection from '@/components/sections/HeroSection'
import BusPhotoStrip from '@/components/sections/BusPhotoStrip'
import PourQuiSection from '@/components/sections/PourQuiSection'
import ProblemSection from '@/components/sections/ProblemSection'
import UserJourneySection from '@/components/sections/UserJourneySection'
import SolutionFlow from '@/components/sections/SolutionFlow'
import ReliabilitySection from '@/components/sections/ReliabilitySection'
import CorporatePhotoSection from '@/components/sections/CorporatePhotoSection'
import DashboardPreview from '@/components/sections/DashboardPreview'
import MVPSection from '@/components/sections/MVPSection'
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
        <PourQuiSection />
        <ProblemSection />
        <UserJourneySection />
        <SolutionFlow />
        <ReliabilitySection />
        <CorporatePhotoSection />
        <DashboardPreview />
        <MVPSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  )
}
