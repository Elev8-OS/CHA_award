import { LangProvider } from '@/components/common/LangProvider';
import { Navigation } from '@/components/common/Navigation';
import { CountdownBanner } from '@/components/common/CountdownBanner';
import { Hero } from '@/components/landing/Hero';
import {
  PartnershipStrip,
  WhatYouWin,
  AboutElev8,
  Categories,
  StageSection,
  Endorsement,
  Jury,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing/Sections';

export default function HomePage() {
  return (
    <LangProvider>
      <Navigation />
      <main>
        <Hero />
        <PartnershipStrip />
        <WhatYouWin />
        <AboutElev8 />
        <Categories />
        <StageSection />
        <Endorsement />
        <Jury />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <CountdownBanner />
    </LangProvider>
  );
}
