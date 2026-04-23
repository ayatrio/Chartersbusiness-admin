import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RiEyeLine, RiEyeOffLine, RiLockLine, RiMailLine } from 'react-icons/ri';
import Button from '../components/Common/Button';
import InputField from '../components/Common/InputField';
import BrandMark from '../components/Common/BrandMark';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (key) => (e) =>
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);

    try {
      const res = await login(form.email, form.password);

      toast.success('Welcome back!');

      // Redirect to new dashboard
      const destination = res?.user?.role === 'admin' ? '/admin' : '/home';
      navigate(destination);
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell auth-shell--login">
      <div className="auth-shell__inner auth-shell__inner--login">
        <div className="auth-shell__logo">
          <BrandMark />
        </div>

        <div className="auth-shell__grid">
          <section className="auth-panel auth-panel--feature auth-panel--login-feature">
            <div className="auth-panel__glow" />

            <div className="auth-panel__content">
              <p className="auth-eyebrow auth-eyebrow--inverse">Career Branding Platform</p>

              <h1 className="auth-title auth-title--hero">
                Build a profile that stands out with clarity and confidence.
              </h1>

              <p className="auth-copy auth-copy--hero auth-copy--inverse">
                Track your professional presence, score your branding profile,
                and turn weak spots into focused next steps.
              </p>

              <div className="auth-feature-list auth-feature-list--login">
                {[
                  'Measure LinkedIn, GitHub, website, credentials, networking, and thought leadership in one place.',
                  'Get actionable suggestions you can actually complete, not just static analytics.',
                  'Work inside a cleaner, more structured experience inspired by modern academic platforms.'
                ].map((item) => (
                  <div key={item} className="auth-feature-item auth-feature-item--inverse">
                    <span className="auth-feature-dot" />
                    <p className="auth-feature-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="auth-panel auth-panel--form auth-panel--login-form">
            <div className="auth-panel__header">
              <p className="auth-eyebrow">Welcome Back</p>

              <h2 className="auth-title auth-title--section">Sign in to continue</h2>

              <p className="auth-copy">
                Access your dashboard and continue improving your profile.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <InputField
                label="Email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                icon={<RiMailLine />}
                required
              />

              <div className="auth-password-wrap">
                <InputField
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Enter your password"
                  icon={<RiLockLine />}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="auth-password-toggle"
                >
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: 10 }}
              >
                Sign In
              </Button>
            </form>

            <p className="auth-footer-copy">
              Don't have an account?{' '}
              <Link to="/register" className="auth-inline-link">Create one</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

