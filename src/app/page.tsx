import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import HeroSection from '@/components/sections/HeroSection'
import PourQuiSection from '@/components/sections/PourQuiSection'
import ProblemSection from '@/components/sections/ProblemSection'
import SolutionFlow from '@/components/sections/SolutionFlow'
import ReliabilitySection from '@/components/sections/ReliabilitySection'
import DashboardPreview from '@/components/sections/DashboardPreview'
import MVPSection from '@/components/sections/MVPSection'
import FinalCTA from '@/components/sections/FinalCTA'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <PourQuiSection />
        <ProblemSection />
        <SolutionFlow />
        <ReliabilitySection />
        <DashboardPreview />
        <MVPSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  )
}
