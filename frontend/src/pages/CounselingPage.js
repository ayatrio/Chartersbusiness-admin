import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MAIN_APP_URL } from '../services/api';
import PageLayout from '../components/Layout/PageLayout';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import { RiCalendarCheckLine, RiTimeLine, RiInformationLine } from 'react-icons/ri';

export default function CounselingPage() {
  const { counselings, refreshCounselings, generateRedirectCode } = useAuth();

  useEffect(() => {
    refreshCounselings();
  }, [refreshCounselings]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not scheduled';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const getStatusStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'completed') return { background: 'var(--green-dim)', color: 'var(--green)' };
    if (s === 'cancelled') return { background: 'var(--red-dim)', color: 'var(--red)' };
    return { background: 'var(--accent-dim)', color: 'var(--accent)' };
  };

  const isEmpty = !counselings || counselings.length === 0;

  return (
    <PageLayout
      title="Counseling Sessions"
      subtitle="Manage your upcoming and past expert counseling sessions to guide your career path."
    >
      {isEmpty ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'var(--surface-tint)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: 'var(--text-muted)'
          }}>
            <RiCalendarCheckLine size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>No sessions found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            You haven't scheduled any counseling sessions yet. Get expert advice today!
          </p>
          <Button 
            size="lg" 
            onClick={async () => {
              const code = await generateRedirectCode();
              if (code) {
                  window.location.href = `${MAIN_APP_URL}/apply?type=counseling&code=${code}`;
              } else {
                  alert("Failed to generate redirection. Please try again.");
              }
            }}
          >
            Book a Session
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {counselings.map((session, index) => (
            <Card key={session.counselingNumber || index} padding="0">
              <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                      {session.program || 'General Counseling'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      SESSION ID: <strong style={{ color: 'var(--text-primary)' }}>#{session.counselingNumber}</strong>
                    </p>
                  </div>
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    ...getStatusStyle(session.status)
                  }}>
                    {session.status || 'Scheduled'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--surface-tint)', borderRadius: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}>
                      <RiCalendarCheckLine size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{formatDate(session.counselingDate)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--surface-tint)', borderRadius: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}>
                      <RiTimeLine size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Time</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{formatTime(session.counselingTime)}</div>
                    </div>
                  </div>
                </div>

                {session.status === 'scheduled' && (
                  <div style={{
                    marginTop: 20,
                    padding: '12px 16px',
                    background: 'var(--bg-primary)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'start',
                    gap: 10,
                    border: '1px solid var(--border)'
                  }}>
                    <RiInformationLine size={18} style={{ color: 'var(--accent)', marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      A counselor will contact you via your registered email or phone number at the scheduled time. 
                      Please ensure you are available for the 30-minute duration.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
