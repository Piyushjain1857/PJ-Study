import { useState, useEffect, useCallback } from 'react';
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
import './AdminDashboardPage.css';
import '../auth/Auth.css';

/**
 * Editorial Academic Governance & Role Management Dashboard.
 */
export function AdminDashboardPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);

  // User Directory State
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

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
      const data = await adminService.getStats();
      setStats(data);
    } catch {
      // Non-blocking metric fetch
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(
    async (pageToLoad = 1) => {
      setIsLoadingUsers(true);
      setActionNotice({ type: '', message: '' });
      try {
        const response = await adminService.getUsers({
          page: pageToLoad,
          limit: 10,
          search: search.trim() || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined
        });
        setUsers(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
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
      setAuditLogs(response.data || []);
      if (response.pagination) {
        setAuditPagination(response.pagination);
      }
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to load audit logs.'
      });
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchUsers(1);
  }, [fetchStats, fetchUsers]);

  // Load audit logs when switching to audit tab
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs(1);
    }
  }, [activeTab, fetchAuditLogs]);

  // Fetch Review Reports
  const fetchReviewReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const response = await reviewService.getAdminReviewReports({
        page: 1,
        limit: 20,
        status: reportFilter || undefined
      });
      setReviewReports(response.items || []);
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to load review reports.'
      });
    } finally {
      setIsLoadingReports(false);
    }
  }, [reportFilter]);

  // Load review reports when switching to reviews tab
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviewReports();
    }
  }, [activeTab, fetchReviewReports]);

  // Handle Search Submission
  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchUsers(1);
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

  // Render Role Badge
  function renderRoleBadge(role) {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return (
          <Badge variant="accent" size="sm">
            Super Admin
          </Badge>
        );
      case ROLES.ADMIN:
        return (
          <Badge variant="primary" size="sm">
            Admin
          </Badge>
        );
      case ROLES.MODERATOR:
        return (
          <Badge variant="warning" size="sm">
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Student
          </Badge>
        );
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Header */}
        <header className="admin-header">
          <span className="admin-header__badge">Academic Governance</span>
          <h1 className="admin-header__title">Role-Based Access Control</h1>
          <p className="admin-header__subtitle">
            Manage university student accounts, faculty moderators, and audit compliance logs.
          </p>
        </header>

        {/* Global Action Banner */}
        {actionNotice.message && (
          <div
            className={`auth-alert auth-alert--${actionNotice.type}`}
            style={{ marginBottom: '24px' }}
          >
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* KPI Metrics */}
        {stats && (
          <div className="admin-metrics">
            <div className="admin-metric-card">
              <div className="admin-metric-card__label">Total Scholars</div>
              <p className="admin-metric-card__value">{stats.totalUsers}</p>
            </div>
            <div className="admin-metric-card">
              <div className="admin-metric-card__label">Active Accounts</div>
              <p className="admin-metric-card__value" style={{ color: 'var(--color-success)' }}>
                {stats.activeUsers}
              </p>
            </div>
            <div className="admin-metric-card">
              <div className="admin-metric-card__label">Suspended</div>
              <p className="admin-metric-card__value" style={{ color: 'var(--color-danger)' }}>
                {stats.suspendedUsers}
              </p>
            </div>
            <div className="admin-metric-card">
              <div className="admin-metric-card__label">Moderators & Admins</div>
              <p className="admin-metric-card__value">
                {(stats.roles?.MODERATOR || 0) +
                  (stats.roles?.ADMIN || 0) +
                  (stats.roles?.SUPER_ADMIN || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <nav className="admin-tabs" aria-label="Administrative Views">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'users' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Directory
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'staff' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff & Moderators
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'audit' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Log Trail
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Review Moderation
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'matrix' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
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
                    placeholder="Search name or email..."
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
                        fetchUsers(1);
                      }}
                      className="admin-search-clear"
                      title="Clear search"
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
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        fetchUsers(1);
                      }}
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
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      fetchUsers(1);
                    }}
                    aria-label="Filter by status"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="suspended">Suspended Only</option>
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
                  Search
                </Button>

                {(search || roleFilter || statusFilter) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('');
                      setStatusFilter('');
                      fetchUsers(1);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </form>

              <div className="admin-toolbar__count">
                <span>
                  {pagination.total} {pagination.total === 1 ? 'scholar' : 'scholars'}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="admin-table-container">
              {isLoadingUsers ? (
                <div style={{ padding: '24px' }}>
                  <Skeleton height="36px" count={5} style={{ marginBottom: '12px' }} />
                </div>
              ) : users.length === 0 ? (
                <EmptyState
                  title="No scholars found"
                  description="No accounts match your current search and role filters."
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
                      <th>Actions</th>
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
                                    {userItem.name} {isSelf && '(You)'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  color: 'var(--color-text-secondary)',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {userItem.email}
                              </span>
                            </td>
                            <td>{renderRoleBadge(userItem.role)}</td>
                            <td>
                              {userItem.isActive ? (
                                <Badge variant="success" size="sm">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="danger" size="sm">
                                  Suspended
                                </Badge>
                              )}
                            </td>
                            <td
                              style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}
                            >
                              {new Date(userItem.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="admin-actions-cell">
                                <Button
                                  variant="outline"
                                  size="sm"
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
                                  Change Role
                                </Button>

                                <Button
                                  variant={userItem.isActive ? 'ghost' : 'secondary'}
                                  size="sm"
                                  disabled={!canSuspend}
                                  onClick={() => handleOpenSuspendModal(userItem)}
                                  title={
                                    isSelf
                                      ? 'You cannot suspend yourself'
                                      : !canSuspend
                                        ? 'Cannot suspend this administrator'
                                        : userItem.isActive
                                          ? 'Suspend user'
                                          : 'Reactivate user'
                                  }
                                >
                                  {userItem.isActive ? 'Suspend' : 'Reactivate'}
                                </Button>
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
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.825rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        {log.actor ? (
                          <div>
                            <span style={{ fontWeight: 600 }}>{log.actor.name}</span>
                            <span
                              style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)'
                              }}
                            >
                              {log.actor.role}
                            </span>
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
                      <td style={{ fontSize: '0.85rem' }}>
                        {log.entityType} ({log.entityId.slice(0, 8)}...)
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
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
                          <span className="matrix-check">✓ Yes</span>
                        ) : (
                          <span className="matrix-cross">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasMod ? (
                          <span className="matrix-check">✓ Yes</span>
                        ) : (
                          <span className="matrix-cross">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasAdmin ? (
                          <span className="matrix-check">✓ Yes</span>
                        ) : (
                          <span className="matrix-cross">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasSuper ? (
                          <span className="matrix-check">✓ Yes</span>
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

        {/* TAB: REVIEW MODERATION */}
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
                              style={{ fontSize: '0.75rem', color: '#74756f', marginTop: '2px' }}
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
                                fontSize: '0.8125rem',
                                color: '#334155',
                                maxWidth: '280px'
                              }}
                            >
                              {review?.comment || (
                                <em style={{ color: '#94a3b8' }}>No written critique</em>
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
                                style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}
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
                              style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}
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
                    fontSize: '0.9rem',
                    fontWeight: 600,
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
      </div>
    </div>
  );
}

export default AdminDashboardPage;
