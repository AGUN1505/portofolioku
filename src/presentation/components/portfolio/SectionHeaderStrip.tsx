export function SectionHeaderStrip({
  indexLabel,
  mobileIndexLabel,
  subtitle,
  subtitleLeftClass = "left-[610px]",
  counter,
}: {
  indexLabel: string;
  mobileIndexLabel?: string;
  subtitle: string;
  subtitleLeftClass?: string;
  counter: string;
}) {
  return (
    <div className="w-full border-b border-border-subtle bg-bg-surface">
      <div className="relative mx-auto flex min-h-[44px] md:min-h-[48px] xl:min-h-[56px] w-full max-w-[1440px] items-center justify-between gap-[16px] py-[8px] px-[16px] sm:px-[24px] md:px-[40px] xl:px-[48px] 2xl:px-[80px]">
        {mobileIndexLabel ? (
          <>
            <span className="md:hidden min-w-0 font-mono text-[10.5px] leading-[12px] font-semibold text-accent-cobalt break-words">
              {mobileIndexLabel}
            </span>
            <span className="hidden md:inline min-w-0 font-mono text-[10.5px] leading-[12px] tracking-[0.02em] xl:text-[11px] xl:leading-[13px] font-semibold text-accent-cobalt">
              {indexLabel}
            </span>
          </>
        ) : (
          <span className="min-w-0 font-mono text-[10.5px] leading-[12px] md:tracking-[0.02em] xl:text-[11px] xl:leading-[13px] xl:tracking-[0.02em] font-semibold text-accent-cobalt break-words">
            {indexLabel}
          </span>
        )}
        <span
          className={`hidden xl:block 2xl:absolute ${subtitleLeftClass} font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary truncate max-w-[420px] 2xl:max-w-none`}
        >
          {subtitle}
        </span>
        <span className="hidden md:block shrink-0 font-mono text-[10.5px] leading-[12px] xl:text-[11px] xl:leading-[13px] font-normal text-text-secondary whitespace-nowrap">
          {counter}
        </span>
      </div>
    </div>
  );
}
