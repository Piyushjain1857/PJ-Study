import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { NotificationIcon } from '../../components/notifications/NotificationDropdown.jsx';
import { NotificationPreferencesModal } from '../../components/notifications/NotificationPreferencesModal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { formatRelativeTime } from '../../utils/formatTime.js';
import './NotificationCenterPage.css';

const CATEGORIES = [
  { key: '', label: 'All Categories' },
  { key: 'ACADEMIC', label: 'Academic Notes' },
  { key: 'REVIEWS', label: 'Peer Reviews' },
  { key: 'COMMUNITY', label: 'Community' },
  { key: 'SYSTEM', label: 'Platform Announcements' },
  { key: 'SECURITY', label: 'Security' }
];

export function NotificationCenterPage() {
  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'read'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Load notifications when tab, category, or page changes
  const loadData = useCallback(() => {
    fetchNotifications({
      page: currentPage,
      limit: 10,
      status: activeTab,
      category: selectedCategory || undefined
    });
  }, [fetchNotifications, currentPage, activeTab, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleCategoryChange = (catKey) => {
    setSelectedCategory(catKey);
    setCurrentPage(1);
  };

  return (
    <div className="notif-center">
      <div className="container">
        {/* Header */}
        <header className="notif-center__header">
          <div className="notif-center__header-main">
            <span className="notif-center__badge">Academic Updates</span>
            <h1 className="notif-center__title">Notification Center</h1>
            <p className="notif-center__subtitle">
              Track manuscript peer review submissions, student critique, badges, and campus
              announcements.
            </p>
          </div>

          <div className="notif-center__header-actions">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreferencesOpen(true)}
              aria-label="Notification Preferences"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '6px' }}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Preferences
            </Button>
          </div>
        </header>

        {/* Toolbar & Filters */}
        <div className="notif-center__toolbar">
          <div className="notif-center__tabs" role="tablist">
            <button
              type="button"
              className={`notif-center__tab ${activeTab === 'all' ? 'notif-center__tab--active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All Notifications
            </button>
            <button
              type="button"
              className={`notif-center__tab ${activeTab === 'unread' ? 'notif-center__tab--active' : ''}`}
              onClick={() => handleTabChange('unread')}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              type="button"
              className={`notif-center__tab ${activeTab === 'read' ? 'notif-center__tab--active' : ''}`}
              onClick={() => handleTabChange('read')}
            >
              Archived / Read
            </button>
          </div>

          <div className="notif-center__categories" aria-label="Category filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`notif-center__cat-pill ${selectedCategory === cat.key ? 'notif-center__cat-pill--active' : ''}`}
                onClick={() => handleCategoryChange(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed List */}
        <div className="notif-feed">
          {isLoading ? (
            <div style={{ padding: '24px' }}>
              <Skeleton height="60px" count={4} style={{ marginBottom: '16px' }} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-feed__empty">
              <EmptyState
                title={activeTab === 'unread' ? "You're all caught up!" : 'No notifications found'}
                description={
                  activeTab === 'unread'
                    ? 'All academic feedback and announcements have been read.'
                    : 'No records match the selected status and category filter.'
                }
              />
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`notif-feed__row ${!item.isRead ? 'notif-feed__row--unread' : ''}`}
              >
                <div className="notif-feed__icon-wrap">
                  <NotificationIcon category={item.category} />
                </div>

                <div className="notif-feed__content">
                  <div className="notif-feed__title-line">
                    <h3 className="notif-feed__title">{item.title}</h3>
                    <Badge variant="neutral" size="sm">
                      {item.category}
                    </Badge>
                    {item.metadata?.priority === 'URGENT' && (
                      <Badge variant="danger" size="sm">
                        Urgent
                      </Badge>
                    )}
                    {item.metadata?.priority === 'IMPORTANT' && (
                      <Badge variant="warning" size="sm">
                        Important
                      </Badge>
                    )}
                  </div>

                  <p className="notif-feed__message">{item.message}</p>

                  <div className="notif-feed__meta">
                    <span>{formatRelativeTime(item.createdAt)}</span>
                    {item.targetUrl && (
                      <Link
                        to={item.targetUrl}
                        className="notif-feed__target-link"
                        onClick={() => !item.isRead && markAsRead(item.id)}
                      >
                        Open related study resource →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="notif-feed__actions">
                  {!item.isRead && (
                    <button
                      type="button"
                      className="notif-feed__btn-action"
                      onClick={() => markAsRead(item.id)}
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    className="notif-feed__btn-action notif-feed__btn-action--danger"
                    onClick={() => dismissNotification(item.id)}
                    title="Dismiss notification"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            className="admin-pagination"
            style={{ marginTop: '20px', borderRadius: 'var(--radius-lg)' }}
          >
            <span className="admin-pagination__info">
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems}{' '}
              notifications)
            </span>
            <div className="admin-pagination__actions">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Preferences Modal */}
        <NotificationPreferencesModal
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
        />
      </div>
    </div>
  );
}

export default NotificationCenterPage;
