import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import HeroSection from '@/components/sections/HeroSection'
import ProblemSection from '@/components/sections/ProblemSection'
import SolutionFlow from '@/components/sections/SolutionFlow'
import ReliabilitySection from '@/components/sections/ReliabilitySection'
import FinalCTA from '@/components/sections/FinalCTA'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <div className="divider" />
        <ProblemSection />
        <div className="divider" />
        <SolutionFlow />
        <div className="divider" />
        <ReliabilitySection />
        <div className="divider" />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  )
}
