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
    <div className="relative flex h-[44px] md:h-[48px] xl:h-[56px] w-full items-center justify-between border-b border-border-subtle bg-bg-surface px-[24px] md:px-[40px] xl:px-[80px]">
      {mobileIndexLabel ? (
        <>
          <span className="md:hidden font-mono text-[10.5px] leading-[12px] font-semibold text-accent-cobalt">
            {mobileIndexLabel}
          </span>
          <span className="hidden md:inline font-mono text-[10.5px] leading-[12px] tracking-[0.02em] xl:text-[11px] xl:leading-[13px] font-semibold text-accent-cobalt">
            {indexLabel}
          </span>
        </>
      ) : (
        <span className="font-mono text-[10.5px] leading-[12px] md:tracking-[0.02em] xl:text-[11px] xl:leading-[13px] xl:tracking-[0.02em] font-semibold text-accent-cobalt">
          {indexLabel}
        </span>
      )}
      <span
        className={`hidden xl:block absolute ${subtitleLeftClass} font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary`}
      >
        {subtitle}
      </span>
      <span className="hidden md:block font-mono text-[10.5px] leading-[12px] xl:text-[11px] xl:leading-[13px] font-normal text-text-secondary">
        {counter}
      </span>
    </div>
  );
}
