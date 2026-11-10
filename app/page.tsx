import { GetPortfolioUseCase } from "@/src/application/use-cases/get-portfolio";
import { StaticPortfolioRepository } from "@/src/infrastructure/repositories/static-portfolio.repository";
import { PortfolioViewMapper } from "@/src/presentation/mappers/portfolio-view-mapper";
import { Navbar } from "@/src/presentation/components/portfolio/Navbar";
import { HeroSection } from "@/src/presentation/components/portfolio/HeroSection";
import { AboutSection } from "@/src/presentation/components/portfolio/AboutSection";
import { ProjectsSection } from "@/src/presentation/components/portfolio/ProjectsSection";
import { ExperienceSection } from "@/src/presentation/components/portfolio/ExperienceSection";
import { SkillsSection } from "@/src/presentation/components/portfolio/SkillsSection";
import { ContactSection } from "@/src/presentation/components/portfolio/ContactSection";
import { Footer } from "@/src/presentation/components/portfolio/Footer";
import {
  HERO_ROLES,
  SCHEMATIC_NODES,
  NAV_LINKS,
  SKILL_CATEGORY_PRESENTATION_CONFIG,
  ABOUT_DOMAIN_PRESENTATION_CONFIG,
  ABOUT_PILLAR_PRESENTATION_CONFIG,
} from "@/src/presentation/data/constants";

export default function Home() {
  const repository = new StaticPortfolioRepository();
  const useCase = new GetPortfolioUseCase(repository);
  const portfolio = useCase.execute();

  // Map domain entities + presentation config → view models
  const projects = portfolio.projects.map(PortfolioViewMapper.toProjectViewModel);
  const experiences = portfolio.experiences.map(PortfolioViewMapper.toExperienceViewModel);
  const contactChannels = portfolio.contact.channels.map((ch, idx) =>
    PortfolioViewMapper.toContactChannelViewModel(ch, idx)
  );

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

  return (
    <>
      <Navbar links={NAV_LINKS} brandName={portfolio.hero.name} />
      <main className="min-h-screen">
        <HeroSection profile={portfolio.hero} roles={HERO_ROLES} nodes={SCHEMATIC_NODES} />
        <AboutSection
          profile={portfolio.about}
          domains={aboutDomains}
          pillars={aboutPillars}
        />
        <ProjectsSection projects={projects} />
        <ExperienceSection experiences={experiences} />
        <SkillsSection
          taxonomy={portfolio.skills}
          viewConfig={SKILL_CATEGORY_PRESENTATION_CONFIG}
        />
        <ContactSection profile={portfolio.contact} channels={contactChannels} />
      </main>
      <Footer brandName={portfolio.hero.name} />
    </>
  );
}
