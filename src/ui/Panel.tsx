import type { CSSProperties, ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  titleRight?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  as?: 'section' | 'div' | 'aside';
  labelledBy?: string;
}

/** Dark rounded panel with optional uppercase label (HF .panel + .lbl). */
export function Panel({ title, titleRight, className = '', style, children, as = 'section' }: Props) {
  const Tag = as;
  return (
    <Tag className={`panel ${className}`} style={style}>
      {(title || titleRight) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          {title && <span className="lbl">{title}</span>}
          {titleRight}
        </div>
      )}
      {children}
    </Tag>
  );
}
