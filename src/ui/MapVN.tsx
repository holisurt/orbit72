import type { ReactNode } from 'react';
import { useMaps } from '../data/context';

/**
 * Viet Nam region map (design/HF-Brief, HF-Ops). Map files are equirectangular at 30 px/deg
 * with origin (98°E, 26°N): x = (lon − 98)·30, y = (26 − lat)·30. Frame 540×600.
 */
export function projVN(lat: number, lon: number): { x: number; y: number } {
  return { x: (lon - 98) * 30, y: (26 - lat) * 30 };
}

interface Props {
  label: string;
  viewBox?: string;
  children?: ReactNode;
}

export function MapVN({ label, viewBox = '60 20 420 300', children }: Props) {
  const maps = useMaps();
  return (
    <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <rect x="-1000" y="-1000" width="3000" height="3000" fill="#0A1A33" />
      <path
        d="M0 30 H540 M0 60 H540 M0 90 H540 M0 120 H540 M0 150 H540 M0 180 H540 M0 210 H540 M0 240 H540 M0 270 H540 M0 300 H540 M90 0 V600 M180 0 V600 M270 0 V600 M360 0 V600 M450 0 V600"
        stroke="#14284A"
        strokeWidth="0.6"
      />
      {maps?.seaLand && <path d={maps.seaLand} fill="#1B2B45" stroke="#33476E" strokeWidth="0.5" />}
      {maps?.vn && <path d={maps.vn} fill="#2F6B4F" stroke="#7BC59A" strokeWidth="0.8" />}
      {children}
    </svg>
  );
}
