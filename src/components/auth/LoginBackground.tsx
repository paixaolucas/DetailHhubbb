'use client';

import { useRef, useEffect } from 'react';

interface LoginBackgroundProps {
  className?: string;
}

// Exact Detailer'HUB icon path — from src/components/ui/logo.tsx (LogoType icon portion)
// Original viewBox context: "0 0 1000 154", icon spans x:[0,153.59] y:[0,154]
const SYMBOL_PATH_D =
  'M134.77,77.02c0-20.07,7.05-38.48,18.82-52.91V1.6c0-.88-.72-1.6-1.6-1.6h-59.5l-7.56,30.85' +
  'c8.83,3.25,14.98,10.77,14.98,20.73,0,12.76-10.35,23.11-23.11,23.11s-23.11-10.35-23.11-23.11' +
  'c0-9.96,6.3-17.48,15.12-20.73L61.1,0H1.6C.72,0,0,.72,0,1.6v22.51c11.76,14.43,18.82,32.85,' +
  '18.82,52.91S11.76,115.5,0,129.93v22.51c0,.88.72,1.6,1.6,1.6h59.5l7.38-30.81' +
  'c-8.83-3.25-14.8-10.97-14.8-20.92,0-13.15,10.98-23.73,24.27-23.08,12.42.61,22.21,11.13,' +
  '21.95,23.56-.2,9.72-6.61,17.25-15.29,20.44l7.88,30.81h59.5c.88,0,1.6-.72,1.6-1.6v-22.51' +
  'c-11.76-14.43-18.82-32.85-18.82-52.91Z';

// Symbol dimensions — Problem 5: increased from 32 to 52px
const SYMBOL_VIEW_H = 154;
const SYMBOL_VIEW_W = 154.77;
const SYMBOL_H = 52;
const SYMBOL_W = (SYMBOL_VIEW_W / SYMBOL_VIEW_H) * SYMBOL_H; // ~52.26px
const DRAW_SCALE = SYMBOL_H / SYMBOL_VIEW_H;

// Grid layout — Problem 5: wider spacing for larger symbols
const COL_SPACING = 88;
const ROW_SPACING = 72;
const ODD_ROW_OFFSET = 44; // half of COL_SPACING

// Problem 6: glow radius 180px, lantern-style
const MAX_DIST = 180;

// Phrase — two lines
const LINE_1 = 'O hub dos profissionais';
const LINE_2 = 'de estética automotiva.';

interface SymbolPos {
  cx: number;
  cy: number;
}

function buildGrid(width: number, height: number): SymbolPos[] {
  const syms: SymbolPos[] = [];
  const cols = Math.ceil(width / COL_SPACING) + 2;
  const rows = Math.ceil(height / ROW_SPACING) + 2;
  for (let row = -1; row < rows; row++) {
    const offset = row % 2 !== 0 ? ODD_ROW_OFFSET : 0;
    for (let col = -1; col < cols; col++) {
      syms.push({
        cx: col * COL_SPACING + offset + COL_SPACING / 2,
        cy: row * ROW_SPACING + ROW_SPACING / 2,
      });
    }
  }
  return syms;
}

export default function LoginBackground({ className = '' }: LoginBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const symbolPath = useRef<Path2D | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const isHovering = useRef(false);
  const phraseOpacity = useRef(0);
  const rafId = useRef<number | null>(null);
  const symbols = useRef<SymbolPos[]>([]);
  // Smoothed values for parallax + chrome sheen
  const textX = useRef(0);       // smoothed x offset for phrase parallax
  const textY = useRef(0);       // smoothed y offset for phrase parallax
  const sheenPos = useRef(0.5);  // smoothed sheen position (0 = left, 1 = right)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    symbolPath.current = new Path2D(SYMBOL_PATH_D);

    // Capture non-null references for closures
    const el = canvas;
    const c = ctx;

    function draw() {
      if (!symbolPath.current) return;

      // Use CSS pixel dimensions for all positioning (bug fix: canvas.width is physical pixels)
      const cssW = el.clientWidth;
      const cssH = el.clientHeight;

      c.clearRect(0, 0, cssW, cssH);

      const mp = mousePos.current;

      // Draw symbols — Problem 6: lantern glow with intensity formula
      for (const { cx, cy } of symbols.current) {
        let intensity = 0;
        if (mp !== null) {
          const dx = cx - mp.x;
          const dy = cy - mp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          intensity = Math.max(0, 1 - dist / MAX_DIST);
        }

        const g = Math.round(96 + intensity * 60);   // 96 → 156
        const b = Math.round(121 + intensity * 96);  // 121 → 217
        const a = (0.22 + intensity * 0.70).toFixed(3); // 0.22 → 0.92

        c.save();
        c.translate(cx - SYMBOL_W / 2, cy - SYMBOL_H / 2);
        c.scale(DRAW_SCALE, DRAW_SCALE);
        c.fillStyle = `rgba(0,${g},${b},${a})`;
        c.fill(symbolPath.current);
        c.restore();
      }

      // Phrase — 38px, parallax offset, chrome sheen
      if (phraseOpacity.current > 0.001) {
        const alpha = phraseOpacity.current * 0.80;
        // Parallax: text floats opposite to mouse — depth illusion like a dashboard
        const phraseX = cssW / 2 + textX.current;
        const phraseY = cssH * 0.42 + textY.current;

        // Base text
        c.save();
        c.font = '300 38px "Titillium Web", sans-serif';
        c.fillStyle = `rgba(238,230,228,${alpha.toFixed(3)})`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.letterSpacing = '0.06em';
        c.fillText(LINE_1, phraseX, phraseY);
        c.fillText(LINE_2, phraseX, phraseY + 50);
        c.restore();

        // Chrome sheen — automotive paint catching light, moves with mouse X
        // A narrow bright band that sweeps across the phrase area
        const sheenPixelX = cssW * sheenPos.current;
        const sheenAlpha = phraseOpacity.current * 0.18;
        const grad = c.createLinearGradient(sheenPixelX - 140, 0, sheenPixelX + 140, 0);
        grad.addColorStop(0,    'rgba(255,255,255,0)');
        grad.addColorStop(0.42, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5,  `rgba(255,255,255,${sheenAlpha.toFixed(3)})`);
        grad.addColorStop(0.58, 'rgba(255,255,255,0)');
        grad.addColorStop(1,    'rgba(255,255,255,0)');
        c.save();
        c.fillStyle = grad;
        c.fillRect(0, phraseY - 44, cssW, 120);
        c.restore();
      }

      // Problem 8: vignette — drawn on top of everything
      const vignette = c.createRadialGradient(
        cssW / 2, cssH / 2, cssH * 0.3,
        cssW / 2, cssH / 2, cssW * 0.85,
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = vignette;
      c.fillRect(0, 0, cssW, cssH);
    }

    function loop() {
      const cssW = el.clientWidth;
      const cssH = el.clientHeight;

      // Problem 7: 0.04 per frame → ~400ms in/out at 60fps
      if (isHovering.current) {
        phraseOpacity.current = Math.min(1, phraseOpacity.current + 0.04);
      } else {
        phraseOpacity.current = Math.max(0, phraseOpacity.current - 0.04);
      }

      // Lerp smooth values
      const mp = mousePos.current;
      let targetX = 0;
      let targetY = 0;
      let targetSheen = 0.5;

      if (mp !== null && cssW > 0 && cssH > 0) {
        // Parallax: text drifts opposite to mouse — like a dashboard cluster floating in depth
        targetX = (mp.x / cssW - 0.5) * -28;
        targetY = (mp.y / cssH - 0.5) * -16;
        // Sheen follows mouse X — automotive paint catching a light source
        targetSheen = mp.x / cssW;
      }

      const lerpSpeed = isHovering.current ? 0.08 : 0.06;
      textX.current += (targetX - textX.current) * lerpSpeed;
      textY.current += (targetY - textY.current) * lerpSpeed;
      sheenPos.current += (targetSheen - sheenPos.current) * 0.06;

      draw();

      const smoothSettled =
        Math.abs(textX.current) < 0.1 &&
        Math.abs(textY.current) < 0.1 &&
        Math.abs(sheenPos.current - 0.5) < 0.002;

      if (isHovering.current || phraseOpacity.current > 0 || !smoothSettled) {
        rafId.current = requestAnimationFrame(loop);
      } else {
        rafId.current = null;
      }
    }

    function startLoop() {
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(loop);
      }
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      isHovering.current = true;
      startLoop();
    }

    function handleMouseLeave() {
      mousePos.current = null;
      isHovering.current = false;
      startLoop();
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      el.width = w * dpr;
      el.height = h * dpr;
      c.scale(dpr, dpr);
      symbols.current = buildGrid(w, h);
      draw();
    }

    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(el);

    // Fallback: se clientWidth era 0 no mount, tenta novamente após layout
    const initTimeout = setTimeout(() => {
      if (el.clientWidth > 0 && symbols.current.length === 0) resize();
    }, 80);

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      ro.disconnect();
      clearTimeout(initTimeout);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`w-full h-full outline-none ${className}`}
      style={{ display: 'block' }}
    />
  );
}
