// File: page.tsx
// Path: zaire-web/app/politica-de-privacidad/page.tsx
// Last modified: 2026-04-28

import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de ZAIRE.',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontFamily: 'var(--fd)', fontSize: 18, fontWeight: 800, textTransform: 'uppercase', color: '#111', marginBottom: 12, letterSpacing: '.02em' }}>
      {title}
    </h2>
    <div style={{ fontSize: 15, color: '#555', lineHeight: 1.8 }}>
      {children}
    </div>
  </div>
);

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <nav className="zn dark" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Link href="/" className="zn-logo" style={{ fontFamily: 'var(--fm)', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '.1em' }}>
          ZAIRE
        </Link>
        <div className="zn-links">
          <Link href="/">Inicio</Link>
          <Link href="/servicios">Servicios</Link>
          <Link href="/contacto">Contacto</Link>
        </div>
        <Link href="/contacto">
          <button className="zn-cta">Solicitar diagnóstico</button>
        </Link>
      </nav>

      <section style={{ background: '#111', padding: '110px var(--pad) 64px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 20 }}>
            // LEGAL · PRIVACIDAD
          </div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 0.95, marginBottom: 24 }}>
            POLÍTICA DE<br /><em style={{ color: '#FF6A00', fontStyle: 'normal' }}>PRIVACIDAD</em>
          </h1>
          <p style={{ fontSize: 14, color: '#666', fontFamily: 'var(--fm)', letterSpacing: '.04em' }}>
            Última actualización: abril 2026
          </p>
        </div>
      </section>

      <Stripe />

      <section style={{ padding: '72px var(--pad) 96px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <Section title="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de los datos personales recolectados a través de este sitio web es <strong>ZAIRE</strong> (en adelante, "ZAIRE", "nosotros" o "el responsable"), con domicilio en la República Argentina y contacto en{' '}
              <a href="mailto:hola@zaire.studio" style={{ color: '#FF6A00' }}>hola@zaire.studio</a>.
            </p>
          </Section>

          <Section title="2. Datos que recolectamos">
            <p style={{ marginBottom: 12 }}>A través de los formularios y el chat de diagnóstico de este sitio podemos recolectar los siguientes datos personales:</p>
            <ul style={{ paddingLeft: 20 }}>
              {[
                'Nombre y apellido',
                'Dirección de correo electrónico',
                'Número de WhatsApp o teléfono',
                'Nombre y tipo de empresa',
                'Tamaño del equipo',
                'Descripción del desafío o necesidad operativa',
                'Contenido de la conversación con el asistente de diagnóstico',
              ].map(item => (
                <li key={item} style={{ marginBottom: 6 }}>{item}</li>
              ))}
            </ul>
            <p style={{ marginTop: 12 }}>
              La provisión de estos datos es voluntaria. El único campo obligatorio es el correo electrónico, necesario para poder contactarte.
            </p>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            <p style={{ marginBottom: 12 }}>Los datos personales recolectados son utilizados exclusivamente para:</p>
            <ul style={{ paddingLeft: 20 }}>
              {[
                'Responder consultas comerciales y coordinar diagnósticos de operación',
                'Enviar información sobre los servicios de ZAIRE cuando fue solicitada',
                'Mejorar la calidad del asistente de diagnóstico',
                'Cumplir con obligaciones legales vigentes',
              ].map(item => (
                <li key={item} style={{ marginBottom: 6 }}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title="4. Base legal">
            <p>
              El tratamiento de datos se realiza con base en el <strong>consentimiento del titular</strong>, otorgado al completar y enviar los formularios del sitio, en el marco de la{' '}
              <strong>Ley N° 25.326 de Protección de los Datos Personales</strong> de la República Argentina y sus normas reglamentarias.
            </p>
          </Section>

          <Section title="5. Almacenamiento y seguridad">
            <p>
              Los datos son almacenados en <strong>Supabase</strong> (plataforma de base de datos en la nube con servidores en Estados Unidos), bajo protocolos de seguridad estándar de la industria. ZAIRE implementa medidas técnicas y organizativas razonables para proteger la información contra acceso no autorizado, pérdida o alteración.
            </p>
            <p style={{ marginTop: 12 }}>
              Las comunicaciones de correo electrónico son gestionadas a través de <strong>Resend</strong>, un servicio de envío de emails transaccionales con infraestructura segura.
            </p>
          </Section>

          <Section title="6. Compartición con terceros">
            <p>
              ZAIRE <strong>no vende, alquila ni cede</strong> datos personales a terceros con fines comerciales. Los datos son compartidos únicamente con los prestadores de servicios tecnológicos mencionados (Supabase, Resend) en la medida necesaria para prestar el servicio, quienes actúan como encargados del tratamiento bajo sus propias políticas de privacidad.
            </p>
          </Section>

          <Section title="7. Plazo de conservación">
            <p>
              Los datos se conservarán mientras sean necesarios para la finalidad para la que fueron recolectados, o hasta que el titular ejerza su derecho de supresión. En caso de no concretarse una relación comercial, los datos serán eliminados dentro de los <strong>24 meses</strong> desde su recolección.
            </p>
          </Section>

          <Section title="8. Derechos del titular (derechos ARCO)">
            <p style={{ marginBottom: 12 }}>
              En virtud de la Ley 25.326, el titular de los datos personales tiene derecho a:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              {[
                'Acceder a sus datos personales en nuestro poder',
                'Rectificar datos inexactos o incompletos',
                'Cancelar o suprimir sus datos cuando ya no sean necesarios',
                'Oponerse al tratamiento de sus datos en determinadas circunstancias',
              ].map(item => (
                <li key={item} style={{ marginBottom: 6 }}>{item}</li>
              ))}
            </ul>
            <p style={{ marginTop: 12 }}>
              Para ejercer estos derechos, podés contactarnos en{' '}
              <a href="mailto:hola@zaire.studio" style={{ color: '#FF6A00' }}>hola@zaire.studio</a>{' '}
              indicando tu nombre, el derecho que deseás ejercer y adjuntando prueba de identidad. Responderemos dentro de los 5 días hábiles.
            </p>
          </Section>

          <Section title="9. Autoridad de control">
            <p>
              Si considerás que el tratamiento de tus datos no se ajusta a la normativa vigente, podés presentar un reclamo ante la{' '}
              <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, autoridad de aplicación de la Ley 25.326 en Argentina.
            </p>
          </Section>

          <Section title="10. Cookies y tecnologías de seguimiento">
            <p>
              Este sitio puede utilizar cookies técnicas necesarias para su funcionamiento. No utilizamos cookies de seguimiento con fines publicitarios ni compartimos datos de navegación con redes de publicidad.
            </p>
          </Section>

          <Section title="11. Modificaciones">
            <p>
              ZAIRE se reserva el derecho de actualizar esta política cuando sea necesario. Las modificaciones serán publicadas en esta página con la fecha de última actualización. El uso continuado del sitio tras una modificación implica la aceptación de la nueva versión.
            </p>
          </Section>

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #e5e3dd' }}>
            <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.7 }}>
              ¿Tenés preguntas sobre el tratamiento de tus datos?{' '}
              <a href="mailto:hola@zaire.studio" style={{ color: '#FF6A00' }}>Escribinos</a>.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}
