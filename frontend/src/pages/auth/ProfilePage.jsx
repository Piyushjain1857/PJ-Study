import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';
import profileService from '../../services/profileService.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import NoteCard from '../../components/notes/NoteCard.jsx';
import EmailNotificationSettings from '../../components/profile/EmailNotificationSettings.jsx';
import SEO from '../../components/common/SEO.jsx';
import './ProfilePage.css';
import './Auth.css';

/**
 * Scholar Personal Profile, Academic Identity, Uploads & Security Hub.
 */
export function ProfilePage() {
  const { user, isModerator, logout, updateUser } = useAuth();
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
    university: 'K.R. Mangalam University',
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
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Fetch full profile and statistics once on mount or when explicitly reloaded
  const fetchProfile = useCallback(
    async (options = {}) => {
      setIsLoadingProfile(true);
      try {
        const data = await profileService.getOwnProfile(options);
        setProfileData(data);
        if (data) {
          // Synchronize auth context user state safely with shallow-checked user fields
          updateUser({
            id: data.id,
            name: data.name,
            email: data.email,
            avatarUrl: data.avatarUrl,
            bio: data.bio,
            university: data.university,
            courseId: data.courseId,
            semester: data.semester,
            role: data.role,
            publicProfileEnabled: data.publicProfileEnabled,
            showAcademicInfo: data.showAcademicInfo,
            showBio: data.showBio,
            showContributionStats: data.showContributionStats
          });
          setEditForm({
            name: data.name || '',
            bio: data.bio || '',
            university: data.university || 'K.R. Mangalam University',
            courseId: data.courseId || '',
            semester:
              data.semester !== null && data.semester !== undefined ? String(data.semester) : ''
          });
        }
      } catch {
        // Fallback to user from ref if network fails
        const fallbackUser = userRef.current;
        if (fallbackUser) {
          setEditForm({
            name: fallbackUser.name || '',
            bio: fallbackUser.bio || '',
            university: fallbackUser.university || 'K.R. Mangalam University',
            courseId: fallbackUser.courseId || '',
            semester: fallbackUser.semester ? String(fallbackUser.semester) : ''
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    },
    [updateUser]
  );

  // Fetch academic options
  useEffect(() => {
    let isMounted = true;
    async function loadAcademicOptions() {
      try {
        const opts = await profileService.getAcademicOptions();
        if (isMounted) {
          setCourses(opts || []);
        }
      } catch {
        if (isMounted) {
          setCourses([]);
        }
      }
    }
    loadAcademicOptions();
    return () => {
      isMounted = false;
    };
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
    if (activeTab === 'uploads' && isModerator) {
      fetchUploads(1, uploadsStatus, uploadsSearch);
    }
  }, [activeTab, fetchUploads, uploadsStatus, uploadsSearch, isModerator]);

  useEffect(() => {
    if (!isModerator && activeTab === 'uploads') {
      setActiveTab('overview');
    }
  }, [isModerator, activeTab]);

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

  // Discard changes and reset form to current profile data
  function handleDiscardChanges() {
    const data = profileData || user;
    if (data) {
      setEditForm({
        name: data.name || '',
        bio: data.bio || '',
        university: data.university || '',
        courseId: data.courseId || '',
        semester:
          data.semester !== null && data.semester !== undefined ? String(data.semester) : ''
      });
      setProfileError('');
      setProfileSuccess('');
    }
  }

  // Sort canonical degree courses with preferred order
  const preferredCourseOrder = ['b.tech', 'bca', 'b.sc.', 'mca', 'm.tech'];

  const displayCourses = useMemo(() => {
    const rawList = Array.isArray(courses) ? courses : [];
    return [...rawList].sort((a, b) => {
      const idxA = preferredCourseOrder.indexOf(a.name?.toLowerCase().trim());
      const idxB = preferredCourseOrder.indexOf(b.name?.toLowerCase().trim());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [courses]);

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
        <SEO title="Profile & Security" noindex={true} />
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Loading Profile and academic records...
        </p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <SEO title="Profile & Security" noindex={true} />
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
            </div>

            <p className="profile-email">{currentUser?.email}</p>

            <div className="profile-badges">
              <Badge
                variant={
                  currentUser?.role === 'SUPER_ADMIN'
                    ? 'accent'
                    : currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
                      ? 'primary'
                      : 'secondary'
                }
                size="sm"
              >
                {currentUser?.role === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
                    ? 'Academic Admin'
                    : 'Scholar'}
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
        {isModerator && (
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
        )}
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
          aria-selected={activeTab === 'security'}
          className={`profile-tab ${activeTab === 'security' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security & Password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'email-notifications'}
          className={`profile-tab ${activeTab === 'email-notifications' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('email-notifications')}
        >
          Email Notifications
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="profile-tab-content">
          {/* Contribution Statistics Grid */}
          {isModerator ? (
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
          ) : (
            <div className="profile-stats-grid profile-stats-grid--scholar">
              <div className="profile-stat-box">
                <span className="profile-stat-number" style={{ color: '#1b4d3e' }}>
                  {stats?.totalDownloads ?? stats?.downloadsCount ?? 0}
                </span>
                <span className="profile-stat-label">Notes Downloaded</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-number" style={{ color: '#059669' }}>
                  {currentUser?.course?.name || 'Enrolled'}
                </span>
                <span className="profile-stat-label">Academic Program</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-number" style={{ color: '#1b4d3e' }}>
                  {currentUser?.semester ? `Semester ${currentUser.semester}` : 'Active'}
                </span>
                <span className="profile-stat-label">Current Standing</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-number" style={{ color: '#059669' }}>
                  Verified
                </span>
                <span className="profile-stat-label">Scholar Status</span>
              </div>
            </div>
          )}

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
                  {currentUser?.university || 'K.R. Mangalam University'}
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

      {/* TAB 2: MY UPLOADS (Moderators & Super Admin only) */}
      {isModerator && activeTab === 'uploads' && (
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
              {isModerator ? (
                <Link
                  to="/notes/new"
                  className="btn btn--primary btn--sm"
                  style={{ marginTop: '8px' }}
                >
                  + Upload a Study Note
                </Link>
              ) : (
                <Link
                  to="/notes/explore"
                  className="btn btn--outline btn--sm"
                  style={{ marginTop: '8px' }}
                >
                  Explore Study Notes
                </Link>
              )}
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
          <div className="profile-section-card profile-section-card--edit">
            <div className="profile-edit-header">
              <h2 className="profile-section-title">Edit Personal & Academic Identity</h2>
              <p className="profile-section-desc">
                Manage your scholar display name, biography, university affiliation, and curriculum
                semester.
              </p>
            </div>

            {profileSuccess && (
              <div className="auth-alert auth-alert--success" style={{ marginBottom: '20px' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '8px', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="auth-alert auth-alert--danger" style={{ marginBottom: '20px' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '8px', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="profile-edit-form">
              {/* SECTION 1: PROFILE PHOTO */}
              <div className="profile-edit-section">
                <div className="profile-edit-avatar-row">
                  <div className="profile-edit-avatar-preview">
                    <Avatar
                      name={currentUser?.name || 'Scholar'}
                      src={currentUser?.avatarUrl}
                      size="xl"
                    />
                  </div>
                  <div className="profile-edit-avatar-info">
                    <div className="profile-edit-avatar-title-row">
                      <h3 className="profile-edit-avatar-heading">Profile Photo</h3>
                      <span className="profile-avatar-chip">JPG, PNG, WebP · Max 5MB</span>
                    </div>
                    <p className="profile-edit-avatar-subtext">
                      Upload an academic photo or avatar. This image is saved permanently and
                      displayed across your dashboard, notes, and comments.
                    </p>
                    <div className="profile-edit-avatar-actions">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        icon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        }
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
                          icon={
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          }
                        >
                          Remove Photo
                        </Button>
                      )}
                    </div>
                    {avatarSuccess && <p className="profile-avatar-success">✓ {avatarSuccess}</p>}
                    {avatarError && <p className="profile-avatar-error">✕ {avatarError}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERSONAL IDENTITY */}
              <div className="profile-edit-section">
                <div className="profile-edit-section-header">
                  <span className="profile-edit-section-tag">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Personal Identity
                  </span>
                </div>

                <div className="profile-field-block">
                  <Input
                    label="Display Name"
                    id="edit-name"
                    name="name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    maxLength={120}
                    placeholder="Enter your full name or academic pen-name"
                  />
                </div>

                <div className="input-group profile-field-block">
                  <div className="profile-label-with-counter">
                    <label htmlFor="edit-bio" className="input-label">
                      Biography (Short Academic Bio)
                    </label>
                    <span className="profile-char-count-pill">{editForm.bio.length} / 300</span>
                  </div>
                  <textarea
                    id="edit-bio"
                    name="bio"
                    rows={3}
                    className="profile-textarea"
                    placeholder="Tell fellow scholars about your academic focus, major subjects, research interests, or study goals..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                    maxLength={300}
                  />
                </div>
              </div>

              {/* SECTION 3: ACADEMIC CURRICULUM */}
              <div className="profile-edit-section">
                <div className="profile-edit-section-header">
                  <span className="profile-edit-section-tag">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    Academic Curriculum & Institution
                  </span>
                </div>

                <div className="profile-field-block">
                  <Input
                    label="University / College / Institution"
                    id="edit-university"
                    name="university"
                    type="text"
                    placeholder="K.R. Mangalam University"
                    value={editForm.university}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, university: e.target.value }))
                    }
                    maxLength={150}
                  />
                </div>

                <div className="profile-form-grid-2">
                  <div className="input-group">
                    <label htmlFor="edit-course" className="input-label">
                      Academic Program / Degree
                    </label>
                    <div className="profile-select-wrapper">
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
                        {displayCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="profile-select-chevron"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="edit-semester" className="input-label">
                      Current Semester
                    </label>
                    <div className="profile-select-wrapper profile-select-wrapper--semester">
                      <select
                        id="edit-semester"
                        className="profile-select"
                        value={editForm.semester}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, semester: e.target.value }))
                        }
                      >
                        <option value="">Select semester...</option>
                        {availableSemesters.map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="profile-select-chevron"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="profile-edit-footer">
                <span className="profile-edit-footer-hint">
                  Saved updates reflect across all your published notes, reviews, and contributor
                  identity.
                </span>
                <div className="profile-edit-footer-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleDiscardChanges}
                    disabled={isSavingProfile}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSavingProfile}
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    }
                  >
                    Save Academic Profile
                  </Button>
                </div>
              </div>
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

      {/* TAB: EMAIL NOTIFICATIONS */}
      {activeTab === 'email-notifications' && (
        <div className="profile-tab-content">
          <EmailNotificationSettings />
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
