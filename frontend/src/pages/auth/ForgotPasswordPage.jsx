import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService.js';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import './Auth.css';

/**
 * Scholar Password Reset Request Page.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__badge">Account Recovery</span>
          <h1 className="auth-card__title">Reset Password</h1>
          <p className="auth-card__subtitle">
            Enter your academic email address and we will send you secure instructions to reset your
            password.
          </p>
        </div>

        {errorMessage && (
          <div
            className="auth-alert auth-alert--danger"
            role="alert"
            style={{ marginBottom: '20px' }}
          >
            <span>{errorMessage}</span>
          </div>
        )}

        {isSubmitted ? (
          <div>
            <div className="auth-alert auth-alert--success">
              <strong>Instructions Dispatched</strong>
              <span>
                If an account exists with that email address, password reset instructions have been
                sent. Please check your inbox and spam folder.
              </span>
            </div>
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link to="/login">
                <Button variant="secondary" size="md">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <Input
              label="Academic Email"
              id="forgot-email"
              name="email"
              type="email"
              placeholder="scholar@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="auth-card__footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
