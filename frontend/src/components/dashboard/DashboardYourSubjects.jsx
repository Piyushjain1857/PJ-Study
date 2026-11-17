import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Enrolled Subjects Browsing Area (Section D).
 * Displays genuine enrolled curriculum subjects with active note counts and 1-click exploration.
 */
export const DashboardYourSubjects = React.memo(function DashboardYourSubjects({
  subjects = [],
  userCourseName,
  userSemester,
  loading = false
}) {
  const navigate = useNavigate();

  return (
    <section className="dash-section" aria-labelledby="enrolled-subjects-heading">
      <div className="dash-section-header">
        <div>
          <h2 id="enrolled-subjects-heading" className="dash-section-title">
            Your Subjects
          </h2>
          <p className="dash-section-subtitle">
            {userCourseName
              ? `${userCourseName} ${userSemester ? `• Semester ${userSemester}` : ''}`
              : 'Core academic subjects tailored to your study curriculum'}
          </p>
        </div>
        <Link to="/notes/explore" className="dash-section-link">
          All Subjects →
        </Link>
      </div>

      {loading ? (
        <div className="dash-subjects-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dash-subject-card">
              <Skeleton width="80px" height="18px" rounded="sm" />
              <div style={{ marginTop: '10px' }}>
                <Skeleton width="100%" height="22px" />
                <Skeleton width="60%" height="16px" style={{ marginTop: '6px' }} />
              </div>
              <div style={{ marginTop: '16px' }}>
                <Skeleton width="90px" height="16px" />
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="dash-empty-state">
          <div className="dash-empty-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3 className="dash-empty-title">No Subjects Assigned</h3>
          <p className="dash-empty-desc">
            Select your academic course and semester in your profile to load your syllabus subjects.
          </p>
          <Link to="/profile" className="dash-empty-action">
            Update Academic Profile →
          </Link>
        </div>
      ) : (
        <div className="dash-subjects-grid">
          {subjects.map((subj) => {
            const hasNotes = subj.notesCount > 0;

            return (
              <div
                key={subj.id}
                className="dash-subject-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/notes/explore?subjectId=${subj.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/notes/explore?subjectId=${subj.id}`);
                  }
                }}
                title={`Explore notes for ${subj.name}`}
              >
                <div className="dash-subject-card__top">
                  {subj.code ? (
                    <span className="dash-subject-code">{subj.code}</span>
                  ) : (
                    <span className="dash-subject-sem">Semester {subj.semester || 1}</span>
                  )}
                  {subj.semester && subj.code && (
                    <span className="dash-subject-sem-tag">Sem {subj.semester}</span>
                  )}
                </div>

                <div className="dash-subject-card__body">
                  <h3 className="dash-subject-name">
                    {subj.name}
                  </h3>
                  {subj.description && (
                    <p className="dash-subject-desc">
                      {subj.description}
                    </p>
                  )}
                </div>

                <div className="dash-subject-card__footer">
                  <span className={`dash-subject-count ${hasNotes ? 'dash-subject-count--active' : ''}`}>
                    {hasNotes
                      ? `${subj.notesCount} note${subj.notesCount === 1 ? '' : 's'} available`
                      : 'Curriculum subject'}
                  </span>
                  <span className="dash-subject-explore-link">
                    Explore →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

export default DashboardYourSubjects;
