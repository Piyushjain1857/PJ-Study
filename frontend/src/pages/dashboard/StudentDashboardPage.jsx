import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePlatformConfig } from '../../context/PlatformConfigContext.jsx';
import dashboardService from '../../services/dashboardService.js';
import { isCancellation } from '../../services/api.js';
import DashboardWelcome from '../../components/dashboard/DashboardWelcome.jsx';
import DashboardStats from '../../components/dashboard/DashboardStats.jsx';
import DashboardActivityChart from '../../components/dashboard/DashboardActivityChart.jsx';
import DashboardRecentNotes from '../../components/dashboard/DashboardRecentNotes.jsx';
import DashboardCollections from '../../components/dashboard/DashboardCollections.jsx';
import DashboardDownloadsHistory from '../../components/dashboard/DashboardDownloadsHistory.jsx';
import DashboardRecommendations from '../../components/dashboard/DashboardRecommendations.jsx';
import DashboardQuickActions from '../../components/dashboard/DashboardQuickActions.jsx';
import Button from '../../components/common/Button.jsx';
import SEO from '../../components/common/SEO.jsx';
import '../../components/dashboard/dashboard.css';

const DEFAULT_SECTION_ORDER = [
  'welcome_header',
  'academic_info',
  'stats_kpi',
  'activity_chart',
  'recent_notes',
  'downloads',
  'collections',
  'recommendations',
  'quick_actions'
];

/**
 * Premium Student Dashboard & Personalized Learning Analytics Page.
 * Dynamic Visual Builder Release: Orders sections dynamically according to Super Admin database configuration.
 */
export function StudentDashboardPage() {
  const { user } = useAuth();
  const { pageConfig } = usePlatformConfig();

  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeRange, setActiveRange] = useState('7d');

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      setError(null);
      const data = await dashboardService.getOverview();
      setOverview(data);
    } catch (err) {
      if (!isCancellation(err)) {
        setError(
          err.response?.data?.error?.message || err.message || 'Failed to load dashboard overview.'
        );
      }
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (range) => {
    try {
      setLoadingAnalytics(true);
      const data = await dashboardService.getAnalytics({ range });
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

  useEffect(() => {
    fetchAnalytics(activeRange);
  }, [fetchAnalytics, activeRange]);

  const handleRangeChange = (range) => {
    setActiveRange(range);
  };

  // Derive dynamic section order and visibility from platform config
  const activeSections = useMemo(() => {
    const order = Array.isArray(pageConfig?.section_order) && pageConfig.section_order.length > 0
      ? pageConfig.section_order
      : DEFAULT_SECTION_ORDER;

    return order.filter((key) => {
      const sec = pageConfig?.[key];
      return sec ? sec.isVisible !== false : true;
    });
  }, [pageConfig]);

  if (error && !overview) {
    return (
      <div className="container dash-page">
        <div className="dash-error-state" role="alert">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="48"
            height="48"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Unable to Load Student Dashboard</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={fetchOverview}>
            Retry
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
            config={pageConfig?.welcome_header}
          />
        );

      case 'academic_info':
        return (
          <div
            key="academic_info"
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              borderLeft: '4px solid var(--color-primary, #0f766e)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '26px' }}>🏛️</span>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  K.R. Mangalam University — Academic Portal
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {user?.school?.name || 'School of Computer Science & Engineering'} · Semester {user?.semester || 4}
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-primary, #0f766e)',
                backgroundColor: 'rgba(15, 118, 110, 0.1)',
                padding: '4px 10px',
                borderRadius: '12px'
              }}
            >
              Enrolled Scholar
            </span>
          </div>
        );

      case 'stats_kpi':
        return (
          <DashboardStats
            key="stats_kpi"
            stats={overview?.stats}
            loading={loadingOverview}
            config={pageConfig?.stats_kpi}
          />
        );

      case 'activity_chart':
        return (
          <DashboardActivityChart
            key="activity_chart"
            analytics={analytics}
            activeRange={activeRange}
            onRangeChange={handleRangeChange}
            loading={loadingAnalytics}
          />
        );

      case 'recent_notes':
        return (
          <DashboardRecentNotes
            key="recent_notes"
            recentBookmarks={overview?.recentBookmarks}
            recentUploads={overview?.recentUploads}
            recentViews={overview?.recentViews}
            loading={loadingOverview}
            title={pageConfig?.recent_notes?.title}
            subtitle={pageConfig?.recent_notes?.subtitle}
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

      case 'recommendations':
        return (
          <DashboardRecommendations
            key="recommendations"
            recommendedNotes={overview?.recommendedNotes}
            loading={loadingOverview}
            title={pageConfig?.recommendations?.title}
            subtitle={pageConfig?.recommendations?.subtitle}
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
      <SEO title="Student Dashboard" noindex={true} />
      {activeSections.map((sectionKey) => renderSection(sectionKey))}
    </div>
  );
}

export default StudentDashboardPage;
