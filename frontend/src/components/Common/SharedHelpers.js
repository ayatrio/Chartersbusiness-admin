import React from 'react';
import { RiCheckLine, RiCloseLine } from 'react-icons/ri';

// ─── Section Header ───────────────────────────────────────────────
export function SectionHeader({ icon, title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <span style={{
        fontSize: 20,
        color: color || 'var(--accent)',
        display: 'flex',
        alignItems: 'center'
      }}>
        {icon}
      </span>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--text-primary)'
      }}>
        {title}
      </h3>
    </div>
  );
}

// ─── Score Preview Card ───────────────────────────────────────────
export function ScorePreviewCard({ title, score, max, color, items }) {
  const pct = Math.round((score / max) * 100);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 20
    }}>
      <h4 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        marginBottom: 14
      }}>
        {title}
      </h4>

      {/* Score number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontWeight: 800,
          color
        }}>
          {score}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>/ {max}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 20 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.8s ease'
        }} />
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(({ label, done, pts }, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 18, height: 18,
                borderRadius: '50%',
                background: done ? 'var(--green-dim)' : 'var(--bg-hover)',
                border: `1px solid ${done ? 'rgba(45, 122, 96, 0.24)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {done
                  ? <RiCheckLine style={{ fontSize: 10, color: 'var(--green)' }} />
                  : <RiCloseLine style={{ fontSize: 10, color: 'var(--text-muted)' }} />
                }
              </span>
              <span style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {label}
              </span>
            </div>
            <span style={{
              fontSize: 11,
              color: done ? color : 'var(--text-muted)',
              fontWeight: done ? 600 : 400
            }}>
              +{pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────
export function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24,
        borderRadius: 12,
        background: value ? 'var(--accent)' : 'var(--bg-hover)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
        flexShrink: 0
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: value ? 22 : 2,
        width: 18, height: 18,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
      }} />
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
export function EmptyState({ icon, text }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', textAlign: 'center',
      color: 'var(--text-muted)'
    }}>
      <span style={{ fontSize: 40, marginBottom: 12, display: 'block' }}>{icon}</span>
      <p style={{ fontSize: 14, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

