import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/Layout/PageLayout';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import InputField from '../components/Common/InputField';
import { SectionHeader, ScorePreviewCard } from '../components/Common/SharedHelpers';
import { profileService } from '../services/api';
import toast from 'react-hot-toast';
import {
  RiGlobalLine, RiSearchLine, RiFileTextLine,
  RiBriefcaseLine, RiNewspaperLine, RiMailLine,
  RiCheckLine, RiCloseLine
} from 'react-icons/ri';

const PAGE_CHECKS = [
  { key: 'hasAboutPage',    label: 'About Page',    icon: <RiFileTextLine />,    pts: 3, desc: 'A page about you, your story, and background' },
  { key: 'hasPortfolio',    label: 'Portfolio',      icon: <RiBriefcaseLine />,   pts: 5, desc: 'Projects, case studies, or work samples' },
  { key: 'hasBlog',         label: 'Blog / Articles',icon: <RiNewspaperLine />,   pts: 4, desc: 'Published articles or blog posts' },
  { key: 'hasContactPage',  label: 'Contact Page',   icon: <RiMailLine />,        pts: 2, desc: 'A way for people to reach you' }
];

export default function WebsitePage() {
  const [url,        setUrl]        = useState('');
  const [website,    setWebsite]    = useState(null);
  const [verifying,  setVerifying]  = useState(false);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await profileService.getScore();
      const w = data.profile?.personalWebsite || {};
      if (w.url) {
        setUrl(w.url);
        setWebsite(w);
      }
    } catch { toast.error('Failed to load website data'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async () => {
    if (!url.trim()) return toast.error('Enter your website URL');
    setVerifying(true);
    try {
      const { data } = await profileService.updateWebsite({ url: url.trim() });
      setWebsite(data.profile?.personalWebsite || {});
      toast.success('Website verified & score updated!');
    } catch { toast.error('Failed to verify website. Make sure it is publicly accessible.'); }
    finally  { setVerifying(false); }
  };

  if (loading) return (
    <PageLayout title="Personal Website">
      <div className="shimmer" style={{ height: 400, borderRadius: 14 }} />
    </PageLayout>
  );

  const score = calcWebsiteScore(website);

  return (
    <PageLayout
      title="Personal Website"
      subtitle="Verify your personal website to automatically detect pages and content"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* URL Input */}
          <Card>
            <SectionHeader icon={<RiGlobalLine />} title="Verify Your Website" color="var(--accent)" />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <InputField
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://yourname.dev"
                  icon={<RiGlobalLine />}
                  hint="Must be publicly accessible. Our scanner checks for key pages automatically."
                />
              </div>
              <Button
                icon={<RiSearchLine />}
                loading={verifying}
                onClick={handleVerify}
                style={{ alignSelf: 'flex-start' }}
              >
                Verify
              </Button>
            </div>
          </Card>

          {/* Verification Results */}
          {website?.url && (
            <Card>
              <SectionHeader icon={<RiCheckLine />} title="Scan Results" color="var(--green)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {PAGE_CHECKS.map(({ key, label, icon, pts, desc }) => {
                  const found = website[key];
                  return (
                    <div key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 16px',
                      background: found ? 'var(--green-dim)' : 'var(--bg-secondary)',
                      border: `1px solid ${found ? 'rgba(45, 122, 96, 0.2)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s'
                    }}>
                      <span style={{ color: found ? 'var(--green)' : 'var(--text-muted)', fontSize: 18 }}>
                        {icon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{pts} pts</span>
                        {found
                          ? <RiCheckLine style={{ color: 'var(--green)', fontSize: 18 }} />
                          : <RiCloseLine style={{ color: 'var(--text-muted)', fontSize: 18 }} />
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Blog post count */}
              {website.hasBlog && (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--accent-dim)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(177, 7, 56, 0.18)',
                  fontSize: 13,
                  color: 'var(--accent-light)'
                }}>
                  📝 Found <strong>{website.blogPostCount || 0}</strong> blog posts.
                  {(website.blogPostCount || 0) < 5 && ' Publish at least 5 posts for the full bonus.'}
                </div>
              )}

              {/* Last verified */}
              {website.lastVerified && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                  Last scanned: {new Date(website.lastVerified).toLocaleString()}
                </p>
              )}
            </Card>
          )}

          {!website?.url && (
            <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
              <RiGlobalLine style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Enter your website URL above and click Verify to scan it automatically.
              </p>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ScorePreviewCard
            title="Website Score"
            score={score}
            max={19}
            color="var(--accent)"
            items={[
              { label: 'Website exists',      done: !!website?.url,            pts: 5 },
              { label: 'About page',          done: website?.hasAboutPage,     pts: 3 },
              { label: 'Portfolio page',      done: website?.hasPortfolio,     pts: 5 },
              { label: 'Blog exists',         done: website?.hasBlog,          pts: 4 },
              { label: 'Contact page',        done: website?.hasContactPage,   pts: 2 }
            ]}
          />
          <Card padding="16px">
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>
              💡 Don't have a website yet?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              Free options to get started quickly:
            </p>
            {['GitHub Pages', 'Vercel + Portfolio Template', 'Notion Public Page', 'Carrd.co'].map(opt => (
              <div key={opt} style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                padding: '5px 0',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <RiCheckLine style={{ color: 'var(--green)', fontSize: 14 }} />
                {opt}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

function calcWebsiteScore(w) {
  if (!w?.url) return 0;
  let s = 5;
  if (w.hasAboutPage)   s += 3;
  if (w.hasPortfolio)   s += 5;
  if (w.hasBlog)        s += 4;
  if (w.hasContactPage) s += 2;
  return Math.min(19, s);
}

