// File: footer.tsx
// Path: zaire-web/components/footer.tsx
// Last modified: 2026-04-27
// Description: Footer ZAIRE. Logo grande, links reducidos, barra inferior
//              en 3 columnas: copyright | mantra | email.

'use client';

import Link from 'next/link';
import Image from 'next/image';
import Stripe from './stripe';

/* ── Opciones de mantra — elegir una y dejar las demás comentadas ── */
const MANTRA = 'Infraestructura para lo que viene.';
// Otras opciones:
// 'Sistemas que no se detienen.'
// 'Inteligencia que opera.'
// 'Donde la IA encuentra su forma.'
// 'El futuro ya tiene arquitectura.'
// 'Construimos antes de que lo pidan.'

const navLinks = [
  { href: '/sistemas',  label: 'Software'  },
  { href: '/servicios', label: 'Studio'    },
  { href: '/planes',    label: 'Planes'    },
  { href: '/proceso',   label: 'Proceso'   },
  { href: '/blog',      label: 'Blog'      },
  { href: '/contacto',  label: 'Contacto'  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <Stripe />

      <footer style={{ background: '#111', padding: '56px var(--pad) 0' }}>

        {/* Fila principal: logo grande + links */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 40,
          paddingBottom: 48,
          borderBottom: '1px solid #1d1d1d',
        }}>

          {/* Logo + tagline */}
          <div>
            <Image
              src="/assets/zaire-logo-full-white.png"
              alt="ZAIRE"
              width={420}
              height={108}
              style={{ width: 'auto', height: 72, display: 'block' }}
            />
            <div style={{
              fontFamily: 'var(--fm)',
              fontSize: 8,
              color: '#aaa',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              marginTop: 12,
            }}>
              Zaire Technologies — Software industrial y sistemas operativos
            </div>
          </div>

          {/* Links + acceso al portal */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20, paddingTop: 4 }}>
            <nav style={{ display: 'flex', flexDirection: 'row', gap: 15 }}>
              {navLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{ fontSize: 11, color: '#aaa', letterSpacing: '.04em', transition: 'color .15s', fontFamily: 'var(--fu)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#444')}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: '#888', letterSpacing: '.1em', textTransform: 'uppercase' }}>¿Sos cliente?</span>
              <Link
                href="/portal/login"
                style={{ background: 'var(--org)', color: '#111', fontFamily: 'var(--fm)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '11px 20px', borderRadius: 2, transition: 'background .15s', display: 'inline-block' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e85e00')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--org)')}
              >
                Acceso al Portal →
              </Link>
            </div>
          </div>
        </div>

        {/* Barra inferior: copyright | mantra | email */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          padding: '20px 0 28px',
        }}>
          {/* Izquierda */}
          <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: '#aaa', letterSpacing: '.06em' }}>
            © ZAIRE {year} — Todos los derechos reservados
          </div>

          {/* Centro */}
          <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: '#aaa', letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {MANTRA}
          </div>

          {/* Derecha */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <a
              href="mailto:hola@zairetech.com"
              style={{ fontFamily: 'var(--fm)', fontSize: 10, color: '#aaa', letterSpacing: '.06em', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FF6A00')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
              hola@zairetech.com
            </a>
            <Link
              href="/politica-de-privacidad"
              style={{ fontFamily: 'var(--fm)', fontSize: 8, color: '#333', letterSpacing: '.04em', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#666')}
              onMouseLeave={e => (e.currentTarget.style.color = '#333')}
            >
              Política de privacidad
            </Link>
          </div>
        </div>

      </footer>
    </>
  );
}
