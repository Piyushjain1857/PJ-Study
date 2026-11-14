import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import dashboardService from '../../services/dashboardService.js';
import DashboardWelcome from '../../components/dashboard/DashboardWelcome.jsx';
import DashboardStats from '../../components/dashboard/DashboardStats.jsx';
import DashboardActivityChart from '../../components/dashboard/DashboardActivityChart.jsx';
import DashboardRecentNotes from '../../components/dashboard/DashboardRecentNotes.jsx';
import DashboardCollections from '../../components/dashboard/DashboardCollections.jsx';
import DashboardDownloadsHistory from '../../components/dashboard/DashboardDownloadsHistory.jsx';
import DashboardRecommendations from '../../components/dashboard/DashboardRecommendations.jsx';
import DashboardQuickActions from '../../components/dashboard/DashboardQuickActions.jsx';
import Button from '../../components/common/Button.jsx';
import '../../components/dashboard/dashboard.css';

/**
 * Premium Student Dashboard & Personalized Learning Analytics Page.
 */
export function StudentDashboardPage() {
  const { user } = useAuth();

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
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to load dashboard overview.'
      );
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (range) => {
    try {
      setLoadingAnalytics(true);
      const data = await dashboardService.getAnalytics(range);
      setAnalytics(data);
    } catch {
      // Keep existing analytics data on silent error
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

  const handleRangeChange = (newRange) => {
    setActiveRange(newRange);
  };

  if (error && !overview) {
    return (
      <div className="container" style={{ padding: '64px 20px', textAlign: 'center' }}>
        <div className="dash-empty-box">
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

  return (
    <div className="container dash-page">
      {/* 1. Personalized Welcome Header */}
      <DashboardWelcome user={user} />

      {/* 2. Primary 4 Statistics Cards */}
      <DashboardStats stats={overview?.stats} loading={loadingOverview} />

      {/* 3. Personalized Learning Analytics & SVG Activity Chart */}
      <DashboardActivityChart
        analytics={analytics}
        activeRange={activeRange}
        onRangeChange={handleRangeChange}
        loading={loadingAnalytics}
      />

      {/* 4. Split Two-Column Workspace Layout */}
      <div className="dash-grid-split">
        {/* Left Column: Recent Notes & Download History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <DashboardRecentNotes
            recentBookmarks={overview?.recentBookmarks}
            recentUploads={overview?.recentUploads}
            loading={loadingOverview}
          />

          <DashboardDownloadsHistory
            downloads={overview?.recentDownloads}
            loading={loadingOverview}
          />
        </div>

        {/* Right Column: Collections, Recommendations & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <DashboardCollections
            collections={overview?.recentCollections}
            loading={loadingOverview}
          />

          <DashboardRecommendations
            recommendedNotes={overview?.recommendedNotes}
            loading={loadingOverview}
          />

          <DashboardQuickActions />
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardPage;
