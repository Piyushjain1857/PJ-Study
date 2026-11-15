import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import adminService from '../../services/adminService.js';
import reviewService from '../../services/reviewService.js';
import { ROLES, canManageRole, ROLE_PERMISSIONS } from '../../utils/permissions.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { AnnouncementModal } from '../../components/notifications/AnnouncementModal.jsx';
import { formatRelativeTime } from '../../utils/formatTime.js';
import './AdminDashboardPage.css';
import '../auth/Auth.css';

/**
 * Editorial Academic Governance & Role Management Dashboard (V3 Production-Grade).
 */
export function AdminDashboardPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // User Directory State
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Review Moderation State
  const [reviewReports, setReviewReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState('OPEN');

  // Announcement Modal State
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  // Feedback notifications
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });

  // Role Change Modal State
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Suspend/Reactivate Modal State
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);
  const [suspendError, setSuspendError] = useState('');

  // Load KPI metrics
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch {
      // Non-blocking metric fetch
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch Users with explicit overrides to prevent stale closures
  const fetchUsers = useCallback(
    async (pageToLoad = 1, overrides = {}) => {
      setIsLoadingUsers(true);
      try {
        const qSearch = overrides.search !== undefined ? overrides.search : search;
        const qRole = overrides.role !== undefined ? overrides.role : roleFilter;
        const qStatus = overrides.status !== undefined ? overrides.status : statusFilter;

        const response = await adminService.getUsers({
          page: pageToLoad,
          limit: 10,
          search: qSearch.trim() || undefined,
          role: qRole || undefined,
          status: qStatus || undefined
        });

        const userList = response?.data || response?.items || [];
        setUsers(userList);

        const pag = response?.pagination || response?.meta || {};
        setPagination({
          page: pag.page || pageToLoad,
          limit: pag.limit || 10,
          total: pag.total ?? pag.totalItems ?? userList.length,
          totalPages: pag.totalPages || 1
        });
      } catch (err) {
        setActionNotice({
          type: 'danger',
          message: err.message || 'Failed to load user directory.'
        });
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [search, roleFilter, statusFilter]
  );

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async (pageToLoad = 1) => {
    setIsLoadingAudit(true);
    try {
      const response = await adminService.getAuditLogs({
        page: pageToLoad,
        limit: 15
      });
      const logList = response?.data || response?.items || [];
      setAuditLogs(logList);
      const pag = response?.pagination || response?.meta || {};
      setAuditPagination({
        page: pag.page || pageToLoad,
        limit: pag.limit || 15,
        total: pag.total ?? pag.totalItems ?? logList.length,
        totalPages: pag.totalPages || 1
      });
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to load audit logs.'
      });
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  // Fetch Review Reports
  const fetchReviewReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const response = await reviewService.getAdminReviewReports({
        page: 1,
        limit: 20,
        status: reportFilter || undefined
      });
      setReviewReports(response?.items || response?.data || []);
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to load review reports.'
      });
    } finally {
      setIsLoadingReports(false);
    }
  }, [reportFilter]);

  // Initial load on mount
  useEffect(() => {
    fetchStats();
    fetchUsers(1, { search: '', role: '', status: '' });
  }, []);

  // Tab change handler
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs(1);
    } else if (activeTab === 'reviews') {
      fetchReviewReports();
    } else if (activeTab === 'users' || activeTab === 'staff') {
      fetchUsers(1);
    }
  }, [activeTab]);

  // Handle Search Submission
  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchUsers(1, { search, role: roleFilter, status: statusFilter });
  }

  // Handle Role Filter Change
  function handleRoleChange(e) {
    const newRole = e.target.value;
    setRoleFilter(newRole);
    fetchUsers(1, { role: newRole });
  }

  // Handle Status Filter Change
  function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    fetchUsers(1, { status: newStatus });
  }

  // Handle Reset Filters
  function handleResetFilters() {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    fetchUsers(1, { search: '', role: '', status: '' });
  }

  // Refresh Console
  async function handleRefreshConsole() {
    setIsRefreshing(true);
    await Promise.all([
      fetchStats(),
      activeTab === 'audit'
        ? fetchAuditLogs(auditPagination.page)
        : activeTab === 'reviews'
          ? fetchReviewReports()
          : fetchUsers(pagination.page)
    ]);
    setTimeout(() => setIsRefreshing(false), 400);
  }

  // Open Role Modal
  function handleOpenRoleModal(user) {
    setRoleModalUser(user);
    setTargetRole(user.role);
    setRoleReason('');
    setRoleError('');
  }

  // Submit Role Change
  async function handleSubmitRoleChange(e) {
    e.preventDefault();
    if (!roleModalUser || !targetRole) return;

    if (roleModalUser.role === targetRole) {
      setRoleModalUser(null);
      return;
    }

    setIsSubmittingRole(true);
    setRoleError('');

    try {
      await adminService.changeUserRole(roleModalUser.id, targetRole, roleReason);
      setRoleModalUser(null);
      setActionNotice({
        type: 'success',
        message: `Successfully changed ${roleModalUser.name}'s role to ${targetRole}. All active sessions have been revoked.`
      });
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err) {
      setRoleError(err.message || 'Failed to change user role.');
    } finally {
      setIsSubmittingRole(false);
    }
  }

  // Open Suspend Confirmation Modal
  function handleOpenSuspendModal(user) {
    setSuspendModalUser(user);
    setSuspendError('');
  }

  // Submit Suspend / Reactivate
  async function handleSubmitSuspend() {
    if (!suspendModalUser) return;

    setIsSubmittingSuspend(true);
    setSuspendError('');

    const newActiveState = !suspendModalUser.isActive;

    try {
      await adminService.updateUser(suspendModalUser.id, {
        isActive: newActiveState,
        reason: newActiveState ? 'Reactivated by administrator' : 'Suspended by administrator'
      });
      setSuspendModalUser(null);
      setActionNotice({
        type: 'success',
        message: `User ${suspendModalUser.name} has been ${newActiveState ? 'reactivated' : 'suspended'}.`
      });
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err) {
      setSuspendError(err.message || 'Failed to update account status.');
    } finally {
      setIsSubmittingSuspend(false);
    }
  }

  // Handle Review Moderation Actions
  async function handleHideReviewAction(reviewId) {
    try {
      await reviewService.adminHideReview(reviewId, 'Violates academic respect guidelines');
      setActionNotice({
        type: 'success',
        message: 'Review successfully hidden from public catalog.'
      });
      fetchReviewReports();
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to hide review.'
      });
    }
  }

  async function handleRestoreReviewAction(reviewId) {
    try {
      await reviewService.adminRestoreReview(reviewId);
      setActionNotice({
        type: 'success',
        message: 'Review restored to visible status.'
      });
      fetchReviewReports();
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to restore review.'
      });
    }
  }

  async function handleDismissReportAction(reportId) {
    try {
      await reviewService.adminDismissReport(reportId);
      setActionNotice({
        type: 'success',
        message: 'Report dismissed.'
      });
      fetchReviewReports();
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to dismiss report.'
      });
    }
  }

  // Render Role Badge with Icons
  function renderRoleBadge(role) {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return (
          <span className="admin-role-badge admin-role-badge--super">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Super Admin
          </span>
        );
      case ROLES.ADMIN:
        return (
          <span className="admin-role-badge admin-role-badge--admin">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin
          </span>
        );
      case ROLES.MODERATOR:
        return (
          <span className="admin-role-badge admin-role-badge--moderator">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Moderator
          </span>
        );
      default:
        return (
          <span className="admin-role-badge admin-role-badge--student">
            <svg
              width="11"
              height="11"
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
            Student
          </span>
        );
    }
  }

  // Helper for human-readable audit detail text
  function formatAuditDetails(log) {
    if (!log.metadata) return 'No additional context provided';
    const m = log.metadata;
    if (m.oldRole && m.newRole) {
      return `Role changed from ${m.oldRole} → ${m.newRole}${m.reason ? ` (${m.reason})` : ''}`;
    }
    if (m.reason) {
      return m.reason;
    }
    if (typeof m === 'object') {
      const keys = Object.keys(m);
      if (keys.length === 0) return '—';
      return keys.map((k) => `${k}: ${String(m[k])}`).join(', ');
    }
    return String(m);
  }

  const hasActiveFilters = Boolean(search || roleFilter || statusFilter);

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header__left">
            <span className="admin-header__badge">
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Academic Governance
            </span>
            <h1 className="admin-header__title">Role-Based Access Control</h1>
            <p className="admin-header__subtitle">
              Manage university scholar accounts, faculty moderators, access permissions, and
              governance audit trails.
            </p>
          </div>

          <div className="admin-header__actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAnnouncementOpen(true)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '6px' }}
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              Broadcast Notice
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshConsole}
              disabled={isRefreshing}
              title="Refresh console metrics and tables"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isRefreshing ? 'admin-spin-icon' : ''}
                style={{ marginRight: '6px' }}
                aria-hidden="true"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </header>

        {/* Global Action Notice */}
        {actionNotice.message && (
          <div
            className={`auth-alert auth-alert--${actionNotice.type}`}
            style={{
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{actionNotice.message}</span>
            <button
              type="button"
              onClick={() => setActionNotice({ type: '', message: '' })}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'inherit'
              }}
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI Metrics */}
        {isLoadingStats && !stats ? (
          <div className="admin-metrics">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="admin-metric-card">
                <Skeleton height="20px" width="60%" style={{ marginBottom: '12px' }} />
                <Skeleton height="36px" width="40%" style={{ marginBottom: '8px' }} />
                <Skeleton height="14px" width="70%" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="admin-metrics">
            <div className="admin-metric-card">
              <div className="admin-metric-card__top">
                <span className="admin-metric-card__label">Total Scholars</span>
                <span className="admin-metric-card__icon admin-metric-card__icon--blue">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
              </div>
              <p className="admin-metric-card__value">{stats.totalUsers}</p>
              <div className="admin-metric-card__footer">
                <span className="admin-metric-card__subtext">Enrolled university accounts</span>
                <span className="admin-metric-card__pill admin-metric-card__pill--blue">
                  All Courses
                </span>
              </div>
            </div>

            <div className="admin-metric-card">
              <div className="admin-metric-card__top">
                <span className="admin-metric-card__label">Active Accounts</span>
                <span className="admin-metric-card__icon admin-metric-card__icon--green">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
              </div>
              <p className="admin-metric-card__value" style={{ color: 'var(--color-success)' }}>
                {stats.activeUsers}
              </p>
              <div className="admin-metric-card__footer">
                <span className="admin-metric-card__subtext">Good academic standing</span>
                <span className="admin-metric-card__pill admin-metric-card__pill--green">
                  {Math.round(((stats.activeUsers || 0) / (stats.totalUsers || 1)) * 100)}% Verified
                </span>
              </div>
            </div>

            <div className="admin-metric-card">
              <div className="admin-metric-card__top">
                <span className="admin-metric-card__label">Suspended Accounts</span>
                <span className="admin-metric-card__icon admin-metric-card__icon--red">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </span>
              </div>
              <p
                className="admin-metric-card__value"
                style={{
                  color:
                    stats.suspendedUsers > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)'
                }}
              >
                {stats.suspendedUsers}
              </p>
              <div className="admin-metric-card__footer">
                <span className="admin-metric-card__subtext">Access restricted</span>
                {stats.suspendedUsers > 0 ? (
                  <span className="admin-metric-card__pill admin-metric-card__pill--red">
                    Hold Active
                  </span>
                ) : (
                  <span className="admin-metric-card__pill admin-metric-card__pill--green">
                    Zero Holds
                  </span>
                )}
              </div>
            </div>

            <div className="admin-metric-card">
              <div className="admin-metric-card__top">
                <span className="admin-metric-card__label">Staff & Governance</span>
                <span className="admin-metric-card__icon admin-metric-card__icon--purple">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
              </div>
              <p className="admin-metric-card__value">
                {(stats.roles?.MODERATOR || 0) +
                  (stats.roles?.ADMIN || 0) +
                  (stats.roles?.SUPER_ADMIN || 0)}
              </p>
              <div className="admin-metric-card__footer">
                <span className="admin-metric-card__subtext">Faculty evaluators & staff</span>
                <span className="admin-metric-card__pill admin-metric-card__pill--purple">
                  {stats.roles?.MODERATOR || 0} Mod ·{' '}
                  {(stats.roles?.ADMIN || 0) + (stats.roles?.SUPER_ADMIN || 0)} Adm
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab Navigation */}
        <nav className="admin-tabs" aria-label="Administrative Views">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'users' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            User Directory
            {stats && <span className="admin-tab-count">{stats.totalUsers}</span>}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'staff' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Staff & Moderators
            {stats && (
              <span className="admin-tab-count">
                {(stats.roles?.MODERATOR || 0) +
                  (stats.roles?.ADMIN || 0) +
                  (stats.roles?.SUPER_ADMIN || 0)}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'audit' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
            Audit Log Trail
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Review Moderation
            {reviewReports.length > 0 && (
              <span
                className="admin-tab-count"
                style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#ca8a04' }}
              >
                {reviewReports.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'matrix' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Permissions Matrix
          </button>
        </nav>

        {/* TAB 1: USER DIRECTORY & TAB 2: STAFF */}
        {(activeTab === 'users' || activeTab === 'staff') && (
          <div>
            {/* Toolbar */}
            <div className="admin-toolbar">
              <form onSubmit={handleSearchSubmit} className="admin-toolbar__form">
                <div className="admin-search-wrapper">
                  <svg
                    className="admin-search-icon"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search by scholar name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="admin-search-input"
                    aria-label="Search scholars by name or email"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        fetchUsers(1, { search: '' });
                      }}
                      className="admin-search-clear"
                      title="Clear search query"
                      aria-label="Clear search query"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {activeTab === 'users' && (
                  <div className="admin-select-wrapper">
                    <select
                      className="admin-select"
                      value={roleFilter}
                      onChange={handleRoleChange}
                      aria-label="Filter by role"
                    >
                      <option value="">All Roles</option>
                      <option value="STUDENT">Students</option>
                      <option value="MODERATOR">Moderators</option>
                      <option value="ADMIN">Admins</option>
                      <option value="SUPER_ADMIN">Super Admins</option>
                    </select>
                    <svg
                      className="admin-select-chevron"
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
                )}

                <div className="admin-select-wrapper">
                  <select
                    className="admin-select"
                    value={statusFilter}
                    onChange={handleStatusChange}
                    aria-label="Filter by status"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active Accounts</option>
                    <option value="suspended">Suspended Accounts</option>
                  </select>
                  <svg
                    className="admin-select-chevron"
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

                <Button type="submit" variant="primary" size="sm">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '5px' }}
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Filter
                </Button>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    title="Reset all filters"
                  >
                    ✕ Clear
                  </Button>
                )}
              </form>

              <div className="admin-toolbar__count">
                <span className="admin-count-pill">
                  {pagination.total} {pagination.total === 1 ? 'scholar' : 'scholars'}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="admin-table-container">
              {isLoadingUsers ? (
                <div style={{ padding: '24px' }}>
                  <Skeleton height="40px" count={5} style={{ marginBottom: '12px' }} />
                </div>
              ) : users.length === 0 ? (
                <EmptyState
                  title="No scholars found"
                  description="No accounts match your current search and role filters."
                  action={
                    hasActiveFilters ? (
                      <Button variant="outline" size="sm" onClick={handleResetFilters}>
                        Reset all filters
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Scholar</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((u) =>
                        activeTab === 'staff'
                          ? u.role === ROLES.MODERATOR ||
                            u.role === ROLES.ADMIN ||
                            u.role === ROLES.SUPER_ADMIN
                          : true
                      )
                      .map((userItem) => {
                        const isSelf = userItem.id === currentUser.id;
                        const canChangeRole =
                          !isSelf && canManageRole(currentUser.role, userItem.role, ROLES.STUDENT);
                        const canSuspend =
                          !isSelf &&
                          (isSuperAdmin ||
                            (currentUser.role === ROLES.ADMIN &&
                              userItem.role !== ROLES.ADMIN &&
                              userItem.role !== ROLES.SUPER_ADMIN));

                        return (
                          <tr key={userItem.id}>
                            <td>
                              <div className="admin-user-cell">
                                <Avatar name={userItem.name} src={userItem.avatarUrl} size="sm" />
                                <div>
                                  <p className="admin-user-cell__name">
                                    {userItem.name}
                                    {isSelf && <span className="admin-self-pill">You</span>}
                                  </p>
                                  <span className="admin-user-cell__meta">
                                    ID: {userItem.id ? userItem.id.slice(0, 8) : '—'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="admin-email-text">{userItem.email}</span>
                            </td>
                            <td>{renderRoleBadge(userItem.role)}</td>
                            <td>
                              <span
                                className={`admin-status-pill ${
                                  userItem.isActive
                                    ? 'admin-status-pill--active'
                                    : 'admin-status-pill--suspended'
                                }`}
                              >
                                <span className="admin-status-pill__dot" />
                                {userItem.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td>
                              <span className="admin-date-text">
                                {new Date(userItem.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="admin-actions-cell">
                                <button
                                  type="button"
                                  className="admin-action-btn admin-action-btn--role"
                                  disabled={!canChangeRole}
                                  onClick={() => handleOpenRoleModal(userItem)}
                                  title={
                                    isSelf
                                      ? 'You cannot change your own role'
                                      : !canChangeRole
                                        ? 'Insufficient privileges to manage this role'
                                        : 'Change user role'
                                  }
                                >
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
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <polyline points="16 11 18 13 22 9" />
                                  </svg>
                                  Change Role
                                </button>

                                <button
                                  type="button"
                                  className={`admin-action-btn ${
                                    userItem.isActive
                                      ? 'admin-action-btn--suspend'
                                      : 'admin-action-btn--reactivate'
                                  }`}
                                  disabled={!canSuspend}
                                  onClick={() => handleOpenSuspendModal(userItem)}
                                  title={
                                    isSelf
                                      ? 'You cannot suspend yourself'
                                      : !canSuspend
                                        ? 'Cannot suspend this administrator'
                                        : userItem.isActive
                                          ? 'Suspend user account'
                                          : 'Reactivate user account'
                                  }
                                >
                                  {userItem.isActive ? (
                                    <>
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
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                      </svg>
                                      Suspend
                                    </>
                                  ) : (
                                    <>
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
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                      </svg>
                                      Reactivate
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="admin-pagination">
                  <span className="admin-pagination__info">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total
                    accounts)
                  </span>
                  <div className="admin-pagination__actions">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchUsers(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchUsers(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOG TRAIL */}
        {activeTab === 'audit' && (
          <div className="admin-table-container">
            {isLoadingAudit ? (
              <div style={{ padding: '24px' }}>
                <Skeleton height="36px" count={6} style={{ marginBottom: '12px' }} />
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState
                title="No audit entries recorded"
                description="Administrative actions and role updates will appear here."
              />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Event Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--text-xs)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatRelativeTime(log.createdAt)}
                        <span
                          style={{
                            display: 'block',
                            fontSize: '10px',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td>
                        {log.actor ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar name={log.actor.name} size="xs" />
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {log.actor.name}
                              </span>
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: '11px',
                                  color: 'var(--color-text-secondary)'
                                }}
                              >
                                {log.actor.role}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-secondary)' }}>System</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={
                            log.action.includes('SUSPEND')
                              ? 'danger'
                              : log.action.includes('ROLE')
                                ? 'accent'
                                : 'primary'
                          }
                          size="sm"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>
                        <span style={{ fontWeight: 500 }}>{log.entityType}</span>
                        <span
                          style={{
                            display: 'block',
                            color: 'var(--color-text-muted)',
                            fontSize: '11px'
                          }}
                        >
                          ID: {log.entityId ? log.entityId.slice(0, 8) + '...' : '—'}
                        </span>
                      </td>
                      <td
                        style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}
                      >
                        {formatAuditDetails(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {auditPagination.totalPages > 1 && (
              <div className="admin-pagination">
                <span className="admin-pagination__info">
                  Page {auditPagination.page} of {auditPagination.totalPages}
                </span>
                <div className="admin-pagination__actions">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPagination.page <= 1}
                    onClick={() => fetchAuditLogs(auditPagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPagination.page >= auditPagination.totalPages}
                    onClick={() => fetchAuditLogs(auditPagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERMISSIONS MATRIX */}
        {activeTab === 'matrix' && (
          <div className="admin-table-container">
            <table className="admin-table matrix-table">
              <thead>
                <tr>
                  <th>Platform Capability</th>
                  <th style={{ textAlign: 'center' }}>Student</th>
                  <th style={{ textAlign: 'center' }}>Moderator</th>
                  <th style={{ textAlign: 'center' }}>Admin</th>
                  <th style={{ textAlign: 'center' }}>Super Admin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Browse public study notes', perm: 'notes:read' },
                  { label: 'Create personal notes', perm: 'notes:create' },
                  { label: 'Edit & delete own notes', perm: 'notes:update_own' },
                  { label: 'Submit notes for review', perm: 'notes:submit_review' },
                  { label: 'Review submitted notes', perm: 'notes:review' },
                  { label: 'Approve or reject notes', perm: 'notes:approve' },
                  { label: 'Manage categories & subjects', perm: 'categories:manage' },
                  { label: 'Inspect user accounts', perm: 'users:read' },
                  { label: 'Suspend or reactivate accounts', perm: 'users:suspend' },
                  { label: 'Change user roles (Student ↔ Moderator)', perm: 'users:change_role' },
                  { label: 'Manage administrators & moderators', perm: 'admins:manage' },
                  { label: 'Configure system settings', perm: 'settings:manage' },
                  { label: 'View audit logs', perm: 'audit_logs:read' }
                ].map((row, idx) => {
                  const hasStudent = ROLE_PERMISSIONS[ROLES.STUDENT].includes(row.perm);
                  const hasMod = ROLE_PERMISSIONS[ROLES.MODERATOR].includes(row.perm);
                  const hasAdmin = ROLE_PERMISSIONS[ROLES.ADMIN].includes(row.perm);
                  const hasSuper = ROLE_PERMISSIONS[ROLES.SUPER_ADMIN].includes(row.perm);

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{row.label}</td>
                      <td style={{ textAlign: 'center' }}>
                        {hasStudent ? (
                          <span className="matrix-check">✓ Granted</span>
                        ) : (
                          <span className="matrix-cross">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasMod ? (
                          <span className="matrix-check">✓ Granted</span>
                        ) : (
                          <span className="matrix-cross">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasAdmin ? (
                          <span className="matrix-check">✓ Granted</span>
                        ) : (
                          <span className="matrix-cross">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasSuper ? (
                          <span className="matrix-check">✓ Granted</span>
                        ) : (
                          <span className="matrix-cross">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: REVIEW MODERATION */}
        {activeTab === 'reviews' && (
          <div>
            <div className="admin-toolbar" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  Filter Reports:
                </span>
                <div className="admin-select-wrapper">
                  <select
                    value={reportFilter}
                    onChange={(e) => setReportFilter(e.target.value)}
                    className="admin-select"
                    aria-label="Filter review reports"
                  >
                    <option value="OPEN">Open Reports</option>
                    <option value="ACTIONED">Actioned</option>
                    <option value="DISMISSED">Dismissed</option>
                    <option value="">All Reports</option>
                  </select>
                  <svg
                    className="admin-select-chevron"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReviewReports()}
                isLoading={isLoadingReports}
              >
                ↻ Refresh Queue
              </Button>
            </div>

            {isLoadingReports ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton height={60} count={4} />
              </div>
            ) : reviewReports.length === 0 ? (
              <EmptyState
                title="No reported reviews"
                description={
                  reportFilter === 'OPEN'
                    ? 'The review moderation queue is clear. No active reports require attention.'
                    : 'No reports match the selected filter.'
                }
              />
            ) : (
              <div className="admin-table-container">
                <table className="admin-table rev-mod-table">
                  <thead>
                    <tr>
                      <th>Manuscript & Author</th>
                      <th>Rating & Review</th>
                      <th>Report Reason</th>
                      <th>Reporter</th>
                      <th>Review Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewReports.map((report) => {
                      const review = report.review;
                      return (
                        <tr key={report.id}>
                          <td>
                            <strong>{review?.note?.title || 'Unknown Note'}</strong>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)',
                                marginTop: '2px'
                              }}
                            >
                              By {review?.user?.name || review?.user?.email || 'Scholar'}
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginBottom: '4px'
                              }}
                            >
                              <span style={{ color: '#eab308' }}>★</span>
                              <strong>{review?.rating} / 5</strong>
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-secondary)',
                                maxWidth: '280px'
                              }}
                            >
                              {review?.comment || (
                                <em style={{ color: 'var(--color-text-muted)' }}>
                                  No written critique
                                </em>
                              )}
                            </p>
                          </td>
                          <td>
                            <Badge
                              variant={report.reason === 'OFFENSIVE' ? 'accent' : 'warning'}
                              size="sm"
                            >
                              {report.reason}
                            </Badge>
                            {report.description && (
                              <p
                                style={{
                                  margin: '4px 0 0',
                                  fontSize: '11px',
                                  color: 'var(--color-text-secondary)'
                                }}
                              >
                                &ldquo;{report.description}&rdquo;
                              </p>
                            )}
                          </td>
                          <td>
                            <span>
                              {report.reporter?.name || report.reporter?.email || 'Scholar'}
                            </span>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--color-text-muted)',
                                marginTop: '2px'
                              }}
                            >
                              {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <Badge
                              variant={review?.status === 'VISIBLE' ? 'success' : 'neutral'}
                              size="sm"
                            >
                              {review?.status || 'VISIBLE'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}
                            >
                              {review?.status === 'VISIBLE' ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleHideReviewAction(review.id)}
                                >
                                  Hide Review
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestoreReviewAction(review.id)}
                                >
                                  Restore
                                </Button>
                              )}
                              {report.status === 'OPEN' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDismissReportAction(report.id)}
                                >
                                  Dismiss Report
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ROLE CHANGE MODAL */}
        <Modal
          isOpen={Boolean(roleModalUser)}
          onClose={() => setRoleModalUser(null)}
          title="Modify Scholar Role"
        >
          {roleModalUser && (
            <form onSubmit={handleSubmitRoleChange} className="admin-modal-content">
              {roleError && (
                <div className="auth-alert auth-alert--danger">
                  <span>{roleError}</span>
                </div>
              )}

              <div className="admin-modal-user-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar name={roleModalUser.name} src={roleModalUser.avatarUrl} size="sm" />
                  <div>
                    <strong style={{ display: 'block' }}>{roleModalUser.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {roleModalUser.email}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                  Current Role: <strong>{roleModalUser.role}</strong>
                </div>
              </div>

              <div>
                <label
                  htmlFor="select-target-role"
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    marginBottom: '6px'
                  }}
                >
                  Assign New Role
                </label>
                <select
                  id="select-target-role"
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value={ROLES.STUDENT}>Student (Regular Scholar)</option>
                  <option value={ROLES.MODERATOR}>Moderator (Note Evaluator)</option>
                  {isSuperAdmin && (
                    <>
                      <option value={ROLES.ADMIN}>Administrator (Curriculum & Users)</option>
                      <option value={ROLES.SUPER_ADMIN}>Super Administrator (Full System)</option>
                    </>
                  )}
                </select>
              </div>

              <Input
                label="Reason for Role Change (Audit Record)"
                placeholder="e.g. Promoted to faculty peer reviewer"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
              />

              <p
                className="admin-modal-desc"
                style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }}
              >
                ⚠️ Notice: Modifying this user's role will immediately invalidate all their active
                multi-device sessions. They will be required to log in again.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '12px'
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setRoleModalUser(null)}
                  disabled={isSubmittingRole}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isSubmittingRole}>
                  Confirm Role Change
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* SUSPEND / REACTIVATE CONFIRMATION MODAL */}
        <Modal
          isOpen={Boolean(suspendModalUser)}
          onClose={() => setSuspendModalUser(null)}
          title={suspendModalUser?.isActive ? 'Suspend User Account' : 'Reactivate User Account'}
        >
          {suspendModalUser && (
            <div className="admin-modal-content">
              {suspendError && (
                <div className="auth-alert auth-alert--danger">
                  <span>{suspendError}</span>
                </div>
              )}

              <p className="admin-modal-desc">
                Are you sure you want to {suspendModalUser.isActive ? 'suspend' : 'reactivate'} the
                account for <strong>{suspendModalUser.name}</strong> ({suspendModalUser.email})?
              </p>

              {suspendModalUser.isActive && (
                <p className="admin-modal-desc" style={{ color: 'var(--color-danger)' }}>
                  This will immediately terminate all active sessions and prevent the scholar from
                  accessing any study resources or notes until reactivated.
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '12px'
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSuspendModalUser(null)}
                  disabled={isSubmittingSuspend}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={suspendModalUser.isActive ? 'danger' : 'primary'}
                  size="md"
                  isLoading={isSubmittingSuspend}
                  onClick={handleSubmitSuspend}
                >
                  Confirm {suspendModalUser.isActive ? 'Suspension' : 'Reactivation'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* BROADCAST ANNOUNCEMENT MODAL (STEP 14) */}
        <AnnouncementModal
          isOpen={isAnnouncementOpen}
          onClose={() => setIsAnnouncementOpen(false)}
          onSuccess={(result) => {
            setActionNotice({
              type: 'success',
              message: `Announcement broadcast successfully to ${result?.recipientCount || 0} scholars!`
            });
          }}
        />
      </div>
    </div>
  );
}

export default AdminDashboardPage;
