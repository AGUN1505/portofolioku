interface FooterProps {
  readonly brandName: string;
}

export function Footer({ brandName }: FooterProps) {
  return (
    <footer className="w-full bg-text-primary text-bg-primary">
      {/* Desktop Footer (1280px+, max-width 1440px centered) */}
      <div className="hidden xl:flex relative mx-auto min-h-[100px] w-full max-w-[1440px] items-center justify-between gap-[24px] py-[20px] px-[48px] 2xl:px-[80px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <span
            aria-hidden="true"
            className="h-[10px] w-[10px] shrink-0 bg-accent-cobalt"
          />
          <span className="font-sans text-[15px] leading-[18px] font-bold tracking-[0.02em] text-bg-primary">
            {brandName}
          </span>
        </div>

        <p className="2xl:absolute 2xl:left-[560px] font-mono text-[12px] leading-[14px] font-normal text-border-subtle">
          © {brandName}. All rights reserved.
        </p>

        <a
          href="#top"
          className="shrink-0 font-mono text-[12px] leading-[14px] font-semibold tracking-[0.02em] text-bg-primary whitespace-pre"
        >
          {"Back to top  ↑"}
        </a>
      </div>

      {/* Tablet Footer (768px - 1279px) */}
      <div className="hidden md:flex xl:hidden relative mx-auto min-h-[92px] w-full max-w-[1440px] items-center justify-between gap-[16px] py-[20px] px-[40px]">
        <span className="min-w-0 font-sans text-[14px] leading-[17px] font-bold text-bg-primary">
          {brandName}
        </span>

        <p className="font-mono text-[11px] leading-[13px] font-normal text-border-subtle text-center">
          © {brandName}. All rights reserved.
        </p>

        <a
          href="#top"
          className="shrink-0 font-mono text-[11px] leading-[13px] font-semibold text-bg-primary whitespace-nowrap"
        >
          Back to top ↑
        </a>
      </div>

      {/* Mobile Footer (< 768px) */}
      <div className="md:hidden min-h-[100px] w-full px-[16px] sm:px-[24px] py-[24px]">
        <div className="flex items-center justify-between gap-[12px]">
          <span className="min-w-0 font-sans text-[14px] leading-[17px] font-bold text-bg-primary break-words">
            {brandName}
          </span>

          <a
            href="#top"
            className="shrink-0 font-mono text-[11px] leading-[13px] font-semibold text-accent-cobalt whitespace-nowrap"
          >
            Back to top ↑
          </a>
        </div>

        <p className="mt-[15px] font-mono text-[11px] leading-[13px] font-normal text-border-subtle">
          © {brandName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
