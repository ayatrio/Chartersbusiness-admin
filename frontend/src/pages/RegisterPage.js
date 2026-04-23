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
    <div className="auth-shell auth-shell--register">
      <div className="auth-shell__inner auth-shell__inner--register">
        <div className="auth-shell__logo">
          <BrandMark />
        </div>

        <div className="auth-shell__grid">
          <section className="auth-panel auth-panel--form auth-panel--register-info">
            <p className="auth-eyebrow">Why Join</p>
            <h1 className="auth-title auth-title--hero auth-title--dark">
              Build your profile with the same clarity as a premium institutional platform.
            </h1>
            <p className="auth-copy auth-copy--hero auth-copy--dark">
              Choose your course track, connect your public profiles, and start measuring the signals that shape your professional brand.
            </p>

            <div className="auth-value-list">
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
                <div key={item.title} className="auth-value-card">
                  <h3 className="auth-value-card__title">{item.title}</h3>
                  <p className="auth-value-card__text">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="auth-panel auth-panel--inverse auth-panel--register-form">
            <div className="auth-panel__header">
              <p className="auth-eyebrow auth-eyebrow--inverse">Create Account</p>
              <h2 className="auth-title auth-title--section auth-title--inverse">Start your profile journey</h2>
              <p className="auth-copy auth-copy--inverse">
                Register once, pick your course, and begin building a stronger professional brand.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-form-grid auth-form-grid--two">
                <InputField
                  label="First Name"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="Jane"
                  icon={<RiUserLine />}
                  tone="inverse"
                  required
                />
                <InputField
                  label="Last Name"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Doe"
                  tone="inverse"
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
                tone="inverse"
                required
              />

              <InputField
                label="Phone (optional)"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
                icon={<RiPhoneLine />}
                tone="inverse"
              />

              <div className="course-selector">
                <label className="course-selector__label">Select Course</label>

                <div className="course-selector__options">
                  {COURSE_OPTIONS.map((course) => {
                    const selected = form.selectedCourse === course;
                    const optionClassName = selected ? 'course-option is-selected' : 'course-option';

                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, selectedCourse: course }))}
                        className={optionClassName}
                      >
                        <div className="course-option__main">
                          <span className="course-option__icon">
                            <RiBookOpenLine />
                          </span>
                          <span className="course-option__text">{course}</span>
                        </div>

                        <span className="course-option__radio" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="auth-password-wrap">
                <InputField
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  icon={<RiLockLine />}
                  tone="inverse"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="auth-password-toggle auth-password-toggle--inverse"
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
                tone="inverse"
                required
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                className="auth-submit--light"
                style={{ marginTop: 10 }}
              >
                Create Account
              </Button>
            </form>

            <p className="auth-footer-copy auth-footer-copy--inverse">
              Already have an account?{' '}
              <Link to="/login" className="auth-inline-link auth-inline-link--inverse">Sign in</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

