import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import './Auth.css';

/**
 * Scholar Sign-in Page for PJ Study.
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const redirectPath = location.state?.from?.pathname || '/profile';

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) {
      setErrorMessage('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__badge">Academic Portal</span>
          <h1 className="auth-card__title">Sign In to PJ Study</h1>
          <p className="auth-card__subtitle">
            Access your curated notes, study collections, and academic resources.
          </p>
        </div>

        {errorMessage && (
          <div
            className="auth-alert auth-alert--danger"
            role="alert"
            style={{ marginBottom: '20px' }}
          >
            <strong>Sign-in failed</strong>
            <span>{errorMessage}</span>
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
          />

          <div>
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
            />
            <div className="auth-form__row-split" style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: 0
                }}
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Sign In
          </Button>
        </form>

        <div className="auth-card__footer">
          Don't have an academic account yet?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
