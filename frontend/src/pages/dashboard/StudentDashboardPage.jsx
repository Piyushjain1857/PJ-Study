import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePlatformConfig } from '../../context/PlatformConfigContext.jsx';
import dashboardService from '../../services/dashboardService.js';
import { isCancellation } from '../../services/api.js';

import DashboardWelcome from '../../components/dashboard/DashboardWelcome.jsx';
import DashboardSmartSearch from '../../components/dashboard/DashboardSmartSearch.jsx';
import DashboardStats from '../../components/dashboard/DashboardStats.jsx';
import DashboardRecentPublishedNotes from '../../components/dashboard/DashboardRecentPublishedNotes.jsx';
import DashboardRecommendations from '../../components/dashboard/DashboardRecommendations.jsx';
import DashboardLibraryPreview from '../../components/dashboard/DashboardLibraryPreview.jsx';
import DashboardAnnouncements from '../../components/dashboard/DashboardAnnouncements.jsx';
import DashboardActivityChart from '../../components/dashboard/DashboardActivityChart.jsx';
import DashboardDownloadsHistory from '../../components/dashboard/DashboardDownloadsHistory.jsx';
import DashboardCollections from '../../components/dashboard/DashboardCollections.jsx';
import DashboardQuickActions from '../../components/dashboard/DashboardQuickActions.jsx';

import Modal from '../../components/common/Modal.jsx';
import NotePreview from '../../components/notes/NotePreview.jsx';
import Button from '../../components/common/Button.jsx';
import SEO from '../../components/common/SEO.jsx';
import '../../components/dashboard/dashboard.css';

const DEFAULT_SECTION_ORDER = [
  'welcome_header',
  'quick_search',
  'stats_kpi',
  'recent_notes',
  'recommendations',
  'bottom_split'
];

/**
 * Premium Student Dashboard 3.0.
 * Refined EdTech SaaS experience for K.R. Mangalam University scholars.
 * Seamlessly integrates real database analytics, smart notes search, curated recommendations,
 * and dynamic Super Admin Visual Website Builder configurations.
 */
export function StudentDashboardPage() {
  const { user } = useAuth();
  const { pageConfig } = usePlatformConfig();

  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeRange, setActiveRange] = useState('7d');

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState(null);

  // Note preview modal state
  const [previewNote, setPreviewNote] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      setError(null);
      const data = await dashboardService.getOverview();
      setOverview(data);
    } catch (err) {
      if (!isCancellation(err)) {
        setError(
          err.response?.data?.error?.message || err.message || 'Failed to load student dashboard.'
        );
      }
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (range) => {
    try {
      setLoadingAnalytics(true);
      const data = await dashboardService.getAnalytics(range);
      setAnalytics(data);
    } catch (err) {
      if (!isCancellation(err)) {
        console.error('Failed to load learning analytics:', err);
      }
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Derive dynamic section order and visibility from platform config
  const activeSections = useMemo(() => {
    const rawOrder = Array.isArray(pageConfig?.section_order) && pageConfig.section_order.length > 0
      ? pageConfig.section_order
      : DEFAULT_SECTION_ORDER;

    // Normalize: if order contains legacy keys or standard 3.0 keys
    return rawOrder.filter((key) => {
      const sec = pageConfig?.[key];
      return sec ? sec.isVisible !== false : true;
    });
  }, [pageConfig]);

  if (error && !overview) {
    return (
      <div className="container dash-page">
        <div className="dash-error-state" role="alert" style={{ background: '#ffffff', borderRadius: '12px', padding: '36px', textAlign: 'center', border: '1px solid #e2e8f0', marginTop: '24px' }}>
          <span style={{ fontSize: '36px' }}>⚠️</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '12px 0 6px' }}>
            Unable to Load Student Dashboard
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 auto 16px', maxWidth: '420px' }}>
            {error}
          </p>
          <Button variant="primary" onClick={fetchOverview}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // Render individual component by section key
  const renderSection = (key) => {
    switch (key) {
      case 'welcome_header':
        return (
          <DashboardWelcome
            key="welcome_header"
            user={user}
          />
        );

      case 'quick_search':
        return (
          <DashboardSmartSearch
            key="quick_search"
            userCourseName={user?.course?.name}
            userSemester={user?.semester}
          />
        );

      case 'stats_kpi':
        return (
          <DashboardStats
            key="stats_kpi"
            stats={overview?.stats}
            loading={loadingOverview}
          />
        );

      case 'recent_notes':
        return (
          <DashboardRecentPublishedNotes
            key="recent_notes"
            notes={overview?.recentPublishedNotes || overview?.recentBookmarks?.map((b) => b.note) || []}
            loading={loadingOverview}
            title={pageConfig?.recent_notes?.title}
            subtitle={pageConfig?.recent_notes?.subtitle}
            onPreviewNote={(note) => setPreviewNote(note)}
            onBookmarkChanged={fetchOverview}
          />
        );

      case 'recommendations':
        return (
          <DashboardRecommendations
            key="recommendations"
            recommendedNotes={overview?.recommendedNotes}
            loading={loadingOverview}
            title={pageConfig?.recommendations?.title}
            subtitle={pageConfig?.recommendations?.subtitle}
            onPreviewNote={(note) => setPreviewNote(note)}
          />
        );

      case 'bottom_split':
      case 'library_preview':
        return (
          <div key="bottom_split" className="dash-row-split">
            <DashboardLibraryPreview
              bookmarks={overview?.recentBookmarks || []}
              collections={overview?.recentCollections || []}
              loading={loadingOverview}
              title={pageConfig?.library_preview?.title}
            />
            <DashboardAnnouncements
              announcements={overview?.announcements || []}
              loading={loadingOverview}
              title={pageConfig?.announcements?.title}
            />
          </div>
        );

      case 'announcements':
        // If rendered separately from split
        if (activeSections.includes('bottom_split') || activeSections.includes('library_preview')) {
          return null;
        }
        return (
          <DashboardAnnouncements
            key="announcements"
            announcements={overview?.announcements || []}
            loading={loadingOverview}
            title={pageConfig?.announcements?.title}
          />
        );

      // Backwards compatibility handlers for legacy platform configurations
      case 'activity_chart':
        return (
          <DashboardActivityChart
            key="activity_chart"
            analytics={analytics}
            activeRange={activeRange}
            onRangeChange={(range) => {
              setActiveRange(range);
              fetchAnalytics(range);
            }}
            loading={loadingAnalytics}
          />
        );

      case 'downloads':
        return (
          <DashboardDownloadsHistory
            key="downloads"
            downloads={overview?.recentDownloads}
            loading={loadingOverview}
            title={pageConfig?.downloads?.title}
            subtitle={pageConfig?.downloads?.subtitle}
          />
        );

      case 'collections':
        return (
          <DashboardCollections
            key="collections"
            collections={overview?.recentCollections}
            loading={loadingOverview}
            title={pageConfig?.collections?.title}
            subtitle={pageConfig?.collections?.subtitle}
          />
        );

      case 'quick_actions':
        return <DashboardQuickActions key="quick_actions" />;

      default:
        return null;
    }
  };

  return (
    <div className="container dash-page">
      <SEO title="Scholar Dashboard · PJ Study" noindex={true} />

      {/* Render dynamically ordered sections */}
      {activeSections.map((sectionKey) => renderSection(sectionKey))}

      {/* Ensure quick search and bottom split always display if not specified in legacy order */}
      {!activeSections.includes('quick_search') && (
        <DashboardSmartSearch
          userCourseName={user?.course?.name}
          userSemester={user?.semester}
        />
      )}

      {/* Note Document Preview Modal */}
      {previewNote && (
        <Modal
          isOpen={Boolean(previewNote)}
          onClose={() => setPreviewNote(null)}
          title={`Document Preview: ${previewNote.title}`}
          maxWidth="760px"
        >
          <NotePreview
            note={previewNote}
            onClose={() => setPreviewNote(null)}
          />
        </Modal>
      )}
    </div>
  );
}

export default StudentDashboardPage;
