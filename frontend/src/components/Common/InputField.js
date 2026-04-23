import React, { useState } from 'react';

export default function InputField({
  label, type = 'text', value, onChange,
  placeholder, required, error, hint,
  icon, rows, style = {}, labelStyle = {}, hintStyle = {}, tone = 'default'
}) {
  const [focused, setFocused] = useState(false);
  const isTextarea = type === 'textarea';
  const wrapperClassName = tone === 'inverse' ? 'input-field input-field--inverse' : 'input-field';
  const controlClassName = [
    'input-field__control',
    icon && 'input-field__control--with-icon',
    isTextarea && 'is-textarea',
    focused && 'is-focused',
    error && 'is-error'
  ].filter(Boolean).join(' ');
  const iconClassName = focused ? 'input-field__icon is-focused' : 'input-field__icon';

  return (
    <div className={wrapperClassName} style={style}>
      {label && (
        <label className="input-field__label" style={labelStyle}>
          {label} {required && <span className="input-field__required">*</span>}
        </label>
      )}
      <div className="input-field__control-wrap">
        {icon && (
          <span className={iconClassName}>
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
              className={controlClassName}
            />
          : <input
              type={type}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={controlClassName}
            />
        }
      </div>
      {error && (
        <p className="input-field__error">{error}</p>
      )}
      {hint && !error && (
        <p className="input-field__hint" style={hintStyle}>{hint}</p>
      )}
    </div>
  );
}

