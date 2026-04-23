import React from 'react';

export default function BrandMark({ compact = false }) {
  const rootClassName = compact ? 'brand-mark brand-mark--compact' : 'brand-mark';

  return (
    <div className={rootClassName}>
      <div className="brand-mark__badge">
        <span className="brand-mark__badge-text">CB</span>
      </div>

      <div className="brand-mark__copy">
        <div className="brand-mark__title">CHARTERS</div>
        <div className="brand-mark__subtitle">BUSINESS</div>
      </div>
    </div>
  );
}

