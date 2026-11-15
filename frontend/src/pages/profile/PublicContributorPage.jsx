import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import profileService from '../../services/profileService.js';
import Avatar from '../../components/common/Avatar.jsx';
import Badge from '../../components/common/Badge.jsx';
import NoteCard from '../../components/notes/NoteCard.jsx';
import Button from '../../components/common/Button.jsx';
import './PublicContributorPage.css';

/**
 * Public Contributor & Academic Identity Profile Page.
 * Strictly respects scholar privacy configurations and exposes only approved public manuscripts.
 */
export function PublicContributorPage() {
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesMeta, setNotesMeta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await profileService.getContributorProfile(userId);
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Contributor not found.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchNotes = useCallback(
    async (page = 1) => {
      if (!profile || profile.isPrivate) return;
      setIsNotesLoading(true);
      try {
        const data = await profileService.getContributorNotes(userId, { page, limit: 9 });
        setNotes(data?.items || []);
        setNotesMeta(data?.meta || null);
        setCurrentPage(page);
      } catch {
        setNotes([]);
      } finally {
        setIsNotesLoading(false);
      }
    },
    [userId, profile]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile && !profile.isPrivate) {
      fetchNotes(1);
    }
  }, [profile, fetchNotes]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="contributor-page contributor-page--loading">
        <div className="contributor-skeleton-header">
          <div className="skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--subtitle" />
          </div>
        </div>
      </div>
    );
  }

  // Not found or network error
  if (error || !profile) {
    return (
      <div className="contributor-page">
        <div className="contributor-empty-state">
          <div className="contributor-empty-icon" aria-hidden="true">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="contributor-empty-title">Contributor Profile Unavailable</h2>
          <p className="contributor-empty-desc">
            {error || 'The Profile you requested does not exist or has been deactivated.'}
          </p>
          <Link to="/notes/explore" className="btn btn--primary">
            Explore Study Notes
          </Link>
        </div>
      </div>
    );
  }

  // Private profile state
  if (profile.isPrivate) {
    return (
      <div className="contributor-page">
        <div className="contributor-private-card">
          <div className="contributor-private-avatar-row">
            <Avatar name={profile.name || 'Scholar'} src={profile.avatarUrl} size="lg" />
            <h1 className="contributor-private-name">{profile.name}</h1>
          </div>

          <div className="contributor-private-notice">
            <div className="contributor-lock-icon" aria-hidden="true">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="contributor-private-title">Private Academic Profile</h2>
            <p className="contributor-private-desc">
              This contributor has configured their academic identity, biography, and published
              manuscripts as private.
            </p>
            <Link to="/notes/explore" className="btn btn--outline">
              Return to Notes Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { name, avatarUrl, createdAt, bio, academicInfo, stats } = profile;

  const joinDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <div className="contributor-page">
      {/* Contributor Hero Card */}
      <section className="contributor-hero">
        <div className="contributor-hero__top">
          <Avatar
            name={name || 'Scholar'}
            src={avatarUrl}
            size="xl"
            className="contributor-avatar"
          />
          <div className="contributor-hero__info">
            <div className="contributor-hero__name-row">
              <h1 className="contributor-hero__name">{name}</h1>
              <Badge variant="primary" size="sm">
                Academic Contributor
              </Badge>
            </div>

            {academicInfo &&
              (academicInfo.university || academicInfo.course || academicInfo.semester) && (
                <div className="contributor-academic-pills">
                  {academicInfo.university && (
                    <span className="academic-pill" title="University / Institution">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      {academicInfo.university}
                    </span>
                  )}
                  {academicInfo.course && (
                    <span className="academic-pill" title="Academic Program">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      {academicInfo.course.name}
                    </span>
                  )}
                  {academicInfo.semester && (
                    <span className="academic-pill" title="Current Semester">
                      Semester {academicInfo.semester}
                    </span>
                  )}
                </div>
              )}

            {joinDate && (
              <p className="contributor-member-date">Scholar on PJ Study since {joinDate}</p>
            )}
          </div>
        </div>

        {bio && (
          <div className="contributor-bio-card">
            <p className="contributor-bio-text">{bio}</p>
          </div>
        )}
      </section>

      {/* Database Contribution Statistics */}
      {stats && (
        <section className="contributor-stats-grid" aria-label="Contribution metrics">
          <div className="contributor-stat-card">
            <span className="contributor-stat-value">{stats.totalApprovedNotes || 0}</span>
            <span className="contributor-stat-label">Published Manuscripts</span>
          </div>
          <div className="contributor-stat-card">
            <span className="contributor-stat-value">{stats.totalDownloads || 0}</span>
            <span className="contributor-stat-label">Community Downloads</span>
          </div>
          <div className="contributor-stat-card">
            <span className="contributor-stat-value">
              {stats.averageRating > 0 ? (
                <>
                  <span style={{ color: '#b45309' }}>★</span>{' '}
                  {Number(stats.averageRating).toFixed(1)}
                </>
              ) : (
                '—'
              )}
            </span>
            <span className="contributor-stat-label">Average Rating</span>
          </div>
          <div className="contributor-stat-card">
            <span className="contributor-stat-value">{stats.totalReviews || 0}</span>
            <span className="contributor-stat-label">Peer Reviews</span>
          </div>
        </section>
      )}

      {/* Approved Manuscripts Catalog */}
      <section className="contributor-notes-section">
        <div className="contributor-notes-header">
          <h2 className="contributor-notes-title">
            Published Manuscripts
            {notesMeta?.totalItems !== undefined && (
              <span className="contributor-count-pill">{notesMeta.totalItems}</span>
            )}
          </h2>
        </div>

        {isNotesLoading ? (
          <div className="contributor-notes-loading">
            <div className="spinner" />
            <span>Loading published manuscripts...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="contributor-no-notes">
            <p>This contributor has not published any approved study materials yet.</p>
          </div>
        ) : (
          <div className="contributor-notes-grid">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} showActions={true} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {notesMeta && notesMeta.totalPages > 1 && (
          <div className="contributor-pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={!notesMeta.hasPrevPage || isNotesLoading}
              onClick={() => fetchNotes(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="pagination-info">
              Page {notesMeta.page} of {notesMeta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!notesMeta.hasNextPage || isNotesLoading}
              onClick={() => fetchNotes(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

export default PublicContributorPage;
