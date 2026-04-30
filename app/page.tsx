import { LangProvider } from '@/components/common/LangProvider';
import { Navigation } from '@/components/common/Navigation';
import { Hero } from '@/components/landing/Hero';
import {
  PartnershipStrip,
  Categories,
  StageSection,
  Endorsement,
  Jury,
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
        <Categories />
        <StageSection />
        <Endorsement />
        <Jury />
        <FinalCTA />
      </main>
      <Footer />
    </LangProvider>
  );
}
