// File: reveal.tsx
// Path: zaire-web/components/reveal.tsx
// Last modified: 2026-04-27
// Description: Wrapper de animación scroll-reveal usando IntersectionObserver.
//              Aplica clase .rv → .rv.vis para fade-in + slide-up.

'use client';

import { useEffect, useRef } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('vis'), delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`rv ${className}`}>
      {children}
    </div>
  );
}
