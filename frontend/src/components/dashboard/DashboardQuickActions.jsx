import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Fast navigation shortcuts for common student workflows.
 */
export function DashboardQuickActions() {
  const { isModerator } = useAuth();

  const uploadOrRecAction = isModerator
    ? {
        to: '/notes/new',
        title: 'Upload Note',
        desc: 'Submit PDF lecture guides or assignments for peer review',
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="20"
            height="20"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        )
      }
    : {
        to: '/notes/recommended',
        title: 'Recommended Notes',
        desc: 'Curated study materials aligned with your curriculum',
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="20"
            height="20"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      };

  const actions = [
    {
      to: '/notes/explore',
      title: 'Explore Notes',
      desc: 'Search syllabus notes & solutions by subject or semester',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="20"
          height="20"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    },
    uploadOrRecAction,
    isModerator
      ? {
          to: '/my-notes',
          title: 'My Submissions',
          desc: 'Track submissions, edit draft materials, and review feedback',
          icon: (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="20"
              height="20"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )
        }
      : {
          to: '/my-notes',
          title: 'My Study Library',
          desc: 'Access your saved notes, bookmarks, and organized collections',
          icon: (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="20"
              height="20"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          )
        },
    {
      to: '/profile',
      title: 'Academic Profile',
      desc: 'Manage account security, university standing, and email',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="20"
          height="20"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <h3 className="dash-section-title">Quick Actions</h3>
      </div>
      <div className="dash-quick-actions-grid">
        {actions.map((act) => (
          <Link key={act.to} to={act.to} className="dash-quick-action-card">
            <div style={{ color: 'var(--color-primary, #285943)' }}>{act.icon}</div>
            <div className="dash-quick-action-title">{act.title}</div>
            <div className="dash-quick-action-desc">{act.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DashboardQuickActions;
