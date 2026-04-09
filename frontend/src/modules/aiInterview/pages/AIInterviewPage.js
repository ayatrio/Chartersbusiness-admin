import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  RiCheckboxCircleLine,
  RiLock2Line,
  RiPlayCircleLine,
  RiRestartLine,
  RiRobotLine,
  RiTimerLine,
} from 'react-icons/ri';
import { useAuth } from '../../../context/AuthContext';
import PageLayout from '../../../components/Layout/PageLayout';
import Card from '../../../components/Common/Card';
import Button from '../../../components/Common/Button';
import InterviewRoom from '../components/InterviewRoom';
import ScoreReport from '../components/ScoreReport';

const createSessionId = (user) => {
  const prefix = String(user?.firstName || 'session')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 10) || 'session';

  const suffix = Date.now().toString(36);
  return `${prefix}-${suffix}`;
};

const formatDuration = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function AIInterviewPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [phase, setPhase] = useState('lobby');
  const [scores, setScores] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [interviewId, setInterviewId] = useState(() => id || createSessionId(user));

  const hasInterviewAccess = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    if (role === 'admin' || role === 'recruiter') {
      return true;
    }

    const permissions = user?.permissions?.aiInterview || {};
    return Object.values(permissions).some(Boolean);
  }, [user]);

  useEffect(() => {
    if (id) {
      setInterviewId(String(id));
    }
  }, [id]);

  useEffect(() => {
    if (phase !== 'interview') {
      return undefined;
    }

    const timer = setInterval(() => {
      setDurationSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const resetSession = () => {
    setScores(null);
    setDurationSeconds(0);
    setInterviewId(createSessionId(user));
    setPhase('lobby');
  };

  const startInterview = () => {
    if (!hasInterviewAccess) {
      return;
    }

    setScores(null);
    setDurationSeconds(0);
    setPhase('interview');
  };

  const pageActions = phase === 'interview'
    ? (
      <Button
        variant="secondary"
        size="sm"
        icon={<RiRestartLine style={{ fontSize: 15 }} />}
        onClick={resetSession}
      >
        Reset Session
      </Button>
    )
    : null;

  return (
    <PageLayout
      title="AI Interview"
      subtitle="Practice role-based interviews, monitor live communication signals, and get a final score report."
      actions={pageActions}
    >
      {phase === 'lobby' && (
        <LobbyCard
          interviewId={interviewId}
          hasInterviewAccess={hasInterviewAccess}
          onStart={startInterview}
        />
      )}

      {phase === 'interview' && (
        <InterviewRoom
          interviewId={interviewId}
          durationLabel={formatDuration(durationSeconds)}
          onEnd={(finalScores) => {
            setScores(finalScores);
            setPhase('results');
          }}
          onCancel={resetSession}
        />
      )}

      {phase === 'results' && scores && (
        <ScoreReport
          scores={scores}
          duration={formatDuration(durationSeconds)}
          onRestart={resetSession}
        />
      )}
    </PageLayout>
  );
}

function LobbyCard({ interviewId, hasInterviewAccess, onStart }) {
  return (
    <Card hover={false} style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <span style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          fontSize: 28,
        }}>
          <RiRobotLine />
        </span>

        <div>
          <p style={{
            margin: '0 0 5px',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: 'var(--accent)',
            fontWeight: 700,
          }}>
            Session Setup
          </p>
          <h3 style={{
            margin: '0 0 3px',
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}>
            Mock Interview Lobby
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Session ID: <strong>{interviewId}</strong>
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        marginBottom: 18,
      }}>
        <InfoBlock
          icon={<RiCheckboxCircleLine />}
          title="Before you begin"
          points={[
            'Allow camera and microphone access.',
            'Use a quiet environment if possible.',
            'Keep one tab active for best performance.',
          ]}
        />
        <InfoBlock
          icon={<RiTimerLine />}
          title="Scoring dimensions"
          points={[
            'Language quality and clarity',
            'Body language and eye-contact signals',
            'Voice confidence and pacing',
          ]}
        />
      </div>

      {!hasInterviewAccess && (
        <div style={{
          marginBottom: 14,
          border: '1px solid rgba(197, 42, 86, 0.24)',
          background: 'var(--red-dim)',
          borderRadius: 12,
          color: 'var(--red)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
        }}>
          <RiLock2Line style={{ flexShrink: 0 }} />
          <span>AI Interview access is currently locked for this account.</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          icon={<RiPlayCircleLine style={{ fontSize: 18 }} />}
          onClick={onStart}
          disabled={!hasInterviewAccess}
        >
          Begin Interview
        </Button>
      </div>
    </Card>
  );
}

function InfoBlock({ icon, title, points }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 14,
      background: 'var(--surface-tint)',
      padding: '14px 14px',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--text-primary)',
        fontWeight: 700,
        marginBottom: 8,
      }}>
        <span style={{ color: 'var(--accent)', fontSize: 17 }}>{icon}</span>
        <span>{title}</span>
      </div>

      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        {points.map((point) => <li key={point}>{point}</li>)}
      </ul>
    </div>
  );
}
