import { useMaps } from '../data/context';
import { MascotGroup } from './Mascot';

/** Globe centred on Viet Nam with orbit rings and Hanoi marker (design/HF-Home). */
export function Globe() {
  const maps = useMaps();
  return (
    <svg
      viewBox="-40 -40 500 500"
      role="img"
      aria-label="Quả địa cầu nhìn từ không gian, tâm là Việt Nam, với các quỹ đạo vệ tinh"
    >
      <defs>
        <radialGradient id="globe-oc" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#1D4E89" />
          <stop offset="70%" stopColor="#0B2547" />
          <stop offset="100%" stopColor="#06142B" />
        </radialGradient>
        <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#3DD6F5" stopOpacity="0" />
          <stop offset="100%" stopColor="#3DD6F5" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="210" cy="210" r="222" fill="url(#globe-glow)" />
      <circle cx="210" cy="210" r="200" fill="url(#globe-oc)" />
      {maps?.globe && <path d={maps.globe} fill="#2F6B4F" stroke="#7BC59A" strokeWidth="0.6" fillRule="evenodd" />}
      <circle cx="210" cy="210" r="200" fill="none" stroke="#3DD6F5" strokeOpacity="0.5" />
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
    </svg>
  );
}
