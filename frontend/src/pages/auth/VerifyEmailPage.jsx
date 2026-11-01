import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import authService from '../../services/authService.js';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import './Auth.css';

/**
 * Account email verification landing page.
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'verifying' : 'no_token');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState({ loading: false, sent: false, message: '' });

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function executeVerification() {
      try {
        const response = await authService.verifyEmail(token);
        if (isMounted) {
          setStatus('success');
          setMessage(response.message || 'Your email address has been successfully verified.');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setMessage(err.message || 'The verification link is invalid or has expired.');
        }
      }
    }

    executeVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    if (!resendEmail) return;

    setResendStatus({ loading: true, sent: false, message: '' });

    try {
      const response = await authService.resendVerification(resendEmail);
      setResendStatus({
        loading: false,
        sent: true,
        message:
          response.message ||
          'If an unverified account exists, a new verification link has been sent.'
      });
    } catch (err) {
      setResendStatus({
        loading: false,
        sent: false,
        message: err.message || 'Failed to dispatch verification email.'
      });
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {status === 'verifying' && (
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--pending">⌛</div>
            <h1 className="auth-card__title">Verifying Email</h1>
            <p className="auth-card__subtitle">
              Please wait while we validate your academic credentials...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--success">✓</div>
            <h1 className="auth-card__title">Email Verified!</h1>
            <p className="auth-card__subtitle" style={{ marginTop: '12px' }}>
              {message}
            </p>
            <div style={{ marginTop: '32px' }}>
              <Link to="/login">
                <Button variant="primary" size="md">
                  Sign In to PJ Study
                </Button>
              </Link>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'no_token') && (
          <div>
            <div className="verify-status">
              <div className="verify-status__icon verify-status__icon--error">!</div>
              <h1 className="auth-card__title">
                {status === 'no_token' ? 'Verify Your Account' : 'Verification Issue'}
              </h1>
              <p className="auth-card__subtitle" style={{ marginTop: '12px' }}>
                {status === 'no_token'
                  ? 'Please check your email inbox for your activation link or request a new one below.'
                  : message}
              </p>
            </div>

            <div
              style={{
                marginTop: '24px',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '24px'
              }}
            >
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 12px 0' }}>Request a New Link</h3>
              {resendStatus.sent ? (
                <div className="auth-alert auth-alert--success">
                  <span>{resendStatus.message}</span>
                </div>
              ) : (
                <form onSubmit={handleResend} className="auth-form">
                  {resendStatus.message && (
                    <div className="auth-alert auth-alert--danger">
                      <span>{resendStatus.message}</span>
                    </div>
                  )}
                  <Input
                    label="Account Email"
                    id="resend-email"
                    name="resendEmail"
                    type="email"
                    placeholder="scholar@university.edu"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={resendStatus.loading}
                  >
                    Send Verification Link
                  </Button>
                </form>
              )}
            </div>

            <div className="auth-card__footer" style={{ marginTop: '24px' }}>
              <Link to="/login" className="auth-link">
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
