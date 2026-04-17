import React from 'react';

const LoadingSpinner = ({ fullPage = false }) => {
  const spinner = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: fullPage ? 0 : '40px',
      height: fullPage ? '100vh' : 'auto',
      background: fullPage ? 'var(--bg-primary)' : 'transparent'
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '3px solid rgba(179, 4, 55, 0.1)',
        borderTopColor: 'var(--accent, #B30437)',
        animation: 'spinner-rotate 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spinner-rotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return spinner;
};

export default LoadingSpinner;
