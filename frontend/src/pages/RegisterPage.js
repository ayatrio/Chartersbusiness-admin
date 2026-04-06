import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  RiBookOpenLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockLine,
  RiMailLine,
  RiPhoneLine,
  RiUserLine
} from 'react-icons/ri';
import Button from '../components/Common/Button';
import InputField from '../components/Common/InputField';
import BrandMark from '../components/Common/BrandMark';

const COURSE_OPTIONS = [
  'Certified Management Professional (CMP)',
  'Digital Growth Engineer',
  'Product Growth Engineering'
];

const INVERSE_LABEL_STYLE = { color: 'rgba(255,255,255,0.84)' };
const INVERSE_HINT_STYLE = { color: 'rgba(255,255,255,0.7)' };

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    selectedCourse: '',
    password: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.selectedCourse) {
      return toast.error('Please choose one of the offered courses');
    }
    if (form.password !== form.confirm) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        selectedCourse: form.selectedCourse,
        password: form.password
      });
      toast.success('Account created successfully');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: 28 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <BrandMark />
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 28,
          alignItems: 'stretch'
        }}>
          <section style={{
            flex: '1 1 420px',
            minHeight: 640,
            borderRadius: 28,
            padding: '44px 42px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <p style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 12
            }}>
              Why Join
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              lineHeight: 1.05,
              fontWeight: 800,
              color: 'var(--text-primary)',
              maxWidth: 500,
              marginBottom: 18
            }}>
              Build your profile with the same clarity as a premium institutional platform.
            </h1>
            <p style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: 'var(--text-secondary)',
              maxWidth: 520
            }}>
              Choose your course track, connect your public profiles, and start measuring the signals that shape your professional brand.
            </p>

            <div style={{
              marginTop: 30,
              display: 'grid',
              gap: 16
            }}>
              {[
                {
                  title: 'Choose your course direction',
                  text: 'Registration now captures the course pathway that later powers YouTube and profile relevance scoring.'
                },
                {
                  title: 'Turn scattered data into a single score',
                  text: 'Bring together LinkedIn, GitHub, website, networking, credentials, and AI-assisted improvements.'
                },
                {
                  title: 'Keep the experience focused',
                  text: 'Clean layouts, calm surfaces, and sharper hierarchy make the product feel more trusted and academic.'
                }
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 20,
                    background: 'var(--surface-tint)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: 6
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section style={{
            flex: '0 1 500px',
            width: '100%',
            borderRadius: 28,
            padding: '40px 36px',
            background: 'linear-gradient(160deg, var(--accent-light), var(--accent-strong))',
            color: '#fff',
            boxShadow: '0 28px 56px rgba(177, 7, 56, 0.2)'
          }}>
            <div style={{ marginBottom: 28 }}>
              <p style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.82)',
                marginBottom: 10
              }}>
                Create Account
              </p>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 34,
                fontWeight: 800,
                color: '#fff',
                marginBottom: 8
              }}>
                Start your profile journey
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.84)', fontSize: 15, lineHeight: 1.65 }}>
                Register once, pick your course, and begin building a stronger professional brand.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InputField
                  label="First Name"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="Jane"
                  icon={<RiUserLine />}
                  labelStyle={INVERSE_LABEL_STYLE}
                  hintStyle={INVERSE_HINT_STYLE}
                  required
                />
                <InputField
                  label="Last Name"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Doe"
                  labelStyle={INVERSE_LABEL_STYLE}
                  hintStyle={INVERSE_HINT_STYLE}
                  required
                />
              </div>

              <InputField
                label="Email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                icon={<RiMailLine />}
                labelStyle={INVERSE_LABEL_STYLE}
                hintStyle={INVERSE_HINT_STYLE}
                required
              />

              <InputField
                label="Phone (optional)"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
                icon={<RiPhoneLine />}
                labelStyle={INVERSE_LABEL_STYLE}
                hintStyle={INVERSE_HINT_STYLE}
              />

              <div style={{ marginBottom: 18 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.84)',
                  marginBottom: 10
                }}>
                  Select Course
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {COURSE_OPTIONS.map((course) => {
                    const selected = form.selectedCourse === course;

                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, selectedCourse: course }))}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 16px',
                          borderRadius: 16,
                          border: `1px solid ${selected ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.18)'}`,
                          background: selected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            color: selected ? '#fff' : 'rgba(255,255,255,0.72)',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <RiBookOpenLine />
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>
                            {course}
                          </span>
                        </div>

                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.6)'}`,
                          background: selected ? '#fff' : 'transparent',
                          boxShadow: selected ? '0 0 0 4px rgba(255,255,255,0.12)' : 'none',
                          flexShrink: 0
                        }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <InputField
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  icon={<RiLockLine />}
                  labelStyle={INVERSE_LABEL_STYLE}
                  hintStyle={INVERSE_HINT_STYLE}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: 38,
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    fontSize: 16
                  }}
                >
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>

              <InputField
                label="Confirm Password"
                type={showPass ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="Repeat password"
                icon={<RiLockLine />}
                labelStyle={INVERSE_LABEL_STYLE}
                hintStyle={INVERSE_HINT_STYLE}
                required
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                style={{
                  marginTop: 10,
                  background: '#fff',
                  color: 'var(--accent)',
                  boxShadow: '0 18px 36px rgba(0, 0, 0, 0.08)'
                }}
              >
                Create Account
              </Button>
            </form>

            <p style={{
              marginTop: 22,
              fontSize: 14,
              color: 'rgba(255,255,255,0.8)'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700
              }}>
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

