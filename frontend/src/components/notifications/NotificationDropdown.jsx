import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { formatRelativeTime } from '../../utils/formatTime.js';

export function NotificationIcon({ category }) {
  switch (category) {
    case 'ACADEMIC':
      return (
        <span className="notif-item__icon notif-item__icon--academic" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </span>
      );
    case 'REVIEWS':
      return (
        <span className="notif-item__icon notif-item__icon--reviews" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </span>
      );
    case 'COMMUNITY':
      return (
        <span className="notif-item__icon notif-item__icon--community" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
        </span>
      );
    case 'SECURITY':
      return (
        <span className="notif-item__icon notif-item__icon--security" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
      );
    case 'SYSTEM':
    default:
      return (
        <span className="notif-item__icon notif-item__icon--system" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </span>
      );
  }
}

export function NotificationDropdown({ onClose }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const recentItems = notifications.slice(0, 5);

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    onClose();
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="notif-dropdown" role="dialog" aria-label="Notifications Dropdown">
      <div className="notif-dropdown__header">
        <div className="notif-dropdown__title-wrap">
          <h2 className="notif-dropdown__title">Notifications</h2>
          {unreadCount > 0 && <span className="notif-dropdown__pill">{unreadCount} new</span>}
        </div>
        {unreadCount > 0 && (
          <button type="button" className="notif-dropdown__mark-all" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notif-dropdown__list">
        {recentItems.length === 0 ? (
          <div className="notif-dropdown__empty">
            <svg
              className="notif-dropdown__empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="notif-dropdown__empty-title">All caught up!</p>
            <p className="notif-dropdown__empty-desc">No new notifications right now.</p>
          </div>
        ) : (
          recentItems.map((item) => (
            <div
              key={item.id}
              className={`notif-item ${!item.isRead ? 'notif-item--unread' : ''}`}
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item);
                }
              }}
            >
              <NotificationIcon category={item.category} />
              <div className="notif-item__content">
                <p className="notif-item__title">{item.title}</p>
                <p className="notif-item__message">{item.message}</p>
                <div className="notif-item__meta">
                  <span>{formatRelativeTime(item.createdAt)}</span>
                </div>
              </div>
              {!item.isRead && <span className="notif-item__unread-dot" aria-label="Unread" />}
            </div>
          ))
        )}
      </div>

      <div className="notif-dropdown__footer">
        <Link to="/notifications" className="notif-dropdown__view-all" onClick={onClose}>
          View all notifications →
        </Link>
      </div>
    </div>
  );
}

export default NotificationDropdown;
