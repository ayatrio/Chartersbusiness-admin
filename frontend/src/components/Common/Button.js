import React from 'react';

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, style = {},
  onClick, type = 'button', fullWidth = false, className = ''
}) {
  const classes = [
    'app-button',
    `app-button--${variant}`,
    `app-button--${size}`,
    fullWidth && 'is-full-width',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      style={style}
    >
      {loading
        ? <span className="app-button__spinner" />
        : icon
      }
      {children}
    </button>
  );
}

