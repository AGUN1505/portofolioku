interface FooterProps {
  readonly brandName: string;
}

export function Footer({ brandName }: FooterProps) {
  return (
    <footer className="w-full bg-text-primary text-bg-primary">
      {/* Desktop Footer (1440px, height 100px) */}
      <div className="hidden xl:flex relative h-[100px] w-full items-center justify-between px-[80px]">
        <div className="flex items-center gap-[10px]">
          <span
            aria-hidden="true"
            className="h-[10px] w-[10px] shrink-0 bg-accent-cobalt"
          />
          <span className="font-sans text-[15px] leading-[18px] font-bold tracking-[0.02em] text-bg-primary">
            {brandName}
          </span>
        </div>

        <p className="absolute left-[560px] font-mono text-[12px] leading-[14px] font-normal text-border-subtle">
          © {brandName}. All rights reserved.
        </p>

        <a
          href="#top"
          className="font-mono text-[12px] leading-[14px] font-semibold tracking-[0.02em] text-bg-primary whitespace-pre"
        >
          {"Back to top  ↑"}
        </a>
      </div>

      {/* Tablet Footer (768px, height 92px) */}
      <div className="hidden md:flex xl:hidden relative h-[92px] w-full items-center justify-between px-[40px]">
        <span className="font-sans text-[14px] leading-[17px] font-bold text-bg-primary">
          {brandName}
        </span>

        <p className="font-mono text-[11px] leading-[13px] font-normal text-border-subtle">
          © {brandName}. All rights reserved.
        </p>

        <a
          href="#top"
          className="font-mono text-[11px] leading-[13px] font-semibold text-bg-primary"
        >
          Back to top ↑
        </a>
      </div>

      {/* Mobile Footer (390px, height 100px) */}
      <div className="md:hidden h-[100px] w-full px-[24px] pt-[24px]">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[14px] leading-[17px] font-bold text-bg-primary">
            {brandName}
          </span>

          <a
            href="#top"
            className="font-mono text-[11px] leading-[13px] font-semibold text-accent-cobalt"
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
