import React from 'react';
import { Link } from 'react-router-dom';
import { RiMailLine, RiPhoneLine, RiTimeLine, RiMapPinUserLine } from 'react-icons/ri';
import Card from '../Common/Card';

const COUNSELLORS = [
  {
    id: 1,
    name: "Alex Thompson",
    role: "Senior Admissions Counsellor",
    email: "alex.t@chartersbusiness.com",
    phone: "+1 234 567 8900",
    availability: "Mon - Fri, 9AM - 6PM",
    specialization: ["MBA", "Business Analytics"],
    languages: ["English", "Spanish"]
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "International Student Advisor",
    email: "s.chen@chartersbusiness.com",
    phone: "+1 234 567 8901",
    availability: "Mon - Fri, 10AM - 7PM",
    specialization: ["Undergraduate", "Visa Support"],
    languages: ["English", "Mandarin"]
  },
  {
    id: 3,
    name: "Michael Roberts",
    role: "Postgraduate Program Specialist",
    email: "m.roberts@chartersbusiness.com",
    phone: "+1 234 567 8902",
    availability: "Mon - Fri, 8AM - 5PM",
    specialization: ["Executive Education", "Doctoral Programs"],
    languages: ["English", "French"]
  }
];

export default function CounsellorContact() {
  return (
    <div style={{ width: '100%', padding: '48px 0', background: '#fff' }}>
      <header style={{ marginBottom: 40, padding: '0 5%' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Expert Guidance Just a Click Away
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
          Our certified admissions counsellors are dedicated to helping you find the perfect program.
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 0,
        border: '1px solid var(--border)',
        borderRight: 'none',
        margin: '0 5%'
      }}>
        {/* ... existing card mapping ... */}
        {COUNSELLORS.map((counsellor) => (
          <Card 
            key={counsellor.id} 
            padding="0" 
            style={{ 
                borderRadius: 0, 
                border: 'none', 
                borderRight: '1px solid var(--border)',
                boxShadow: 'none',
                background: '#fff'
            }}
          >
            <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  background: 'var(--surface-tint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <RiMapPinUserLine size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {counsellor.name}
                  </h3>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginTop: 4 }}>
                    {counsellor.role}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ContactItem icon={RiMailLine} label="Email" value={counsellor.email} href={`mailto:${counsellor.email}`} />
              <ContactItem icon={RiPhoneLine} label="Phone" value={counsellor.phone} href={`tel:${counsellor.phone.replace(/\s/g, '')}`} />
              <ContactItem icon={RiTimeLine} label="Availability" value={counsellor.availability} />

              <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                <a
                  href={`mailto:${counsellor.email}?subject=Application Inquiry`}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: 12,
                    background: 'var(--accent)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(177, 7, 56, 0.15)',
                    transition: 'transform 0.2s'
                  }}
                >
                  Send Email
                </a>
                <a
                  href={`tel:${counsellor.phone.replace(/\s/g, '')}`}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    transition: 'background 0.2s'
                  }}
                >
                  Call Now
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <footer style={{
        marginTop: 48,
        padding: 32,
        borderRadius: 0,
        background: 'var(--surface-tint)',
        textAlign: 'center',
        border: '1px solid var(--border)',
        margin: '0 40px'
      }}>
        <p style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
          General Enquiries & Support
        </p>
        <a 
          href="mailto:support@chartersbusiness.com" 
          style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', textDecoration: 'none' }}
        >
          support@chartersbusiness.com
        </a>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          Our team usually responds within 24 hours during business days.
        </p>
      </footer>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value, href }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon size={18} style={{ color: 'var(--text-muted)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: href ? 'var(--accent)' : 'var(--text-primary)' }}>
          {value}
        </div>
      </div>
    </div>
  );

  return href ? (
    <a href={href} style={{ textDecoration: 'none' }}>{content}</a>
  ) : content;
}