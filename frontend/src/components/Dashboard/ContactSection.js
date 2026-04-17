import React from 'react';
import CounsellorContact from '../Layout/CounsellorContact';

const ContactSection = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Main Contact Section */}
      <section>
        <CounsellorContact />
      </section>

      {/* Informational Banner */}
      <div style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, var(--navy) 0%, #1e293b 100%)',
          borderRadius: 20,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: 'var(--shadow-lg)'
      }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Helpful Tip</h3>
          <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
              Before contacting us, make sure to check your <strong>Application Status</strong> for real-time updates on your submissions.
              Many common questions are answered directly in the tracking dashboard below.
          </p>
      </div>
    </div>
  );
};

export default ContactSection;
