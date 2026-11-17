import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import dashboardService from '../../services/dashboardService.js';
import { isCancellation } from '../../services/api.js';

import DashboardPersonalizedHeader from '../../components/dashboard/DashboardPersonalizedHeader.jsx';
import DashboardSearchDiscovery from '../../components/dashboard/DashboardSearchDiscovery.jsx';
import DashboardContinueReading from '../../components/dashboard/DashboardContinueReading.jsx';
import DashboardYourSubjects from '../../components/dashboard/DashboardYourSubjects.jsx';
import DashboardRecommendations from '../../components/dashboard/DashboardRecommendations.jsx';
import DashboardRecentPublishedNotes from '../../components/dashboard/DashboardRecentPublishedNotes.jsx';
import DashboardLibraryPreview from '../../components/dashboard/DashboardLibraryPreview.jsx';
import DashboardAnnouncements from '../../components/dashboard/DashboardAnnouncements.jsx';

import Modal from '../../components/common/Modal.jsx';
import NotePreview from '../../components/notes/NotePreview.jsx';
import Button from '../../components/common/Button.jsx';
import SEO from '../../components/common/SEO.jsx';
import '../../components/dashboard/dashboard.css';

/**
 * PJ Study Scholar Dashboard 4.0.
 * Premium personalized academic workspace designed for serious university students.
 * Editorial minimalism, zero clutter, real database taxonomies, fast discovery, and seamless document preview.
 */
export function StudentDashboardPage() {
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [error, setError] = useState(null);

  // Document preview modal state
  const [previewNote, setPreviewNote] = useState(null);

  // Stabilized modal preview callbacks
  const handlePreviewNote = useCallback((note) => {
    setPreviewNote(note);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewNote(null);
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      setError(null);
      const data = await dashboardService.getOverview();
      setOverview(data);
    } catch (err) {
      if (!isCancellation(err)) {
        setError(
          err.response?.data?.error?.message || err.message || 'Failed to load scholar workspace.'
        );
      }
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (error && !overview) {
    return (
      <div className="container dash-workspace">
        <SEO title="Scholar Workspace · PJ Study" noindex={true} />
        <div className="dash-error-box" role="alert">
          <div className="dash-error-icon" aria-hidden="true">⚠️</div>
          <h2 className="dash-error-title">Unable to Connect to Workspace</h2>
          <p className="dash-error-message">{error}</p>
          <Button variant="primary" onClick={fetchOverview}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container dash-workspace">
      <SEO title="Scholar Workspace · PJ Study" noindex={true} />

      {/* SECTION H (Conditional Alert Placement if Urgent Notice) */}
      <DashboardAnnouncements
        announcements={overview?.announcements || []}
        loading={loadingOverview}
      />

      {/* SECTION A — PERSONALIZED HEADER */}
      <DashboardPersonalizedHeader user={user} />

      {/* SECTION B — SEARCH & DISCOVERY */}
      <DashboardSearchDiscovery
        userCourseName={user?.course?.name}
        userSemester={user?.semester}
        subjects={overview?.studentSubjects || []}
      />

      {/* SECTION C — CONTINUE READING (Recently Viewed Notes) */}
      <DashboardContinueReading
        views={overview?.recentViews || []}
        loading={loadingOverview}
        onPreviewNote={handlePreviewNote}
      />

      {/* SECTION D — YOUR SUBJECTS */}
      <DashboardYourSubjects
        subjects={overview?.studentSubjects || []}
        userCourseName={user?.course?.name}
        userSemester={user?.semester}
        loading={loadingOverview}
      />

      {/* SECTION E — RECOMMENDED FOR YOU */}
      <DashboardRecommendations
        recommendedNotes={overview?.recommendedNotes || []}
        loading={loadingOverview}
        onPreviewNote={handlePreviewNote}
        onBookmarkChanged={fetchOverview}
      />

      {/* SECTION F — RECENTLY ADDED */}
      <DashboardRecentPublishedNotes
        notes={overview?.recentPublishedNotes || []}
        loading={loadingOverview}
        onPreviewNote={handlePreviewNote}
        onBookmarkChanged={fetchOverview}
      />

      {/* SECTION G — YOUR LIBRARY SHORTCUTS */}
      <DashboardLibraryPreview
        bookmarks={overview?.recentBookmarks || []}
        collections={overview?.recentCollections || []}
        stats={overview?.stats || {}}
        loading={loadingOverview}
      />

      {/* Inline Document Preview Modal */}
      {previewNote && (
        <Modal
          isOpen={Boolean(previewNote)}
          onClose={handleClosePreview}
          title={`Document Preview: ${previewNote.title}`}
          maxWidth="780px"
        >
          <NotePreview
            note={previewNote}
            onClose={handleClosePreview}
          />
        </Modal>
      )}
    </div>
  );
}

export default StudentDashboardPage;
