// File: page.tsx — Detalle de lead: conversación del chat, estado (pipeline), notas internas, convertir a cliente.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLead, LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_STATUS_COLOR } from '@/lib/zaire-ops/leads';
import ConfirmButton from '@/app/dashboard/_components/confirm-button';
import { updateLeadStatusAction, updateLeadNotesAction, convertLeadToClientAction, deleteLeadAction } from '../actions';

export const dynamic = 'force-dynamic';

const fmt = (iso: string) => new Date(iso).toLocaleString('es-AR');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#666', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: '#ddd' }}>{children}</div>
    </div>
  );
}

// Renderiza la conversación del chat (líneas "ZAIRE:" / "Visitante:") en burbujas.
function Conversation({ raw }: { raw: string }) {
  const lines = raw.split('\n').filter(l => l.trim());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.map((line, i) => {
        const isBot = line.startsWith('ZAIRE:');
        const text = line.replace(/^(ZAIRE|Visitante):\s?/, '');
        return (
          <div key={i} style={{ padding: '8px 12px', background: isBot ? '#1a1a1a' : '#202020', borderLeft: `2px solid ${isBot ? '#FF6A00' : '#444'}`, borderRadius: 4 }}>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: isBot ? '#FF6A00' : '#777', display: 'block', marginBottom: 4 }}>{isBot ? 'ZAIRE' : 'Visitante'}</span>
            <span style={{ fontSize: 13, color: '#ccc', lineHeight: 1.55 }}>{text}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const waHref = lead.whatsapp ? `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}` : null;

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// LEAD · {fmt(lead.created_at)}</div>
          <h1 className="zo-h1">{lead.name ?? lead.email}</h1>
          <div className="zo-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="zo-chip"><span className="zo-dot" style={{ background: LEAD_STATUS_COLOR[lead.status] }} />{LEAD_STATUS_LABEL[lead.status]}</span>
            {lead.company && <span className="zo-chip">{lead.company}</span>}
            <span className="zo-chip">{lead.source ?? 'web'}</span>
            {lead.converted_client_id && <span className="zo-chip" style={{ background: 'rgba(34,197,94,.14)', color: '#22c55e' }}><span className="zo-dot" style={{ background: '#22c55e' }} />Cliente</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`mailto:${lead.email}`}><button className="zo-btn zo-btn-sm" type="button">Responder email</button></a>
          {waHref && <a href={waHref} target="_blank" rel="noopener noreferrer"><button className="zo-btn zo-btn-sm" type="button">WhatsApp</button></a>}
          <Link href="/dashboard/leads"><button className="zo-btn zo-back">← Volver</button></Link>
        </div>
      </div>

      <div className="zo-grid2" style={{ alignItems: 'start' }}>
        {/* Columna izquierda: datos + gestión */}
        <div>
          <div className="zo-card">
            <div className="zo-card-title">// CONTACTO</div>
            <Field label="Nombre">{lead.name}</Field>
            <Field label="Email"><a href={`mailto:${lead.email}`} className="zo-rowlink">{lead.email}</a></Field>
            <Field label="WhatsApp">{waHref ? <a href={waHref} target="_blank" rel="noopener noreferrer" className="zo-rowlink">{lead.whatsapp}</a> : null}</Field>
            <Field label="Empresa">{lead.company}</Field>
            <Field label="Equipo">{lead.employees}</Field>
            <Field label="Desafío">{lead.challenge}</Field>
            <Field label="Necesidad">{lead.need}</Field>
            <Field label="Conoce IA">{lead.ai_knowledge}</Field>
            {lead.message && <Field label="Mensaje">{lead.message}</Field>}
          </div>

          <div className="zo-card zo-section-gap">
            <div className="zo-card-title">// GESTIÓN</div>
            <form action={updateLeadStatusAction.bind(null, lead.id)} className="zo-form" style={{ maxWidth: '100%' }}>
              <div className="zo-field"><label className="zo-flabel">Estado (pipeline)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="zo-select" name="status" defaultValue={lead.status} style={{ flex: 1 }}>
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                  </select>
                  <button className="zo-btn zo-btn-sm" type="submit">Actualizar</button>
                </div>
              </div>
            </form>

            <form action={updateLeadNotesAction.bind(null, lead.id)} className="zo-form" style={{ maxWidth: '100%', marginTop: 8 }}>
              <div className="zo-field"><label className="zo-flabel">Notas internas</label>
                <textarea className="zo-textarea" name="notes" defaultValue={lead.notes ?? ''} placeholder="Seguimiento, contexto, próximos pasos…" rows={4} />
              </div>
              <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">Guardar notas</button></div>
            </form>

            <div style={{ borderTop: '1px solid #1e1e1e', marginTop: 16, paddingTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lead.converted_client_id ? (
                <Link href={`/dashboard/clientes/${lead.converted_client_id}`}><button className="zo-btn zo-btn-sm" type="button">Ver cliente →</button></Link>
              ) : (
                <form action={convertLeadToClientAction.bind(null, lead.id)}>
                  <ConfirmButton className="zo-btn zo-btn-primary zo-btn-sm" message="¿Convertir este lead en cliente? Se creará un registro en Clientes con estos datos.">Convertir en cliente</ConfirmButton>
                </form>
              )}
              <form action={deleteLeadAction.bind(null, lead.id)}>
                <ConfirmButton message="¿Eliminar este lead? No se puede deshacer.">Eliminar lead</ConfirmButton>
              </form>
            </div>
          </div>
        </div>

        {/* Columna derecha: conversación del chat */}
        <div className="zo-card">
          <div className="zo-card-title">// CONVERSACIÓN DEL CHAT</div>
          {lead.conversation
            ? <Conversation raw={lead.conversation} />
            : <div style={{ fontSize: 13, color: '#666' }}>Sin conversación registrada (vino del formulario de contacto).</div>}
        </div>
      </div>
    </>
  );
}
