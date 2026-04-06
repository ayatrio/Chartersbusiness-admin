import React from 'react';

export default function Card({
  children, style = {}, hover = true,
  accent, padding = '24px', onClick
}) {
  const [hovered, setHovered] = React.useState(false);
  const borderColor = hovered ? 'var(--border-hover)' : 'var(--border)';
  const shadowParts = [];

  if (accent) {
    shadowParts.push(`inset 3px 0 0 ${accent}`);
  }

  if (hovered) {
    shadowParts.push('var(--shadow-lg)');
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius)',
        padding,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        transform: hovered && onClick ? 'translateY(-2px)' : 'none',
        boxShadow: shadowParts.length
          ? ['var(--shadow-md)', ...shadowParts].join(', ')
          : 'var(--shadow-md)',
        ...style
      }}
    >
      {children}
    </div>
  );
}

