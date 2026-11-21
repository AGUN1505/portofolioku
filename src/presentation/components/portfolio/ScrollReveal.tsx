// src/presentation/components/portfolio/ScrollReveal.tsx
'use client';

import { useEffect, useRef, useState, type ReactNode, type HTMLAttributes } from 'react';

interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly delay?: number; // Delay in milliseconds for staggered item reveals
  readonly className?: string;
  readonly threshold?: number;
  readonly as?: 'div' | 'section';
}

export function ScrollReveal({
  children,
  delay = 0,
  className = '',
  threshold = 0.12,
  as = 'div',
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            const timer = setTimeout(() => {
              setIsVisible(true);
            }, delay);
            observer.unobserve(element);
            return () => clearTimeout(timer);
          } else {
            setIsVisible(true);
            observer.unobserve(element);
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delay, threshold]);

  const style = delay > 0 && isVisible ? { transitionDelay: `${delay}ms` } : undefined;
  const classes = `reveal-init ${isVisible ? 'reveal-visible' : ''} ${className}`.trim();

  if (as === 'section') {
    return (
      <section
        ref={ref as unknown as React.Ref<HTMLElement>}
        style={style}
        className={classes}
        {...rest}
      >
        {children}
      </section>
    );
  }

  return (
    <div
      ref={ref}
      style={style}
      className={classes}
      {...rest}
    >
      {children}
    </div>
  );
}
