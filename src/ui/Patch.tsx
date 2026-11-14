import { forwardRef } from 'react';
import { EXPORT_FONT } from './exportPng';

export const PATCH_THEMES = [
  { name: 'Đêm xanh', c1: '#0B1F45', c2: '#13285A', acc: '#F5A524' },
  { name: 'Đồng thau', c1: '#2A1B0B', c2: '#3B2711', acc: '#E9B44C' },
  { name: 'Sơn mài', c1: '#3A0D12', c2: '#56141B', acc: '#F2C14E' },
];

/** 14-ray star of the Đông Sơn bronze drum face: 28 alternating points (design/HF-Share). */
export function starPoints(cx = 200, cy = 200, rOuter = 96, rInner = 30, rays = 14): string {
  const pts: string[] = [];
  for (let q = 0; q < rays * 2; q++) {
    const r = q % 2 === 0 ? rOuter : rInner;
    const ang = -Math.PI / 2 + (q * Math.PI) / rays;
    pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`);
  }
  return pts.join(' ');
}

interface Props {
  theme: number;
  team: string;
  scenario: string;
  satCount: number;
}

/** Mission patch: 14-ray star, lotus, orbit with one white dot per satellite. Literal colours (exportable). */
export const Patch = forwardRef<SVGSVGElement, Props>(function Patch({ theme, team, scenario, satCount }, ref) {
  const t = PATCH_THEMES[theme] ?? PATCH_THEMES[0];
  const tilt = (-20 * Math.PI) / 180;
  const n = Math.max(1, Math.min(18, satCount));
  const dots = Array.from({ length: n }, (_, q) => {
    const ang = (q * 2 * Math.PI) / n + 0.6;
    const x = 150 * Math.cos(ang);
    const y = 44 * Math.sin(ang);
    return { x: 200 + x * Math.cos(tilt) - y * Math.sin(tilt), y: 200 + x * Math.sin(tilt) + y * Math.cos(tilt) };
  });
  return (
    <svg
      ref={ref}
      viewBox="0 0 400 400"
      role="img"
      aria-label={`Mission patch: ngôi sao 14 cánh mặt trống đồng, cánh sen và quỹ đạo ${satCount} vệ tinh`}
      style={{ width: '100%', maxWidth: 380, height: 'auto' }}
    >
      <defs>
        <path id="patch-ring" d="M200 200 m-158 0 a158 158 0 1 1 316 0 a158 158 0 1 1 -316 0" />
      </defs>
      <circle cx="200" cy="200" r="196" fill={t.c1} />
      <circle cx="200" cy="200" r="186" fill="none" stroke={t.acc} strokeWidth="4" />
      <text fontSize="22" fontWeight="800" fill={t.acc} letterSpacing="3" fontFamily={EXPORT_FONT}>
        <textPath href="#patch-ring" startOffset="2%">
          {`${team} · ${scenario.toUpperCase()} · ORBIT 72 ·`}
        </textPath>
      </text>
      <circle cx="200" cy="200" r="132" fill={t.c2} stroke={t.acc} strokeWidth="3" />
      <circle cx="200" cy="200" r="118" fill="none" stroke={t.acc} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="2 6" />
      <circle cx="200" cy="200" r="100" fill="none" stroke={t.acc} strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="10 5" />
      <polygon points={starPoints()} fill={t.acc} />
      <circle cx="200" cy="200" r="16" fill={t.c2} stroke={t.acc} strokeWidth="3" />
      <ellipse cx="200" cy="200" rx="150" ry="44" fill="none" stroke="#3DD6F5" strokeWidth="3" transform="rotate(-20 200 200)" />
      {dots.map((d, k) => (
        <circle key={k} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r="7" fill="#FFFFFF" stroke="#3DD6F5" strokeWidth="3" />
      ))}
      <g fill="#F9A8D4" stroke={t.c1} strokeWidth="2">
        <path d="M200 332 C186 312 186 292 200 276 C214 292 214 312 200 332Z" />
        <path d="M200 332 C176 322 166 302 172 284 C190 290 200 310 200 332Z" />
        <path d="M200 332 C224 322 234 302 228 284 C210 290 200 310 200 332Z" />
      </g>
    </svg>
  );
});
