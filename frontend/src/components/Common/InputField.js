import React, { useState } from 'react';

export default function InputField({
  label, type = 'text', value, onChange,
  placeholder, required, error, hint,
  icon, rows, style = {}, labelStyle = {}, hintStyle = {}
}) {
  const [focused, setFocused] = useState(false);
  const isTextarea = type === 'textarea';

  const inputStyle = {
    width: '100%',
    padding: icon ? '12px 14px 12px 42px' : '12px 14px',
    background: focused ? '#fff' : 'var(--surface-tint)',
    border: `1px solid ${error ? 'var(--red)' : focused ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    resize: isTextarea ? 'vertical' : 'none',
    boxShadow: focused ? `0 0 0 4px ${error ? 'var(--red-dim)' : 'var(--accent-dim)'}` : 'none'
  };

  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 6,
          ...labelStyle
        }}>
          {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 16,
            transition: 'color 0.2s',
            pointerEvents: 'none'
          }}>
            {icon}
          </span>
        )}
        {isTextarea
          ? <textarea
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              rows={rows || 4}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={inputStyle}
            />
          : <input
              type={type}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={inputStyle}
            />
        }
      </div>
      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 5 }}>{error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, ...hintStyle }}>{hint}</p>
      )}
    </div>
  );
}

