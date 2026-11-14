/** Rồng Con — mascot CubeSat (from design/HF-Home). Drawn around (0,0); use inside an <svg>. */
export function MascotGroup({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <rect x="-34" y="10" width="22" height="26" rx="2" fill="#1E3A8A" stroke="#3DD6F5" />
      <path d="M-34 23 H-12 M-23 10 V36" stroke="#3DD6F5" strokeWidth="0.8" />
      <rect x="44" y="10" width="22" height="26" rx="2" fill="#1E3A8A" stroke="#3DD6F5" />
      <path d="M44 23 H66 M55 10 V36" stroke="#3DD6F5" strokeWidth="0.8" />
      <rect x="-12" y="0" width="56" height="52" rx="10" fill="#F5A524" />
      <path d="M-2 0 L3 -12 L9 0Z M25 0 L31 -12 L36 0Z" fill="#FFD27A" />
      <circle cx="5" cy="22" r="7" fill="#FFFFFF" />
      <circle cx="6" cy="23" r="3.5" fill="#0B1020" />
      <circle cx="27" cy="22" r="7" fill="#FFFFFF" />
      <circle cx="28" cy="23" r="3.5" fill="#0B1020" />
      <path d="M6 38 Q16 45 26 38" stroke="#0B1020" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Standalone mascot icon. */
export function Mascot({ size = 64, title = 'Rồng Con' }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="-40 -16 110 70" role="img" aria-label={title}>
      <MascotGroup />
    </svg>
  );
}
