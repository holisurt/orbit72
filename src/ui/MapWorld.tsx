import type { ReactNode } from 'react';
import { useMaps } from '../data/context';

/** Equirectangular world, 720×360 (2 px/deg), as in design/HF-Orbit. */
export const WORLD_W = 720;
export const WORLD_H = 360;

export function projWorld(lat: number, lon: number): { x: number; y: number } {
  return { x: (lon + 180) * 2, y: (90 - lat) * 2 };
}

interface Props {
  label: string;
  children?: ReactNode;
}

export function MapWorld({ label, children }: Props) {
  const maps = useMaps();
  return (
    <svg className="world" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      <rect width={WORLD_W} height={WORLD_H} fill="#0A1A33" />
      <path
        d="M0 60 H720 M0 120 H720 M0 180 H720 M0 240 H720 M0 300 H720 M120 0 V360 M240 0 V360 M360 0 V360 M480 0 V360 M600 0 V360"
        stroke="#14284A"
        strokeWidth="0.8"
      />
      {maps?.world && <path d={maps.world} fill="#1E3B3A" stroke="#3E7A66" strokeWidth="0.5" />}
      {children}
    </svg>
  );
}
