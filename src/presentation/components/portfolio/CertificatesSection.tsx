import { SectionHeaderStrip } from "./SectionHeaderStrip";
import { ScrollReveal } from "./ScrollReveal";
import type { CertificateViewModel } from "../../view-models";

interface CertificatesSectionProps {
  readonly certificates: ReadonlyArray<CertificateViewModel>;
  readonly sectionIndex?: string;
  readonly sectionCounter?: string;
}

export function CertificatesSection({
  certificates,
  sectionIndex = "07",
  sectionCounter = "SECTION 07 / 07",
}: CertificatesSectionProps) {
  if (!certificates || certificates.length === 0) {
    return null;
  }

  return (
    <section
      id="certificates"
      aria-label="Certifications and Credentials"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel={`[ ${sectionIndex} // CERTIFICATIONS & CREDENTIALS ]`}
        subtitle="ACCREDITATIONS — PROFESSIONAL LICENSES & VERIFIED CREDENTIALS"
        counter={sectionCounter}
      />

      {/* DESKTOP CERTIFICATES (1280px+) */}
      <div className="hidden xl:block max-w-[1440px] mx-auto px-[48px] 2xl:px-[80px] pt-[56px] pb-[80px]">
        <div className="grid grid-cols-2 2xl:grid-cols-3 gap-[24px]">
          {certificates.map((cert, index) => (
            <ScrollReveal
              key={cert.id}
              delay={index * 100}
              className="flex flex-col justify-between border border-border-subtle bg-white p-[28px] hover:border-accent-cobalt hover-card-swiss transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-accent-cobalt uppercase group-hover:underline">
                    {cert.issuer}
                  </span>
                  <span className="font-mono text-[10px] leading-[12px] px-2 py-0.5 bg-bg-surface border border-border-subtle text-text-secondary group-hover:border-accent-cobalt/40 uppercase transition-colors">
                    {cert.isPdf ? "PDF Document" : "Image Credential"}
                  </span>
                </div>

                <h3 className="mt-[16px] font-sans text-[20px] leading-[26px] font-bold tracking-[-0.01em] text-text-primary group-hover:text-accent-cobalt transition-colors duration-200">
                  {cert.title}
                </h3>

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
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* TABLET CERTIFICATES (768px - 1279px) */}
      <div className="hidden md:block xl:hidden px-[40px] pt-[40px] pb-[56px]">
        <div className="grid grid-cols-2 gap-[20px]">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col justify-between border border-border-subtle bg-white p-[24px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9.5px] leading-[11px] font-semibold tracking-[0.03em] text-accent-cobalt uppercase">
                    {cert.issuer}
                  </span>
                  <span className="font-mono text-[9px] leading-[11px] px-1.5 py-0.5 bg-bg-surface border border-border-subtle text-text-secondary uppercase">
                    {cert.isPdf ? "PDF" : "IMG"}
                  </span>
                </div>

                <h3 className="mt-[14px] font-sans text-[18px] leading-[23px] font-bold tracking-[-0.01em] text-text-primary">
                  {cert.title}
                </h3>

                <div className="mt-[10px] space-y-[4px] font-mono text-[10.5px] leading-[14px] text-text-secondary">
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

              <div className="mt-[24px] pt-[16px] border-t border-border-subtle flex flex-wrap items-center gap-[10px]">
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[34px] items-center justify-center bg-text-primary px-[16px] font-mono text-[10.5px] leading-[12px] font-semibold text-bg-primary hover:bg-black transition-colors"
                >
                  View Certificate ↗
                </a>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[34px] items-center justify-center border border-border-subtle px-[14px] font-mono text-[10.5px] leading-[12px] font-semibold text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt transition-colors"
                  >
                    Verify ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE CERTIFICATES (< 768px) */}
      <div className="md:hidden px-[16px] sm:px-[24px] pt-[28px] pb-[40px] space-y-[16px]">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="border border-border-subtle bg-white p-[20px] space-y-[14px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-accent-cobalt uppercase">
                {cert.issuer}
              </span>
              <span className="font-mono text-[8.5px] leading-[10px] px-1.5 py-0.5 bg-bg-surface border border-border-subtle text-text-secondary uppercase">
                {cert.isPdf ? "PDF" : "IMG"}
              </span>
            </div>

            <h3 className="font-sans text-[16px] leading-[21px] font-bold tracking-[-0.01em] text-text-primary">
              {cert.title}
            </h3>

            <div className="space-y-[4px] font-mono text-[10px] leading-[13px] text-text-secondary">
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

            <div className="pt-[14px] border-t border-border-subtle flex flex-col sm:flex-row gap-[8px]">
              <a
                href={cert.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[36px] items-center justify-center bg-text-primary px-[14px] font-mono text-[10.5px] leading-[12px] font-semibold text-bg-primary"
              >
                View Certificate ↗
              </a>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[36px] items-center justify-center border border-border-subtle px-[14px] font-mono text-[10.5px] leading-[12px] font-semibold text-text-primary"
                >
                  Verify Credential ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
