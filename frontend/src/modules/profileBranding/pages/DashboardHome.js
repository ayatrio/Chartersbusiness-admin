import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiArrowRightUpLine,
  RiArrowRightLine,
  RiAwardLine,
  RiGlobalLine,
  RiGithubLine,
  RiLinkedinBoxLine,
  RiLock2Line,
  RiMagicLine,
  RiMedalLine,
  RiRobotLine,
  RiRocket2Line,
  RiSparklingLine,
  RiTeamLine,
  RiTimeLine,
  RiYoutubeLine,
  RiRefreshLine,
  RiCheckboxCircleLine
} from 'react-icons/ri';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../../../services/api';
import PageLayout from '../../../components/Layout/PageLayout';
import Card from '../../../components/Common/Card';
import ScoreRing from '../../../components/Common/ScoreRing';
import Button from '../../../components/Common/Button';
import {
  hasProfileBrandingAccess,
  normalizeProfileBrandingPermissions,
} from '../../../utils/permissions';

const readBoolean = (value) => Boolean(value);
const readNumber = (value) => (Number.isFinite(value) ? value : 0);

function formatLastCalculated(value) {
  if (!value) return 'Not calculated yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not calculated yet';
  return date.toLocaleString();
}

const CATEGORY_COLORS = {
  'Personal Presence': 'var(--accent)',
  'Professional Profile': 'var(--navy)',
  'Networking': 'var(--gold)',
  'Credentials': 'var(--orange)',
  'Thought Leadership': 'var(--green)'
};

const CATEGORY_ROUTES = {
  'Personal Presence': '/website',
  'Professional Profile': '/linkedin',
  'Networking': '/networking',
  'Credentials': '/credentials',
  'Thought Leadership': '/youtube'
};

const TOOL_ROUTES = {
  Website: '/website',
  LinkedIn: '/linkedin',
  GitHub: '/github'
};

const BREAKDOWN_ITEMS = [
  { label: 'Personal Presence', key: 'personalPresence', max: 25, color: 'var(--accent)' },
  { label: 'Professional Profiles', key: 'professionalProfiles', max: 25, color: 'var(--navy)' },
  { label: 'Networking', key: 'networking', max: 20, color: 'var(--gold)' },
  { label: 'Credentials', key: 'credentials', max: 20, color: 'var(--orange)' },
  { label: 'Thought Leadership', key: 'thoughtLeadership', max: 10, color: 'var(--green)' }
];

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const profilePermissions = normalizeProfileBrandingPermissions(
    user?.permissions?.profileBranding || {}
  );
  const aiPermissions = user?.permissions?.aiInterview || {};
  const isAdminUser = ['admin', 'recruiter'].includes(String(user?.role || '').toLowerCase());
  const profilePermissionCount = Object.values(profilePermissions).filter(readBoolean).length;
  const aiPermissionCount = Object.values(aiPermissions).filter(readBoolean).length;
  const totalPermissionCount = Object.keys(profilePermissions).length + Object.keys(aiPermissions).length;
  const unlockedPermissionCount = profilePermissionCount + aiPermissionCount;

  const hasAIAccess = isAdminUser || Object.values(aiPermissions).some(readBoolean);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await profileService.getScore();
      setProfile(data?.profile || null);
    } catch {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRecalculate = async () => {
    setRefreshing(true);
    try {
      await profileService.calculateScore();
      await loadProfile();
      toast.success('Score recalculated successfully!');
    } catch {
      toast.error('Failed to recalculate score');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCompleteSuggestion = async (id) => {
    try {
      await profileService.completeSuggestion(id);
      await loadProfile();
      toast.success('Marked as complete!');
    } catch {
      toast.error('Failed to update suggestion');
    }
  };

  const scores = profile?.scores || {};
  const history = profile?.scoreHistory || [];
  const suggestions = (profile?.suggestions || []).filter((item) => !item.completed);
  const completed = (profile?.suggestions || []).filter((item) => item.completed);

  const workspaceCards = useMemo(() => ([
    {
      id: 'linkedin',
      title: 'LinkedIn Studio',
      subtitle: 'Headline and profile depth',
      description: 'Strengthen discoverability and profile structure with guided checks.',
      to: '/linkedin',
      icon: RiLinkedinBoxLine,
      enabled: hasProfileBrandingAccess(profilePermissions, 'linkedin')
    },
    {
      id: 'github',
      title: 'GitHub Signals',
      subtitle: 'Portfolio quality and relevance',
      description: 'Review repo quality, profile signals, and brand-fit technical visibility.',
      to: '/github',
      icon: RiGithubLine,
      enabled: hasProfileBrandingAccess(profilePermissions, 'github')
    },
    {
      id: 'website',
      title: 'Website Verifier',
      subtitle: 'Professional web presence',
      description: 'Validate structure, essentials, and impact cues on your personal site.',
      to: '/website',
      icon: RiGlobalLine,
      enabled: hasProfileBrandingAccess(profilePermissions, 'website')
    },
    {
      id: 'networking',
      title: 'Networking',
      subtitle: 'Audience and engagement health',
      description: 'Measure consistency and social proof signals across your professional reach.',
      to: '/networking',
      icon: RiTeamLine,
      enabled: hasProfileBrandingAccess(profilePermissions, 'socialMedia')
    },
    {
      id: 'youtube',
      title: 'YouTube Presence',
      subtitle: 'Thought leadership footprint',
      description: 'Analyze educational content signal and how it boosts your brand authority.',
      to: '/youtube',
      icon: RiYoutubeLine,
      enabled: hasProfileBrandingAccess(profilePermissions, 'youtube')
    },
    {
      id: 'credentials',
      title: 'Credential Vault',
      subtitle: 'Courses and certifications',
      description: 'Organize proof of skill development and keep your profile credibility fresh.',
      to: '/credentials',
      icon: RiAwardLine,
      enabled: hasProfileBrandingAccess(profilePermissions, 'credentials')
    },
    {
      id: 'ai-tools',
      title: 'AI Tools',
      subtitle: 'Generation and optimization helpers',
      description: 'Use AI to tighten messaging and profile narrative quality faster.',
      to: '/ai-tools',
      icon: RiMagicLine,
      enabled: hasProfileBrandingAccess(profilePermissions, 'linkedin')
    },
    {
      id: 'ai-interview',
      title: 'AI Interview',
      subtitle: 'Mock interview and feedback',
      description: 'Practice live interview rounds and review language, voice, and body-language insights.',
      to: '/ai-interview',
      icon: RiRobotLine,
      enabled: hasAIAccess
    }
  ]), [hasAIAccess, profilePermissions]);

  const disabledWorkspaceCount = workspaceCards.filter((card) => !card.enabled).length;

  const radarData = [
    { subject: 'Personal', value: scores.personalPresence || 0 },
    { subject: 'Profiles', value: scores.professionalProfiles || 0 },
    { subject: 'Networking', value: scores.networking || 0 },
    { subject: 'Credentials', value: scores.credentials || 0 },
    { subject: 'Leadership', value: scores.thoughtLeadership || 0 }
  ];

  const historyData = history.slice(-14).map((item) => ({
    date: format(new Date(item.date), 'MMM d'),
    score: item.total
  }));

  if (loading) return <DashboardSkeleton />;

  return (
    <PageLayout
      title="Enrolled Student Dashboard"
      subtitle={`Welcome back, ${user?.firstName || 'Candidate'}. Track your progress, manage your profile strength, and complete actions to optimize your career branding.`}
      actions={(
        <Button
          variant="secondary"
          icon={<RiRefreshLine style={{ fontSize: 16 }} />}
          loading={refreshing}
          onClick={handleRecalculate}
        >
          Re-score Profile
        </Button>
      )}
    >
      {/* 1. Header Hero Panel */}
      <section className="fade-up" style={heroStyle}>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <p style={eyebrowStyle}>Account Status</p>
          <h2 style={heroTitleStyle}>
            Welcome Back, {user?.firstName}!
          </h2>
          <p style={heroTextStyle}>
            Your account is connected to <strong>{user?.selectedCourse || 'your course track'}</strong>.
            Work through the unlocked tools to raise your profile quality and visibility.
          </p>

          <div style={chipRowStyle}>
            <span style={infoChipStyle}>
              <RiRocket2Line />
              {unlockedPermissionCount}/{totalPermissionCount || 0} features unlocked
            </span>
            <span style={infoChipStyle}>
              <RiLock2Line />
              {disabledWorkspaceCount} workspace{disabledWorkspaceCount === 1 ? '' : 's'} locked
            </span>
            <span style={infoChipStyle}>
              <RiTimeLine />
              Last score update: {formatLastCalculated(scores.lastCalculated)}
            </span>
          </div>
        </div>

        <div style={{ flex: '0 1 230px', display: 'flex', justifyContent: 'center' }}>
          <ScoreRing
            score={readNumber(scores.total)}
            level={scores.level || 'Beginner'}
            size={180}
          />
        </div>
      </section>

      {/* 2. Unified Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Workspace Launcher & Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Workspace Hub */}
          <section className="fade-up" style={{ animationDelay: '0.06s' }}>
            <div style={sectionHeaderStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Workspace Hub</p>
                <h3 style={sectionTitleStyle}>Choose a tool and keep moving</h3>
              </div>
            </div>

            <div style={workspaceGridStyle}>
              {workspaceCards.map((card) => (
                <WorkspaceCard
                  key={card.id}
                  card={card}
                  onOpen={(target) => {
                    if (!card.enabled) {
                      toast.error('Access not granted by admin');
                      return;
                    }
                    navigate(target);
                  }}
                />
              ))}
            </div>
          </section>

          {/* Improvement Suggestions */}
          <Card>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>
                  Improvement Suggestions
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {suggestions.length} pending / {completed.length} completed
                </p>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 0',
                color: 'var(--text-muted)'
              }}>
                <RiCheckboxCircleLine style={{ fontSize: 40, color: 'var(--green)', display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 14 }}>All suggestions completed - great work!</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  Re-score your profile to get fresh suggestions.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion._id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '14px 16px',
                      background: 'var(--surface-tint)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${
                        suggestion.priority === 'high'
                          ? 'var(--accent)'
                          : suggestion.priority === 'medium'
                            ? 'var(--gold)'
                            : 'var(--text-muted)'
                      }`,
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4
                      }}>
                        <span style={{
                          fontSize: 10,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: 'var(--bg-hover)',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {suggestion.tool || 'Profile'}
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: CATEGORY_COLORS[suggestion.category] || 'var(--accent)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {suggestion.category}
                        </span>
                        <span style={{
                          fontSize: 10,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background:
                            suggestion.priority === 'high'
                              ? 'var(--accent-dim)'
                              : suggestion.priority === 'medium'
                                ? 'var(--gold-dim)'
                                : 'var(--bg-hover)',
                          color:
                            suggestion.priority === 'high'
                              ? 'var(--accent)'
                              : suggestion.priority === 'medium'
                                ? 'var(--gold)'
                                : 'var(--text-muted)',
                          textTransform: 'capitalize'
                        }}>
                          {suggestion.priority}
                        </span>
                      </div>

                      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                        {suggestion.text}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Impact: {suggestion.impact}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Expected score impact: +{suggestion.expectedScoreImpact || 0}
                      </p>
                      {suggestion.exampleRewrite ? (
                        <div style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: 'var(--bg-secondary)',
                          border: '1px dashed var(--border)'
                        }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                            Example rewrite
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {suggestion.exampleRewrite}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<RiArrowRightLine />}
                        onClick={() => navigate(TOOL_ROUTES[suggestion.tool] || CATEGORY_ROUTES[suggestion.category] || '/home')}
                      >
                        Fix
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        icon={<RiCheckboxCircleLine />}
                        onClick={() => handleCompleteSuggestion(suggestion._id)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* RIGHT COLUMN: Performance Metrics, Breakdowns, and Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Performance Summary Metrics */}
          <section className="fade-up" style={{ animationDelay: '0.12s' }}>
            <div style={metricsGridStyle}>
              <MetricCard
                icon={<RiMedalLine />}
                label="Current Level"
                value={scores.level || 'Beginner'}
                color="var(--accent)"
              />
              <MetricCard
                icon={<RiSparklingLine />}
                label="Total Score"
                value={`${readNumber(scores.total)}/100`}
                color="var(--navy)"
              />
              <MetricCard
                icon={<RiRocket2Line />}
                label="Percentile"
                value={`${readNumber(scores.percentile)}%`}
                color="var(--gold)"
              />
              <MetricCard
                icon={<RiRobotLine />}
                label="AI Interview Access"
                value={hasAIAccess ? (isAdminUser ? 'Admin access' : `${aiPermissionCount} enabled`) : 'Locked'}
                color={hasAIAccess ? 'var(--green)' : 'var(--text-muted)'}
              />
            </div>
          </section>

          {/* Category Score Breakdown */}
          <Card>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 20,
              color: 'var(--text-primary)'
            }}>
              Score Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {BREAKDOWN_ITEMS.map(({ label, key, max, color }) => {
                const value = scores[key] || 0;
                const percent = Math.round((value / max) * 100);

                return (
                  <div key={key}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      fontSize: 13
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ color, fontWeight: 700 }}>
                        {value} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {max}</span>
                      </span>
                    </div>
                    <div style={{
                      height: 6,
                      background: 'var(--bg-hover)',
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: color,
                        borderRadius: 3,
                        opacity: 0.9
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Skill Radar */}
          <Card>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 20
            }}>
              Skill Radar
            </h3>

            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Score History */}
          <Card>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 20
            }}>
              Score History
            </h3>

            {historyData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 13
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#scoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: 8
              }}>
                <RiTimeLine style={{ fontSize: 32 }} />
                <p style={{ fontSize: 13 }}>Score history will appear after multiple calculations.</p>
              </div>
            )}
          </Card>

        </div>

      </div>
    </PageLayout>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <Card hover={false} padding="14px 16px" style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span style={{ color, fontSize: 18 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>
        {value}
      </p>
    </Card>
  );
}

function WorkspaceCard({ card, onOpen }) {
  const Icon = card.icon;
  const locked = !card.enabled;

  return (
    <button
      type="button"
      onClick={() => onOpen(card.to)}
      style={{
        textAlign: 'left',
        border: '1px solid var(--border)',
        borderRadius: 16,
        background: locked
          ? 'linear-gradient(160deg, #faf8f5, #f4efe8)'
          : 'linear-gradient(150deg, #ffffff, #fbf8f4)',
        padding: '16px',
        cursor: 'pointer',
        position: 'relative',
        minHeight: 160,
        transition: 'all 0.2s ease',
        opacity: locked ? 0.75 : 1
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-2px)';
        event.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'none';
        event.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: locked ? '#ece6df' : 'var(--accent-dim)',
          color: locked ? 'var(--text-muted)' : 'var(--accent)',
          fontSize: 20
        }}>
          <Icon />
        </span>

        {locked ? (
          <span style={lockedBadgeStyle}>
            <RiLock2Line style={{ marginRight: 5, verticalAlign: 'text-bottom' }} />
            Locked
          </span>
        ) : (
          <span style={openBadgeStyle}>
            Open
            <RiArrowRightUpLine style={{ marginLeft: 5, verticalAlign: 'text-bottom' }} />
          </span>
        )}
      </div>

      <h4 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>
        {card.title}
      </h4>
      <p style={{ fontSize: 12, color: 'var(--navy-soft)', marginBottom: 6 }}>
        {card.subtitle}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {card.description}
      </p>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <PageLayout title="Enrolled Student Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="shimmer" style={{ height: 400, borderRadius: 'var(--radius)', width: '100%' }} />
        <div className="shimmer" style={{ height: 400, borderRadius: 'var(--radius)', width: '100%' }} />
      </div>
    </PageLayout>
  );
}

const heroStyle = {
  border: '1px solid var(--border)',
  borderRadius: 24,
  padding: '24px',
  marginBottom: 20,
  background: 'linear-gradient(140deg, #ffffff 0%, #fbf8f4 56%, #f4ede5 100%)',
  boxShadow: 'var(--shadow-md)',
  display: 'flex',
  gap: 20,
  flexWrap: 'wrap',
  alignItems: 'center'
};

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  marginBottom: 9
};

const heroTitleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(24px, 3vw, 32px)',
  lineHeight: 1.1,
  marginBottom: 10
};

const heroTextStyle = {
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  fontSize: 14,
  maxWidth: 760
};

const chipRowStyle = {
  marginTop: 16,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const infoChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 11,
  color: 'var(--navy-soft)',
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid var(--border)'
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 10
};

const sectionHeaderStyle = {
  marginBottom: 12,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 10,
  flexWrap: 'wrap'
};

const sectionEyebrowStyle = {
  fontSize: 12,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  marginBottom: 4
};

const sectionTitleStyle = {
  fontSize: 20,
  fontWeight: 800,
  color: 'var(--text-primary)'
};

const workspaceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const lockedBadgeStyle = {
  fontSize: 10,
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '3px 8px',
  background: '#fff'
};

const openBadgeStyle = {
  fontSize: 10,
  color: 'var(--green)',
  border: '1px solid var(--green-dim)',
  borderRadius: 999,
  padding: '3px 8px',
  background: '#f7fffb'
};
