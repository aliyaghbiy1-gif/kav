import React, { useEffect, useRef, useState } from 'react';

interface NeuralOrbProps {
  className?: string;
}

export const NeuralOrb: React.FC<NeuralOrbProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isSmall = window.innerWidth < 768;
    setReducedMotion(mq.matches || isSmall);

    const onChange = () => setReducedMotion(mq.matches || window.innerWidth < 768);
    mq.addEventListener('change', onChange);
    window.addEventListener('resize', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const nodes = Array.from({ length: 42 }, (_, idx) => {
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / 42);
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      return {
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
      };
    });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    const handleMove = (e: MouseEvent) => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 0.4,
        y: (e.clientY / window.innerHeight - 0.5) * 0.4,
      };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMove, { passive: true });

    let t = 0;
    const render = () => {
      t += 0.0045;
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.46;
      const radius = Math.min(width, height) * 0.28;

      const rotY = t + pointerRef.current.x;
      const rotX = t * 0.5 + pointerRef.current.y;

      const projected = nodes.map((n) => {
        const x1 = n.x * Math.cos(rotY) - n.z * Math.sin(rotY);
        const z1 = n.z * Math.cos(rotY) + n.x * Math.sin(rotY);
        const y2 = n.y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = z1 * Math.cos(rotX) + n.y * Math.sin(rotX);
        const scale = 1.6 / (2.5 - z2);
        return {
          px: cx + x1 * radius * scale,
          py: cy + y2 * radius * scale,
          depth: z2,
        };
      });

      // Subtle atmospheric aura
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.45);
      grad.addColorStop(0, 'rgba(79, 140, 255, 0.16)');
      grad.addColorStop(0.55, 'rgba(135, 91, 255, 0.08)');
      grad.addColorStop(1, 'rgba(6, 9, 18, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Connect nearby nodes
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius * 0.62) {
            const alpha = (1 - dist / (radius * 0.62)) * 0.24;
            ctx.strokeStyle = `rgba(79, 140, 255, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const p of projected) {
        const size = p.depth > 0 ? 2.6 : 1.5;
        ctx.fillStyle = p.depth > 0 ? 'rgba(56, 217, 255, 0.85)' : 'rgba(135, 91, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(79,140,255,0.35) 0%, rgba(135,91,255,0.22) 50%, transparent 75%)',
          }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
    />
  );
};
