import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import './Auth.css';

/**
 * Calculates password strength score (0 to 3).
 *
 * @param {string} password
 * @returns {{ score: number, label: string, barClass: string }}
 */
function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: '', barClass: '' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  if (score === 1) {
    return {
      score: 1,
      label: 'Weak (needs uppercase, numbers, or symbols)',
      barClass: 'password-strength__bar--weak'
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: 'Fair (add special characters or numbers)',
      barClass: 'password-strength__bar--medium'
    };
  }
  return {
    score: 3,
    label: 'Strong academic password',
    barClass: 'password-strength__bar--strong'
  };
}

/**
 * Registration page for new scholars joining PJ Study.
 */
export function RegisterPage() {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const strength = getPasswordStrength(formData.password);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage || validationErrors.length > 0) {
      setErrorMessage('');
      setValidationErrors([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setValidationErrors([]);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      setIsSubmittedSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Registration could not be completed.');
      if (Array.isArray(err.errors)) {
        setValidationErrors(err.errors);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmittedSuccess) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card auth-card--wide">
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--success">✓</div>
            <h1 className="auth-card__title">Check Your Inbox</h1>
            <p className="auth-card__subtitle" style={{ marginTop: '12px', fontSize: '1rem' }}>
              We have dispatched a verification link to <strong>{formData.email}</strong>.
            </p>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                marginTop: '16px'
              }}
            >
              Please click the link in your email to activate your account and access full study
              materials.
            </p>
            <div style={{ marginTop: '32px' }}>
              <Link to="/login">
                <Button variant="primary" size="md">
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <span className="auth-card__badge">Join PJ Study</span>
          <h1 className="auth-card__title">Create Scholar Account</h1>
          <p className="auth-card__subtitle">
            Organize lecture notes, unlock peer-reviewed study guides, and collaborate with
            scholars.
          </p>
        </div>

        {errorMessage && (
          <div
            className="auth-alert auth-alert--danger"
            role="alert"
            style={{ marginBottom: '20px' }}
          >
            <strong>Registration failed</strong>
            <span>{errorMessage}</span>
            {validationErrors.length > 0 && (
              <ul className="auth-alert__errors">
                {validationErrors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input
            label="Full Name"
            id="register-name"
            name="name"
            placeholder="Ada Lovelace"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />

          <Input
            label="Academic Email"
            id="register-email"
            name="email"
            type="email"
            placeholder="ada@oxford.edu"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />

          <div>
            <Input
              label="Password"
              id="register-password"
              name="password"
              type="password"
              placeholder="At least 8 chars, numbers & symbols"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {formData.password && (
              <div className="password-strength" style={{ marginTop: '8px' }}>
                <div className="password-strength__bars">
                  <div
                    className={`password-strength__bar ${strength.score >= 1 ? strength.barClass : ''}`}
                  />
                  <div
                    className={`password-strength__bar ${strength.score >= 2 ? strength.barClass : ''}`}
                  />
                  <div
                    className={`password-strength__bar ${strength.score >= 3 ? strength.barClass : ''}`}
                  />
                </div>
                <div className="password-strength__label">
                  <span>Strength</span>
                  <span>{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your chosen password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Create Account
          </Button>
        </form>

        <div className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
