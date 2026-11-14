import { useMaps } from '../data/context';
import { MascotGroup } from './Mascot';
import { SI_LABEL } from './labels';
import { useTr } from '../i18n';

/** Globe centred on Viet Nam with orbit rings and Hanoi marker (design/HF-Home). */
export function Globe() {
  const tr = useTr();
  const maps = useMaps();
  return (
    <svg
      viewBox="-40 -40 500 500"
      role="img"
      aria-label={tr('globe_label')}
    >
      <defs>
        <radialGradient id="globe-oc" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#1E3E6B" />
          <stop offset="65%" stopColor="#0E2342" />
          <stop offset="100%" stopColor="#05101F" />
        </radialGradient>
        <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#3B82F6" stopOpacity="0" />
          <stop offset="96%" stopColor="#60A5FA" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="210" cy="210" r="222" fill="url(#globe-glow)" />
      <circle cx="210" cy="210" r="200" fill="url(#globe-oc)" />
      {maps?.globe && <path d={maps.globe} fill="#24543D" stroke="#5EA87F" strokeWidth="0.6" fillRule="evenodd" />}
      <circle cx="210" cy="210" r="200" fill="none" stroke="rgba(243, 245, 248, 0.25)" strokeWidth="1" />
      {[-62, -22, 18].map((r) => (
        <ellipse
          key={r}
          cx="210"
          cy="210"
          rx="250"
          ry="70"
          fill="none"
          stroke="#F5A524"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          transform={`rotate(${r} 210 210)`}
        />
      ))}
      <circle cx="209.5" cy="192.6" r="5" fill="#F87171" />
      <circle cx="209.5" cy="192.6" r="14" fill="none" stroke="#F87171" strokeWidth="1.5" />
      <text x="228" y="188" fontSize="13" fontWeight="700" fill="#FFFFFF">
        Hà Nội
      </text>
      <MascotGroup transform="translate(330 20) rotate(12)" />
      <text x="300" y="104" fontSize="13" fontWeight="700" fill="#F5A524">
        Rồng Con
      </text>
      <text x="300" y="120" fontSize="10" fill="#C9D4E8" stroke="#07090F" strokeWidth="3" paintOrder="stroke">
        {SI_LABEL}
      </text>
    </svg>
  );
}
