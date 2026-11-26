import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CompositionRoot } from "@/src/infrastructure/composition-root";
import { PortfolioViewMapper } from "@/src/presentation/mappers/portfolio-view-mapper";
import { Footer } from "@/src/presentation/components/portfolio/Footer";
import { ScrollReveal } from "@/src/presentation/components/portfolio/ScrollReveal";

export const instant = false;

export const metadata: Metadata = {
  title: "All Certificates — Agun Firmansyah",
  description:
    "Complete archive of professional certifications, licenses, and verified credentials earned by Agun Firmansyah.",
};

export default async function CertificatesIndexPage() {
  await connection();
  const portfolio = await CompositionRoot.getResilientPortfolioUseCase().execute();
  const certificates = portfolio.certificates.map(PortfolioViewMapper.toCertificateViewModel);
  const brandName = portfolio.hero.name || "AGUN FIRMANSYAH";

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-[16px] sm:px-[32px] lg:px-[64px]">
          <Link
            href="/"
            className="flex items-center gap-[10px] group transition-opacity hover:opacity-80"
          >
            <span
              aria-hidden="true"
              className="h-[10px] w-[10px] shrink-0 bg-accent-cobalt transition-transform duration-200 group-hover:scale-125"
            />
            <span className="font-sans text-[14px] sm:text-[15px] font-bold tracking-[0.02em] text-text-primary">
              {brandName}
            </span>
          </Link>

          <Link
            href="/#certificates"
            className="group inline-flex items-center gap-[8px] border border-border-subtle bg-bg-primary px-[14px] sm:px-[18px] py-[8px] font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.04em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt transition-colors duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>
            <span>[ BACK TO HOME ]</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto max-w-[1440px] px-[16px] sm:px-[32px] lg:px-[64px] py-[40px] sm:py-[64px] 2xl:py-[80px]">
        {/* Breadcrumb Strip */}
        <div className="flex items-center gap-[8px] font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.05em] text-text-secondary">
          <Link href="/" className="hover:text-accent-cobalt transition-colors">
            PORTFOLIO
          </Link>
          <span>{"//"}</span>
          <span className="text-accent-cobalt uppercase">ALL CERTIFICATES</span>
        </div>

        {/* Header Strip */}
        <div className="mt-[24px] sm:mt-[32px] border-b border-border-subtle pb-[32px] sm:pb-[48px]">
          <p className="font-mono text-[11px] sm:text-[12px] font-semibold tracking-[0.06em] text-accent-cobalt">
            [ ARCHIVE // VERIFIED CREDENTIALS &amp; LICENSES ]
          </p>
          <div className="mt-[16px] flex flex-col md:flex-row md:items-end md:justify-between gap-[16px]">
            <div>
              <h1 className="font-sans text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.1] font-bold tracking-[-0.02em] text-text-primary">
                All Certificates
              </h1>
              <p className="mt-[16px] max-w-[720px] font-sans text-[15px] sm:text-[17px] leading-[26px] text-text-secondary">
                Daftar lengkap sertifikasi profesional, lisensi, dan kredensial terverifikasi yang telah diraih.
              </p>
            </div>
            <div className="shrink-0 font-mono text-[11px] sm:text-[12px] text-text-secondary border border-border-subtle bg-bg-surface px-[16px] py-[10px]">
              TOTAL VERIFIED: <span className="font-bold text-accent-cobalt">{certificates.length}</span> CERTIFICATES
            </div>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="mt-[48px] border border-border-subtle bg-white p-[32px] sm:p-[48px] text-center">
            <p className="font-sans text-[16px] text-text-secondary">
              Belum ada sertifikat yang tersedia untuk ditampilkan.
            </p>
            <div className="mt-[24px]">
              <Link
                href="/"
                className="inline-flex items-center gap-[8px] border border-border-subtle bg-bg-surface px-[20px] py-[10px] font-mono text-[11px] font-semibold tracking-[0.04em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt transition-colors"
              >
                [ BACK TO HOME ]
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-[48px] sm:mt-[64px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] xl:gap-[32px]">
            {certificates.map((cert, index) => (
              <ScrollReveal
                key={cert.id}
                delay={Math.min(index * 70, 420)}
                className="h-full"
              >
                <article className="flex h-full flex-col justify-between border border-border-subtle bg-white p-[24px] sm:p-[28px] hover:border-accent-cobalt hover-card-swiss transition-all duration-300 group">
                  <div>
                    <div className="flex items-center justify-between gap-[12px]">
                      <span className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-accent-cobalt uppercase group-hover:underline">
                        {`${String(index + 1).padStart(2, "0")} // ${cert.issuer}`}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] leading-[12px] px-2 py-0.5 bg-bg-surface border border-border-subtle text-text-secondary group-hover:border-accent-cobalt/40 uppercase transition-colors">
                        {cert.isPdf ? "PDF Document" : "Image Credential"}
                      </span>
                    </div>

                    <h2 className="mt-[16px] font-sans text-[19px] sm:text-[20px] leading-[26px] font-bold tracking-[-0.01em] text-text-primary group-hover:text-accent-cobalt transition-colors duration-200">
                      {cert.title}
                    </h2>

                    <div className="mt-[12px] space-y-[4px] font-mono text-[11px] leading-[15px] text-text-secondary">
                      {cert.formattedDate && (
                        <p>
                          <span className="text-text-primary font-medium">ISSUED:</span>{" "}
                          {cert.formattedDate}
                        </p>
                      )}
                      {cert.credentialId && (
                        <p className="break-all">
                          <span className="text-text-primary font-medium">ID:</span>{" "}
                          {cert.credentialId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-[28px] pt-[20px] border-t border-border-subtle flex flex-wrap items-center gap-[12px]">
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-[36px] items-center justify-center bg-text-primary hover:bg-accent-cobalt px-[18px] font-mono text-[11px] leading-[13px] font-semibold text-bg-primary hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      View Certificate ↗
                    </a>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-[36px] items-center justify-center border border-border-subtle hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-bg-surface px-[16px] font-mono text-[11px] leading-[13px] font-semibold text-text-primary hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                      >
                        Verify Credential ↗
                      </a>
                    )}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer brandName={brandName} />
    </div>
  );
}
