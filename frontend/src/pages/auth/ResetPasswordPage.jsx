import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import authService from '../../services/authService.js';
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
    return { score: 1, label: 'Weak', barClass: 'password-strength__bar--weak' };
  }
  if (score === 2) {
    return { score: 2, label: 'Fair', barClass: 'password-strength__bar--medium' };
  }
  return { score: 3, label: 'Strong', barClass: 'password-strength__bar--strong' };
}

/**
 * Password Reset page accepting token from email link.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setValidationErrors([]);

    if (!token) {
      setErrorMessage('Reset token is missing. Please use the link sent to your email.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({ token, password });
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. Link may have expired.');
      if (Array.isArray(err.errors)) {
        setValidationErrors(err.errors);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--error">!</div>
            <h1 className="auth-card__title">Missing Reset Token</h1>
            <p className="auth-card__subtitle" style={{ marginTop: '12px' }}>
              The password reset link appears incomplete. Please request a new link.
            </p>
            <div style={{ marginTop: '24px' }}>
              <Link to="/forgot-password">
                <Button variant="primary" size="md">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--success">✓</div>
            <h1 className="auth-card__title">Password Reset Complete</h1>
            <p className="auth-card__subtitle" style={{ marginTop: '12px' }}>
              Your password has been successfully updated. You can now log in with your new
              credentials.
            </p>
            <div style={{ marginTop: '28px' }}>
              <Link to="/login">
                <Button variant="primary" size="md">
                  Sign In Now
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
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__badge">Security</span>
          <h1 className="auth-card__title">Set New Password</h1>
          <p className="auth-card__subtitle">
            Choose a strong, memorable password for your PJ Study account.
          </p>
        </div>

        {errorMessage && (
          <div
            className="auth-alert auth-alert--danger"
            role="alert"
            style={{ marginBottom: '20px' }}
          >
            <strong>Reset Failed</strong>
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
          <div>
            <Input
              label="New Password"
              id="reset-password"
              name="password"
              type="password"
              placeholder="At least 8 chars, uppercase, digit & symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {password && (
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
            label="Confirm New Password"
            id="reset-confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            Update Password
          </Button>
        </form>

        <div className="auth-card__footer">
          <Link to="/login" className="auth-link">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
