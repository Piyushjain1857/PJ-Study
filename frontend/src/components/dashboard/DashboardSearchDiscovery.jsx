import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Editorial Academic Search & Resource Discovery (Section B).
 * Features a large, accessible search bar with real multi-attribute filters:
 * keywords/title, enrolled subjects, semester, category, and file format.
 */
export function DashboardSearchDiscovery({
  userCourseName,
  userSemester,
  subjects = []
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(userSemester || '');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'semester' | 'subjects' | 'categories'

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    const params = new URLSearchParams();

    if (query) params.set('search', query);
    if (selectedSemester) params.set('semester', String(selectedSemester));
    if (selectedFormat) params.set('format', selectedFormat);

    const queryString = params.toString();
    navigate(`/notes/explore${queryString ? `?${queryString}` : ''}`);
  };

  const handleSubjectClick = (subjectId) => {
    const params = new URLSearchParams();
    if (subjectId) params.set('subjectId', subjectId);
    if (selectedSemester) params.set('semester', String(selectedSemester));
    navigate(`/notes/explore?${params.toString()}`);
  };

  const handleSemesterFilter = (sem) => {
    const nextSem = selectedSemester === sem ? '' : sem;
    setSelectedSemester(nextSem);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (nextSem) params.set('semester', String(nextSem));
    navigate(`/notes/explore?${params.toString()}`);
  };

  const handleCategoryFilter = (catSlug) => {
    const params = new URLSearchParams();
    if (catSlug) params.set('category', catSlug);
    if (selectedSemester) params.set('semester', String(selectedSemester));
    navigate(`/notes/explore?${params.toString()}`);
  };

  return (
    <section className="dash-search-section" aria-label="Academic Search and Resource Discovery">
      <form onSubmit={handleSearchSubmit} className="dash-search-form" role="search">
        <div className="dash-search-input-box">
          <svg
            className="dash-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="search"
            className="dash-search-input"
            placeholder={
              userCourseName
                ? `Search ${userCourseName} notes, syllabus topics, past papers...`
                : 'Search academic notes, subjects, exam prep, lab manuals...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search academic manuscripts and study notes"
          />

          {searchTerm && (
            <button
              type="button"
              className="dash-search-clear-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search query"
              aria-label="Clear query"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <button type="submit" className="dash-search-submit-btn">
            Search
          </button>
        </div>
      </form>

      {/* Discovery Quick Filter Pills */}
      <div className="dash-search-filters-bar" aria-label="Discovery Filters">
        <div className="dash-search-pills-row">
          <span className="dash-search-pills-label">Curriculum:</span>

          {userSemester && (
            <button
              type="button"
              className={`dash-filter-pill ${selectedSemester === userSemester ? 'dash-filter-pill--active' : ''}`}
              onClick={() => handleSemesterFilter(userSemester)}
              title={`Filter by enrolled Semester ${userSemester}`}
            >
              Semester {userSemester} (Current)
            </button>
          )}

          {subjects.slice(0, 4).map((subj) => (
            <button
              key={subj.id}
              type="button"
              className="dash-filter-pill"
              onClick={() => handleSubjectClick(subj.id)}
              title={`Search notes for ${subj.name}`}
            >
              {subj.code ? `${subj.code} · ` : ''}{subj.name}
            </button>
          ))}

          <button
            type="button"
            className="dash-filter-pill dash-filter-pill--ghost"
            onClick={() => handleCategoryFilter('lecture-notes')}
          >
            Lecture Notes
          </button>

          <button
            type="button"
            className="dash-filter-pill dash-filter-pill--ghost"
            onClick={() => handleCategoryFilter('exam-prep')}
          >
            Exam Solutions
          </button>
        </div>
      </div>
    </section>
  );
}

export default DashboardSearchDiscovery;
