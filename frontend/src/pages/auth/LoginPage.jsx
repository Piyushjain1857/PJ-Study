import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import SEO from '../../components/common/SEO.jsx';
import './Auth.css';

/**
 * Premium Educational SaaS Sign-In Experience for PJ Study.
 * Features an editorial academic showcase, quick-fill demo credentials,
 * built-in password visibility toggle, and responsive presentation.
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeDemo, setActiveDemo] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) {
      setErrorMessage('');
    }
  }

  function handleDemoSelect(role, email) {
    setFormData({
      email,
      password: 'Password123!'
    });
    setActiveDemo(role);
    setErrorMessage('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });
      const userRole = result?.user?.role;
      let targetPath = location.state?.from?.pathname;
      if (!targetPath || targetPath === '/dashboard') {
        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
          targetPath = '/admin';
        } else {
          targetPath = '/dashboard';
        }
      }
      navigate(targetPath, { replace: true });
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to sign in. Please verify your academic credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <SEO title="Sign In to PJ Study" noindex={true} />
      <div className="auth-ambient-orb auth-ambient-orb--top" aria-hidden="true" />
      <div className="auth-ambient-orb auth-ambient-orb--bottom" aria-hidden="true" />

      <div className="auth-layout">
        {/* Left Column: Academic Brand Showcase */}
        <aside className="auth-showcase">
          <div className="auth-showcase__content">
            <div className="auth-showcase__pill">
              <span className="auth-showcase__pill-dot" />
              <span>The Academic Manuscript Vault</span>
            </div>

            <h2 className="auth-showcase__headline">
              Your Entire Study World, <br />
              <span className="auth-showcase__highlight">One Place.</span>
            </h2>

            <p className="auth-showcase__lead">
              Join thousands of university scholars discovering course-mapped lecture notes,
              curated semester syllabi, and peer-reviewed study materials.
            </p>

            {/* Value Proposition Grid */}
            <div className="auth-showcase__features">
              <div className="auth-feature-item">
                <div className="auth-feature-item__icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="auth-feature-item__title">Course-Mapped Taxonomy</h4>
                  <p className="auth-feature-item__desc">
                    Notes organized strictly by University, Degree, Semester, and Subject.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-item__icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div>
                  <h4 className="auth-feature-item__title">Verified Academic Quality</h4>
                  <p className="auth-feature-item__desc">
                    100% of public notes are reviewed and verified by academic moderators.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-item__icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="auth-feature-item__title">Smart Study Collections</h4>
                  <p className="auth-feature-item__desc">
                    Bookmark, curate collections, download for offline reading, and rate notes.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof Quote */}
            <div className="auth-testimonial-card">
              <div className="auth-testimonial-card__quote">
                “PJ Study completely transformed our semester exam prep. Finding syllabus-accurate notes used to take hours—now it’s instant.”
              </div>
              <div className="auth-testimonial-card__author">
                <div className="auth-testimonial-card__avatar">CS</div>
                <div>
                  <div className="auth-testimonial-card__name">Computer Science Scholar</div>
                  <div className="auth-testimonial-card__uni">Stanford University · Semester 6</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Sign-In Card */}
        <main className="auth-card-container">
          <div className="auth-card">
            <div className="auth-card__header">
              <div className="auth-card__badge-row">
                <span className="auth-card__badge">
                  <span className="auth-card__status-dot" />
                  Academic Portal
                </span>
              </div>
              <h1 className="auth-card__title">Sign In to PJ Study</h1>
              <p className="auth-card__subtitle">
                Access your curated manuscripts, personal collections, and verified course notes.
              </p>
            </div>

            {/* Quick Demo Credentials Switcher */}
            <div className="auth-demo-picker">
              <div className="auth-demo-picker__label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Demo Access</span>
              </div>
              <div className="auth-demo-picker__pills">
                <button
                  type="button"
                  className={`auth-demo-pill ${activeDemo === 'student' ? 'auth-demo-pill--active' : ''}`}
                  onClick={() => handleDemoSelect('student', 'student@portal.com')}
                >
                  <span className="auth-demo-pill__emoji">🎓</span>
                  <span>Scholar</span>
                </button>
                <button
                  type="button"
                  className={`auth-demo-pill ${activeDemo === 'moderator' ? 'auth-demo-pill--active' : ''}`}
                  onClick={() => handleDemoSelect('moderator', 'moderator@portal.com')}
                >
                  <span className="auth-demo-pill__emoji">🛡️</span>
                  <span>Moderator</span>
                </button>
                <button
                  type="button"
                  className={`auth-demo-pill ${activeDemo === 'admin' ? 'auth-demo-pill--active' : ''}`}
                  onClick={() => handleDemoSelect('admin', 'superadmin@portal.com')}
                >
                  <span className="auth-demo-pill__emoji">⚡</span>
                  <span>Super Admin</span>
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="auth-alert auth-alert--danger" role="alert">
                <div className="auth-alert__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="auth-alert__content">
                  <strong>Sign-in failed</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <Input
                label="Academic Email"
                id="login-email"
                name="email"
                type="email"
                placeholder="scholar@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />

              <Input
                label="Password"
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
                endAdornment={
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                }
              />

              <div className="auth-form__controls">
                <label className="auth-remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span>Remember this device</span>
                </label>
                <Link to="/forgot-password" className="auth-link">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="auth-submit-btn"
              >
                Sign In to Workspace →
              </Button>

              <div className="auth-security-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>256-Bit Encrypted Session · Student Privacy Safeguarded</span>
              </div>
            </form>

            <div className="auth-card__footer">
              <span>Don't have an academic account yet?</span>{' '}
              <Link to="/register" className="auth-link auth-link--strong">
                Create an account
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage;
