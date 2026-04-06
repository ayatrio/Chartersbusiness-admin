import React from 'react';

export default function BrandMark({ compact = false }) {
  const badgeSize = compact ? 38 : 46;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 12 }}>
      <div style={{
        width: badgeSize,
        height: badgeSize,
        borderRadius: 10,
        background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        flexShrink: 0
      }}>
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'var(--font-brand)',
          fontSize: compact ? 18 : 22,
          fontWeight: 700,
          letterSpacing: '0.04em'
        }}>
          CB
        </span>
      </div>

      <div style={{ lineHeight: 0.95 }}>
        <div style={{
          fontFamily: 'var(--font-brand)',
          fontSize: compact ? 20 : 24,
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '0.03em'
        }}>
          CHARTERS
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: compact ? 16 : 18,
          fontWeight: 800,
          color: 'var(--navy)',
          letterSpacing: '0.04em'
        }}>
          BUSINESS
        </div>
      </div>
    </div>
  );
}

