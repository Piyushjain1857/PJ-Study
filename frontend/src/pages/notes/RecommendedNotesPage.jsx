import React, { useEffect, useState, useCallback } from 'react';
import recommendationService from '../../services/recommendationService.js';
import RecommendationSection from '../../components/recommendations/RecommendationSection.jsx';
import Button from '../../components/common/Button.jsx';
import '../../components/recommendations/recommendations.css';

/**
 * Dedicated Recommended Notes Discovery Page.
 * Showcases personalized recommendations, subject-based feeds, popular notes, and recent approvals.
 */
export function RecommendedNotesPage() {
  const [personalizedData, setPersonalizedData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [popularNotes, setPopularNotes] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [personalized, subjects, popular, recent] = await Promise.all([
        recommendationService.getPersonalizedRecommendations({ limit: 6 }).catch(() => null),
        recommendationService.getSubjectRecommendations(6).catch(() => null),
        recommendationService.getPopularRecommendations(6).catch(() => null),
        recommendationService.getRecentRecommendations(6).catch(() => null)
      ]);

      setPersonalizedData(personalized);
      setSubjectData(subjects);
      setPopularNotes(popular?.recommendations || []);
      setRecentNotes(recent?.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllRecommendations();
  }, [loadAllRecommendations]);

  const isColdStart = personalizedData?.fallback === true;

  return (
    <div className="container rec-page">
      {/* Editorial Header Banner */}
      <div className="rec-header-banner">
        <div className="rec-header-kicker">
          <span>Academic Discovery</span>
          <span>•</span>
          <span>Curated Recommendations</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h1 className="rec-header-title">Personalized Study Recommendations</h1>
            <p className="rec-header-desc">
              Discover academic manuscripts, lecture guides, and curriculum resources tailored to
              your enrolled subjects, semester, and active study habits.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAllRecommendations} isLoading={loading}>
            ↻ Refresh Feed
          </Button>
        </div>
      </div>

      {/* Cold-Start Informational Banner */}
      {isColdStart && (
        <div className="rec-coldstart-banner">
          <p className="rec-coldstart-text">
            <strong>Welcome to PJ Study Recommendations!</strong> You are currently seeing trending
            and popular campus notes. As you explore, bookmark, and download notes, your feed will
            dynamically adapt to your exact courses and semester.
          </p>
        </div>
      )}

      {error && (
        <div className="auth-alert auth-alert--danger" style={{ marginBottom: '24px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* 1. Recommended for You */}
      <RecommendationSection
        title={isColdStart ? 'Popular Academic Discoveries' : 'Tailored For Your Curriculum'}
        subtitle={
          isColdStart
            ? 'Curated popular notes across the academic catalog'
            : 'Scored by course alignment, semester match, and your study signals'
        }
        items={personalizedData?.recommendations || []}
        loading={loading}
        emptyMessage="No personalized notes found yet. Try exploring notes and saving your favorites!"
      />

      {/* 2. Based on Your Active Subjects */}
      {subjectData?.hasSubjects && (
        <RecommendationSection
          title="From Your Subjects"
          subtitle="Curated from subjects you have bookmarked, collected, or studied"
          items={subjectData.recommendations || []}
          loading={loading}
          emptyMessage="No notes found for your active subjects."
        />
      )}

      {/* 3. Popular Across the Campus */}
      <RecommendationSection
        title="Trending in the Catalog"
        subtitle="Highly downloaded and peer-reviewed manuscripts"
        items={popularNotes}
        loading={loading}
        emptyMessage="No trending notes recorded yet."
      />

      {/* 4. Recently Added */}
      <RecommendationSection
        title="Recently Added & Approved"
        subtitle="Fresh academic contributions verified by campus moderators"
        items={recentNotes}
        loading={loading}
        emptyMessage="No recently approved notes."
      />
    </div>
  );
}

export default RecommendedNotesPage;
