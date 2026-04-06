import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/Layout/PageLayout';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import InputField from '../components/Common/InputField';
import { SectionHeader, ScorePreviewCard } from '../components/Common/SharedHelpers';
import { profileService } from '../services/api';
import toast from 'react-hot-toast';
import {
  RiGithubLine, RiSearchLine, RiCodeLine,
  RiGitRepositoryLine, RiUserFollowLine,
  RiFileTextLine, RiCheckboxCircleLine, RiTimeLine
} from 'react-icons/ri';

export default function GitHubPage() {
  const [username, setUsername]   = useState('');
  const [github,   setGithub]     = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [fetching, setFetching]   = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await profileService.getScore();
      const gh = data.profile?.github || {};
      if (gh.username) {
        setUsername(gh.username);
        setGithub(gh);
      }
    } catch { toast.error('Failed to load GitHub data'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFetch = async () => {
    const normalizedUsername = normalizeGithubUsername(username);

    if (!normalizedUsername) return toast.error('Enter a GitHub username or profile URL');
    if (normalizedUsername.length > 39) {
      return toast.error('GitHub usernames must be 39 characters or fewer');
    }
    if (!isValidGithubUsername(normalizedUsername)) {
      return toast.error('Enter a valid GitHub username or profile URL');
    }

    setFetching(true);
    try {
      const { data } = await profileService.fetchGitHub({ username: normalizedUsername });
      setGithub(data.github);
      setUsername(normalizedUsername);
      await profileService.calculateScore();
      toast.success('GitHub profile fetched & score updated!');
    } catch (err) {
      const message = err.response?.data?.message || err.message || '';
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes('not found')) {
        toast.error(`GitHub user "${normalizedUsername}" not found. Check the username and try again.`);
      } else if (normalizedMessage.includes('rate limit')) {
        toast.error('GitHub API rate limit hit. Add a valid GITHUB_TOKEN in backend/.env to increase the limit.');
      } else if (normalizedMessage.includes('token')) {
        toast.error('The configured GITHUB_TOKEN is invalid. Update or remove it in backend/.env and try again.');
      } else {
        toast.error(message || 'Failed to fetch GitHub profile. Please try again.');
      }
    } finally { setFetching(false); }
  };

  if (loading) return (
    <PageLayout title="GitHub Profile">
      <div className="shimmer" style={{ height: 400, borderRadius: 14 }} />
    </PageLayout>
  );

  const score = calcGitHubScore(github);

  return (
    <PageLayout
      title="GitHub Profile"
      subtitle="Connect your GitHub to automatically fetch your repository and contribution data"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Fetch Card */}
          <Card>
            <SectionHeader icon={<RiGithubLine />} title="Connect GitHub" color="#f0f0f0" />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <InputField
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. torvalds or https://github.com/torvalds"
                  hint="You can paste a GitHub username or full profile URL"
                  icon={<RiGithubLine />}
                />
              </div>
              <Button
                icon={<RiSearchLine />}
                loading={fetching}
                onClick={handleFetch}
                style={{ alignSelf: 'flex-start', marginTop: 0 }}
              >
                Fetch
              </Button>
            </div>
          </Card>

          {/* Profile Data */}
          {github && (
            <>
              <Card>
                <SectionHeader icon={<RiGitRepositoryLine />} title="Repository Stats" color="var(--gold)" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <StatBox label="Public Repos"      value={github.publicRepos || 0}              color="var(--accent)" />
                  <StatBox label="Total Repos"       value={github.repositoriesCount || 0}        color="var(--green)" />
                  <StatBox label="Contributions/yr"  value={github.contributionsLastYear || 0}    color="var(--gold)" />
                  <StatBox label="Followers"         value={github.followers || 0}                color="var(--orange)" />
                  <StatBox label="Following"         value={github.following || 0}                color="var(--red)" />
                  <StatBox
                    label="Profile README"
                    value={github.hasReadme ? '✓ Yes' : '✗ No'}
                    color={github.hasReadme ? 'var(--green)' : 'var(--red)'}
                  />
                </div>
              </Card>

              {/* Top Languages */}
              {github.topLanguages?.length > 0 && (
                <Card>
                  <SectionHeader icon={<RiCodeLine />} title="Top Languages" color="var(--accent)" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {github.topLanguages.map(({ language, percentage }) => (
                      <div key={language}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                          fontSize: 13
                        }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{language}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {percentage}%
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3 }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
                            borderRadius: 3,
                            transition: 'width 0.8s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Profile README tip */}
              {!github.hasReadme && (
                <Card padding="16px" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(177, 7, 56, 0.18)' }}>
                  <p style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 500, marginBottom: 6 }}>
                    🚀 Quick Win — Add a Profile README
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Create a repo named <code style={{
                      background: 'var(--bg-hover)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>{username}</code> with a README.md to showcase yourself on your GitHub profile page.
                  </p>
                </Card>
              )}
            </>
          )}

          {!github && !fetching && (
            <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
              <RiGithubLine style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Enter your GitHub username above and click Fetch to load your profile data.
              </p>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
          <ScorePreviewCard
            title="GitHub Score"
            score={score}
            max={8}
            color="#f0f0f0"
            items={[
              { label: 'Profile Connected',    done: !!github?.username,                        pts: 2 },
              { label: '10+ Public Repos',     done: (github?.publicRepos || 0) >= 10,          pts: 2 },
              { label: '100+ Contributions',   done: (github?.contributionsLastYear || 0) >= 100,pts: 2 },
              { label: 'Profile README',       done: github?.hasReadme || false,                pts: 1 },
              { label: '50+ Followers',        done: (github?.followers || 0) >= 50,            pts: 1 }
            ]}
          />
          <Card padding="16px" style={{ background: 'var(--green-dim)', border: '1px solid rgba(45, 122, 96, 0.14)' }}>
            <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500, marginBottom: 6 }}>
              <RiTimeLine style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Auto-fetched Data
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your GitHub data is fetched live from the GitHub API. Click Fetch anytime to refresh it.
            </p>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

function calcGitHubScore(gh) {
  if (!gh) return 0;
  let s = 0;
  if (gh.username)                          s += 2;
  if ((gh.publicRepos || 0) >= 10)          s += 2;
  if ((gh.contributionsLastYear || 0) >= 100) s += 2;
  if (gh.hasReadme)                         s += 1;
  if ((gh.followers || 0) >= 50)            s += 1;
  return Math.min(8, s);
}

function normalizeGithubUsername(value) {
  let normalized = (value || '').trim();

  if (!normalized) return '';

  normalized = normalized.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  normalized = normalized.replace(/^(www\.)?github\.com\//i, '');
  normalized = normalized.replace(/^@/, '');
  normalized = normalized.split(/[/?#]/)[0].trim();

  return normalized;
}

function isValidGithubUsername(value) {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value);
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px'
    }}>
      <div style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        marginBottom: 6
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        color
      }}>
        {value}
      </div>
    </div>
  );
}


