import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import './ProfilePage.css';
import './Auth.css';

/**
 * Scholar Account & Security Settings Page.
 */
export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess('Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleResendVerification() {
    if (!user?.email) return;
    setIsResending(true);
    setResendNotice('');

    try {
      const res = await authService.resendVerification(user.email);
      setResendNotice(res.message || 'Verification link sent to your email.');
    } catch (err) {
      setResendNotice(err.message || 'Failed to resend verification link.');
    } finally {
      setIsResending(false);
    }
  }

  async function handleSignOut() {
    await logout();
    navigate('/');
  }

  return (
    <div className="profile-container">
      {/* Account Overview Card */}
      <div className="profile-header-card">
        <div className="profile-user-info">
          <Avatar name={user?.name || 'Scholar'} size="lg" />
          <div className="profile-details">
            <h1 className="profile-name">{user?.name}</h1>
            <p className="profile-email">{user?.email}</p>
            <div className="profile-badges">
              <Badge variant={user?.role === 'ADMIN' ? 'accent' : 'primary'} size="sm">
                {user?.role}
              </Badge>
              {user?.isEmailVerified ? (
                <Badge variant="success" size="sm">
                  Verified Scholar
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Pending Verification
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {/* Verification Notice if Unverified */}
      {!user?.isEmailVerified && (
        <div className="auth-alert auth-alert--danger" style={{ marginBottom: '24px' }}>
          <strong>Email Verification Required</strong>
          <span>Please verify your email address to enable document uploads and downloads.</span>
          <div style={{ marginTop: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              isLoading={isResending}
              onClick={handleResendVerification}
              style={{ backgroundColor: '#FFFFFF' }}
            >
              Resend Verification Link
            </Button>
            {resendNotice && (
              <span style={{ marginLeft: '12px', fontSize: '0.85rem' }}>{resendNotice}</span>
            )}
          </div>
        </div>
      )}

      {/* Security & Password Settings */}
      <div className="profile-section-card">
        <h2 className="profile-section-title">Security & Password</h2>
        <p className="profile-section-desc">
          Update your password to keep your academic profile and study manuscripts protected.
        </p>

        {passwordSuccess && (
          <div className="auth-alert auth-alert--success" style={{ marginBottom: '16px' }}>
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="auth-alert auth-alert--danger" style={{ marginBottom: '16px' }}>
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="auth-form" style={{ maxWidth: '440px' }}>
          <Input
            label="Current Password"
            id="current-password"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            required
            autoComplete="current-password"
          />

          <Input
            label="New Password"
            id="new-password"
            name="newPassword"
            type="password"
            placeholder="At least 8 chars, uppercase, digit & symbol"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm New Password"
            id="confirm-new-password"
            name="confirmNewPassword"
            type="password"
            placeholder="Re-enter your new password"
            value={passwordData.confirmNewPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
            }
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isChangingPassword}
            style={{ marginTop: '8px' }}
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
