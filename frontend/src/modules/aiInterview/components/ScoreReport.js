import React from 'react';
import { RiDownload2Line, RiRefreshLine } from 'react-icons/ri';
import Card from '../../../components/Common/Card';
import Button from '../../../components/Common/Button';
import ScoreRing from '../../../components/Common/ScoreRing';
import { getPerformanceBand } from '../utils/scoring';

const gradeMeta = (score) => {
  if (score >= 85) return { label: 'Excellent', color: 'var(--green)' };
  if (score >= 70) return { label: 'Strong', color: 'var(--navy)' };
  if (score >= 55) return { label: 'Growing', color: 'var(--orange)' };
  return { label: 'Needs Work', color: 'var(--red)' };
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export default function ScoreReport({ scores, duration, onRestart }) {
  const overall = clampScore(scores?.overall);
  const grade = gradeMeta(overall);
  const transcript = Array.isArray(scores?.transcript) ? scores.transcript : [];
  const languageSnapshots = Array.isArray(scores?.languageSnapshots) ? scores.languageSnapshots : [];

  const fillers = languageSnapshots.reduce(
    (sum, entry) => sum + Math.max(0, Math.round(Number(entry?.fillers || 0))),
    0
  );
  const answerCount = transcript.filter((entry) => entry?.speaker === 'user').length;

  const metrics = [
    {
      key: 'language',
      label: 'Language & grammar',
      value: clampScore(scores?.language),
      weight: '35%',
      color: 'var(--accent)',
      tips: [
        'Use STAR-style structure for behavioral responses.',
        'Cut filler words and keep sentences concise.',
        'Support answers with one measurable outcome.',
      ],
    },
    {
      key: 'body',
      label: 'Body language',
      value: clampScore(scores?.body),
      weight: '30%',
      color: 'var(--navy)',
      tips: [
        'Keep natural eye contact with the camera.',
        'Use a stable posture and avoid restless movement.',
        'Pause briefly before complex responses.',
      ],
    },
    {
      key: 'voice',
      label: 'Voice tone',
      value: clampScore(scores?.voice),
      weight: '20%',
      color: 'var(--green)',
      tips: [
        'Maintain an even pace and clear articulation.',
        'Avoid speaking too softly in long answers.',
        'Vary emphasis on important points.',
      ],
    },
    {
      key: 'technical',
      label: 'Technical depth',
      value: clampScore(scores?.technical),
      weight: '15%',
      color: 'var(--gold)',
      tips: [
        'Explain how and why, not just what you did.',
        'Highlight constraints and trade-offs.',
        'Mention real tools and decision criteria.',
      ],
    },
  ];

  return (
    <div>
      <Card hover={false} style={{ marginBottom: 14 }}>
        <div className="ai-report-header">
          <div>
            <p className="ai-report-eyebrow">Interview Complete</p>
            <h3 className="ai-report-title">Performance Summary</h3>
            <p className="ai-report-subtitle">
              Duration: {duration} - {answerCount} answers - Filler words: {fillers}
            </p>
          </div>
          <div className="ai-report-actions">
            <Button
              size="sm"
              variant="secondary"
              icon={<RiDownload2Line style={{ fontSize: 15 }} />}
              onClick={() => window.print()}
            >
              Export
            </Button>
            {onRestart && (
              <Button
                size="sm"
                icon={<RiRefreshLine style={{ fontSize: 15 }} />}
                onClick={onRestart}
              >
                New Session
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="ai-report-overview">
        <Card hover={false} style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={overall} level={getPerformanceBand(overall)} size={180} />

          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Overall Assessment
            </p>
            <h4 style={{ fontSize: 30, marginBottom: 8, color: grade.color }}>
              {grade.label}
            </h4>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {overall >= 75
                ? 'Strong interview performance with clear communication and solid confidence indicators.'
                : overall >= 55
                  ? 'You have a good base. Improving structure and delivery can raise your outcomes quickly.'
                  : 'Foundational performance today. Focus on clarity, pacing, and examples for your next attempt.'}
            </p>

            <div className="ai-report-stat-row">
              <Stat label="Language" value={`${clampScore(scores?.language)}/100`} />
              <Stat label="Body" value={`${clampScore(scores?.body)}/100`} />
              <Stat label="Voice" value={`${clampScore(scores?.voice)}/100`} />
              <Stat label="Technical" value={`${clampScore(scores?.technical)}/100`} />
            </div>
          </div>
        </Card>
      </div>

      <div className="ai-report-metrics">
        {metrics.map((metric) => {
          const band = gradeMeta(metric.value);

          return (
            <Card key={metric.key} hover={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{metric.label}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Weight: {metric.weight}</p>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: metric.color }}>{metric.value}</p>
              </div>

              <div style={{
                height: 6,
                borderRadius: 999,
                background: 'var(--bg-hover)',
                overflow: 'hidden',
                marginBottom: 8,
              }}>
                <div style={{
                  width: `${metric.value}%`,
                  height: '100%',
                  background: metric.color,
                }} />
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, color: band.color, marginBottom: 8 }}>
                {band.label}
              </p>

              <ul style={{
                margin: 0,
                paddingLeft: 18,
                color: 'var(--text-secondary)',
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {metric.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card hover={false} style={{ marginTop: 16 }}>
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
          Interview Transcript
        </h4>

        <div className="ai-report-transcript">
          {transcript.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No transcript captured in this session.</p>
          )}

          {transcript.map((entry, index) => (
            <div key={`${entry?.speaker || 'unknown'}-${index}`} className="ai-report-transcript-item">
              <span className={`ai-report-transcript-label ${entry?.speaker === 'user' ? 'is-user' : 'is-ai'}`}>
                {entry?.speaker === 'user' ? 'You' : 'Interviewer'}
              </span>
              <p className="ai-report-transcript-text">{entry?.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <style>{`
        .ai-report-header {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .ai-report-eyebrow {
          margin: 0 0 4px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: var(--accent);
          font-weight: 700;
        }
        .ai-report-title {
          margin: 0 0 4px;
          font-size: 29px;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-weight: 800;
        }
        .ai-report-subtitle {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .ai-report-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ai-report-overview {
          margin-bottom: 16px;
        }
        .ai-report-stat-row {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
        }
        .ai-report-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }
        .ai-report-transcript {
          border: 1px solid var(--border);
          border-radius: 12px;
          max-height: 360px;
          overflow-y: auto;
          padding: 12px;
          background: var(--surface-tint);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ai-report-transcript-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ai-report-transcript-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .ai-report-transcript-label.is-user {
          color: var(--green);
        }
        .ai-report-transcript-label.is-ai {
          color: var(--accent);
        }
        .ai-report-transcript-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-primary);
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 9px 10px;
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '10px 11px',
      background: 'var(--surface-tint)',
    }}>
      <p style={{
        margin: '0 0 4px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}
