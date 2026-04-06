import React, { useState } from 'react';

const VARIANTS = {
  primary: {
    background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 12px 26px rgba(177, 7, 56, 0.18)',
    hover: {
      background: 'linear-gradient(180deg, var(--accent-light), var(--accent-strong))',
      boxShadow: '0 14px 30px rgba(177, 7, 56, 0.24)',
      transform: 'translateY(-1px)'
    }
  },
  secondary: {
    background: 'rgba(255,255,255,0.86)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    hover: {
      border: '1px solid var(--border-hover)',
      background: 'var(--surface-tint)',
      boxShadow: 'var(--shadow-md)'
    }
  },
  danger: {
    background: 'rgba(255,255,255,0.86)',
    color: 'var(--red)',
    border: '1px solid rgba(197, 42, 86, 0.18)',
    hover: { background: 'var(--red-dim)' }
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    hover: { color: 'var(--text-primary)', background: 'var(--bg-hover)' }
  },
  success: {
    background: 'var(--green-dim)',
    color: 'var(--green)',
    border: '1px solid rgba(45, 122, 96, 0.2)',
    hover: { background: 'rgba(45, 122, 96, 0.16)' }
  }
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, style = {},
  onClick, type = 'button', fullWidth = false
}) {
  const [hovered, setHovered] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;

  const sizes = {
    sm: { padding: '8px 15px',  fontSize: 13 },
    md: { padding: '11px 22px', fontSize: 14 },
    lg: { padding: '14px 30px', fontSize: 15 }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: '14px',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.18s ease',
        width: fullWidth ? '100%' : 'auto',
        letterSpacing: '-0.01em',
        ...sizes[size],
        ...v,
        ...(hovered && !disabled && !loading ? v.hover : {}),
        ...style
      }}
    >
      {loading
        ? <span style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block'
          }} />
        : icon
      }
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

