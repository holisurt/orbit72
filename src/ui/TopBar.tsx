import type { ReactNode } from 'react';
import type { ScreenId } from '../state/store';
import { Stepper } from './Stepper';
import { HeaderTools } from './HeaderTools';

interface Props {
  subtitle?: string;
  step?: ScreenId; // show mission stepper with this screen active
  right?: ReactNode;
}

/** Screen header: brand · stepper · turn/role (HF-Build/Orbit/Brief). */
export function TopBar({ subtitle, step, right }: Props) {
  return (
    <header className="topbar">
      <span className="brand">
        ORBIT <span className="amber">72</span>
        {subtitle && <span className="sub"> · {subtitle}</span>}
      </span>
      {step && <Stepper current={step} />}
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        {right}
        <HeaderTools />
      </div>
    </header>
  );
}
