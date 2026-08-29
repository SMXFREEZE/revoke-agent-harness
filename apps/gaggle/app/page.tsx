import { RHero } from "@/components/reasonal/RHero";
import { RWhy } from "@/components/reasonal/RWhy";
import { RSteps } from "@/components/reasonal/RSteps";
import { RConsoleTeaser } from "@/components/reasonal/RConsoleTeaser";
import { RDisciplines } from "@/components/reasonal/RDisciplines";
import { RScience } from "@/components/reasonal/RScience";
import { RAgents } from "@/components/reasonal/RAgents";
import { RFeatures } from "@/components/reasonal/RFeatures";
import { RGooseBand } from "@/components/reasonal/RGooseBand";
import { RImageTrail } from "@/components/reasonal/RImageTrail";
import { RFounder } from "@/components/reasonal/RFounder";
import { RScrollReveal } from "@/components/reasonal/RScrollReveal";
import { RFaq } from "@/components/reasonal/RFaq";

export default function HomePage() {
  return (
    <div className="rz">
      <RScrollReveal />
      <RHero />
      <RWhy />
      <RSteps />
      <RConsoleTeaser />
      <RDisciplines />
      <RScience />
      <RAgents />
      <RFeatures />
      <RGooseBand />
      <RImageTrail />
      <RFounder />
      <RFaq />
    </div>
  );
}
