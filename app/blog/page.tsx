// File: page.tsx
// Path: zaire-web/app/blog/page.tsx
// Last modified: 2026-04-27
// Description: Listado del blog con filtros por categoría.
//              Datos desde Supabase (fallback a dummy posts durante desarrollo).

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import { type BlogPost, getAllPosts } from '@/lib/blog';

const CATEGORIES = ['Todos', 'Automatización', 'Agentes IA', 'Arquitectura', 'Revenue', 'Operaciones'];

/* ── Componente de card de post ──────────────────────────── */
function PostCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`blog-card${featured ? ' featured' : ''}`}>
      <div className="blog-img" style={{ background: post.cover_bg }}>
        <div className="blog-img-bg" style={{ background: post.cover_bg }} />
        <span
          className="blog-category"
          style={featured ? { background: post.cover_accent, color: post.cover_accent === '#111' ? '#fff' : '#111' } : {}}
        >
          {featured ? 'DESTACADO' : post.category.toUpperCase()}
        </span>
      </div>
      <div className="blog-body">
        <div className="blog-date">
          {new Date(post.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}{post.read_time} min lectura
        </div>
        <div className="blog-title">{post.title}</div>
        <div className="blog-excerpt">{post.excerpt}</div>
        <div className="blog-read">Leer artículo →</div>
      </div>
    </Link>
  );
}

/* ── Página principal ────────────────────────────────────── */
export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    getAllPosts().then(setPosts);
  }, []);

  const filtered = activeCategory === 'Todos'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  const featured = filtered.find(p => p.featured) ?? filtered[0];
  const rest = filtered.filter(p => p.id !== featured?.id);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/blog" />

      {/* Hero de página */}
      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// BLOG · INTELIGENCIA APLICADA</div>
            <h1 className="pg-hero-h1">
              SIN FILTROS,<br /><em>CON CRITERIO</em>
            </h1>
            <p className="pg-hero-sub">
              Decisiones de arquitectura, patrones probados y lecciones reales de implementación.
              Contenido técnico sin relleno ni hype.
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="220">
              {[0, 48, 96, 144].map((y, i) => (
                <g key={y}>
                  <rect x="20" y={20 + y} width="280" height="32" rx="2"
                    stroke={i === 1 ? '#FF6A00' : '#333'} strokeWidth={i === 1 ? 2 : 1.5}
                    fill={i === 1 ? '#1a0a00' : i === 3 ? '#1a1500' : 'none'} />
                  <rect x="30" y={30 + y} width="80" height="12" rx="1"
                    fill={i === 1 ? '#FF6A00' : i === 3 ? '#FFC107' : '#333'} />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <section className="section">
        {/* Filtros de categoría */}
        <div className="cat-filter">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de posts */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#888' }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Cargando artículos...
            </div>
          </div>
        ) : (
          <div className="blog-grid">
            {featured && <PostCard post={featured} featured />}
            {rest.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <Stripe />
      <section className="section s-dk">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div className="s-lbl s-lbl-dk">// NEWSLETTER</div>
            <h2 className="s-h2" style={{ color: '#fff' }}>CONTENIDO<br />SIN <em>RUIDO</em></h2>
            <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.75, marginTop: 16, fontWeight: 300 }}>
              Un artículo por semana. Sin spam, sin hype. Solo lo que vale la pena saber sobre sistemas operativos inteligentes.
            </p>
          </div>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            onSubmit={e => { e.preventDefault(); }}>
            <input type="email" required placeholder="tu@empresa.com"
              className="ai-linput"
              style={{ background: '#1a1a1a', border: '1px solid #252525', color: '#fff', fontFamily: 'var(--fu)', fontSize: 14, padding: '14px 18px', outline: 'none', borderRadius: 2, width: '100%' }} />
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              SUSCRIBIRME →
            </button>
          </form>
        </div>
      </section>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
