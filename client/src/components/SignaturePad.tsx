import { useEffect, useRef } from 'react';

export default function SignaturePad({
  width = 600,
  height = 200,
  onSave,
  onCancel,
}: {
  width?: number;
  height?: number;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff0';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const getPos = (e: MouseEvent | Touch) => {
      const rect = c.getBoundingClientRect();
      if ('clientX' in e) return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      return { x: (e as Touch).clientX - rect.left, y: (e as Touch).clientY - rect.top };
    };

    const start = (ev: MouseEvent | TouchEvent) => {
      drawing.current = true;
      ctx.beginPath();
      const p = 'touches' in ev ? (ev.touches[0] as Touch) : (ev as MouseEvent);
      const pos = getPos(p as any);
      ctx.moveTo(pos.x, pos.y);
    };

    const move = (ev: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      const p = 'touches' in ev ? (ev.touches[0] as Touch) : (ev as MouseEvent);
      const pos = getPos(p as any);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const end = () => {
      drawing.current = false;
    };

    c.addEventListener('mousedown', start as any);
    window.addEventListener('mousemove', move as any);
    window.addEventListener('mouseup', end as any);
    c.addEventListener('touchstart', start as any, { passive: true } as any);
    window.addEventListener('touchmove', move as any as any, { passive: true } as any);
    window.addEventListener('touchend', end as any as any);

    return () => {
      c.removeEventListener('mousedown', start as any);
      window.removeEventListener('mousemove', move as any);
      window.removeEventListener('mouseup', end as any);
      c.removeEventListener('touchstart', start as any);
      window.removeEventListener('touchmove', move as any as any);
      window.removeEventListener('touchend', end as any as any);
    };
  }, []);

  function clear() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  }

  function save() {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((b) => {
      if (!b) return;
      onSave(b);
    }, 'image/png');
  }

  return (
    <div>
      <canvas ref={canvasRef} width={width} height={height} className="w-full rounded border" style={{ touchAction: 'none', background: 'white' }} />
      <div className="mt-2 flex gap-2">
        <button onClick={clear} className="px-3 py-1 border rounded">Clear</button>
        <button onClick={save} className="px-3 py-1 bg-indigo-600 text-white rounded">Save Signature</button>
        <button onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
      </div>
    </div>
  );
}
