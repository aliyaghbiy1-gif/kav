import React, { useEffect, useRef } from 'react';

export interface ParticleNetworkProps {
  theme: 'dark' | 'light';
  className?: string;
  density?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number; // Depth factor [0.45, 1.0]
  radius: number;
  baseAlpha: number;
  isAccent: boolean;
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const MAX_LINK_DISTANCE = 138;
const CURSOR_LINK_RADIUS = 215;
const CURSOR_REPEL_RADIUS = 54;
const PULSE_MAX_RADIUS = 240;
const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, option, label, [role="button"], [role="tab"], [role="dialog"], [contenteditable="true"]';

const PALETTES = {
  dark: {
    baseNode: '214, 224, 240', // Cool slate-white rgb(214, 224, 240)
    accent: '56, 189, 248', // Electric ice-blue rgb(56, 189, 248)
    haloAlpha: 0.065,
    linkOpacity: 0.16,
    cursorLinkOpacity: 0.42,
  },
  light: {
    baseNode: '15, 23, 42', // Deep slate rgb(15, 23, 42)
    accent: '29, 78, 216', // Cobalt blue rgb(29, 78, 216)
    haloAlpha: 0.05,
    linkOpacity: 0.14,
    cursorLinkOpacity: 0.36,
  },
} as const;

export const ParticleNetwork: React.FC<ParticleNetworkProps> = ({
  theme,
  className = '',
  density = 1,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<'dark' | 'light'>(theme);
  themeRef.current = theme;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let particles: Particle[] = [];
    const pulses: PulseWave[] = [];

    // Spatial hash grid storage reused across frames to avoid GC churn
    const gridColsRef = { value: 1 };
    const gridRowsRef = { value: 1 };
    let gridCells: number[][] = [];

    const targetPointer = { x: -9999, y: -9999, active: false };
    const smoothPointer = { x: -9999, y: -9999, strength: 0 };

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;
    let isInViewport = true;
    let isTabVisible = !document.hidden;
    let rafId = 0;
    let lastTimestamp = 0;

    const createParticles = (w: number, h: number) => {
      if (w <= 0 || h <= 0) {
        particles = [];
        return;
      }
      const area = w * h;
      const targetCount = Math.min(
        132,
        Math.max(44, Math.round((area / 14500) * Math.max(0.4, density)))
      );

      const next: Particle[] = new Array(targetCount);
      for (let i = 0; i < targetCount; i++) {
        const z = 0.45 + Math.random() * 0.55; // [0.45, 1.0]
        const angle = Math.random() * Math.PI * 2;
        const speed = (10 + Math.random() * 14) * z; // px/sec scaled by depth
        next[i] = {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          z,
          radius: (0.95 + Math.random() * 0.9) * (0.6 + z * 0.65),
          baseAlpha: 0.24 + z * 0.46,
          isAccent: Math.random() < 0.24,
        };
      }
      particles = next;
    };

    const ensureGridSize = (w: number, h: number) => {
      const cols = Math.max(1, Math.ceil(w / MAX_LINK_DISTANCE));
      const rows = Math.max(1, Math.ceil(h / MAX_LINK_DISTANCE));
      gridColsRef.value = cols;
      gridRowsRef.value = rows;
      const needed = cols * rows;
      while (gridCells.length < needed) {
        gridCells.push([]);
      }
    };

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width));
      const nextH = Math.max(1, Math.floor(rect.height));
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      if (nextW === width && nextH === height && nextDpr === dpr && particles.length > 0) {
        return;
      }

      const prevW = width;
      const prevH = height;
      width = nextW;
      height = nextH;
      dpr = nextDpr;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ensureGridSize(width, height);

      if (particles.length === 0 || prevW === 0 || prevH === 0) {
        createParticles(width, height);
      } else {
        const sx = width / prevW;
        const sy = height / prevH;
        for (let i = 0; i < particles.length; i++) {
          particles[i].x = Math.min(width, Math.max(0, particles[i].x * sx));
          particles[i].y = Math.min(height, Math.max(0, particles[i].y * sy));
        }
      }

      if (prefersReducedMotion) {
        renderFrame(0, false);
      }
    };

    const renderFrame = (dt: number, animate: boolean) => {
      if (width <= 0 || height <= 0) return;

      const palette = PALETTES[themeRef.current];
      ctx.clearRect(0, 0, width, height);

      // 1. Spring lerp pointer tracking
      if (animate) {
        const pointerLerp = 1 - Math.exp(-11 * dt);
        const strengthTarget = targetPointer.active ? 1 : 0;
        smoothPointer.strength += (strengthTarget - smoothPointer.strength) * pointerLerp;
        if (targetPointer.active) {
          if (smoothPointer.x < -5000) {
            smoothPointer.x = targetPointer.x;
            smoothPointer.y = targetPointer.y;
          } else {
            smoothPointer.x += (targetPointer.x - smoothPointer.x) * pointerLerp;
            smoothPointer.y += (targetPointer.y - smoothPointer.y) * pointerLerp;
          }
        }
      }

      // 2. Advance pulses and draw pulse waves
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        if (animate) {
          pulse.radius += 320 * dt;
          const progress = pulse.radius / pulse.maxRadius;
          pulse.alpha = Math.max(0, (1 - progress) * 0.42);
        }
        if (pulse.radius >= pulse.maxRadius || pulse.alpha <= 0.005) {
          pulses.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(${palette.accent}, ${pulse.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Soft radial atmospheric halo around cursor
      if (smoothPointer.strength > 0.02 && smoothPointer.x > -2000) {
        const haloRadius = CURSOR_LINK_RADIUS * 0.92;
        const halo = ctx.createRadialGradient(
          smoothPointer.x,
          smoothPointer.y,
          0,
          smoothPointer.x,
          smoothPointer.y,
          haloRadius
        );
        halo.addColorStop(
          0,
          `rgba(${palette.accent}, ${(palette.haloAlpha * smoothPointer.strength).toFixed(4)})`
        );
        halo.addColorStop(1, `rgba(${palette.accent}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(smoothPointer.x, smoothPointer.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Update particle kinematics (clamped dt) & populate O(n) spatial hash grid
      const cols = gridColsRef.value;
      const rows = gridRowsRef.value;
      const totalCells = cols * rows;
      for (let c = 0; c < totalCells; c++) {
        gridCells[c].length = 0;
      }

      const pointerActive = smoothPointer.strength > 0.02 && smoothPointer.x > -2000;
      const cursorRadiusSq = CURSOR_LINK_RADIUS * CURSOR_LINK_RADIUS;
      const repelRadiusSq = CURSOR_REPEL_RADIUS * CURSOR_REPEL_RADIUS;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (animate) {
          // Cursor orbital attraction & inner repulsion scaled by depth z
          if (pointerActive) {
            const dx = smoothPointer.x - p.x;
            const dy = smoothPointer.y - p.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > 0.001 && distSq < cursorRadiusSq) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;

              if (distSq < repelRadiusSq) {
                const repelFactor = (1 - dist / CURSOR_REPEL_RADIUS) * 145 * p.z * dt;
                p.vx -= nx * repelFactor;
                p.vy -= ny * repelFactor;
              } else {
                // Mid-range gentle inward + tangential orbital drift
                const falloff = 1 - (dist - CURSOR_REPEL_RADIUS) / (CURSOR_LINK_RADIUS - CURSOR_REPEL_RADIUS);
                const attract = falloff * 24 * p.z * smoothPointer.strength * dt;
                const orbit = falloff * 18 * p.z * smoothPointer.strength * dt;
                p.vx += nx * attract - ny * orbit;
                p.vy += ny * attract + nx * orbit;
              }
            }
          }

          // Click pulse wave subtle radial ripple
          for (let w = 0; w < pulses.length; w++) {
            const pulse = pulses[w];
            const dx = p.x - pulse.x;
            const dy = p.y - pulse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const band = Math.abs(dist - pulse.radius);
            if (band < 34 && dist > 1) {
              const strength = (1 - band / 34) * (1 - pulse.radius / pulse.maxRadius) * 110 * p.z * dt;
              p.vx += (dx / dist) * strength;
              p.vy += (dy / dist) * strength;
            }
          }

          // Gentle velocity damping back toward natural cruise speed
          const cruiseSpeed = 16 * p.z;
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > cruiseSpeed * 2.2) {
            const damp = Math.exp(-3.2 * dt);
            p.vx *= damp;
            p.vy *= damp;
          } else if (speed < cruiseSpeed * 0.45 && speed > 0.001) {
            const boost = 1 + 0.6 * dt;
            p.vx *= boost;
            p.vy *= boost;
          }

          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Seamless edge wrap
          if (p.x < -12) p.x = width + 12;
          else if (p.x > width + 12) p.x = -12;
          if (p.y < -12) p.y = height + 12;
          else if (p.y > height + 12) p.y = -12;
        }

        const cellX = Math.min(cols - 1, Math.max(0, Math.floor(p.x / MAX_LINK_DISTANCE)));
        const cellY = Math.min(rows - 1, Math.max(0, Math.floor(p.y / MAX_LINK_DISTANCE)));
        gridCells[cellY * cols + cellX].push(i);
      }

      // 5. Draw node-to-node links using O(n) 3x3 neighborhood checks
      const maxDistSq = MAX_LINK_DISTANCE * MAX_LINK_DISTANCE;
      ctx.lineWidth = 0.7;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const cellX = Math.min(cols - 1, Math.max(0, Math.floor(a.x / MAX_LINK_DISTANCE)));
        const cellY = Math.min(rows - 1, Math.max(0, Math.floor(a.y / MAX_LINK_DISTANCE)));

        for (let ny = Math.max(0, cellY - 1); ny <= Math.min(rows - 1, cellY + 1); ny++) {
          for (let nx = Math.max(0, cellX - 1); nx <= Math.min(cols - 1, cellX + 1); nx++) {
            const bucket = gridCells[ny * cols + nx];
            for (let k = 0; k < bucket.length; k++) {
              const j = bucket[k];
              if (j <= i) continue;

              const b = particles[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const distSq = dx * dx + dy * dy;
              if (distSq >= maxDistSq) continue;

              const dist = Math.sqrt(distSq);
              const proximity = 1 - dist / MAX_LINK_DISTANCE;
              const depthFactor = (a.z + b.z) * 0.5;
              const alpha = proximity * depthFactor * palette.linkOpacity;
              if (alpha <= 0.008) continue;

              const rgb = a.isAccent || b.isAccent ? palette.accent : palette.baseNode;
              ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      // 6. Draw crisp accent filaments from pointer to nearby particles
      if (pointerActive) {
        ctx.lineWidth = 0.85;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = smoothPointer.x - p.x;
          const dy = smoothPointer.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq >= cursorRadiusSq) continue;

          const dist = Math.sqrt(distSq);
          const alpha =
            (1 - dist / CURSOR_LINK_RADIUS) *
            p.z *
            palette.cursorLinkOpacity *
            smoothPointer.strength;
          if (alpha <= 0.01) continue;

          ctx.strokeStyle = `rgba(${palette.accent}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(smoothPointer.x, smoothPointer.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      // 7. Draw nodes scaled by depth z
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const rgb = p.isAccent ? palette.accent : palette.baseNode;
        ctx.fillStyle = `rgba(${rgb}, ${p.baseAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (now: number) => {
      if (prefersReducedMotion || !isInViewport || !isTabVisible) {
        rafId = 0;
        return;
      }
      if (lastTimestamp === 0) lastTimestamp = now;
      const dt = Math.min((now - lastTimestamp) / 1000, 0.032);
      lastTimestamp = now;

      renderFrame(dt, true);
      rafId = window.requestAnimationFrame(tick);
    };

    const syncLoopState = () => {
      if (prefersReducedMotion) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        renderFrame(0, false);
        return;
      }

      if (isInViewport && isTabVisible) {
        if (!rafId) {
          lastTimestamp = 0;
          rafId = window.requestAnimationFrame(tick);
        }
      } else if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetPointer.x = e.clientX - rect.left;
      targetPointer.y = e.clientY - rect.top;
      targetPointer.active = true;
    };

    const handlePointerLeave = () => {
      targetPointer.active = false;
    };

    const handleBackgroundClick = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest(INTERACTIVE_SELECTOR)) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > width || y > height) return;

      if (pulses.length >= 4) pulses.shift();
      pulses.push({
        x,
        y,
        radius: 0,
        maxRadius: PULSE_MAX_RADIUS,
        alpha: 0.42,
      });
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      syncLoopState();
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      syncLoopState();
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isInViewport = entries[0]?.isIntersecting ?? true;
        syncLoopState();
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(container);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('click', handleBackgroundClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    resizeCanvas();
    syncLoopState();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('click', handleBackgroundClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, [density]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`w-full h-full pointer-events-none select-none ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
