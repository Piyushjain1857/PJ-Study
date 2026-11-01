import React from 'react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import './DashboardShellPage.css';

/**
 * DashboardShellPage provides an authenticated application shell preview
 * with breadcrumbs, action buttons, and student workspace foundation.
 */
export function DashboardShellPage() {
  return (
    <div className="dash-shell-page">
      <PageHeader
        kicker="Student Workspace"
        title="Scholar Overview"
        subtitle="Manage your personal academic note collection, AI review queues, and course notebooks."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Workspace', href: '/app' },
          { label: 'Overview' }
        ]}
        actions={
          <div className="d-flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            >
              Search Archive
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              Upload Note
            </Button>
          </div>
        }
      />

      {/* Workspace Quick Metrics */}
      <div className="grid grid-cols-1 grid-cols-3-md gap-4 mb-8">
        <div className="card d-flex flex-col gap-1">
          <span className="editorial-kicker">Saved Materials</span>
          <span className="dash-metric-number">0</span>
          <span className="text-meta">Notes in personal archive</span>
        </div>
        <div className="card d-flex flex-col gap-1">
          <span className="editorial-kicker">AI Synthesis Quota</span>
          <span className="dash-metric-number">Unlimited</span>
          <span className="text-meta">Document chat queries available</span>
        </div>
        <div className="card d-flex flex-col gap-1">
          <span className="editorial-kicker">Academic Standing</span>
          <div className="d-flex items-center gap-2 mt-1">
            <Badge variant="verified" label="Verified Scholar" dot />
          </div>
          <span className="text-meta">University honor roll linked</span>
        </div>
      </div>

      {/* Main Workspace Area with Honest Phase 1 Notification */}
      <div className="dash-shell-content">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          title="Student Dashboard Foundation Ready"
          description="The authenticated application layout, sidebar navigation, breadcrumb structure, and design tokens are in place. Core note ingestion and personal notebooks will be integrated in Phase 2."
          action={
            <div className="d-flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => window.history.back()}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = '/design-system')}
              >
                Explore Design System
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}

export default DashboardShellPage;
