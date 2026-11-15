import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';
import profileService from '../../services/profileService.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import NoteCard from '../../components/notes/NoteCard.jsx';
import './ProfilePage.css';
import './Auth.css';

/**
 * Scholar Personal Profile, Academic Identity, Uploads & Security Hub.
 */
export function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Active tab: 'overview' | 'uploads' | 'edit' | 'privacy' | 'security'
  const [activeTab, setActiveTab] = useState('overview');

  // Full profile and statistics from backend
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Academic metadata options
  const [courses, setCourses] = useState([]);

  // Edit Profile Form state
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    university: '',
    courseId: '',
    semester: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  // Privacy toggles state
  const [privacySettings, setPrivacySettings] = useState({
    publicProfileEnabled: true,
    showAcademicInfo: true,
    showBio: true,
    showContributionStats: true
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState('');
  const [privacyError, setPrivacyError] = useState('');

  // Uploads management state
  const [uploads, setUploads] = useState([]);
  const [uploadsMeta, setUploadsMeta] = useState(null);
  const [uploadsStatus, setUploadsStatus] = useState('ALL');
  const [uploadsSearch, setUploadsSearch] = useState('');
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Password & Security Form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email verification state
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  // Fetch full profile and statistics
  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const data = await profileService.getOwnProfile();
      setProfileData(data);
      if (data) {
        updateUser(data);
        setEditForm({
          name: data.name || '',
          bio: data.bio || '',
          university: data.university || '',
          courseId: data.courseId || '',
          semester:
            data.semester !== null && data.semester !== undefined ? String(data.semester) : ''
        });
        setPrivacySettings({
          publicProfileEnabled: data.publicProfileEnabled ?? true,
          showAcademicInfo: data.showAcademicInfo ?? true,
          showBio: data.showBio ?? true,
          showContributionStats: data.showContributionStats ?? true
        });
      }
    } catch {
      // Fallback to user from context
      if (user) {
        setEditForm({
          name: user.name || '',
          bio: user.bio || '',
          university: user.university || '',
          courseId: user.courseId || '',
          semester: user.semester ? String(user.semester) : ''
        });
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user, updateUser]);

  // Fetch academic options
  useEffect(() => {
    async function loadAcademicOptions() {
      try {
        const opts = await profileService.getAcademicOptions();
        setCourses(opts || []);
      } catch {
        setCourses([]);
      }
    }
    loadAcademicOptions();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch uploads whenever uploads tab is selected, or status/page changes
  const fetchUploads = useCallback(
    async (page = 1, status = uploadsStatus, search = uploadsSearch) => {
      setIsLoadingUploads(true);
      try {
        const data = await profileService.getOwnUploads({
          page,
          limit: 8,
          status,
          search
        });
        setUploads(data?.items || []);
        setUploadsMeta(data?.meta || null);
        setCurrentPage(page);
      } catch {
        setUploads([]);
      } finally {
        setIsLoadingUploads(false);
      }
    },
    [uploadsStatus, uploadsSearch]
  );

  useEffect(() => {
    if (activeTab === 'uploads') {
      fetchUploads(1, uploadsStatus, uploadsSearch);
    }
  }, [activeTab, uploadsStatus, fetchUploads, uploadsSearch]);

  // Avatar file upload handler
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');

    // Pre-validate file type & extension
    const originalName = file.name || '';
    const ext = originalName.slice(((originalName.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
    const validExts = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];
    const validMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'image/pjpeg',
      'image/jfif',
      'image/x-png'
    ];
    const isMimeValid = validMimes.includes(file.type?.toLowerCase());
    const isExtValid = validExts.includes(ext);

    if (!isMimeValid && !isExtValid) {
      setAvatarError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Pre-validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Avatar image must be smaller than 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await profileService.uploadAvatar(file);
      if (result?.avatarUrl) {
        updateUser({ avatarUrl: result.avatarUrl });
        setProfileData((prev) => (prev ? { ...prev, avatarUrl: result.avatarUrl } : prev));
        setAvatarSuccess('Profile photo updated and saved successfully!');
        setTimeout(() => setAvatarSuccess(''), 4500);
      }
    } catch (err) {
      setAvatarError(
        err.response?.data?.error?.message || err.message || 'Failed to upload avatar.'
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Avatar removal handler
  async function handleAvatarRemove() {
    setIsUploadingAvatar(true);
    setAvatarError('');
    setAvatarSuccess('');
    try {
      await profileService.removeAvatar();
      updateUser({ avatarUrl: null });
      setProfileData((prev) => (prev ? { ...prev, avatarUrl: null } : prev));
      setAvatarSuccess('Profile photo removed.');
      setTimeout(() => setAvatarSuccess(''), 4500);
    } catch (err) {
      setAvatarError(
        err.response?.data?.error?.message || err.message || 'Failed to remove avatar.'
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  // Edit profile form submit handler
  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editForm.name || editForm.name.trim().length < 2) {
      setProfileError('Display name must be at least 2 characters long.');
      return;
    }

    if (editForm.bio && editForm.bio.length > 300) {
      setProfileError('Biography cannot exceed 300 characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        bio: editForm.bio.trim() || null,
        university: editForm.university.trim() || null,
        courseId: editForm.courseId || null,
        semester: editForm.semester ? Number(editForm.semester) : null
      };

      const updated = await profileService.updateOwnProfile(payload);
      updateUser(updated);
      setProfileData((prev) => (prev ? { ...prev, ...updated } : updated));
      setProfileSuccess('Academic profile updated successfully.');
    } catch (err) {
      setProfileError(
        err.response?.data?.error?.message || err.message || 'Failed to update academic profile.'
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Privacy settings toggle submit handler
  async function handlePrivacySubmit(e) {
    e.preventDefault();
    setPrivacyError('');
    setPrivacySuccess('');
    setIsSavingPrivacy(true);

    try {
      const updated = await profileService.updatePrivacySettings(privacySettings);
      updateUser(updated);
      setProfileData((prev) => (prev ? { ...prev, ...updated } : updated));
      setPrivacySuccess('Profile privacy preferences updated successfully.');
    } catch (err) {
      setPrivacyError(
        err.response?.data?.error?.message || err.message || 'Failed to update privacy settings.'
      );
    } finally {
      setIsSavingPrivacy(false);
    }
  }

  // Available semesters for selected course
  const selectedCourse = courses.find((c) => c.id === editForm.courseId);
  const availableSemesters = selectedCourse?.semesters || [1, 2, 3, 4, 5, 6, 7, 8];

  // Password change handler
  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password cannot be identical to current password');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setPasswordError('New password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(passwordData.newPassword)) {
      setPasswordError('New password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(passwordData.newPassword)) {
      setPasswordError('New password must contain at least one numeric digit');
      return;
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordData.newPassword)) {
      setPasswordError('New password must contain at least one special character (!@#$%^&*)');
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
      const detailedErrors = err.errors || err.response?.data?.error?.errors;
      if (Array.isArray(detailedErrors) && detailedErrors.length > 0) {
        setPasswordError(detailedErrors.join('. '));
      } else {
        setPasswordError(
          err.message || err.response?.data?.error?.message || 'Failed to update password.'
        );
      }
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

  const currentUser = profileData || user;
  const stats = profileData?.stats;

  if (isLoadingProfile && !currentUser) {
    return (
      <div className="profile-container" style={{ padding: '48px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Loading scholar profile and academic records...
        </p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Account Overview Header Card */}
      <div className="profile-header-card">
        <div className="profile-user-info">
          <div className="profile-avatar-container">
            <div
              className="profile-avatar-wrapper"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              title="Click to change profile picture"
              aria-label="Click to change profile picture"
            >
              <Avatar
                name={currentUser?.name || 'Scholar'}
                src={currentUser?.avatarUrl}
                size="xl"
              />
              <div className="profile-avatar-overlay">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Change</span>
              </div>
            </div>
            <div className="profile-avatar-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                aria-label="Upload avatar image"
              />
              <button
                type="button"
                className="profile-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Upload new profile picture"
                aria-label="Upload profile picture"
              >
                {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
              </button>
              {currentUser?.avatarUrl && (
                <button
                  type="button"
                  className="profile-avatar-btn profile-avatar-btn--remove"
                  onClick={handleAvatarRemove}
                  disabled={isUploadingAvatar}
                  title="Remove profile picture"
                  aria-label="Remove profile picture"
                >
                  Remove
                </button>
              )}
            </div>
            {avatarSuccess && <p className="profile-avatar-success">{avatarSuccess}</p>}
            {avatarError && <p className="profile-avatar-error">{avatarError}</p>}
          </div>

          <div className="profile-details">
            <div className="profile-name-row">
              <h1 className="profile-name">{currentUser?.name}</h1>
              {currentUser?.id && (
                <Link
                  to={`/contributors/${currentUser.id}`}
                  className="profile-public-link"
                  title="View your public contributor profile"
                >
                  View Public Profile ↗
                </Link>
              )}
            </div>

            <p className="profile-email">{currentUser?.email}</p>

            <div className="profile-badges">
              <Badge variant={currentUser?.role === 'ADMIN' ? 'accent' : 'primary'} size="sm">
                {currentUser?.role}
              </Badge>
              {currentUser?.isEmailVerified ? (
                <Badge variant="success" size="sm">
                  Verified Scholar
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Pending Verification
                </Badge>
              )}

              {/* Academic Identity Pill */}
              {(currentUser?.university || currentUser?.course || currentUser?.semester) && (
                <span className="profile-academic-tag">
                  {currentUser.university && `${currentUser.university} `}
                  {currentUser.course && `• ${currentUser.course.name} `}
                  {currentUser.semester && `• Sem ${currentUser.semester}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {/* Verification Notice if Unverified */}
      {!currentUser?.isEmailVerified && (
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

      {/* Profile Section Tabs */}
      <div className="profile-tabs" role="tablist" aria-label="Profile navigation sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`profile-tab ${activeTab === 'overview' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Stats
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'uploads'}
          className={`profile-tab ${activeTab === 'uploads' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('uploads')}
        >
          My Uploads
          {stats?.totalUploads !== undefined && (
            <span className="profile-tab-badge">{stats.totalUploads}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'edit'}
          className={`profile-tab ${activeTab === 'edit' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'privacy'}
          className={`profile-tab ${activeTab === 'privacy' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          Privacy Settings
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'security'}
          className={`profile-tab ${activeTab === 'security' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security & Password
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="profile-tab-content">
          {/* Contribution Statistics Grid */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <span className="profile-stat-number">{stats?.totalUploads ?? '—'}</span>
              <span className="profile-stat-label">Total Uploads</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-number" style={{ color: '#059669' }}>
                {stats?.approvedNotes ?? '—'}
              </span>
              <span className="profile-stat-label">Approved & Published</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-number" style={{ color: '#d97706' }}>
                {stats?.pendingNotes ?? '—'}
              </span>
              <span className="profile-stat-label">Pending Review</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-number" style={{ color: '#dc2626' }}>
                {stats?.rejectedNotes ?? '—'}
              </span>
              <span className="profile-stat-label">Revisions Needed</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-number">{stats?.totalDownloads ?? '—'}</span>
              <span className="profile-stat-label">Community Downloads</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-number">
                {stats?.averageRating ? `★ ${stats.averageRating}` : '—'}
              </span>
              <span className="profile-stat-label">Avg Resource Rating</span>
            </div>
          </div>

          {/* Academic Identity Details */}
          <div className="profile-section-card">
            <div className="profile-card-header-row">
              <h2 className="profile-section-title">Academic Identity</h2>
              <button
                type="button"
                className="profile-edit-link"
                onClick={() => setActiveTab('edit')}
              >
                Edit Details
              </button>
            </div>

            <div className="profile-academic-grid">
              <div className="profile-field-block">
                <span className="profile-field-label">University / Institution</span>
                <span className="profile-field-value">
                  {currentUser?.university || 'Not specified yet'}
                </span>
              </div>
              <div className="profile-field-block">
                <span className="profile-field-label">Academic Program / Degree</span>
                <span className="profile-field-value">
                  {currentUser?.course?.name || 'Not specified yet'}
                </span>
              </div>
              <div className="profile-field-block">
                <span className="profile-field-label">Current Semester</span>
                <span className="profile-field-value">
                  {currentUser?.semester ? `Semester ${currentUser.semester}` : 'Not specified yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Biography Card */}
          <div className="profile-section-card">
            <div className="profile-card-header-row">
              <h2 className="profile-section-title">Scholar Biography</h2>
              <button
                type="button"
                className="profile-edit-link"
                onClick={() => setActiveTab('edit')}
              >
                {currentUser?.bio ? 'Edit Bio' : 'Add Bio'}
              </button>
            </div>
            <p className="profile-bio-text">
              {currentUser?.bio ||
                'No personal biography provided yet. Add a short bio to highlight your academic interests on your contributor profile.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: MY UPLOADS */}
      {activeTab === 'uploads' && (
        <div className="profile-tab-content">
          <div className="profile-uploads-toolbar">
            <div
              className="profile-filter-pills"
              role="radiogroup"
              aria-label="Filter uploads by status"
            >
              {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`profile-filter-pill ${uploadsStatus === st ? 'profile-filter-pill--active' : ''}`}
                  onClick={() => setUploadsStatus(st)}
                >
                  {st === 'ALL'
                    ? 'All Uploads'
                    : st === 'APPROVED'
                      ? 'Approved'
                      : st === 'PENDING'
                        ? 'Pending Review'
                        : st === 'REJECTED'
                          ? 'Needs Revision'
                          : 'Drafts'}
                </button>
              ))}
            </div>

            <div className="profile-search-wrapper">
              <input
                type="search"
                placeholder="Search your notes..."
                value={uploadsSearch}
                onChange={(e) => setUploadsSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchUploads(1, uploadsStatus, uploadsSearch);
                  }
                }}
                className="profile-search-input"
                aria-label="Search personal notes"
              />
            </div>
          </div>

          {isLoadingUploads ? (
            <div className="profile-uploads-loading">
              <div className="spinner" />
              <span>Loading manuscripts...</span>
            </div>
          ) : uploads.length === 0 ? (
            <div className="profile-empty-uploads">
              <p>No study materials match the selected status filter.</p>
              <Link
                to="/notes/new"
                className="btn btn--primary btn--sm"
                style={{ marginTop: '8px' }}
              >
                + Upload a Study Note
              </Link>
            </div>
          ) : (
            <div className="profile-uploads-grid">
              {uploads.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  showStatus={true}
                  showActions={true}
                  actions={(n) => (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Link to={`/notes/${n.id}`} className="btn btn--outline btn--sm">
                        View Note
                      </Link>
                      <Link to={`/notes/${n.id}/edit`} className="btn btn--outline btn--sm">
                        Edit
                      </Link>
                    </div>
                  )}
                />
              ))}
            </div>
          )}

          {/* Uploads Pagination */}
          {uploadsMeta && uploadsMeta.totalPages > 1 && (
            <div className="contributor-pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={!uploadsMeta.hasPrevPage || isLoadingUploads}
                onClick={() => fetchUploads(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="pagination-info">
                Page {uploadsMeta.page} of {uploadsMeta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!uploadsMeta.hasNextPage || isLoadingUploads}
                onClick={() => fetchUploads(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EDIT PROFILE & ACADEMIC IDENTITY */}
      {activeTab === 'edit' && (
        <div className="profile-tab-content">
          <div className="profile-section-card">
            <h2 className="profile-section-title">Edit Personal & Academic Identity</h2>
            <p className="profile-section-desc">
              Manage your scholar display name, biography, university, and current semester.
            </p>

            {profileSuccess && (
              <div className="auth-alert auth-alert--success" style={{ marginBottom: '16px' }}>
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="auth-alert auth-alert--danger" style={{ marginBottom: '16px' }}>
                <span>{profileError}</span>
              </div>
            )}

            {/* Profile Avatar Card */}
            <div className="profile-edit-avatar-card">
              <div className="profile-edit-avatar-left">
                <Avatar
                  name={currentUser?.name || 'Scholar'}
                  src={currentUser?.avatarUrl}
                  size="xl"
                />
              </div>
              <div className="profile-edit-avatar-right">
                <h3 className="profile-edit-avatar-heading">Profile Photo</h3>
                <p className="profile-edit-avatar-subtext">
                  Upload an academic photo or avatar (JPG, PNG, or WebP, up to 5MB). This image is
                  saved permanently to your profile and displayed across your dashboard, notes, and
                  comments.
                </p>
                <div className="profile-edit-avatar-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                  </Button>
                  {currentUser?.avatarUrl && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={isUploadingAvatar}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
                {avatarSuccess && <p className="profile-avatar-success">{avatarSuccess}</p>}
                {avatarError && <p className="profile-avatar-error">{avatarError}</p>}
              </div>
            </div>

            {/* Profile Avatar Card */}
            <div className="profile-edit-avatar-card">
              <div className="profile-edit-avatar-left">
                <Avatar
                  name={currentUser?.name || 'Scholar'}
                  src={currentUser?.avatarUrl}
                  size="xl"
                />
              </div>
              <div className="profile-edit-avatar-right">
                <h3 className="profile-edit-avatar-heading">Profile Photo</h3>
                <p className="profile-edit-avatar-subtext">
                  Upload an academic photo or avatar (JPG, PNG, or WebP, up to 5MB). This image is saved permanently to your profile and displayed across your dashboard, notes, and comments.
                </p>
                <div className="profile-edit-avatar-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                  </Button>
                  {currentUser?.avatarUrl && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={isUploadingAvatar}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
                {avatarSuccess && <p className="profile-avatar-success">{avatarSuccess}</p>}
                {avatarError && <p className="profile-avatar-error">{avatarError}</p>}
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="profile-edit-form">
              <Input
                label="Display Name *"
                id="edit-name"
                name="name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                maxLength={120}
              />

              <div className="input-group">
                <label htmlFor="edit-bio" className="input-label">
                  Biography (Short Academic Bio)
                </label>
                <textarea
                  id="edit-bio"
                  name="bio"
                  rows={3}
                  className="profile-textarea"
                  placeholder="Tell fellow scholars about your academic focus, major subjects, or study goals..."
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  maxLength={300}
                />
                <span className="profile-char-count">{editForm.bio.length} / 300 characters</span>
              </div>

              <Input
                label="University / College / Institution"
                id="edit-university"
                name="university"
                type="text"
                placeholder="e.g. Stanford University"
                value={editForm.university}
                onChange={(e) => setEditForm((prev) => ({ ...prev, university: e.target.value }))}
                maxLength={150}
              />

              <div className="profile-form-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="edit-course" className="input-label">
                    Academic Program / Degree
                  </label>
                  <select
                    id="edit-course"
                    className="profile-select"
                    value={editForm.courseId}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        courseId: e.target.value,
                        semester: '' // reset semester on course switch
                      }))
                    }
                  >
                    <option value="">Select an academic program...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ width: '160px' }}>
                  <label htmlFor="edit-semester" className="input-label">
                    Current Semester
                  </label>
                  <select
                    id="edit-semester"
                    className="profile-select"
                    value={editForm.semester}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, semester: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {availableSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingProfile}
                style={{ marginTop: '12px' }}
              >
                Save Academic Profile
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PRIVACY SETTINGS */}
      {activeTab === 'privacy' && (
        <div className="profile-tab-content">
          <div className="profile-section-card">
            <h2 className="profile-section-title">Profile Privacy Controls</h2>
            <p className="profile-section-desc">
              Choose what academic information and metrics are publicly visible to fellow scholars.
            </p>

            {privacySuccess && (
              <div className="auth-alert auth-alert--success" style={{ marginBottom: '16px' }}>
                <span>{privacySuccess}</span>
              </div>
            )}

            {privacyError && (
              <div className="auth-alert auth-alert--danger" style={{ marginBottom: '16px' }}>
                <span>{privacyError}</span>
              </div>
            )}

            <form onSubmit={handlePrivacySubmit} className="profile-privacy-form">
              <label className="profile-toggle-item">
                <input
                  type="checkbox"
                  checked={privacySettings.publicProfileEnabled}
                  onChange={(e) =>
                    setPrivacySettings((prev) => ({
                      ...prev,
                      publicProfileEnabled: e.target.checked
                    }))
                  }
                  className="profile-toggle-input"
                />
                <div className="profile-toggle-text">
                  <strong>Enable Public Contributor Profile</strong>
                  <span>
                    When enabled, other scholars can visit your contributor profile and see your
                    approved study notes. When disabled, your profile is completely private.
                  </span>
                </div>
              </label>

              <label className="profile-toggle-item">
                <input
                  type="checkbox"
                  checked={privacySettings.showAcademicInfo}
                  disabled={!privacySettings.publicProfileEnabled}
                  onChange={(e) =>
                    setPrivacySettings((prev) => ({
                      ...prev,
                      showAcademicInfo: e.target.checked
                    }))
                  }
                  className="profile-toggle-input"
                />
                <div className="profile-toggle-text">
                  <strong>Show Academic Information</strong>
                  <span>
                    Display your university, academic degree, and current semester on your public
                    profile.
                  </span>
                </div>
              </label>

              <label className="profile-toggle-item">
                <input
                  type="checkbox"
                  checked={privacySettings.showBio}
                  disabled={!privacySettings.publicProfileEnabled}
                  onChange={(e) =>
                    setPrivacySettings((prev) => ({ ...prev, showBio: e.target.checked }))
                  }
                  className="profile-toggle-input"
                />
                <div className="profile-toggle-text">
                  <strong>Show Biography</strong>
                  <span>Display your short personal biography on your public profile.</span>
                </div>
              </label>

              <label className="profile-toggle-item">
                <input
                  type="checkbox"
                  checked={privacySettings.showContributionStats}
                  disabled={!privacySettings.publicProfileEnabled}
                  onChange={(e) =>
                    setPrivacySettings((prev) => ({
                      ...prev,
                      showContributionStats: e.target.checked
                    }))
                  }
                  className="profile-toggle-input"
                />
                <div className="profile-toggle-text">
                  <strong>Show Contribution Statistics</strong>
                  <span>
                    Display your total approved manuscripts, community downloads, and average
                    resource rating publicly.
                  </span>
                </div>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingPrivacy}
                style={{ marginTop: '16px' }}
              >
                Save Privacy Preferences
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="profile-tab-content">
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

            <form
              onSubmit={handlePasswordChange}
              className="auth-form"
              style={{ maxWidth: '440px' }}
            >
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
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
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
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmNewPassword: e.target.value
                  }))
                }
                required
                autoComplete="new-password"
              />

              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-tertiary)',
                  margin: '0',
                  lineHeight: 'var(--line-normal)'
                }}
              >
                Must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 digit, and 1 special
                symbol (!@#$%^&*). Cannot match current password.
              </p>

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
      )}
    </div>
  );
}

export default ProfilePage;
