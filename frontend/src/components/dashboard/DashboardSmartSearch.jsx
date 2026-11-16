import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Smart Notes Search Bar for Student Dashboard 3.0.
 * Allows searching by title, subject, course, or semester with quick filter chips.
 */
export function DashboardSmartSearch({ userCourseName, userSemester }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      navigate(`/notes/explore?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/notes/explore');
    }
  };

  const courseChip = userCourseName ? [{ label: userCourseName, url: `/notes/explore?q=${encodeURIComponent(userCourseName)}` }] : [];

  const quickChips = [
    { label: 'All Notes', url: '/notes/explore' },
    { label: `Semester ${userSemester || 4}`, url: `/notes/explore?semester=${userSemester || 4}` },
    ...courseChip,
    { label: 'Operating Systems', url: '/notes/explore?q=Operating+Systems' },
    { label: 'Database Systems (DBMS)', url: '/notes/explore?q=Database' },
    { label: 'Computer Networks', url: '/notes/explore?q=Networks' }
  ];

  return (
    <div className="dash-smart-search">
      <form onSubmit={handleSearchSubmit} className="dash-smart-search__form" role="search">
        <div className="dash-smart-search__input-wrap">
          <span className="dash-smart-search__icon">🔍</span>
          <input
            type="text"
            className="dash-smart-search__input"
            placeholder="Search notes, subjects, courses, or professors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search notes"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 4px', fontSize: '14px' }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="dash-smart-search__btn">
          Search Catalog
        </button>
      </form>

      <div className="dash-smart-search__chips">
        <span className="dash-smart-search__chip-lbl">Quick Filters:</span>
        {quickChips.map((chip, idx) => (
          <Link key={idx} to={chip.url} className="dash-smart-search__chip">
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DashboardSmartSearch;
