import React from 'react';
import { Helmet } from 'react-helmet';
import StickyAnchorNav from '../../components/ui/StickyAnchorNav';
import ScrollProgressIndicator from '../../components/ui/ScrollProgressIndicator';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import StatsSection from './components/StatsSection';
import HowItWorksSection from './components/HowItWorksSection';
import SocialProofSection from './components/SocialProofSection';
import PricingSection from './components/PricingSection';
import FAQSection from './components/FAQSection';
import TrustBadgesSection from './components/TrustBadgesSection';
import ROICalculatorSection from './components/ROICalculatorSection';
import UseCaseSection from './components/UseCaseSection';
import FinalCTASection from './components/FinalCTASection';
import FooterSection from './components/FooterSection';

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>LeadForge AI - Turn LinkedIn Into Your 24/7 AI Sales Machine</title>
        <meta name="description" content="Generate 3x more qualified leads while you sleep with AI-powered LinkedIn prospecting. No manual prospecting required. Join 2,847+ sales professionals." />
        <meta name="keywords" content="AI sales, LinkedIn automation, sales prospecting, lead generation, SDR, sales development" />
        <meta property="og:title" content="LeadForge AI - Turn LinkedIn Into Your 24/7 AI Sales Machine" />
        <meta property="og:description" content="Generate 3x more qualified leads while you sleep with AI-powered LinkedIn prospecting. No manual prospecting required." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LeadForge AI - Turn LinkedIn Into Your 24/7 AI Sales Machine" />
        <meta name="twitter:description" content="Generate 3x more qualified leads while you sleep with AI-powered LinkedIn prospecting." />
        <link rel="canonical" href="https://agenticsdr.com/landing-page" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation & Progress */}
        <StickyAnchorNav />
        <ScrollProgressIndicator />

        {/* Page Sections */}
        <main>
          <HeroSection />
          <ProblemSection />
          <SolutionSection />
          <StatsSection />
          <HowItWorksSection />
          <PricingSection />
          <FAQSection />
          <UseCaseSection />
          <FinalCTASection />
        </main>

        {/* Footer */}
        <FooterSection />
      </div>
    </>
  );
};

export default LandingPage;