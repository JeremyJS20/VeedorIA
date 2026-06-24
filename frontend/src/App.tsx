import Navbar from './presentation/components/Navbar'
import HeroSection from './presentation/components/HeroSection'
import SocialProofSection from './presentation/components/SocialProofSection'
import PortalsSection from './presentation/components/PortalsSection'
import PriceCheckerSection from './presentation/components/PriceCheckerSection'
import StatsSection from './presentation/components/StatsSection'
import PricingSection from './presentation/components/PricingSection'
import FAQSection from './presentation/components/FAQSection'
import CTABanner from './presentation/components/CTABanner'
import Footer from './presentation/components/Footer'

function App() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <PortalsSection />
        <PriceCheckerSection />
        <StatsSection />
        <PricingSection />
        <FAQSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}

export default App
