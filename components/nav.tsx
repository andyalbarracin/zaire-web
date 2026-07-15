// File: nav.tsx
// Path: zaire-web/components/nav.tsx
// Last modified: 2026-04-27
// Description: Navegación fija. Links con position:absolute centrados en el nav.
//              Logo izquierda, CTA+burger derecha con flex space-between.
//              Logo claro en home sin scroll, blanco en nav oscura.

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NavProps {
  onContact: () => void;
  dark?: boolean;
  activePage?: string;
}

const links = [
  { href: '/',          label: 'Inicio'    },
  { href: '/sistemas',  label: 'Software'  },
  { href: '/servicios', label: 'Servicios' },
  { href: '/planes',    label: 'Planes'    },
  { href: '/proceso',   label: 'Proceso'   },
  { href: '/casos',     label: 'Casos'     },
  { href: '/blog',      label: 'Blog'      },
];

export default function Nav({ onContact, dark = false, activePage }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const close = () => { setOpen(false); document.body.style.overflow = ''; };
  const toggle = () => {
    const next = !open;
    setOpen(next);
    document.body.style.overflow = next ? 'hidden' : '';
  };

  const isDark  = dark || scrolled;
  const logoSrc = isDark
    ? '/assets/zaire-logo-full-white.png'
    : '/assets/zaire-logo-no-bg.png';

  return (
    <>
      {/* ── Nav principal ─────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: 64,
          padding: '0 var(--pad)',
          background:      isDark ? 'rgba(17,17,17,0.95)' : 'transparent',
          backdropFilter:  isDark ? 'blur(16px)' : 'none',
          boxShadow:       isDark ? '0 1px 0 #222' : 'none',
          transition: 'background .25s, box-shadow .25s',
          /* flex space-between: logo izquierda, CTA+burger derecha */
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" onClick={close} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Image
            src={logoSrc}
            alt="ZAIRE"
            width={140}
            height={36}
            priority
            style={{ width: 'auto', height: 28 }}
          />
        </Link>

        {/* Links — centrados con position absolute */}
        <div className="zn-links" style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 24,
          pointerEvents: 'auto',
        }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={activePage === l.href ? 'active' : ''}
              style={{
                fontSize: 12, fontWeight: 500, letterSpacing: '.04em',
                whiteSpace: 'nowrap',
                color: activePage === l.href
                  ? '#FF6A00'
                  : isDark ? '#aaa' : '#555',
                transition: 'color .15s',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Derecha: CTA + Burger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* CTA — va a /contacto directamente */}
          <Link href="/contacto">
            <button className="zn-cta">Solicitar diagnóstico</button>
          </Link>

          {/* Burger — solo visible en mobile via CSS */}
          <button
            className="zn-burger"
            onClick={toggle}
            aria-label="Menú"
            style={{ color: isDark ? '#fff' : '#111' }}
          >
            <svg viewBox="0 0 22 22" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" width="22" height="22">
              <line x1="2" y1="5"  x2="20" y2="5"
                style={{ transformOrigin:'11px 5px',  transform: open ? 'rotate(45deg) translate(0,6px)'   : 'none', transition:'transform .2s' }} />
              <line x1="2" y1="11" x2="20" y2="11"
                style={{ opacity: open ? 0 : 1, transition:'opacity .2s' }} />
              <line x1="2" y1="17" x2="20" y2="17"
                style={{ transformOrigin:'11px 17px', transform: open ? 'rotate(-45deg) translate(0,-6px)' : 'none', transition:'transform .2s' }} />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile overlay ────────────────────────────────────── */}
      <div className={`zn-mobile${open ? ' open' : ''}`}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={activePage === l.href ? 'active' : ''}
            onClick={close}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/contacto" className="zn-cta-mob" onClick={close}>
          Solicitar diagnóstico →
        </Link>
      </div>
    </>
  );
}
