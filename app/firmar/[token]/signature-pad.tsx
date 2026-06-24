'use client';

import { useRef, useEffect, useState } from 'react';

export default function SignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';

    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
    };
    const down = (e: PointerEvent) => { drawing.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); c.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!drawing.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHas(true); };
    const up = () => { if (drawing.current && inputRef.current) inputRef.current.value = c.toDataURL('image/png'); drawing.current = false; };

    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const clear = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    if (inputRef.current) inputRef.current.value = '';
    setHas(false);
  };

  return (
    <div>
      <canvas ref={canvasRef} width={700} height={180}
        style={{ width: '100%', height: 180, background: '#fff', border: '1px solid #ccc', borderRadius: 6, touchAction: 'none', cursor: 'crosshair' }} />
      <input ref={inputRef} type="hidden" name="signature" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: has ? '#1c7a3f' : '#888' }}>{has ? '✓ Firma registrada' : 'Firmá con el mouse o el dedo'}</span>
        <button type="button" onClick={clear} style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Limpiar</button>
      </div>
    </div>
  );
}
