import { Suspense } from "react";
import { connection } from "next/server";
import { CompositionRoot } from "@/src/infrastructure/composition-root";
import { PortfolioViewMapper } from "@/src/presentation/mappers/portfolio-view-mapper";
import { Navbar } from "@/src/presentation/components/portfolio/Navbar";
import { HeroSection } from "@/src/presentation/components/portfolio/HeroSection";
import { AboutSection } from "@/src/presentation/components/portfolio/AboutSection";
import { ProjectsSection } from "@/src/presentation/components/portfolio/ProjectsSection";
import { ExperienceSection } from "@/src/presentation/components/portfolio/ExperienceSection";
import { SkillsSection } from "@/src/presentation/components/portfolio/SkillsSection";
import { CertificatesSection } from "@/src/presentation/components/portfolio/CertificatesSection";
import { ContactSection } from "@/src/presentation/components/portfolio/ContactSection";
import { Footer } from "@/src/presentation/components/portfolio/Footer";
import { ScrollReveal } from "@/src/presentation/components/portfolio/ScrollReveal";
import {
  SKILL_CATEGORY_PRESENTATION_CONFIG,
  ABOUT_DOMAIN_PRESENTATION_CONFIG,
  ABOUT_PILLAR_PRESENTATION_CONFIG,
} from "@/src/presentation/data/constants";
import {
  resolveOrderedSectionKeys,
  resolveOrderedNavLinks,
} from "@/src/presentation/utils/section-order";

async function PortfolioContent() {
  await connection();
  const useCase = CompositionRoot.getResilientPortfolioUseCase();
  const portfolio = await useCase.execute();

  // Map domain entities + presentation config → view models
  const heroRoles = PortfolioViewMapper.toHeroRoleViewModels(portfolio.hero.roles);
  const engineeringNodes = PortfolioViewMapper.toEngineeringNodeViewModels(
    portfolio.hero.engineeringNodes
  );
  const projects = portfolio.projects.map(PortfolioViewMapper.toProjectViewModel);
  const experiences = portfolio.experiences.map(PortfolioViewMapper.toExperienceViewModel);
  const contactChannels = PortfolioViewMapper.toContactChannelViewModels(
    portfolio.contact.channels
  );
  const certificates = portfolio.certificates.map(PortfolioViewMapper.toCertificateViewModel);

  // Map about domains with presentation config
  const aboutDomains = portfolio.about.domains.map((domain, idx) => {
    const config = ABOUT_DOMAIN_PRESENTATION_CONFIG[idx];
    return {
      index: config?.index ?? domain.index,
      title: domain.title,
      tabletTitle: config?.tabletTitleShort ?? domain.title,
      keyAreas: [], // Not used in current implementation
    };
  });

  // Map about pillars with presentation config
  const aboutPillars = portfolio.about.pillars.map((pillar, idx) => {
    const config = ABOUT_PILLAR_PRESENTATION_CONFIG[idx];
    return {
      index: config?.index ?? `${pillar.index} // ${pillar.title.toUpperCase()}`,
      title: pillar.title,
      desktopDesc: pillar.description,
      compactDesc: config?.compactDescShort ?? pillar.description,
      accent: config?.accent ?? false,
    };
  });

  // Determine active ordered sections dynamically
  const rawActiveKeys = resolveOrderedSectionKeys(portfolio.sections);
  const hasCertificates = certificates.length > 0;
  const activeSectionKeys = rawActiveKeys.filter(
    (key) => key !== "certificates" || hasCertificates
  );

  // Derive dynamic navbar links matching CMS order
  const rawNavLinks = resolveOrderedNavLinks(portfolio.sections);
  const filteredNavLinks = rawNavLinks.filter(
    (link) => link.href !== "#certificates" || hasCertificates
  );
  const navLinks = filteredNavLinks.map((link, idx) => ({
    ...link,
    index: String(idx + 1).padStart(2, "0"),
    active: idx === 0,
  }));

  const totalSectionsCount = String(activeSectionKeys.length).padStart(2, "0");

  const getSectionMetadata = (key: string) => {
    const idx = activeSectionKeys.indexOf(key);
    const position = idx === -1 ? 1 : idx + 1;
    const indexStr = String(position).padStart(2, "0");
    return {
      sectionIndex: indexStr,
      sectionCounter: `SECTION ${indexStr} / ${totalSectionsCount}`,
    };
  };

  // Section lookup map keyed by section config identifier
  const sectionComponentMap: Record<string, React.ReactNode> = {
    hero: (
      <HeroSection
        key="hero"
        profile={portfolio.hero}
        roles={heroRoles}
        nodes={engineeringNodes}
        sectionIndex={getSectionMetadata("hero").sectionIndex}
      />
    ),
    about: (
      <AboutSection
        key="about"
        profile={portfolio.about}
        domains={aboutDomains}
        pillars={aboutPillars}
        sectionIndex={getSectionMetadata("about").sectionIndex}
        sectionCounter={getSectionMetadata("about").sectionCounter}
      />
    ),
    projects: (
      <ProjectsSection
        key="projects"
        projects={projects}
        sectionIndex={getSectionMetadata("projects").sectionIndex}
        sectionCounter={getSectionMetadata("projects").sectionCounter}
      />
    ),
    experience: (
      <ExperienceSection
        key="experience"
        experiences={experiences}
        sectionIndex={getSectionMetadata("experience").sectionIndex}
        sectionCounter={getSectionMetadata("experience").sectionCounter}
      />
    ),
    skills: (
      <SkillsSection
        key="skills"
        taxonomy={portfolio.skills}
        viewConfig={SKILL_CATEGORY_PRESENTATION_CONFIG}
        sectionIndex={getSectionMetadata("skills").sectionIndex}
        sectionCounter={getSectionMetadata("skills").sectionCounter}
      />
    ),
    certificates: (
      <CertificatesSection
        key="certificates"
        certificates={certificates}
        sectionIndex={getSectionMetadata("certificates").sectionIndex}
        sectionCounter={getSectionMetadata("certificates").sectionCounter}
      />
    ),
    contact: (
      <ContactSection
        key="contact"
        profile={portfolio.contact}
        channels={contactChannels}
        sectionIndex={getSectionMetadata("contact").sectionIndex}
        sectionCounter={getSectionMetadata("contact").sectionCounter}
      />
    ),
  };

  return (
    <>
      <Navbar links={navLinks} brandName={portfolio.hero.name} />
      <main className="min-h-screen">
        {activeSectionKeys
          .map((key) => {
            const component = sectionComponentMap[key];
            if (!component) return null;
            if (key === "hero") {
              return component;
            }
            return (
              <ScrollReveal key={key} as="div" threshold={0.06}>
                {component}
              </ScrollReveal>
            );
          })
          .filter(Boolean)}
      </main>
      <Footer brandName={portfolio.hero.name} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PortfolioContent />
    </Suspense>
  );
}
