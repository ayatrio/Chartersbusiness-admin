import React from 'react';

export default function BrandMark({ compact = false }) {
  return (
    <img
      src="/Chaters_Union.webp"
      alt="Charters Business Logo"
      style={{
        height: compact ? '18px' : '32px',
        width: 'auto',
        maxWidth: compact ? '50px' : '150px',
        display: 'block',
        transition: 'all 0.25s ease',
        objectFit: 'contain'
      }}
    />
  );
}

