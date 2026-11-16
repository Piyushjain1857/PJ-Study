import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar.jsx';
import Dropdown from '../components/common/Dropdown.jsx';
import Badge from '../components/common/Badge.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlatformConfig } from '../context/PlatformConfigContext.jsx';
import './AppLayout.css';

/**
 * Resolves an icon key or React node to a valid SVG icon component.
 */
function getNavIcon(icon) {
  if (React.isValidElement(icon)) return icon;
  switch (icon) {
    case 'layout':
    case 'grid':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'activity':
    case 'bar-chart':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'code':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      );
    case 'user-check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'monitor':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'palette':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      );
    case 'layers':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case 'toggle-right':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'key':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'file-text':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 10h1v4H9z" />
          <path d="M14 10h1v4h-1z" />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'flag':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      );
    case 'cpu':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'history':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'user':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'bookmark':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'plus-circle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'slash':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      );
    case 'alert-triangle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'message-square':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case 'lock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}

/**
 * Premium Educational SaaS Application Shell for PJ Study.
 * V2 Upgrade: Plus Jakarta Sans headings, refined 256px sidebar, glassmorphic top header, Cmd+K search.
 */
export function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Global Command+K / Ctrl+K keyboard shortcut to focus or navigate to Explore Notes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/notes/explore');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Lock background scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleMobileSidebar = () => setMobileSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  async function handleLogout() {
    closeMobileSidebar();
    await logout();
    navigate('/');
  }

  // Derive human-readable page context based on active route
  const getPageTitle = (path) => {
    if (path.startsWith('/admin-workspace')) return 'Admin Workspace';
    if (path === '/admin') return 'Overview Dashboard';
    if (path.startsWith('/admin/analytics')) return 'Advanced Analytics';
    if (path.startsWith('/admin/activity')) return 'Live Platform Activity';
    if (path.startsWith('/admin/users')) return 'User & Access Control';
    if (path.startsWith('/admin/moderators') || path.startsWith('/admin/admins')) return 'Admin Management & Staff';
    if (path.startsWith('/admin/roles')) return 'Roles & Permissions Matrix';
    if (path.startsWith('/admin/suspended-users')) return 'Suspended Accounts';
    if (path.startsWith('/admin/academics/schools') || path.startsWith('/admin/academics/universities')) return 'Schools & Faculties';
    if (path.startsWith('/admin/academics/courses')) return 'Courses & Semesters';
    if (path.startsWith('/admin/academics/subjects')) return 'Subjects & Categories';
    if (path.startsWith('/admin/academics')) return 'Academic Architecture — KRMU';
    if (path === '/admin/ui-builder/scholar') return 'Scholar Workspace UI Editor';
    if (path === '/admin/ui-builder/admin') return 'Admin Workspace UI Editor';
    if (path === '/admin/ui-builder/homepage') return 'Public Homepage Builder';
    if (path.startsWith('/admin/ui-builder')) return 'Visual Website Builder';
    if (path.startsWith('/admin/appearance')) return 'Theme & Branding Studio';
    if (path.startsWith('/admin/navigation')) return 'Navigation Hierarchy Builder';
    if (path.startsWith('/admin/widgets')) return 'Dashboard Widgets Manager';
    if (path.startsWith('/admin/features')) return 'Platform Feature Flags Control';
    if (path.startsWith('/admin/permissions')) return 'Admin Permission Scopes Manager';
    if (path.startsWith('/admin/content')) return 'Platform Content & CMS Blocks';
    if (path.startsWith('/admin/config/history')) return 'Configuration Version History & Rollback';
    if (path === '/admin/notes') return 'All Notes Directory';
    if (path === '/admin/notes/upload') return 'Upload Study Note';
    if (path.startsWith('/admin/moderation')) return 'Manuscript Approval Queue';
    if (path.startsWith('/admin/reports')) return 'Reports & Appeals';
    if (path.startsWith('/admin/reviews')) return 'Ratings & Reviews Moderation';
    if (path.startsWith('/admin/announcements')) return 'Platform Announcements';
    if (path.startsWith('/admin/notifications')) return 'Notification Operations';
    if (path.startsWith('/admin/storage')) return 'Storage & Files';
    if (path.startsWith('/admin/audit-logs')) return 'Audit Compliance Trail';
    if (path.startsWith('/admin/settings')) return 'Platform Configuration Settings';
    if (path.startsWith('/admin/security')) return 'Security Center';
    if (path.startsWith('/admin/health')) return 'System Health Diagnostics';
    if (path.startsWith('/admin/backups')) return 'Backup & Recovery Readiness';
    if (path === '/dashboard' || path === '/app') {
      return user?.role === 'SUPER_ADMIN' ? 'Command Center' : (user?.role === 'ADMIN' || user?.role === 'MODERATOR') ? 'Admin Workspace' : 'Scholar Dashboard';
    }
    if (path.startsWith('/notes/explore') || path === '/notes') return 'Explore Notes';
    if (path.startsWith('/notes/recommended')) return 'Recommended For You';
    if (path.startsWith('/my-notes')) return 'My Study Library';
    if (path.startsWith('/notes/new')) return 'Upload Study Note';
    if (path.includes('/edit')) return 'Edit Study Note';
    if (path.startsWith('/notes/')) return 'Study Manuscript Details';
    if (path.startsWith('/profile')) return 'Profile & Security';
    if (path.startsWith('/notifications')) return 'Notification Center';
    if (path.startsWith('/design-system')) return 'Design System Reference';
    return 'PJ Study Workspace';
  };

  // User dropdown menu items
  const isSuperAdminRole = user?.role === 'SUPER_ADMIN';
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const userMenuItems = isSuperAdminRole
    ? [
        { label: 'Admin Command Center', onClick: () => navigate('/admin') },
        { label: 'Platform Settings', onClick: () => navigate('/admin/settings') },
        { label: 'Audit Logs', onClick: () => navigate('/admin/audit-logs') },
        { label: 'Admin Profile', onClick: () => navigate('/profile') },
        { divider: true },
        { label: 'Sign Out', danger: true, onClick: handleLogout }
      ]
    : isAdminRole
      ? [
          { label: 'Admin Dashboard', onClick: () => navigate('/admin-workspace') },
          { label: 'Direct Upload Note', onClick: () => navigate('/notes/new') },
          { label: 'My Published Notes', onClick: () => navigate('/my-notes') },
          { label: 'Notifications', onClick: () => navigate('/notifications') },
          { label: 'Profile', onClick: () => navigate('/profile') },
          { divider: true },
          { label: 'Sign Out', danger: true, onClick: handleLogout }
        ]
      : [
          { label: 'Scholar Dashboard', onClick: () => navigate('/dashboard') },
          { label: 'My Library', onClick: () => navigate('/my-notes') },
          { label: 'Notifications', onClick: () => navigate('/notifications') },
          { label: 'Profile', onClick: () => navigate('/profile') },
          { divider: true },
          { label: 'Sign Out', danger: true, onClick: handleLogout }
        ];

  // =============================================================================
  // WORKSPACE 1: SCHOLAR WORKSPACE
  // =============================================================================
  const scholarNavGroups = [
    {
      label: 'MAIN',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          exact: true,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          )
        },
        {
          to: '/notes/explore',
          label: 'Explore Notes',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )
        },
        {
          to: '/notes/recommended',
          label: 'Recommended',
          badge: 'Curated',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )
        },
        {
          to: '/my-notes',
          label: 'My Library',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        {
          to: '/notifications',
          label: 'Notifications',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          )
        },
        {
          to: '/profile',
          label: 'Profile',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )
        }
      ]
    }
  ];

  // =============================================================================
  // WORKSPACE 2: ADMIN WORKSPACE (FORMER MODERATOR)
  // =============================================================================
  const adminNavGroups = [
    {
      label: 'OVERVIEW',
      items: [
        {
          to: '/admin-workspace',
          label: 'Admin Dashboard',
          exact: true,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          )
        },
        {
          to: '/admin-workspace/analytics',
          label: 'Content Analytics',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'NOTES MANAGEMENT',
      items: [
        {
          to: '/notes/new',
          label: 'Upload Note',
          highlight: true,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          )
        },
        {
          to: '/my-notes',
          label: 'My Notes',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          )
        },
        {
          to: '/admin-workspace/notes',
          label: 'Manage Notes',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          )
        },
        {
          to: '/admin-workspace/notes?status=PUBLISHED',
          label: 'Published Notes',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )
        },
        {
          to: '/admin-workspace/notes?status=UNPUBLISHED',
          label: 'Unpublished Notes',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'CONTENT QUALITY',
      items: [
        {
          to: '/admin-workspace/reports',
          label: 'Reported Notes',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          )
        },
        {
          to: '/admin-workspace/quality',
          label: 'Content Quality',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        {
          to: '/notifications',
          label: 'Notifications',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          )
        },
        {
          to: '/profile',
          label: 'Profile',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )
        },
        {
          to: '#signout',
          label: 'Sign Out',
          isSignOut: true,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )
        }
      ]
    }
  ];

  // =============================================================================
  // WORKSPACE 3: SUPER ADMIN COMMAND CENTER WORKSPACE
  // =============================================================================
  const superAdminNavGroups = [
    {
      label: 'COMMAND CENTER',
      items: [
        {
          to: '/admin',
          label: 'Overview Dashboard',
          exact: true,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          )
        },
        {
          to: '/admin/analytics',
          label: 'Advanced Analytics',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          )
        },
        {
          to: '/admin/activity',
          label: 'Platform Activity',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'PLATFORM BUILDER',
      items: [
        {
          to: '/admin/ui-builder',
          label: 'Visual Website Builder',
          exact: true,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          )
        },
        {
          to: '/admin/ui-builder/scholar',
          label: 'Scholar UI Editor',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          )
        },
        {
          to: '/admin/ui-builder/admin',
          label: 'Admin UI Editor',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          )
        },
        {
          to: '/admin/ui-builder/homepage',
          label: 'Homepage Editor',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          )
        },
        {
          to: '/admin/appearance',
          label: 'Theme Studio',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20" />
            </svg>
          )
        },
        {
          to: '/admin/navigation',
          label: 'Navigation Builder',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )
        },
        {
          to: '/admin/widgets',
          label: 'Dashboard Widgets',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'PLATFORM CONTROL',
      items: [
        {
          to: '/admin/features',
          label: 'Feature Control',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )
        },
        {
          to: '/admin/permissions',
          label: 'Permissions Manager',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )
        },
        {
          to: '/admin/content',
          label: 'Content Manager',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          )
        },
        {
          to: '/admin/settings',
          label: 'Platform Settings',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        {
          to: '/admin/users',
          label: 'Users',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )
        },
        {
          to: '/admin/moderators',
          label: 'Admins',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          )
        },
        {
          to: '/admin/academics',
          label: 'Academic Architecture (KRMU)',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 10h1v4H9z" />
              <path d="M14 10h1v4h-1z" />
            </svg>
          )
        },
        {
          to: '/admin/notes',
          label: 'Notes Management',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          )
        },
        {
          to: '/admin/reports',
          label: 'Content Reports',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )
        }
      ]
    },
    {
      label: 'OPERATIONS',
      items: [
        {
          to: '/admin/announcements',
          label: 'Announcements',
          icon: 'message-square'
        },
        {
          to: '/admin/notifications',
          label: 'Notifications',
          icon: 'bell'
        },
        {
          to: '/admin/storage',
          label: 'Storage Management',
          icon: 'database'
        },
        {
          to: '/admin/audit-logs',
          label: 'Audit Logs',
          icon: 'clipboard'
        }
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        {
          to: '/admin/security',
          label: 'Security Center',
          icon: 'lock'
        },
        {
          to: '/admin/health',
          label: 'System Health',
          icon: 'cpu'
        },
        {
          to: '/admin/backups',
          label: 'Backup & Recovery',
          icon: 'database'
        },
        {
          to: '/admin/config/history',
          label: 'Configuration History',
          icon: 'history'
        }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        {
          to: '/profile',
          label: 'Super Admin Profile',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )
        }
      ]
    }
  ];

  const { navigation: dynamicNav } = usePlatformConfig();

  // Active navigation groups based on current RBAC identity & dynamic database release
  const activeNavGroups = React.useMemo(() => {
    // 1. If dynamicNav is available from the database, use it
    if (Array.isArray(dynamicNav) && dynamicNav.length > 0) {
      return dynamicNav
        .map((group) => ({
          ...group,
          items: (group.items || []).filter((item) => item.isVisible !== false)
        }))
        .filter((group) => (group.items || []).length > 0);
    }

    // 2. Fallback to hardcoded safe defaults
    const fallback = isSuperAdminRole
      ? superAdminNavGroups
      : isAdminRole
        ? adminNavGroups
        : scholarNavGroups;

    return fallback
      .map((group) => ({
        ...group,
        items: (group.items || []).filter((item) => item.isVisible !== false)
      }))
      .filter((group) => (group.items || []).length > 0);
  }, [dynamicNav, isSuperAdminRole, isAdminRole, superAdminNavGroups, adminNavGroups, scholarNavGroups]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="app-shell__mobile-backdrop"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (256px Desktop) */}
      <aside
        className={`app-shell__sidebar ${
          mobileSidebarOpen ? 'app-shell__sidebar--mobile-open' : ''
        }`}
        aria-label="Application Navigation"
      >
        {/* Brand Header */}
        <div className="app-shell__sidebar-header">
          <Link to="/" className="app-shell__sidebar-brand" title="PJ Study Homepage">
            <span className="app-shell__sidebar-logo" aria-hidden="true">
              PJ
            </span>
            {!sidebarCollapsed && (
              <span className="app-shell__sidebar-brand-text">
                <span className="app-shell__sidebar-title">PJ Study</span>
                <span
                  className={`app-shell__sidebar-subtitle ${
                    isSuperAdminRole ? 'app-shell__sidebar-subtitle--admin' : ''
                  }`}
                >
                  {isSuperAdminRole ? 'Command Center' : isAdminRole ? 'Admin Workspace' : 'K.R. Mangalam University'}
                </span>
              </span>
            )}
          </Link>
          <div className="d-flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSidebar}
              className="app-shell__collapse-btn d-none d-md-flex"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarCollapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6-6-6" />}
              </svg>
            </button>
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="app-shell__mobile-close-btn d-md-none"
              aria-label="Close navigation drawer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className={`app-shell__nav ${isSuperAdminRole ? 'app-shell__nav--admin' : ''}`}>
          {activeNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="app-shell__nav-group">
              {!sidebarCollapsed && (
                <span className="app-shell__nav-label">{group.label}</span>
              )}
              {group.items.map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.to}
                  end={item.exact}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `app-shell__nav-item ${isActive ? 'app-shell__nav-item--active' : ''} ${
                      item.highlight ? 'app-shell__nav-item--highlight' : ''
                    }`
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="app-shell__nav-icon" aria-hidden="true">
                    {getNavIcon(item.icon)}
                  </span>
                  {!sidebarCollapsed && <span className="app-shell__nav-text">{item.label}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <Badge variant="primary" size="sm" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Quick Sign Out Action for Super Admin inside Nav */}
          {isSuperAdminRole && (
            <div className="app-shell__nav-group mt-2 mb-3">
              <button
                type="button"
                onClick={handleLogout}
                className="app-shell__nav-item app-shell__nav-item--signout"
                title={sidebarCollapsed ? 'Sign Out' : undefined}
              >
                <span className="app-shell__nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                {!sidebarCollapsed && <span className="app-shell__nav-text">Sign Out</span>}
              </button>
            </div>
          )}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="app-shell__sidebar-footer">
          {isAuthenticated ? (
            <div className="app-shell__user-container">
              <Avatar
                name={user?.name || 'Scholar'}
                src={user?.avatarUrl}
                size={sidebarCollapsed ? 'sm' : 'md'}
              />
              {!sidebarCollapsed && (
                <div className="app-shell__user-info">
                  <span className="app-shell__user-name">{user?.name || 'Scholar'}</span>
                  <span className="app-shell__user-role">
                    {user?.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : isAdminRole
                        ? 'Academic Admin'
                        : 'Verified Scholar'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="app-shell__guest-container">
              {!sidebarCollapsed ? (
                <div className="d-flex flex-col gap-2 w-full">
                  <Link to="/login" className="btn btn--sm btn--primary w-full text-center">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn--sm btn--secondary w-full text-center">
                    Get Started
                  </Link>
                </div>
              ) : (
                <Link to="/login" className="app-shell__nav-icon" title="Sign In">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="20"
                    height="20"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="app-shell__main-wrapper">
        {/* Top Header Bar */}
        <header className="app-shell__top-bar">
          <div className="d-flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="app-shell__mobile-menu-btn"
              aria-label="Toggle navigation menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="20"
                height="20"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="app-shell__breadcrumb">
              <span className="app-shell__breadcrumb-sub">PJ Study</span>
              <span className="app-shell__breadcrumb-sep">/</span>
              <h1 className="app-shell__breadcrumb-current">{getPageTitle(location.pathname)}</h1>
            </div>
          </div>

          <div className="d-flex items-center gap-3">
            {/* Quick Search Shortcut Pill */}
            <button
              type="button"
              onClick={() => navigate('/notes/explore')}
              className="app-shell__search-pill"
              aria-label="Search study notes (Command+K)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="15"
                height="15"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="app-shell__search-text">Search notes, subjects...</span>
              <kbd className="app-shell__search-kbd">⌘K</kbd>
            </button>

            {/* Notification Center Trigger */}
            {isAuthenticated && <NotificationBell />}

            {/* User Account Menu */}
            {isAuthenticated ? (
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="app-shell__avatar-btn"
                    aria-label="Open scholar account menu"
                  >
                    <Avatar name={user?.name || 'Scholar'} src={user?.avatarUrl} size="sm" />
                  </button>
                }
                items={userMenuItems}
                align="right"
              />
            ) : (
              <div className="d-flex items-center gap-2">
                <Link to="/login" className="btn btn--sm btn--ghost">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn--sm btn--primary">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Content Outlet */}
        <main id="main-content" className="app-shell__content" tabIndex="-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
