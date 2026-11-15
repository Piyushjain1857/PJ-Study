import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
import SEO from '../../components/common/SEO.jsx';
import './AdminDashboardPage.css';
import '../auth/Auth.css';

/**
 * Editorial Academic Governance & Role Management Dashboard (V3 Production-Grade).
 */
export function AdminDashboardPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  // Command Center Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState('30d');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Notes Directory & Moderation State
  const [adminNotes, setAdminNotes] = useState([]);
  const [notesPagination, setNotesPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [notesSearch, setNotesSearch] = useState('');
  const [notesStatusFilter, setNotesStatusFilter] = useState('ALL');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [rejectModalNote, setRejectModalNote] = useState(null);
  const [noteRejectionReason, setNoteRejectionReason] = useState('');
  const [isSubmittingNoteAction, setIsSubmittingNoteAction] = useState(false);

  // Live Activity & Audit Stream State
  const [liveActivity, setLiveActivity] = useState([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Content Reports State
  const [contentReports, setContentReports] = useState([]);
  const [isLoadingContentReports, setIsLoadingContentReports] = useState(false);

  // Platform Announcements State
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'PJ Study',
    tagline: 'Your Entire Study World, One Place.',
    maxUploadSizeMb: '25',
    allowedFileFormats: 'application/pdf,image/jpeg,image/png',
    autoModerationEnabled: 'false',
    allowStudentReviews: 'true'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState('');

  // System Diagnostics, Storage & Backup State
  const [systemHealth, setSystemHealth] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [isLoadingSystem, setIsLoadingSystem] = useState(false);
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

  // Academic Architecture State (Step 16)
  const [academicSubTab, setAcademicSubTab] = useState('universities');
  const [academics, setAcademics] = useState({
    universities: [],
    schools: [],
    courses: [],
    subjects: [],
    categories: [],
    summary: {}
  });
  const [isLoadingAcademics, setIsLoadingAcademics] = useState(false);
  const [academicSearch, setAcademicSearch] = useState('');
  const [academicStatusFilter, setAcademicStatusFilter] = useState('ALL');
  const [subjectCourseFilter, setSubjectCourseFilter] = useState('');

  // Academic Modal State (Create, Edit, Delete)
  const [academicModal, setAcademicModal] = useState({
    isOpen: false,
    type: null, // 'university' | 'school' | 'course' | 'subject' | 'category' | 'delete'
    mode: 'create', // 'create' | 'edit'
    entity: null
  });
  const [academicFormData, setAcademicFormData] = useState({});
  const [isSubmittingAcademic, setIsSubmittingAcademic] = useState(false);
  const [academicModalError, setAcademicModalError] = useState('');

  // Load Command Center Overview metrics
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const data = await adminService.getOverview();
      setStats(data);
    } catch {
      try {
        const fallback = await adminService.getStats();
        setStats(fallback);
      } catch {
        // Non-blocking metric fetch
      }
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch Advanced Analytics
  const fetchAnalytics = useCallback(async (range = '30d') => {
    setIsLoadingAnalytics(true);
    try {
      const data = await adminService.getAnalytics(range);
      setAnalyticsData(data);
    } catch (err) {
      setActionNotice({ type: 'danger', message: err.message || 'Failed to load analytics.' });
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Fetch Live Activity Feed
  const fetchLiveActivity = useCallback(async (limit = 20) => {
    setIsLoadingActivity(true);
    try {
      const data = await adminService.getLiveActivity(limit);
      setLiveActivity(data || []);
    } catch {
      // Non-blocking activity fetch
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  // Fetch Notes for Administration & Moderation
  const fetchNotes = useCallback(async (pageToLoad = 1, overrides = {}) => {
    setIsLoadingNotes(true);
    try {
      const qSearch = overrides.search !== undefined ? overrides.search : notesSearch;
      const qStatus = overrides.status !== undefined ? overrides.status : notesStatusFilter;

      const response = await adminService.getNotes({
        page: pageToLoad,
        limit: 10,
        search: qSearch.trim() || undefined,
        status: qStatus || undefined
      });

      const noteList = response?.data || response?.items || [];
      setAdminNotes(noteList);

      const pag = response?.pagination || response?.meta || {};
      setNotesPagination({
        page: pag.page || pageToLoad,
        limit: pag.limit || 10,
        total: pag.total ?? pag.totalItems ?? noteList.length,
        totalPages: pag.totalPages || 1
      });
    } catch (err) {
      setActionNotice({ type: 'danger', message: err.message || 'Failed to load notes catalog.' });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [notesSearch, notesStatusFilter]);

  // Handle Approve Note Submission
  const handleApproveNote = async (noteId) => {
    try {
      await adminService.reviewNote(noteId, 'APPROVE');
      setActionNotice({ type: 'success', message: 'Note approved and published to academic catalog.' });
      fetchNotes(notesPagination.page);
      fetchStats();
    } catch (err) {
      setActionNotice({ type: 'danger', message: err.message || 'Failed to approve note.' });
    }
  };

  // Handle Reject Note Submission
  const handleRejectNoteSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalNote) return;
    setIsSubmittingNoteAction(true);
    try {
      await adminService.reviewNote(rejectModalNote.id, 'REJECT', noteRejectionReason);
      setActionNotice({ type: 'success', message: 'Note submission rejected with reason logged.' });
      setRejectModalNote(null);
      setNoteRejectionReason('');
      fetchNotes(notesPagination.page);
      fetchStats();
    } catch (err) {
      setActionNotice({ type: 'danger', message: err.message || 'Failed to reject note.' });
    } finally {
      setIsSubmittingNoteAction(false);
    }
  };

  // Handle Administrative Delete Note
  const handleDeleteNote = async (note) => {
    if (!window.confirm(`Are you sure you want to administratively remove "${note.title}"? This action is logged.`)) return;
    try {
      await adminService.deleteNote(note.id, 'Administrative removal by Super Admin');
      setActionNotice({ type: 'success', message: 'Note permanently removed from catalog.' });
      fetchNotes(notesPagination.page);
      fetchStats();
    } catch (err) {
      setActionNotice({ type: 'danger', message: err.message || 'Failed to remove note.' });
    }
  };

  // Fetch Unified Content Reports
  const fetchContentReports = useCallback(async (pageToLoad = 1) => {
    setIsLoadingContentReports(true);
    try {
      const response = await adminService.getReports({ page: pageToLoad, limit: 15 });
      setContentReports(response?.items || response?.data || []);
    } catch (err) {
      setActionNotice({ type: 'danger', message: err.message || 'Failed to load content reports.' });
    } finally {
      setIsLoadingContentReports(false);
    }
  }, []);

  // Resolve Content Report
  const handleResolveContentReport = async (reportId, action) => {
    try {
      await adminService.resolveReport(reportId, action);
      setActionNotice({ type: 'success', message: `Report ${action.toLowerCase()}d successfully.` });
      fetchContentReports();
      fetchStats();
    } catch (err) {
      setActionNotice({ type: 'danger', message: err.message || 'Failed to resolve report.' });
    }
  };

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    try {
      const data = await adminService.getAnnouncements();
      setAnnouncementsList(data || []);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  // Fetch Platform Configuration Settings
  const fetchPlatformSettings = useCallback(async () => {
    try {
      const data = await adminService.getSettings();
      if (data) {
        setPlatformSettings({
          platformName: data.platformName?.value || 'PJ Study',
          tagline: data.tagline?.value || 'Your Entire Study World, One Place.',
          maxUploadSizeMb: data.maxUploadSizeMb?.value || '25',
          allowedFileFormats: data.allowedFileFormats?.value || 'application/pdf,image/jpeg,image/png',
          autoModerationEnabled: data.autoModerationEnabled?.value || 'false',
          allowStudentReviews: data.allowStudentReviews?.value || 'true'
        });
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Save Platform Settings
  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsNotice('');
    try {
      await adminService.updateSettings(platformSettings);
      setSettingsNotice('Platform settings saved and persisted to database.');
      setActionNotice({ type: 'success', message: 'Platform settings saved successfully.' });
    } catch (err) {
      setSettingsNotice(err.message || 'Failed to update platform settings.');
      setActionNotice({ type: 'danger', message: err.message || 'Failed to update platform settings.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Fetch System Diagnostics Data
  const fetchSystemData = useCallback(async () => {
    setIsLoadingSystem(true);
    try {
      const [health, storage, backups] = await Promise.all([
        adminService.getSystemHealth().catch(() => null),
        adminService.getStorageStats().catch(() => null),
        adminService.getBackupStatus().catch(() => null)
      ]);
      if (health) setSystemHealth(health);
      if (storage) setStorageStats(storage);
      if (backups) setBackupStatus(backups);
    } finally {
      setIsLoadingSystem(false);
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

  // Fetch Academic Architecture (Step 16)
  const fetchAcademics = useCallback(async () => {
    setIsLoadingAcademics(true);
    try {
      const data = await adminService.getAcademics();
      setAcademics(
        data || {
          universities: [],
          schools: [],
          courses: [],
          subjects: [],
          categories: [],
          summary: {}
        }
      );
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to load academic architecture.'
      });
    } finally {
      setIsLoadingAcademics(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    fetchStats();
    fetchUsers(1, { search: '', role: '', status: '' });
  }, []);

  // Keep activeTab synchronized with current URL pathname
  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin') {
      setActiveTab('overview');
    } else if (path === '/admin/analytics') {
      setActiveTab('analytics');
    } else if (path === '/admin/activity') {
      setActiveTab('activity');
    } else if (path === '/admin/users') {
      setActiveTab('users');
      setStatusFilter('');
    } else if (path === '/admin/moderators') {
      setActiveTab('staff');
    } else if (path === '/admin/roles') {
      setActiveTab('matrix');
    } else if (path === '/admin/suspended-users') {
      setActiveTab('users');
      setStatusFilter('inactive');
      fetchUsers(1, { status: 'inactive' });
    } else if (path.startsWith('/admin/academics')) {
      setActiveTab('academics');
      if (path.includes('/universities')) setAcademicSubTab('universities');
      else if (path.includes('/courses')) setAcademicSubTab('courses');
      else if (path.includes('/subjects')) setAcademicSubTab('subjects');
    } else if (path === '/admin/notes') {
      setActiveTab('notes');
      setNotesStatusFilter('ALL');
    } else if (path === '/admin/moderation') {
      setActiveTab('notes');
      setNotesStatusFilter('PENDING');
    } else if (path === '/admin/reports') {
      setActiveTab('reports');
    } else if (path === '/admin/reviews') {
      setActiveTab('reviews');
    } else if (path === '/admin/announcements') {
      setActiveTab('announcements');
    } else if (path === '/admin/notifications') {
      setActiveTab('notifications');
    } else if (path === '/admin/storage') {
      setActiveTab('storage');
    } else if (path === '/admin/audit-logs') {
      setActiveTab('audit');
    } else if (path === '/admin/settings') {
      setActiveTab('settings');
    } else if (path === '/admin/security') {
      setActiveTab('security');
    } else if (path === '/admin/health') {
      setActiveTab('health');
    } else if (path === '/admin/backups') {
      setActiveTab('backups');
    }
  }, [location.pathname, fetchUsers]);

  // Tab data loader
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
      fetchLiveActivity();
      fetchAnalytics('30d');
    } else if (activeTab === 'analytics') {
      fetchAnalytics(analyticsRange);
    } else if (activeTab === 'activity') {
      fetchLiveActivity();
    } else if (activeTab === 'notes') {
      fetchNotes(1);
    } else if (activeTab === 'reports') {
      fetchContentReports(1);
    } else if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'settings') {
      fetchPlatformSettings();
    } else if (activeTab === 'storage' || activeTab === 'health' || activeTab === 'backups' || activeTab === 'security') {
      fetchSystemData();
    } else if (activeTab === 'audit') {
      fetchAuditLogs(1);
    } else if (activeTab === 'reviews') {
      fetchReviewReports();
    } else if (activeTab === 'academics') {
      fetchAcademics();
    } else if (activeTab === 'users' || activeTab === 'staff') {
      fetchUsers(1);
    }
  }, [
    activeTab,
    analyticsRange,
    fetchStats,
    fetchLiveActivity,
    fetchAnalytics,
    fetchNotes,
    fetchContentReports,
    fetchAnnouncements,
    fetchPlatformSettings,
    fetchSystemData,
    fetchAuditLogs,
    fetchReviewReports,
    fetchAcademics,
    fetchUsers
  ]);

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
          : activeTab === 'academics'
            ? fetchAcademics()
            : fetchUsers(pagination.page)
    ]);
    setTimeout(() => setIsRefreshing(false), 400);
  }

  // --- Academic Entity Handlers (Step 16) ---
  function handleOpenCreateModal(type) {
    setAcademicModalError('');
    let initial = { isActive: true };
    if (type === 'university') {
      initial = { name: '', shortName: '', code: '', description: '', website: '', isActive: true };
    } else if (type === 'school') {
      const defaultUniId = academics.universities[0]?.id || '';
      initial = { universityId: defaultUniId, name: '', code: '', description: '', isActive: true };
    } else if (type === 'course') {
      const defaultUniId = academics.universities[0]?.id || '';
      const defaultSchool = academics.schools.find((s) => !defaultUniId || s.universityId === defaultUniId);
      initial = {
        universityId: defaultUniId,
        schoolId: defaultSchool?.id || '',
        name: '',
        code: '',
        degreeLevel: 'UNDERGRADUATE',
        semestersCount: 8,
        isActive: true
      };
    } else if (type === 'subject') {
      const defaultCourse = academics.courses[0];
      initial = {
        courseId: defaultCourse?.id || '',
        name: '',
        code: '',
        semester: 1,
        credits: 3,
        isActive: true
      };
    } else if (type === 'category') {
      initial = { name: '', description: '', isActive: true };
    }
    setAcademicFormData(initial);
    setAcademicModal({ isOpen: true, type, mode: 'create', entity: null });
  }

  function handleOpenEditModal(type, entity) {
    setAcademicModalError('');
    const formValues = { ...entity };
    if (type === 'course') {
      formValues.semestersCount = entity.semestersCount || 8;
    }
    if (type === 'subject') {
      formValues.semester = entity.semester || 1;
      formValues.credits = entity.credits || 3;
    }
    setAcademicFormData(formValues);
    setAcademicModal({ isOpen: true, type, mode: 'edit', entity });
  }

  function handleOpenDeleteModal(type, entity) {
    setAcademicModalError('');
    setAcademicModal({ isOpen: true, type: 'delete', mode: type, entity });
  }

  function handleCloseAcademicModal() {
    setAcademicModal({ isOpen: false, type: null, mode: 'create', entity: null });
    setAcademicFormData({});
    setAcademicModalError('');
  }

  async function handleSubmitAcademicForm(e) {
    e.preventDefault();
    setIsSubmittingAcademic(true);
    setAcademicModalError('');

    try {
      const { type, mode, entity } = academicModal;

      if (type === 'university') {
        if (!academicFormData.name?.trim()) throw new Error('University name is required.');
        if (mode === 'create') {
          await adminService.createUniversity(academicFormData);
          setActionNotice({
            type: 'success',
            message: `University "${academicFormData.name}" added successfully.`
          });
        } else {
          await adminService.updateUniversity(entity.id, academicFormData);
          setActionNotice({
            type: 'success',
            message: `University "${academicFormData.name}" updated successfully.`
          });
        }
      } else if (type === 'school') {
        if (!academicFormData.name?.trim()) throw new Error('School/Faculty name is required.');
        if (!academicFormData.universityId) throw new Error('Affiliated university is required.');
        if (mode === 'create') {
          await adminService.createSchool(academicFormData);
          setActionNotice({
            type: 'success',
            message: `School "${academicFormData.name}" created successfully.`
          });
        } else {
          await adminService.updateSchool(entity.id, academicFormData);
          setActionNotice({
            type: 'success',
            message: `School "${academicFormData.name}" updated successfully.`
          });
        }
      } else if (type === 'course') {
        if (!academicFormData.name?.trim()) throw new Error('Degree Course name is required.');
        const count = Number(academicFormData.semestersCount) || 8;
        if (count < 1 || count > 20) throw new Error('Semesters count must be between 1 and 20.');
        const payload = {
          ...academicFormData,
          semestersCount: count,
          universityId: academicFormData.universityId || null,
          schoolId: academicFormData.schoolId || null
        };
        if (mode === 'create') {
          await adminService.createCourse(payload);
          setActionNotice({
            type: 'success',
            message: `Course "${academicFormData.name}" created with ${count} dynamic semesters.`
          });
        } else {
          await adminService.updateCourse(entity.id, payload);
          setActionNotice({
            type: 'success',
            message: `Course "${academicFormData.name}" updated successfully.`
          });
        }
      } else if (type === 'subject') {
        if (!academicFormData.name?.trim()) throw new Error('Subject name is required.');
        if (!academicFormData.courseId) throw new Error('Parent degree course is required.');
        const sem = Number(academicFormData.semester) || 1;
        const targetCourse = academics.courses.find((c) => c.id === academicFormData.courseId);
        const maxSem = targetCourse?.semestersCount || 8;
        if (sem < 1 || sem > maxSem) {
          throw new Error(`Semester must be between 1 and ${maxSem} for ${targetCourse?.name || 'this course'}.`);
        }
        const payload = {
          ...academicFormData,
          semester: sem,
          credits: Number(academicFormData.credits) || 3
        };
        if (mode === 'create') {
          await adminService.createSubject(payload);
          setActionNotice({
            type: 'success',
            message: `Subject "${academicFormData.name}" created successfully.`
          });
        } else {
          await adminService.updateSubject(entity.id, payload);
          setActionNotice({
            type: 'success',
            message: `Subject "${academicFormData.name}" updated successfully.`
          });
        }
      } else if (type === 'category') {
        if (!academicFormData.name?.trim()) throw new Error('Category name is required.');
        if (mode === 'create') {
          await adminService.createCategory(academicFormData);
          setActionNotice({
            type: 'success',
            message: `Category "${academicFormData.name}" created successfully.`
          });
        } else {
          await adminService.updateCategory(entity.id, academicFormData);
          setActionNotice({
            type: 'success',
            message: `Category "${academicFormData.name}" updated successfully.`
          });
        }
      }

      handleCloseAcademicModal();
      await fetchAcademics();
    } catch (err) {
      setAcademicModalError(err.message || 'Operation failed');
    } finally {
      setIsSubmittingAcademic(false);
    }
  }

  async function handleToggleAcademicStatus(type, entity) {
    try {
      const newStatus = !entity.isActive;
      if (type === 'university') {
        await adminService.updateUniversity(entity.id, { isActive: newStatus });
      } else if (type === 'school') {
        await adminService.updateSchool(entity.id, { isActive: newStatus });
      } else if (type === 'course') {
        await adminService.updateCourse(entity.id, { isActive: newStatus });
      } else if (type === 'subject') {
        await adminService.updateSubject(entity.id, { isActive: newStatus });
      } else if (type === 'category') {
        await adminService.updateCategory(entity.id, { isActive: newStatus });
      }
      setActionNotice({
        type: 'success',
        message: `${entity.name} is now ${newStatus ? 'active' : 'inactive'}.`
      });
      await fetchAcademics();
    } catch (err) {
      setActionNotice({
        type: 'danger',
        message: err.message || 'Failed to update active status.'
      });
    }
  }

  async function handleConfirmDeleteAcademic() {
    setIsSubmittingAcademic(true);
    setAcademicModalError('');
    try {
      const { mode: type, entity } = academicModal;
      if (type === 'university') {
        await adminService.deleteUniversity(entity.id);
      } else if (type === 'school') {
        await adminService.deleteSchool(entity.id);
      } else if (type === 'course') {
        await adminService.deleteCourse(entity.id);
      } else if (type === 'subject') {
        await adminService.deleteSubject(entity.id);
      } else if (type === 'category') {
        await adminService.deleteCategory(entity.id);
      }
      setActionNotice({
        type: 'success',
        message: `Deleted "${entity.name}" successfully.`
      });
      handleCloseAcademicModal();
      await fetchAcademics();
    } catch (err) {
      setAcademicModalError(
        err.message || 'Cannot delete item due to relational integrity constraints (notes or users attached).'
      );
    } finally {
      setIsSubmittingAcademic(false);
    }
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
      <SEO title="Academic Governance & Administration" noindex={true} />
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
            className={`admin-tab-btn ${activeTab === 'overview' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
            Command Overview
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'analytics' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/analytics')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            Analytics
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'activity' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/activity')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            Live Activity
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'users' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/users')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            User Directory
            {stats && <span className="admin-tab-count">{stats.totalUsers}</span>}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'staff' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/moderators')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Staff & Moderators
            {stats && (
              <span className="admin-tab-count">
                {(stats.roles?.MODERATOR || 0) + (stats.roles?.ADMIN || 0) + (stats.roles?.SUPER_ADMIN || 0)}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'notes' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/notes')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            Notes & Content
            {stats?.pendingModeration > 0 && (
              <span className="admin-tab-count" style={{ backgroundColor: 'rgba(234, 179, 8, 0.25)', color: '#ca8a04' }}>
                {stats.pendingModeration}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'reports' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/reports')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /></svg>
            Content Reports
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/reviews')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
            Reviews
            {reviewReports.length > 0 && (
              <span className="admin-tab-count" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#ca8a04' }}>
                {reviewReports.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'academics' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/academics')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            Academic Taxonomy
            {academics.courses?.length > 0 && <span className="admin-tab-count">{academics.courses.length}</span>}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'announcements' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/announcements')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Announcements
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'settings' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/settings')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Settings
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'audit' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/audit-logs')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 14 14" /></svg>
            Audit Trail
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'health' || activeTab === 'storage' || activeTab === 'backups' || activeTab === 'security' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => navigate('/admin/health')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            Diagnostics
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

        {/* TAB 6: ACADEMIC ARCHITECTURE & COURSE CONTENT MANAGEMENT (STEP 16) */}
        {activeTab === 'academics' && (
          <div>
            {isLoadingAcademics ? (
              <div style={{ padding: '24px 0' }}>
                <Skeleton count={5} height="48px" style={{ marginBottom: '12px' }} />
              </div>
            ) : (
              <>
                {/* Metric KPI Overview */}
                <div className="admin-academic-overview">
              <div className="admin-academic-stat-card">
                <span className="admin-academic-stat-label">Universities</span>
                <span className="admin-academic-stat-value">{academics.universities.length}</span>
              </div>
              <div className="admin-academic-stat-card">
                <span className="admin-academic-stat-label">Schools / Faculties</span>
                <span className="admin-academic-stat-value">{academics.schools.length}</span>
              </div>
              <div className="admin-academic-stat-card">
                <span className="admin-academic-stat-label">Degree Programs</span>
                <span className="admin-academic-stat-value">{academics.courses.length}</span>
              </div>
              <div className="admin-academic-stat-card">
                <span className="admin-academic-stat-label">Subjects</span>
                <span className="admin-academic-stat-value">{academics.subjects.length}</span>
              </div>
              <div className="admin-academic-stat-card">
                <span className="admin-academic-stat-label">Note Categories</span>
                <span className="admin-academic-stat-value">{academics.categories.length}</span>
              </div>
            </div>

            {/* Sub-navigation Pills */}
            <div className="admin-academic-subnav" role="tablist" aria-label="Academic Subsections">
              <button
                type="button"
                className={`admin-academic-subnav-btn ${
                  academicSubTab === 'universities' ? 'admin-academic-subnav-btn--active' : ''
                }`}
                onClick={() => setAcademicSubTab('universities')}
              >
                Universities
                <span className="admin-academic-subnav-badge">{academics.universities.length}</span>
              </button>
              <button
                type="button"
                className={`admin-academic-subnav-btn ${
                  academicSubTab === 'schools' ? 'admin-academic-subnav-btn--active' : ''
                }`}
                onClick={() => setAcademicSubTab('schools')}
              >
                Schools / Faculties
                <span className="admin-academic-subnav-badge">{academics.schools.length}</span>
              </button>
              <button
                type="button"
                className={`admin-academic-subnav-btn ${
                  academicSubTab === 'courses' ? 'admin-academic-subnav-btn--active' : ''
                }`}
                onClick={() => setAcademicSubTab('courses')}
              >
                Degree Courses
                <span className="admin-academic-subnav-badge">{academics.courses.length}</span>
              </button>
              <button
                type="button"
                className={`admin-academic-subnav-btn ${
                  academicSubTab === 'semesters' ? 'admin-academic-subnav-btn--active' : ''
                }`}
                onClick={() => setAcademicSubTab('semesters')}
              >
                Dynamic Semesters
                <span className="admin-academic-subnav-badge">{academics.courses.length}</span>
              </button>
              <button
                type="button"
                className={`admin-academic-subnav-btn ${
                  academicSubTab === 'subjects' ? 'admin-academic-subnav-btn--active' : ''
                }`}
                onClick={() => setAcademicSubTab('subjects')}
              >
                Subjects
                <span className="admin-academic-subnav-badge">{academics.subjects.length}</span>
              </button>
              <button
                type="button"
                className={`admin-academic-subnav-btn ${
                  academicSubTab === 'categories' ? 'admin-academic-subnav-btn--active' : ''
                }`}
                onClick={() => setAcademicSubTab('categories')}
              >
                Categories
                <span className="admin-academic-subnav-badge">{academics.categories.length}</span>
              </button>
            </div>

            {/* Academic Toolbar */}
            <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div className="admin-search-wrapper" style={{ minWidth: '220px' }}>
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
                  placeholder={`Search ${academicSubTab}...`}
                  value={academicSearch}
                  onChange={(e) => setAcademicSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div className="admin-select-wrapper">
                <select
                  value={academicStatusFilter}
                  onChange={(e) => setAcademicStatusFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>

              {academicSubTab === 'subjects' && (
                <div className="admin-select-wrapper">
                  <select
                    value={subjectCourseFilter}
                    onChange={(e) => setSubjectCourseFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">All Degree Courses</option>
                    {academics.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginLeft: 'auto' }}>
                {academicSubTab === 'universities' && (
                  <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal('university')}>
                    + Add University
                  </Button>
                )}
                {academicSubTab === 'schools' && (
                  <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal('school')}>
                    + Add School / Faculty
                  </Button>
                )}
                {academicSubTab === 'courses' && (
                  <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal('course')}>
                    + Add Degree Course
                  </Button>
                )}
                {academicSubTab === 'semesters' && (
                  <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal('course')}>
                    + Add Degree Course
                  </Button>
                )}
                {academicSubTab === 'subjects' && (
                  <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal('subject')}>
                    + Add Subject
                  </Button>
                )}
                {academicSubTab === 'categories' && (
                  <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal('category')}>
                    + Add Category
                  </Button>
                )}
              </div>
            </div>

            {/* SUB-TAB 1: UNIVERSITIES */}
            {academicSubTab === 'universities' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>University / Institution</th>
                      <th>Short / Code</th>
                      <th>Website</th>
                      <th>Affiliated Schools & Courses</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academics.universities
                      .filter((u) => {
                        if (academicStatusFilter === 'ACTIVE' && !u.isActive) return false;
                        if (academicStatusFilter === 'INACTIVE' && u.isActive) return false;
                        if (academicSearch) {
                          const q = academicSearch.toLowerCase();
                          return (
                            u.name?.toLowerCase().includes(q) ||
                            u.shortName?.toLowerCase().includes(q) ||
                            u.code?.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((uni) => (
                        <tr key={uni.id}>
                          <td>
                            <strong>{uni.name}</strong>
                            {uni.description && (
                              <p
                                style={{
                                  margin: '2px 0 0',
                                  fontSize: '11px',
                                  color: 'var(--color-text-secondary)'
                                }}
                              >
                                {uni.description}
                              </p>
                            )}
                          </td>
                          <td>
                            <code>{uni.shortName || uni.code || '—'}</code>
                          </td>
                          <td>
                            {uni.website ? (
                              <a
                                href={uni.website}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: 'var(--color-primary)' }}
                              >
                                Visit Link ↗
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '12px' }}>
                              {uni._count?.schools ?? uni.schools?.length ?? 0} Schools •{' '}
                              {uni._count?.courses ?? uni.courses?.length ?? 0} Courses
                            </span>
                          </td>
                          <td>
                            <Badge variant={uni.isActive ? 'success' : 'neutral'} size="sm">
                              {uni.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div
                              style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal('university', uni)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAcademicStatus('university', uni)}
                              >
                                {uni.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenDeleteModal('university', uni)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUB-TAB 2: SCHOOLS / FACULTIES */}
            {academicSubTab === 'schools' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>School / Faculty</th>
                      <th>Code / Slug</th>
                      <th>Affiliated University</th>
                      <th>Courses</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academics.schools
                      .filter((s) => {
                        if (academicStatusFilter === 'ACTIVE' && !s.isActive) return false;
                        if (academicStatusFilter === 'INACTIVE' && s.isActive) return false;
                        if (academicSearch) {
                          const q = academicSearch.toLowerCase();
                          return (
                            s.name?.toLowerCase().includes(q) ||
                            s.code?.toLowerCase().includes(q) ||
                            s.slug?.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((school) => (
                        <tr key={school.id}>
                          <td>
                            <strong>{school.name}</strong>
                            {school.description && (
                              <p
                                style={{
                                  margin: '2px 0 0',
                                  fontSize: '11px',
                                  color: 'var(--color-text-secondary)'
                                }}
                              >
                                {school.description}
                              </p>
                            )}
                          </td>
                          <td>
                            <code>{school.code || school.slug || '—'}</code>
                          </td>
                          <td>
                            {school.university?.name ||
                              academics.universities.find((u) => u.id === school.universityId)?.name ||
                              '—'}
                          </td>
                          <td>
                            <span style={{ fontSize: '12px' }}>
                              {school._count?.courses ?? school.courses?.length ?? 0} Courses
                            </span>
                          </td>
                          <td>
                            <Badge variant={school.isActive ? 'success' : 'neutral'} size="sm">
                              {school.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div
                              style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal('school', school)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAcademicStatus('school', school)}
                              >
                                {school.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenDeleteModal('school', school)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUB-TAB 3: DEGREE COURSES */}
            {academicSubTab === 'courses' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Degree Course</th>
                      <th>Code / Slug</th>
                      <th>Affiliation</th>
                      <th>Level</th>
                      <th>Dynamic Semesters</th>
                      <th>Subjects</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academics.courses
                      .filter((c) => {
                        if (academicStatusFilter === 'ACTIVE' && !c.isActive) return false;
                        if (academicStatusFilter === 'INACTIVE' && c.isActive) return false;
                        if (academicSearch) {
                          const q = academicSearch.toLowerCase();
                          return (
                            c.name?.toLowerCase().includes(q) ||
                            c.code?.toLowerCase().includes(q) ||
                            c.slug?.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((course) => (
                        <tr key={course.id}>
                          <td>
                            <strong>{course.name}</strong>
                          </td>
                          <td>
                            <code>{course.code || course.slug || '—'}</code>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>
                              {course.university?.shortName || course.university?.name || 'All Institutions'}
                              {course.school?.name && (
                                <div
                                  style={{
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '11px'
                                  }}
                                >
                                  {course.school.name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge variant="neutral" size="sm">
                              {course.degreeLevel || 'UNDERGRADUATE'}
                            </Badge>
                          </td>
                          <td>
                            <span className="admin-semester-card__count-badge">
                              {course.semestersCount || 8} Semesters
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px' }}>
                              {course._count?.subjects ?? course.subjects?.length ?? 0} Subjects
                            </span>
                          </td>
                          <td>
                            <Badge variant={course.isActive ? 'success' : 'neutral'} size="sm">
                              {course.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div
                              style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal('course', course)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAcademicStatus('course', course)}
                              >
                                {course.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenDeleteModal('course', course)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUB-TAB 4: DYNAMIC SEMESTERS VISUAL ARCHITECTURE */}
            {academicSubTab === 'semesters' && (
              <div className="admin-semesters-grid">
                {academics.courses
                  .filter((c) => {
                    if (academicStatusFilter === 'ACTIVE' && !c.isActive) return false;
                    if (academicStatusFilter === 'INACTIVE' && c.isActive) return false;
                    if (academicSearch) {
                      const q = academicSearch.toLowerCase();
                      return c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map((course) => {
                    const totalSem = course.semestersCount || 8;
                    const courseSubjects = academics.subjects.filter((s) => s.courseId === course.id);
                    return (
                      <div key={course.id} className="admin-semester-card">
                        <div className="admin-semester-card__header">
                          <div>
                            <h4 className="admin-semester-card__title">{course.name}</h4>
                            <div className="admin-semester-card__meta">
                              {course.degreeLevel || 'UNDERGRADUATE'} • {course.code || course.slug}
                            </div>
                          </div>
                          <span className="admin-semester-card__count-badge">
                            {totalSem} Semesters
                          </span>
                        </div>

                        <div className="admin-semester-chips">
                          {Array.from({ length: totalSem }, (_, i) => i + 1).map((semNum) => {
                            const semSubjects = courseSubjects.filter((s) => s.semester === semNum);
                            return (
                              <div key={semNum} className="admin-semester-chip">
                                <span className="admin-semester-chip__num">Sem {semNum}</span>
                                <span className="admin-semester-chip__sub">{semSubjects.length} subj</span>
                              </div>
                            );
                          })}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 'auto',
                            paddingTop: '8px'
                          }}
                        >
                          <span
                            style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}
                          >
                            Total Subjects: {courseSubjects.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal('course', course)}
                          >
                            Configure Semesters
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* SUB-TAB 5: SUBJECTS */}
            {academicSubTab === 'subjects' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Code / Slug</th>
                      <th>Degree Course</th>
                      <th>Semester</th>
                      <th>Credits</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academics.subjects
                      .filter((s) => {
                        if (subjectCourseFilter && s.courseId !== subjectCourseFilter) return false;
                        if (academicStatusFilter === 'ACTIVE' && !s.isActive) return false;
                        if (academicStatusFilter === 'INACTIVE' && s.isActive) return false;
                        if (academicSearch) {
                          const q = academicSearch.toLowerCase();
                          return (
                            s.name?.toLowerCase().includes(q) ||
                            s.code?.toLowerCase().includes(q) ||
                            s.slug?.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((subj) => (
                        <tr key={subj.id}>
                          <td>
                            <strong>{subj.name}</strong>
                          </td>
                          <td>
                            <code>{subj.code || subj.slug || '—'}</code>
                          </td>
                          <td>
                            {subj.course?.name ||
                              academics.courses.find((c) => c.id === subj.courseId)?.name ||
                              '—'}
                          </td>
                          <td>
                            <Badge variant="neutral" size="sm">
                              Semester {subj.semester}
                            </Badge>
                          </td>
                          <td>{subj.credits || 3}</td>
                          <td>
                            <span style={{ fontSize: '12px' }}>
                              {subj._count?.notes ?? subj.notes?.length ?? 0} Notes
                            </span>
                          </td>
                          <td>
                            <Badge variant={subj.isActive ? 'success' : 'neutral'} size="sm">
                              {subj.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div
                              style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal('subject', subj)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAcademicStatus('subject', subj)}
                              >
                                {subj.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenDeleteModal('subject', subj)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUB-TAB 6: CATEGORIES */}
            {academicSubTab === 'categories' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th>Notes Count</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academics.categories
                      .filter((cat) => {
                        if (academicStatusFilter === 'ACTIVE' && !cat.isActive) return false;
                        if (academicStatusFilter === 'INACTIVE' && cat.isActive) return false;
                        if (academicSearch) {
                          const q = academicSearch.toLowerCase();
                          return cat.name?.toLowerCase().includes(q) || cat.slug?.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((cat) => (
                        <tr key={cat.id}>
                          <td>
                            <strong>{cat.name}</strong>
                          </td>
                          <td>
                            <code>{cat.slug}</code>
                          </td>
                          <td>{cat.description || '—'}</td>
                          <td>
                            <span style={{ fontSize: '12px' }}>
                              {cat._count?.notes ?? cat.notes?.length ?? 0} Notes
                            </span>
                          </td>
                          <td>
                            <Badge variant={cat.isActive ? 'success' : 'neutral'} size="sm">
                              {cat.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div
                              style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal('category', cat)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAcademicStatus('category', cat)}
                              >
                                {cat.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenDeleteModal('category', cat)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB: COMMAND OVERVIEW DASHBOARD
            ===================================================================== */}
        {activeTab === 'overview' && (
          <div className="admin-tab-content">
            {/* 8 Genuine Metric Cards Grid */}
            <div className="admin-overview-kpi-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Total Registered Users</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--blue">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value">{stats?.totalUsers ?? 0}</p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Across all academic programs</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--blue">All Roles</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Active Scholars</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--green">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value" style={{ color: 'var(--color-success)' }}>
                  {stats?.activeScholars ?? stats?.roles?.STUDENT ?? 0}
                </p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Enrolled students in good standing</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--green">Verified</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Active Moderators</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--purple">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value">{stats?.activeModerators ?? stats?.roles?.MODERATOR ?? 0}</p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Faculty evaluators & reviewers</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--purple">Staff</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Total Notes Catalog</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--blue">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value">{stats?.totalNotes ?? 0}</p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Course manuscripts on platform</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--blue">Catalog</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Pending Approvals</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--amber">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 14 14" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value" style={{ color: (stats?.pendingModeration || 0) > 0 ? '#d97706' : 'inherit' }}>
                  {stats?.pendingModeration ?? 0}
                </p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Awaiting moderation review</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--amber">Review Queue</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Approved Notes</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--green">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value" style={{ color: 'var(--color-success)' }}>
                  {stats?.approvedNotes ?? 0}
                </p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Published to student library</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--green">Live</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Total Downloads</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--blue">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value">{stats?.totalDownloads ?? 0}</p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Scholar study sessions served</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--blue">Downloads</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-card__top">
                  <span className="admin-metric-card__label">Open Reports</span>
                  <span className="admin-metric-card__icon admin-metric-card__icon--red">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </span>
                </div>
                <p className="admin-metric-card__value" style={{ color: (stats?.reportedContent || 0) > 0 ? 'var(--color-danger)' : 'inherit' }}>
                  {stats?.reportedContent ?? 0}
                </p>
                <div className="admin-metric-card__footer">
                  <span className="admin-metric-card__subtext">Notes and review flags</span>
                  <span className="admin-metric-card__pill admin-metric-card__pill--red">Flags</span>
                </div>
              </div>
            </div>

            {/* Pending Moderation Alert Banner */}
            {(stats?.pendingModeration || 0) > 0 && (
              <div className="admin-alert-banner" style={{ marginTop: '20px' }}>
                <div className="admin-alert-banner__content">
                  <span className="admin-alert-banner__badge">Action Required</span>
                  <span className="admin-alert-banner__text">
                    There are <strong>{stats.pendingModeration} manuscripts</strong> awaiting academic review in the moderation queue.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--primary"
                  onClick={() => navigate('/admin/moderation')}
                >
                  Open Approval Queue →
                </button>
              </div>
            )}

            {/* Operational 2-Column Grid */}
            <div className="admin-operational-grid" style={{ marginTop: '24px' }}>
              {/* Column 1: Recent Platform Activity & Most Downloaded */}
              <div className="admin-operational-col">
                <div className="admin-card">
                  <div className="admin-card__header">
                    <div>
                      <h3 className="admin-card__title">Recent Platform Activity</h3>
                      <p className="admin-card__subtitle">Latest audit logs and administrative operations</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--xs btn--outline"
                      onClick={() => navigate('/admin/activity')}
                    >
                      View All
                    </button>
                  </div>
                  <div className="admin-card__body">
                    {liveActivity.length === 0 ? (
                      <p className="admin-muted-text">No recent administrative activity recorded.</p>
                    ) : (
                      <div className="admin-activity-list">
                        {liveActivity.slice(0, 5).map((log) => (
                          <div key={log.id} className="admin-activity-item">
                            <div className="admin-activity-item__dot" />
                            <div className="admin-activity-item__info">
                              <div className="admin-activity-item__header">
                                <span className="admin-activity-item__action">{log.action?.replace(/_/g, ' ')}</span>
                                <span className="admin-activity-item__time">{formatRelativeTime(log.createdAt)}</span>
                              </div>
                              <span className="admin-activity-item__actor">
                                By {log.actor?.name || 'System'} ({log.actor?.role || 'SYSTEM'})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-card" style={{ marginTop: '20px' }}>
                  <div className="admin-card__header">
                    <div>
                      <h3 className="admin-card__title">Most Downloaded Notes</h3>
                      <p className="admin-card__subtitle">Top manuscripts accessed by university scholars</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--xs btn--outline"
                      onClick={() => navigate('/admin/notes')}
                    >
                      Browse Catalog
                    </button>
                  </div>
                  <div className="admin-card__body">
                    {!analyticsData?.topNotes || analyticsData.topNotes.length === 0 ? (
                      <p className="admin-muted-text">No note download statistics available yet.</p>
                    ) : (
                      <div className="admin-top-notes-list">
                        {analyticsData.topNotes.map((note, idx) => (
                          <div key={note.id} className="admin-top-note-row">
                            <span className="admin-top-note-rank">#{idx + 1}</span>
                            <div className="admin-top-note-info">
                              <Link to={`/notes/${note.id}`} className="admin-top-note-title">
                                {note.title}
                              </Link>
                              <span className="admin-top-note-sub">
                                {note.course?.name || 'General Course'} · {note.subject?.name || 'General Subject'}
                              </span>
                            </div>
                            <span className="admin-top-note-downloads">
                              {note.downloadCount || 0} downloads
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Academic Content Distribution & Quick Shortcuts */}
              <div className="admin-operational-col">
                <div className="admin-card">
                  <div className="admin-card__header">
                    <div>
                      <h3 className="admin-card__title">Academic Taxonomy Distribution</h3>
                      <p className="admin-card__subtitle">Published study notes by category</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--xs btn--outline"
                      onClick={() => navigate('/admin/academics/subjects')}
                    >
                      Manage Subjects
                    </button>
                  </div>
                  <div className="admin-card__body">
                    {!analyticsData?.categories || analyticsData.categories.length === 0 ? (
                      <p className="admin-muted-text">No category distribution data recorded.</p>
                    ) : (
                      <div className="admin-category-bars">
                        {analyticsData.categories.map((cat) => (
                          <div key={cat.id} className="admin-cat-bar-item">
                            <div className="admin-cat-bar-header">
                              <span className="admin-cat-bar-name">{cat.name}</span>
                              <span className="admin-cat-bar-count">{cat.count} manuscripts</span>
                            </div>
                            <div className="admin-cat-bar-track">
                              <div
                                className="admin-cat-bar-fill"
                                style={{
                                  width: `${Math.min(100, Math.round((cat.count / Math.max(1, stats?.totalNotes || 1)) * 100))}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-card" style={{ marginTop: '20px' }}>
                  <div className="admin-card__header">
                    <div>
                      <h3 className="admin-card__title">Command Center Shortcuts</h3>
                      <p className="admin-card__subtitle">One-click administrative operations</p>
                    </div>
                  </div>
                  <div className="admin-card__body admin-shortcuts-grid">
                    <button
                      type="button"
                      className="admin-shortcut-btn"
                      onClick={() => setIsAnnouncementOpen(true)}
                    >
                      <span className="admin-shortcut-btn__icon">📢</span>
                      <div className="admin-shortcut-btn__text">
                        <strong>New Announcement</strong>
                        <span>Broadcast message to scholars & staff</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="admin-shortcut-btn"
                      onClick={() => navigate('/admin/academics/courses')}
                    >
                      <span className="admin-shortcut-btn__icon">📚</span>
                      <div className="admin-shortcut-btn__text">
                        <strong>Add Course / Program</strong>
                        <span>Expand academic curriculum architecture</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="admin-shortcut-btn"
                      onClick={() => navigate('/admin/settings')}
                    >
                      <span className="admin-shortcut-btn__icon">⚙️</span>
                      <div className="admin-shortcut-btn__text">
                        <strong>Platform Settings</strong>
                        <span>Configure upload size, review policies</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="admin-shortcut-btn"
                      onClick={() => navigate('/admin/health')}
                    >
                      <span className="admin-shortcut-btn__icon">🩺</span>
                      <div className="admin-shortcut-btn__text">
                        <strong>System Health Diagnostics</strong>
                        <span>Check MySQL latency & memory usage</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: ADVANCED ANALYTICS
            ===================================================================== */}
        {activeTab === 'analytics' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Platform Operational Analytics</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Time-series metrics for registrations, notes catalog, and scholar downloads.
                </p>
              </div>
              <div className="d-flex items-center gap-2">
                {['7d', '30d', '90d'].map((r) => (
                  <Button
                    key={r}
                    variant={analyticsRange === r ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setAnalyticsRange(r);
                      fetchAnalytics(r);
                    }}
                  >
                    {r.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {isLoadingAnalytics && !analyticsData ? (
              <Skeleton count={4} height="80px" style={{ marginBottom: '16px' }} />
            ) : analyticsData ? (
              <div>
                {/* Aggregate KPI Banner */}
                <div className="admin-analytics-banner">
                  <div className="admin-analytics-kpi">
                    <span className="admin-analytics-kpi__label">Registrations in Period</span>
                    <span className="admin-analytics-kpi__value">{analyticsData.totals?.registrations ?? 0}</span>
                  </div>
                  <div className="admin-analytics-kpi">
                    <span className="admin-analytics-kpi__label">Notes Uploaded</span>
                    <span className="admin-analytics-kpi__value">{analyticsData.totals?.notes ?? 0}</span>
                  </div>
                  <div className="admin-analytics-kpi">
                    <span className="admin-analytics-kpi__label">Total Study Downloads</span>
                    <span className="admin-analytics-kpi__value">{analyticsData.totals?.downloads ?? 0}</span>
                  </div>
                </div>

                {/* Moderation Workload Breakdown */}
                <div className="admin-card" style={{ marginTop: '20px' }}>
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Manuscript Moderation Workload</h3>
                  </div>
                  <div className="admin-card__body admin-analytics-grid">
                    {Object.entries(analyticsData.moderationWorkload || {}).map(([st, count]) => (
                      <div key={st} className="admin-metric-card" style={{ margin: 0 }}>
                        <span className="admin-metric-card__label">{st}</span>
                        <p className="admin-metric-card__value">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time-Series Daily Table */}
                <div className="admin-card" style={{ marginTop: '20px' }}>
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Daily Platform Activity Timeline ({analyticsRange})</h3>
                  </div>
                  <div className="admin-card__body" style={{ padding: 0 }}>
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>New Accounts</th>
                            <th>Notes Uploaded</th>
                            <th>Downloads Served</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analyticsData.timeline || []).slice(-15).reverse().map((row) => (
                            <tr key={row.date}>
                              <td><strong>{row.date}</strong></td>
                              <td>{row.registrations}</td>
                              <td>{row.notes}</td>
                              <td>{row.downloads}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* =====================================================================
            TAB: LIVE ACTIVITY STREAM
            ===================================================================== */}
        {activeTab === 'activity' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Live Administrative Activity Stream</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Real-time audit events, role changes, notes reviews, and security actions.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLiveActivity(30)}
                isLoading={isLoadingActivity}
              >
                Refresh Stream
              </Button>
            </div>

            <div className="admin-card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Entity Type</th>
                      <th>Entity Identifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveActivity.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>
                          <p className="admin-muted-text">No live activity events recorded.</p>
                        </td>
                      </tr>
                    ) : (
                      liveActivity.map((log) => (
                        <tr key={log.id}>
                          <td>{formatRelativeTime(log.createdAt)}</td>
                          <td>
                            <div className="d-flex items-center gap-2">
                              <Avatar name={log.actor?.name || 'System'} size="xs" />
                              <div>
                                <span style={{ fontWeight: 600 }}>{log.actor?.name || 'System'}</span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  {log.actor?.role}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge variant="primary" size="sm">
                              {log.action}
                            </Badge>
                          </td>
                          <td>{log.entityType}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {log.entityId}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: NOTES CATALOG & MODERATION QUEUE
            ===================================================================== */}
        {activeTab === 'notes' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <Input
                  placeholder="Search notes by title or description..."
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchNotes(1, { search: notesSearch });
                  }}
                />
              </div>
              <div className="d-flex items-center gap-2">
                <select
                  className="admin-select"
                  value={notesStatusFilter}
                  onChange={(e) => {
                    setNotesStatusFilter(e.target.value);
                    fetchNotes(1, { status: e.target.value });
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved (Live)</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DRAFT">Draft</option>
                </select>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/notes/new')}
                >
                  + Upload Study Note
                </Button>
              </div>
            </div>

            {isLoadingNotes ? (
              <Skeleton count={5} height="48px" style={{ marginBottom: '10px' }} />
            ) : (
              <div className="admin-card" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Manuscript Title</th>
                        <th>Academic Scope</th>
                        <th>Uploaded By</th>
                        <th>Status</th>
                        <th>Downloads</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminNotes.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '36px' }}>
                            <p className="admin-muted-text">No notes found matching current filters.</p>
                          </td>
                        </tr>
                      ) : (
                        adminNotes.map((note) => (
                          <tr key={note.id}>
                            <td>
                              <Link to={`/notes/${note.id}`} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                {note.title}
                              </Link>
                              {note.fileName && (
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  📎 {note.fileName} ({Math.round((note.fileSize || 0) / 1024)} KB)
                                </span>
                              )}
                            </td>
                            <td>
                              <span>{note.course?.name || 'General Course'}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {note.subject?.name} · Sem {note.semester}
                              </span>
                            </td>
                            <td>
                              <span>{note.uploadedBy?.name || 'Unknown'}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {note.uploadedBy?.role}
                              </span>
                            </td>
                            <td>
                              <Badge
                                variant={
                                  note.status === 'APPROVED'
                                    ? 'success'
                                    : note.status === 'PENDING'
                                      ? 'warning'
                                      : note.status === 'REJECTED'
                                        ? 'danger'
                                        : 'neutral'
                                }
                                size="sm"
                              >
                                {note.status}
                              </Badge>
                            </td>
                            <td>{note.downloadCount || 0}</td>
                            <td>
                              <div className="d-flex items-center gap-1">
                                {note.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="xs"
                                      variant="primary"
                                      onClick={() => handleApproveNote(note.id)}
                                      title="Approve manuscript"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      onClick={() => {
                                        setRejectModalNote(note);
                                        setNoteRejectionReason('');
                                      }}
                                      title="Reject manuscript"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Link
                                  to={`/notes/${note.id}`}
                                  className="btn btn--xs btn--outline"
                                  title="View and download manuscript"
                                >
                                  View
                                </Link>
                                <Button
                                  size="xs"
                                  variant="danger"
                                  onClick={() => handleDeleteNote(note)}
                                  title="Administratively remove note"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB: CONTENT REPORTS & APPEALS
            ===================================================================== */}
        {activeTab === 'reports' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Content Moderation Reports & Appeals</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Review flags and reported manuscripts submitted by community scholars.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchContentReports(1)}
              >
                Refresh Reports
              </Button>
            </div>

            {isLoadingContentReports ? (
              <Skeleton count={4} height="50px" style={{ marginBottom: '10px' }} />
            ) : (
              <div className="admin-card" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reported Item</th>
                        <th>Type</th>
                        <th>Reporter</th>
                        <th>Reason / Notes</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentReports.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '36px' }}>
                            <p className="admin-muted-text">Zero open content reports pending.</p>
                          </td>
                        </tr>
                      ) : (
                        contentReports.map((rep) => (
                          <tr key={rep.id}>
                            <td>
                              <strong>{rep.targetTitle || rep.note?.title || 'Reported Content'}</strong>
                            </td>
                            <td>
                              <Badge variant="neutral" size="sm">{rep.entityType || 'CONTENT'}</Badge>
                            </td>
                            <td>{rep.reporter?.name || 'Anonymous Scholar'}</td>
                            <td>{rep.reason}</td>
                            <td>
                              <Badge variant={rep.status === 'OPEN' || rep.status === 'PENDING' ? 'warning' : 'success'} size="sm">
                                {rep.status}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex items-center gap-1">
                                <Button
                                  size="xs"
                                  variant="primary"
                                  onClick={() => handleResolveContentReport(rep.id, 'RESOLVE')}
                                >
                                  Resolve
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleResolveContentReport(rep.id, 'DISMISS')}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB: ANNOUNCEMENTS & NOTIFICATIONS
            ===================================================================== */}
        {activeTab === 'announcements' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Platform Announcements</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Broadcast global banners and urgent academic notices to scholars and staff.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAnnouncementOpen(true)}
              >
                + Create Announcement
              </Button>
            </div>

            {isLoadingAnnouncements ? (
              <Skeleton count={4} height="50px" style={{ marginBottom: '10px' }} />
            ) : (
              <div className="admin-card" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title & Message</th>
                        <th>Target Audience</th>
                        <th>Priority</th>
                        <th>Created</th>
                        <th>Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcementsList.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '36px' }}>
                            <p className="admin-muted-text">No active platform announcements.</p>
                          </td>
                        </tr>
                      ) : (
                        announcementsList.map((ann) => (
                          <tr key={ann.id}>
                            <td>
                              <strong>{ann.title}</strong>
                              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                {ann.message}
                              </span>
                            </td>
                            <td><Badge variant="primary" size="sm">{ann.targetRole || 'ALL_USERS'}</Badge></td>
                            <td>
                              <Badge variant={ann.priority === 'URGENT' ? 'danger' : ann.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                                {ann.priority || 'NORMAL'}
                              </Badge>
                            </td>
                            <td>{formatRelativeTime(ann.createdAt)}</td>
                            <td>{ann.expiresAt ? new Date(ann.expiresAt).toLocaleDateString() : 'Permanent'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB: STORAGE & FILES
            ===================================================================== */}
        {activeTab === 'storage' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Platform Storage & Document Vault</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Physical disk capacity, upload directories, and permitted document specifications.
                </p>
              </div>
            </div>

            {isLoadingSystem && !storageStats ? (
              <Skeleton count={4} height="60px" style={{ marginBottom: '12px' }} />
            ) : storageStats ? (
              <div className="admin-operational-grid">
                <div className="admin-card">
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Storage Capacity Summary</h3>
                  </div>
                  <div className="admin-card__body">
                    <div className="admin-overview-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="admin-metric-card" style={{ margin: 0 }}>
                        <span className="admin-metric-card__label">Files Stored</span>
                        <p className="admin-metric-card__value">{storageStats.totalStoredManuscripts}</p>
                      </div>
                      <div className="admin-metric-card" style={{ margin: 0 }}>
                        <span className="admin-metric-card__label">Disk Usage</span>
                        <p className="admin-metric-card__value">{storageStats.totalStorageMb} MB</p>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <p><strong>Storage Provider:</strong> {storageStats.provider}</p>
                      <p><strong>Directory Path:</strong> <code style={{ fontSize: '0.8rem' }}>{storageStats.uploadDirectory}</code></p>
                      <p><strong>Max File Upload Size:</strong> {storageStats.maxUploadSizeMb} MB</p>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Allowed Document Types</h3>
                  </div>
                  <div className="admin-card__body">
                    <div className="d-flex flex-col gap-2">
                      {(storageStats.allowedMimeTypes || []).map((mime) => (
                        <div key={mime} className="d-flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{mime}</span>
                          <Badge variant="success" size="sm">Permitted</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* =====================================================================
            TAB: PLATFORM CONFIGURATION SETTINGS
            ===================================================================== */}
        {activeTab === 'settings' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Platform Configuration Settings</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Super Admin global settings persisted to database and enforced application-wide.
                </p>
              </div>
            </div>

            {settingsNotice && (
              <div className="auth-alert auth-alert--success" style={{ marginBottom: '16px' }}>
                <span>{settingsNotice}</span>
              </div>
            )}

            <form onSubmit={handleSavePlatformSettings} className="admin-card" style={{ maxWidth: '720px' }}>
              <div className="admin-card__body d-flex flex-col gap-4">
                <div>
                  <label className="admin-form-label">Platform Name</label>
                  <Input
                    value={platformSettings.platformName}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="admin-form-label">Tagline Display</label>
                  <Input
                    value={platformSettings.tagline}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, tagline: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-grid">
                  <div>
                    <label className="admin-form-label">Max Upload Size (MB)</label>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      value={platformSettings.maxUploadSizeMb}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, maxUploadSizeMb: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Permitted File Formats</label>
                    <Input
                      value={platformSettings.allowedFileFormats}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, allowedFileFormats: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="d-flex items-center justify-between" style={{ padding: '12px 16px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                  <div>
                    <strong>Student Star Ratings & Reviews</strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Allow registered scholars to submit reviews on approved notes</p>
                  </div>
                  <select
                    className="admin-select"
                    value={platformSettings.allowStudentReviews}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, allowStudentReviews: e.target.value })}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>

                <div className="d-flex items-center justify-between" style={{ padding: '12px 16px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                  <div>
                    <strong>Auto-Moderation Pipeline</strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Automatically publish notes bypassing moderator approval queue</p>
                  </div>
                  <select
                    className="admin-select"
                    value={platformSettings.autoModerationEnabled}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, autoModerationEnabled: e.target.value })}
                  >
                    <option value="false">Disabled (Enforce Peer Review)</option>
                    <option value="true">Enabled (Auto-Approve)</option>
                  </select>
                </div>

                <div className="d-flex justify-end" style={{ marginTop: '12px' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSavingSettings}
                  >
                    Save Platform Settings
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* =====================================================================
            TAB: SECURITY CENTER
            ===================================================================== */}
        {activeTab === 'security' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Platform Security Posture Center</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Audit logs, privilege separation, suspended accounts, and compliance protection.
                </p>
              </div>
            </div>

            <div className="admin-operational-grid">
              <div className="admin-card">
                <div className="admin-card__header">
                  <h3 className="admin-card__title">Security Configuration Checklist</h3>
                </div>
                <div className="admin-card__body d-flex flex-col gap-2">
                  <div className="d-flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                    <span>Role-Based Access Control (RBAC)</span>
                    <Badge variant="success" size="sm">4-Tier Enforced</Badge>
                  </div>
                  <div className="d-flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                    <span>Authentication Architecture</span>
                    <Badge variant="success" size="sm">JWT + HttpOnly Cookie</Badge>
                  </div>
                  <div className="d-flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                    <span>Password Security Standards</span>
                    <Badge variant="success" size="sm">Bcrypt (Cost 12)</Badge>
                  </div>
                  <div className="d-flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                    <span>HTTP Security Headers</span>
                    <Badge variant="success" size="sm">Helmet + Strict CSP</Badge>
                  </div>
                  <div className="d-flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                    <span>API Rate Limiting</span>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card__header">
                  <h3 className="admin-card__title">Account Safety & Suspensions</h3>
                </div>
                <div className="admin-card__body">
                  <div className="admin-overview-kpi-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="admin-metric-card" style={{ margin: 0 }}>
                      <span className="admin-metric-card__label">Suspended User Accounts</span>
                      <p className="admin-metric-card__value" style={{ color: (stats?.suspendedUsers || 0) > 0 ? 'var(--color-danger)' : 'inherit' }}>
                        {stats?.suspendedUsers ?? 0}
                      </p>
                      <div className="admin-metric-card__footer">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            navigate('/admin/suspended-users');
                            setStatusFilter('inactive');
                            fetchUsers(1, { status: 'inactive' });
                          }}
                        >
                          Review Suspended Accounts →
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB: SYSTEM HEALTH & DIAGNOSTICS
            ===================================================================== */}
        {activeTab === 'health' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>System Health Diagnostics</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Live runtime indicators, database latency, process memory, and server status.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSystemData}
                isLoading={isLoadingSystem}
              >
                Run Health Probe
              </Button>
            </div>

            {systemHealth ? (
              <div className="admin-operational-grid">
                <div className="admin-card">
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Database Connectivity (MySQL)</h3>
                  </div>
                  <div className="admin-card__body">
                    <p><strong>Status:</strong> <Badge variant="success" size="sm">{systemHealth.database?.status}</Badge></p>
                    <p><strong>Query Response Latency:</strong> {systemHealth.database?.latencyMs} ms</p>
                    <p><strong>Engine:</strong> {systemHealth.database?.engine}</p>
                    <p><strong>Timestamp:</strong> {new Date(systemHealth.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Runtime Node.js Server Process</h3>
                  </div>
                  <div className="admin-card__body">
                    <p><strong>Node Version:</strong> {systemHealth.server?.nodeVersion}</p>
                    <p><strong>Platform OS:</strong> {systemHealth.server?.platform}</p>
                    <p><strong>Process Uptime:</strong> {Math.floor((systemHealth.server?.uptimeSeconds || 0) / 60)} minutes</p>
                    <p><strong>Memory RSS:</strong> {systemHealth.server?.memoryRssMb} MB</p>
                    <p><strong>Heap Used:</strong> {systemHealth.server?.memoryHeapUsedMb} MB / {systemHealth.server?.memoryHeapTotalMb} MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <Skeleton count={3} height="60px" />
            )}
          </div>
        )}

        {/* =====================================================================
            TAB: BACKUP & RECOVERY READINESS
            ===================================================================== */}
        {activeTab === 'backups' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Backup & Disaster Recovery Readiness</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Operational snapshot validation and database disaster recovery procedures.
                </p>
              </div>
            </div>

            {backupStatus ? (
              <div className="admin-operational-grid">
                <div className="admin-card">
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Database Snapshot Readiness</h3>
                  </div>
                  <div className="admin-card__body d-flex flex-col gap-2">
                    <p><strong>Database Engine:</strong> {backupStatus.databaseEngine}</p>
                    <p><strong>ORM Framework:</strong> {backupStatus.orm}</p>
                    <p><strong>Snapshot Verification:</strong> <Badge variant="success" size="sm">{backupStatus.status}</Badge></p>
                    <div style={{ marginTop: '12px' }}>
                      <strong>Active Managed Records:</strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: '20px', color: 'var(--color-text-secondary)' }}>
                        <li>Users: {backupStatus.tablesSummary?.users}</li>
                        <li>Notes: {backupStatus.tablesSummary?.notes}</li>
                        <li>Downloads: {backupStatus.tablesSummary?.downloads}</li>
                        <li>Audit Logs: {backupStatus.tablesSummary?.auditLogs}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card__header">
                    <h3 className="admin-card__title">Operational Verification Checklist</h3>
                  </div>
                  <div className="admin-card__body d-flex flex-col gap-2">
                    {(backupStatus.snapshotChecklist || []).map((item) => (
                      <div key={item.id} className="d-flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                        <span>{item.name}</span>
                        <Badge variant="success" size="sm">{item.status}</Badge>
                      </div>
                    ))}
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Command Line Snapshot Command:</span>
                      <pre style={{ fontSize: '0.75rem', background: '#1e293b', color: '#e2e8f0', padding: '8px', borderRadius: '4px', marginTop: '6px', overflowX: 'auto' }}>
mysqldump -u root -p pj_study &gt; backup_$(date +%F).sql
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Skeleton count={3} height="60px" />
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

        {/* ACADEMIC ENTITY MODAL (CREATE / EDIT - STEP 16) */}
        <Modal
          isOpen={academicModal.isOpen && academicModal.type !== 'delete'}
          onClose={handleCloseAcademicModal}
          title={`${academicModal.mode === 'create' ? 'Add New' : 'Edit'} ${
            academicModal.type === 'university'
              ? 'University / Institution'
              : academicModal.type === 'school'
                ? 'School / Faculty'
                : academicModal.type === 'course'
                  ? 'Degree Course'
                  : academicModal.type === 'subject'
                    ? 'Curriculum Subject'
                    : 'Note Category'
          }`}
        >
          <form onSubmit={handleSubmitAcademicForm} className="admin-modal-content">
            {academicModalError && (
              <div className="auth-alert auth-alert--danger">
                <span>{academicModalError}</span>
              </div>
            )}

            {/* UNIVERSITY FIELDS */}
            {academicModal.type === 'university' && (
              <>
                <Input
                  label="University / Institution Name *"
                  id="acad-uni-name"
                  type="text"
                  placeholder="e.g. Delhi Technological University"
                  value={academicFormData.name || ''}
                  onChange={(e) =>
                    setAcademicFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <div className="admin-form-grid">
                  <Input
                    label="Short Name / Acronym"
                    id="acad-uni-short"
                    type="text"
                    placeholder="e.g. DTU"
                    value={academicFormData.shortName || ''}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({ ...prev, shortName: e.target.value }))
                    }
                  />
                  <Input
                    label="University Code"
                    id="acad-uni-code"
                    type="text"
                    placeholder="e.g. DTU-01"
                    value={academicFormData.code || ''}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />
                </div>
                <Input
                  label="Official Website URL"
                  id="acad-uni-site"
                  type="url"
                  placeholder="https://..."
                  value={academicFormData.website || ''}
                  onChange={(e) =>
                    setAcademicFormData((prev) => ({ ...prev, website: e.target.value }))
                  }
                />
                <div className="input-group">
                  <label htmlFor="acad-uni-desc" className="input-label">
                    Description & Overview
                  </label>
                  <textarea
                    id="acad-uni-desc"
                    className="admin-search-input"
                    rows="2"
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Optional institutional notes or overview..."
                    value={academicFormData.description || ''}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            {/* SCHOOL / FACULTY FIELDS */}
            {academicModal.type === 'school' && (
              <>
                <div className="input-group">
                  <label htmlFor="acad-school-uni" className="input-label">
                    Affiliated University *
                  </label>
                  <div className="admin-select-wrapper" style={{ width: '100%' }}>
                    <select
                      id="acad-school-uni"
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={academicFormData.universityId || ''}
                      onChange={(e) =>
                        setAcademicFormData((prev) => ({ ...prev, universityId: e.target.value }))
                      }
                      required
                    >
                      <option value="">Select University...</option>
                      {academics.universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.shortName ? `(${u.shortName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="School / Faculty Name *"
                  id="acad-school-name"
                  type="text"
                  placeholder="e.g. School of Computer Engineering"
                  value={academicFormData.name || ''}
                  onChange={(e) =>
                    setAcademicFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <Input
                  label="School Code / Identifier"
                  id="acad-school-code"
                  type="text"
                  placeholder="e.g. SCSE"
                  value={academicFormData.code || ''}
                  onChange={(e) =>
                    setAcademicFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                />
                <div className="input-group">
                  <label htmlFor="acad-school-desc" className="input-label">
                    Description
                  </label>
                  <textarea
                    id="acad-school-desc"
                    className="admin-search-input"
                    rows="2"
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Optional faculty details..."
                    value={academicFormData.description || ''}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            {/* DEGREE COURSE FIELDS */}
            {academicModal.type === 'course' && (
              <>
                <div className="admin-form-grid">
                  <div className="input-group">
                    <label htmlFor="acad-course-uni" className="input-label">
                      University (Optional)
                    </label>
                    <div className="admin-select-wrapper" style={{ width: '100%' }}>
                      <select
                        id="acad-course-uni"
                        className="admin-select"
                        style={{ width: '100%' }}
                        value={academicFormData.universityId || ''}
                        onChange={(e) => {
                          const uniId = e.target.value;
                          setAcademicFormData((prev) => ({
                            ...prev,
                            universityId: uniId,
                            schoolId: '' // reset school on uni switch
                          }));
                        }}
                      >
                        <option value="">General / All Universities</option>
                        {academics.universities.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="acad-course-school" className="input-label">
                      School / Faculty (Optional)
                    </label>
                    <div className="admin-select-wrapper" style={{ width: '100%' }}>
                      <select
                        id="acad-course-school"
                        className="admin-select"
                        style={{ width: '100%' }}
                        value={academicFormData.schoolId || ''}
                        onChange={(e) =>
                          setAcademicFormData((prev) => ({ ...prev, schoolId: e.target.value }))
                        }
                      >
                        <option value="">None / General</option>
                        {academics.schools
                          .filter(
                            (s) =>
                              !academicFormData.universityId ||
                              s.universityId === academicFormData.universityId
                          )
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <Input
                  label="Course / Degree Name *"
                  id="acad-course-name"
                  type="text"
                  placeholder="e.g. Bachelor of Technology (Computer Science)"
                  value={academicFormData.name || ''}
                  onChange={(e) =>
                    setAcademicFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />

                <div className="admin-form-grid">
                  <Input
                    label="Course Code / Acronym"
                    id="acad-course-code"
                    type="text"
                    placeholder="e.g. BTECH-CSE"
                    value={academicFormData.code || ''}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />

                  <div className="input-group">
                    <label htmlFor="acad-course-level" className="input-label">
                      Degree Level
                    </label>
                    <div className="admin-select-wrapper" style={{ width: '100%' }}>
                      <select
                        id="acad-course-level"
                        className="admin-select"
                        style={{ width: '100%' }}
                        value={academicFormData.degreeLevel || 'UNDERGRADUATE'}
                        onChange={(e) =>
                          setAcademicFormData((prev) => ({ ...prev, degreeLevel: e.target.value }))
                        }
                      >
                        <option value="UNDERGRADUATE">Undergraduate (UG)</option>
                        <option value="POSTGRADUATE">Postgraduate (PG)</option>
                        <option value="DIPLOMA">Diploma</option>
                        <option value="DOCTORAL">Doctoral (PhD)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="acad-course-semesters" className="input-label">
                    Dynamic Semesters Count * (Configures Semester Selectors)
                  </label>
                  <input
                    id="acad-course-semesters"
                    type="number"
                    min="1"
                    max="20"
                    className="admin-search-input"
                    style={{ width: '100%' }}
                    value={academicFormData.semestersCount || 8}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({
                        ...prev,
                        semestersCount: parseInt(e.target.value, 10) || 1
                      }))
                    }
                    required
                  />
                  <div className="admin-form-hint">
                    Controls dynamic semester rendering (1 to N) across Note Discovery, Note Uploads,
                    and Scholar Profiles. Typical: B.Tech = 8, BCA = 6, MCA = 4, M.Tech = 4.
                  </div>
                </div>
              </>
            )}

            {/* SUBJECT FIELDS */}
            {academicModal.type === 'subject' && (
              <>
                <div className="input-group">
                  <label htmlFor="acad-subject-course" className="input-label">
                    Parent Degree Course *
                  </label>
                  <div className="admin-select-wrapper" style={{ width: '100%' }}>
                    <select
                      id="acad-subject-course"
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={academicFormData.courseId || ''}
                      onChange={(e) => {
                        const newCId = e.target.value;
                        setAcademicFormData((prev) => ({
                          ...prev,
                          courseId: newCId,
                          semester: 1 // reset semester to 1
                        }));
                      }}
                      required
                    >
                      <option value="">Select Degree Course...</option>
                      {academics.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.semestersCount || 8} Semesters)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Subject Title *"
                  id="acad-subj-name"
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={academicFormData.name || ''}
                  onChange={(e) =>
                    setAcademicFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />

                <div className="admin-form-grid">
                  <Input
                    label="Subject Code"
                    id="acad-subj-code"
                    type="text"
                    placeholder="e.g. CS201"
                    value={academicFormData.code || ''}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />

                  <div className="input-group">
                    <label htmlFor="acad-subj-sem" className="input-label">
                      Semester *
                    </label>
                    <div className="admin-select-wrapper" style={{ width: '100%' }}>
                      <select
                        id="acad-subj-sem"
                        className="admin-select"
                        style={{ width: '100%' }}
                        value={academicFormData.semester || 1}
                        onChange={(e) =>
                          setAcademicFormData((prev) => ({
                            ...prev,
                            semester: parseInt(e.target.value, 10) || 1
                          }))
                        }
                        required
                      >
                        {(() => {
                          const targetC = academics.courses.find(
                            (c) => c.id === academicFormData.courseId
                          );
                          const maxSem = targetC?.semestersCount || 8;
                          return Array.from({ length: maxSem }, (_, i) => i + 1).map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="acad-subj-credits" className="input-label">
                    Academic Credits (Optional)
                  </label>
                  <input
                    id="acad-subj-credits"
                    type="number"
                    min="1"
                    max="10"
                    className="admin-search-input"
                    style={{ width: '100%' }}
                    value={academicFormData.credits || 3}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({
                        ...prev,
                        credits: parseInt(e.target.value, 10) || 1
                      }))
                    }
                  />
                </div>
              </>
            )}

            {/* CATEGORY FIELDS */}
            {academicModal.type === 'category' && (
              <>
                <Input
                  label="Category Name *"
                  id="acad-cat-name"
                  type="text"
                  placeholder="e.g. Lecture Notes, Lab Manuals, PYQs"
                  value={academicFormData.name || ''}
                  onChange={(e) =>
                    setAcademicFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <div className="input-group">
                  <label htmlFor="acad-cat-desc" className="input-label">
                    Description
                  </label>
                  <textarea
                    id="acad-cat-desc"
                    className="admin-search-input"
                    rows="2"
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Short description of notes in this category..."
                    value={academicFormData.description || ''}
                    onChange={(e) =>
                      setAcademicFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            {/* ACTIVE STATUS TOGGLE */}
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(academicFormData.isActive ?? true)}
                onChange={(e) =>
                  setAcademicFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                Active in System (Visible in Note discovery, upload forms, and scholar profiles)
              </span>
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '16px'
              }}
            >
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleCloseAcademicModal}
                disabled={isSubmittingAcademic}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmittingAcademic}
              >
                {academicModal.mode === 'create' ? 'Create Record' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ACADEMIC DELETE CONFIRMATION MODAL */}
        <Modal
          isOpen={academicModal.isOpen && academicModal.type === 'delete'}
          onClose={handleCloseAcademicModal}
          title={`Delete ${
            academicModal.mode === 'university'
              ? 'University'
              : academicModal.mode === 'school'
                ? 'School / Faculty'
                : academicModal.mode === 'course'
                  ? 'Degree Course'
                  : academicModal.mode === 'subject'
                    ? 'Subject'
                    : 'Category'
          }`}
        >
          {academicModal.entity && (
            <div className="admin-modal-content">
              {academicModalError && (
                <div className="auth-alert auth-alert--danger">
                  <span>{academicModalError}</span>
                </div>
              )}

              <p className="admin-modal-desc">
                Are you sure you want to permanently delete{' '}
                <strong>{academicModal.entity.name}</strong>?
              </p>

              <p
                className="admin-modal-desc"
                style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '6px' }}
              >
                PJ Study enforces strict relational integrity. Deleting this record will fail if
                there are active notes, registered scholars, or curriculum dependencies associated
                with it.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '16px'
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCloseAcademicModal}
                  disabled={isSubmittingAcademic}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  isLoading={isSubmittingAcademic}
                  onClick={handleConfirmDeleteAcademic}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          )}
        
        {/* NOTE REJECTION REASON MODAL */}
        <Modal
          isOpen={Boolean(rejectModalNote)}
          onClose={() => setRejectModalNote(null)}
          title="Reject Study Manuscript"
        >
          {rejectModalNote && (
            <form onSubmit={handleRejectNoteSubmit} className="admin-modal-content">
              <p style={{ margin: '0 0 16px', color: 'var(--color-text-secondary)' }}>
                Please specify the academic reason for rejecting "<strong>{rejectModalNote.title}</strong>".
                This will be logged in the audit trail and sent to the author.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-form-label">Rejection Reason *</label>
                <textarea
                  className="input input--textarea w-full"
                  rows="4"
                  required
                  placeholder="e.g. Manuscript missing syllabus mapping or violates academic citation standards."
                  value={noteRejectionReason}
                  onChange={(e) => setNoteRejectionReason(e.target.value)}
                />
              </div>
              <div className="d-flex justify-end gap-2">
                <Button type="button" variant="outline" size="md" onClick={() => setRejectModalNote(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="md" isLoading={isSubmittingNoteAction}>
                  Confirm Rejection
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </Modal>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
