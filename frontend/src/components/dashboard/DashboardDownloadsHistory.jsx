import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Formats file size in bytes to human-readable string.
 */
function formatFileSize(bytes) {
  if (!bytes) return '—';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (Number.isNaN(num) || num <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Formats date and time.
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr));
}

/**
 * Download history panel with document links and file sizes.
 *
 * @param {{
 *   downloads: Array<any>,
 *   loading?: boolean
 * }} props
 */
export function DashboardDownloadsHistory({ downloads = [], loading = false }) {
  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <h3 className="dash-section-title">Recent Downloads</h3>
        <span
          style={{
            fontSize: 'var(--font-size-xs, 0.75rem)',
            color: 'var(--color-text-tertiary, #a2a29c)'
          }}
        >
          {downloads.length} Recent Access Events
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '16px 0' }}>
          <Skeleton height={40} count={3} />
        </div>
      ) : downloads.length === 0 ? (
        <div className="dash-empty-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="36"
            height="36"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <p>
            No downloads recorded yet. As you download PDF lecture slides and study guides, your
            file history will be logged here for offline reference.
          </p>
          <Link to="/notes/explore">
            <Button variant="outline" size="sm">
              Discover Materials
            </Button>
          </Link>
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Subject</th>
                <th>File Size</th>
                <th>Downloaded At</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {downloads.map((item) => {
                const note = item.note || {};
                return (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/notes/${note.id}`} className="dash-table-title">
                        {note.title || 'Untitled Note'}
                      </Link>
                    </td>
                    <td>{note.subject?.name || '—'}</td>
                    <td>{formatFileSize(note.fileSize)}</td>
                    <td style={{ color: 'var(--color-text-secondary, #74756f)' }}>
                      {formatDateTime(item.downloadedAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/notes/${note.id}`}>
                        <Button variant="ghost" size="sm">
                          View Document
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardDownloadsHistory;
