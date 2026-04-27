// File: page.tsx
// Path: zaire-web/app/blog/[slug]/page.tsx
// Last modified: 2026-04-27
// Description: Página de detalle de artículo del blog.
//              Renderiza contenido en markdown simple (párrafos y headings).

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import { getPostBySlug, getAllPosts } from '@/lib/blog';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(p => ({ slug: p.slug }));
}

/* Convierte markdown básico a JSX */
function renderContent(md: string) {
  return md.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, textTransform: 'uppercase', marginTop: 48, marginBottom: 16 }}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', marginTop: 32, marginBottom: 12 }}>{line.slice(4)}</h3>;
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} style={{ fontWeight: 700, marginBottom: 8 }}>{line.slice(2, -2)}</p>;
    }
    if (line.trim() === '') return <div key={i} style={{ height: 16 }} />;
    return <p key={i} style={{ fontSize: 16, lineHeight: 1.8, color: '#555', marginBottom: 8 }}>{line}</p>;
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getAllPosts();
  const related = allPosts.filter(p => p.id !== post.id && p.category === post.category).slice(0, 2);

  return (
    <>
      {/* Nav sin botón de contacto visible en modo server */}
      <nav className="zn dark" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Link href="/" className="zn-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-zaire-v1.PNG" alt="ZAIRE" style={{ height: 22, filter: 'brightness(0) invert(1)' }} />
        </Link>
        <nav className="zn-links">
          <Link href="/">Inicio</Link>
          <Link href="/servicios">Servicios</Link>
          <Link href="/planes">Planes</Link>
          <Link href="/blog" style={{ color: '#FF6A00' }}>Blog</Link>
        </nav>
        <Link href="/contacto">
          <button className="zn-cta">Solicitar diagnóstico</button>
        </Link>
      </nav>

      {/* Hero del artículo */}
      <section style={{ background: post.cover_bg, padding: '110px var(--pad) 64px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            <Link href="/blog">
              <span style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#aaa', cursor: 'pointer' }}>← Blog</span>
            </Link>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 8, padding: '4px 10px', background: post.cover_accent, color: post.cover_accent === '#111' ? '#fff' : '#111', borderRadius: 2 }}>
              {post.category.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.92, color: '#fff', marginBottom: 24 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 16, color: '#aaa', lineHeight: 1.75, fontWeight: 300, maxWidth: 600, marginBottom: 24 }}>
            {post.excerpt}
          </p>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#666' }}>
            {new Date(post.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{post.read_time} min lectura
          </div>
        </div>
      </section>

      <Stripe />

      {/* Cuerpo del artículo */}
      <section style={{ padding: '72px var(--pad)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {renderContent(post.content)}
        </div>
      </section>

      {/* Posts relacionados */}
      {related.length > 0 && (
        <section className="section s-wh">
          <div className="s-lbl">// MÁS ARTÍCULOS</div>
          <h2 className="s-h2" style={{ marginBottom: 32 }}>SEGUIR <em>LEYENDO</em></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {related.map(p => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="blog-card">
                <div className="blog-img" style={{ background: p.cover_bg }}>
                  <div className="blog-img-bg" />
                  <span className="blog-category">{p.category.toUpperCase()}</span>
                </div>
                <div className="blog-body">
                  <div className="blog-date">{p.read_time} min lectura</div>
                  <div className="blog-title">{p.title}</div>
                  <div className="blog-read">Leer artículo →</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
