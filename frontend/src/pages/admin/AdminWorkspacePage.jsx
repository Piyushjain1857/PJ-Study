import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import adminWorkspaceService from '../../services/adminWorkspaceService.js';
import SEO from '../../components/common/SEO.jsx';
import './AdminWorkspacePage.css';

export default function AdminWorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const statusParam = queryParams.get('status');

  // Tab mapping based on URL path and query
  const getTabFromLocation = (pathname, status) => {
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/reports')) return 'reports';
    if (pathname.includes('/quality')) return 'quality';
    if (pathname.includes('/notes')) {
      if (status === 'PUBLISHED') return 'published';
      if (status === 'UNPUBLISHED') return 'unpublished';
      return 'notes';
    }
    return 'overview';
  };

  const activeTab = getTabFromLocation(location.pathname, statusParam);

  // States
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [notes, setNotes] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, reportsData] = await Promise.all([
        adminWorkspaceService.getOverview(),
        adminWorkspaceService.getReports({ limit: 20 })
      ]);
      setOverview(overviewData);
      setReports(reportsData?.reports || []);

      if (activeTab === 'analytics') {
        const analyticsData = await adminWorkspaceService.getAnalytics();
        setAnalytics(analyticsData);
      } else if (activeTab === 'notes' || activeTab === 'published' || activeTab === 'unpublished') {
        let filterStatus = undefined;
        if (activeTab === 'published') filterStatus = 'PUBLISHED';
        if (activeTab === 'unpublished') filterStatus = 'UNPUBLISHED';

        const notesData = await adminWorkspaceService.getNotes({
          status: filterStatus,
          search: searchQuery || undefined,
          limit: 50
        });
        setNotes(notesData?.notes || []);
      }
    } catch (err) {
      console.error('Failed to load admin workspace data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    if (tab === 'overview') navigate('/admin-workspace');
    else if (tab === 'notes') navigate('/admin-workspace/notes');
    else if (tab === 'published') navigate('/admin-workspace/notes?status=PUBLISHED');
    else if (tab === 'unpublished') navigate('/admin-workspace/notes?status=UNPUBLISHED');
    else if (tab === 'reports') navigate('/admin-workspace/reports');
    else if (tab === 'analytics') navigate('/admin-workspace/analytics');
    else if (tab === 'quality') navigate('/admin-workspace/quality');
  };

  const handlePublish = async (noteId, noteTitle) => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    setError(null);
    try {
      await adminWorkspaceService.publishNote(noteId);
      setActionNotice(`"${noteTitle || 'Note'}" has been published and is immediately live to Scholars.`);
      setTimeout(() => setActionNotice(''), 4500);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to publish note.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUnpublish = async (noteId, noteTitle) => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    setError(null);
    try {
      await adminWorkspaceService.unpublishNote(noteId);
      setActionNotice(`"${noteTitle || 'Note'}" has been unpublished and hidden from Scholar discovery.`);
      setTimeout(() => setActionNotice(''), 4500);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to unpublish note.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const isNotePublished = (status) => ['PUBLISHED', 'APPROVED'].includes(status);

  return (
    <div className="admin-workspace">
      <SEO title="Admin Workspace" noindex={true} />
      {/* Header */}
      <div className="admin-workspace__header">
        <div>
          <div className="admin-workspace__badge">
            <span role="img" aria-label="admin">🛡️</span>
            <span>Academic Administrator</span>
          </div>
          <h1 className="admin-workspace__title">Admin Workspace</h1>
          <p className="admin-workspace__subtitle">
            Curriculum content authoring, direct publishing management, and content quality controls for {user?.name || 'Administrator'}.
          </p>
        </div>
        <div className="admin-workspace__header-actions">
          <Link to="/notes/new" className="admin-btn admin-btn--primary">
            <span>+</span>
            <span>Upload Note</span>
          </Link>
          <button onClick={loadData} className="admin-btn admin-btn--secondary" title="Refresh Workspace">
            <span>↻ Refresh</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: '#e6f4ea', border: '1px solid #ceead6', color: '#137333', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
          ✓ {actionNotice}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#fce8e6', border: '1px solid #fad2cf', color: '#c5221f', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          ⚠ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-workspace__tabs">
        <button
          className={`admin-workspace__tab ${activeTab === 'overview' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <span>Overview</span>
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'notes' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('notes')}
        >
          <span>Manage Notes</span>
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'published' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('published')}
        >
          <span>Published Notes</span>
          {overview?.publishedNotes > 0 && <span className="admin-workspace__tab-badge" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>{overview.publishedNotes}</span>}
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'unpublished' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('unpublished')}
        >
          <span>Unpublished Notes</span>
          {overview?.unpublishedNotes > 0 && <span className="admin-workspace__tab-badge" style={{ backgroundColor: '#fef7e0', color: '#b06000' }}>{overview.unpublishedNotes}</span>}
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'reports' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          <span>Reported Notes</span>
          {reports.length > 0 && <span className="admin-workspace__tab-badge">{reports.length}</span>}
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'analytics' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          <span>Content Analytics</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading workspace records...
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Direct Publishing KPI Cards */}
              <div className="admin-workspace__kpis">
                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">My Uploaded Notes</span>
                    <div className="admin-workspace__kpi-icon">📝</div>
                  </div>
                  <div className="admin-workspace__kpi-val">{overview?.myUploadedNotes || 0}</div>
                  <p className="admin-workspace__kpi-caption">Total manuscripts authored by you</p>
                </div>

                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">Published Notes</span>
                    <div className="admin-workspace__kpi-icon" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>✓</div>
                  </div>
                  <div className="admin-workspace__kpi-val" style={{ color: '#137333' }}>{overview?.publishedNotes || 0}</div>
                  <p className="admin-workspace__kpi-caption">Live & downloadable by Scholars</p>
                </div>

                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">Unpublished Notes</span>
                    <div className="admin-workspace__kpi-icon" style={{ backgroundColor: '#fef7e0', color: '#b06000' }}>🔒</div>
                  </div>
                  <div className="admin-workspace__kpi-val" style={{ color: '#b06000' }}>{overview?.unpublishedNotes || 0}</div>
                  <p className="admin-workspace__kpi-caption">Hidden from public catalog</p>
                </div>

                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">Total Downloads</span>
                    <div className="admin-workspace__kpi-icon">📥</div>
                  </div>
                  <div className="admin-workspace__kpi-val">{overview?.totalDownloads || 0}</div>
                  <p className="admin-workspace__kpi-caption">Total scholar access count</p>
                </div>

                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">Open Reports</span>
                    <div className="admin-workspace__kpi-icon" style={{ backgroundColor: '#fef7e0', color: '#b06000' }}>🚩</div>
                  </div>
                  <div className="admin-workspace__kpi-val">{overview?.openReportsCount || 0}</div>
                  <p className="admin-workspace__kpi-caption">Flagged content items</p>
                </div>
              </div>

              {/* 2-Column Overview Details */}
              <div className="admin-workspace__grid-2col">
                {/* Recent Uploads */}
                <div className="admin-workspace__panel">
                  <div className="admin-workspace__panel-header">
                    <h3 className="admin-workspace__panel-title">Recent Uploads</h3>
                    <button onClick={() => handleTabChange('notes')} style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                      Manage All →
                    </button>
                  </div>
                  {overview?.recentUploads?.length > 0 ? (
                    <div className="admin-workspace__table-container">
                      <table className="admin-workspace__table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Downloads</th>
                            <th>Quick Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.recentUploads.map((n) => {
                            const published = isNotePublished(n.status);
                            return (
                              <tr key={n.id}>
                                <td style={{ fontWeight: 500 }}>
                                  <Link to={`/notes/${n.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    {n.title}
                                  </Link>
                                </td>
                                <td style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{n.subjectName}</td>
                                <td>
                                  <span className={`admin-badge admin-badge--${published ? 'published' : 'unpublished'}`}>
                                    {published ? 'Published' : 'Unpublished'}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>{n.downloads}</td>
                                <td>
                                  {published ? (
                                    <button
                                      disabled={isProcessingAction}
                                      onClick={() => handleUnpublish(n.id, n.title)}
                                      className="admin-btn admin-btn--secondary"
                                      style={{ padding: '4px 8px', fontSize: '11px' }}
                                    >
                                      Unpublish
                                    </button>
                                  ) : (
                                    <button
                                      disabled={isProcessingAction}
                                      onClick={() => handlePublish(n.id, n.title)}
                                      className="admin-btn admin-btn--primary"
                                      style={{ padding: '4px 8px', fontSize: '11px' }}
                                    >
                                      Publish
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                      No notes uploaded yet. Click "+ Upload Note" to publish your first study resource.
                    </div>
                  )}
                </div>

                {/* Content Activity Stream */}
                <div className="admin-workspace__panel">
                  <div className="admin-workspace__panel-header">
                    <h3 className="admin-workspace__panel-title">Publishing & Management Stream</h3>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Live Activity</span>
                  </div>
                  {overview?.recentActivity?.length > 0 ? (
                    <div>
                      {overview.recentActivity.map((a) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '13px' }}>
                          <div>
                            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{a.action.replace(':', ' ')}</span>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                              Entity: {a.entityType} ({a.entityId?.slice(0, 8)}...)
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                      No recent activity recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2, 3, 4: NOTES DIRECTORY (MANAGE NOTES, PUBLISHED, UNPUBLISHED) */}
          {(activeTab === 'notes' || activeTab === 'published' || activeTab === 'unpublished') && (
            <div className="admin-workspace__panel">
              <div className="admin-workspace__panel-header">
                <div>
                  <h3 className="admin-workspace__panel-title">
                    {activeTab === 'published' ? 'Published Study Notes' : activeTab === 'unpublished' ? 'Unpublished Study Notes' : 'Manage All Authorized Notes'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {activeTab === 'published'
                      ? 'Live notes immediately visible and downloadable by Scholars in the academic catalog.'
                      : activeTab === 'unpublished'
                      ? 'Private drafts or unpublished notes hidden from Scholars.'
                      : 'Complete catalog of notes authored or managed by you. Direct publishing is active.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border-subtle)',
                      outline: 'none'
                    }}
                  />
                  <Link to="/notes/new" className="admin-btn admin-btn--primary">
                    + Upload Note
                  </Link>
                </div>
              </div>

              {notes.length > 0 ? (
                <div className="admin-workspace__table-container">
                  <table className="admin-workspace__table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Course & Subject</th>
                        <th>Semester</th>
                        <th>Status</th>
                        <th>Downloads</th>
                        <th>Direct Publishing Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((note) => {
                        const published = isNotePublished(note.status);
                        return (
                          <tr key={note.id}>
                            <td style={{ fontWeight: 600 }}>
                              <Link to={`/notes/${note.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {note.title}
                              </Link>
                            </td>
                            <td style={{ fontSize: '13px' }}>
                              {note.course?.name || 'General'} · {note.subject?.name || 'Curriculum'}
                            </td>
                            <td>Sem {note.semester || 1}</td>
                            <td>
                              <span className={`admin-badge admin-badge--${published ? 'published' : 'unpublished'}`}>
                                {published ? 'Published' : 'Unpublished'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{note._count?.downloadHistory || note.downloadCount || 0}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Link to={`/notes/${note.id}`} className="admin-btn admin-btn--secondary" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}>
                                  View
                                </Link>
                                {published ? (
                                  <button
                                    disabled={isProcessingAction}
                                    onClick={() => handleUnpublish(note.id, note.title)}
                                    className="admin-btn admin-btn--secondary"
                                    style={{ padding: '4px 8px', fontSize: '11px', color: '#b06000' }}
                                    title="Hide from Scholars"
                                  >
                                    Unpublish
                                  </button>
                                ) : (
                                  <button
                                    disabled={isProcessingAction}
                                    onClick={() => handlePublish(note.id, note.title)}
                                    className="admin-btn admin-btn--primary"
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    title="Make live to Scholars immediately"
                                  >
                                    Publish
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                  No {activeTab === 'published' ? 'published' : activeTab === 'unpublished' ? 'unpublished' : ''} notes found matching your criteria.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CONTENT REPORTS */}
          {activeTab === 'reports' && (
            <div className="admin-workspace__panel">
              <div className="admin-workspace__panel-header">
                <div>
                  <h3 className="admin-workspace__panel-title">Reported Notes & Content Appeals</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Review flagged content submissions, copyright notices, and community quality reports.
                  </p>
                </div>
                <span className="admin-badge admin-badge--rejected">{reports.length} Open Reports</span>
              </div>

              {reports.length > 0 ? (
                <div className="admin-workspace__table-container">
                  <table className="admin-workspace__table">
                    <thead>
                      <tr>
                        <th>Reported Item</th>
                        <th>Reporter</th>
                        <th>Reason</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.note?.title || 'Study Note'}</td>
                          <td style={{ fontSize: '13px' }}>{r.reportedBy?.name || 'Scholar'}</td>
                          <td>
                            <span style={{ color: '#c5221f', fontWeight: 500 }}>{r.reason}</span>
                            {r.description && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.description}</div>}
                          </td>
                          <td style={{ fontSize: '12px' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className="admin-badge admin-badge--pending">{r.status}</span>
                          </td>
                          <td>
                            {r.noteId && (
                              <Link to={`/notes/${r.noteId}`} className="admin-btn admin-btn--secondary" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}>
                                Inspect Note
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                  ✓ No open content reports. Community standards are maintained.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div>
              <div className="admin-workspace__kpis">
                <div className="admin-workspace__kpi-card">
                  <span className="admin-workspace__kpi-label">Total Uploaded</span>
                  <div className="admin-workspace__kpi-val" style={{ color: 'var(--color-primary)' }}>
                    {analytics?.totalUploaded ?? overview?.myUploadedNotes ?? 0}
                  </div>
                  <p className="admin-workspace__kpi-caption">Authored notes catalog</p>
                </div>
                <div className="admin-workspace__kpi-card">
                  <span className="admin-workspace__kpi-label">Published Notes</span>
                  <div className="admin-workspace__kpi-val" style={{ color: '#137333' }}>
                    {analytics?.publishedNotes ?? overview?.publishedNotes ?? 0}
                  </div>
                  <p className="admin-workspace__kpi-caption">Active in catalog</p>
                </div>
                <div className="admin-workspace__kpi-card">
                  <span className="admin-workspace__kpi-label">Unpublished Notes</span>
                  <div className="admin-workspace__kpi-val" style={{ color: '#b06000' }}>
                    {analytics?.unpublishedNotes ?? overview?.unpublishedNotes ?? 0}
                  </div>
                  <p className="admin-workspace__kpi-caption">Private or hidden notes</p>
                </div>
                <div className="admin-workspace__kpi-card">
                  <span className="admin-workspace__kpi-label">Total Downloads</span>
                  <div className="admin-workspace__kpi-val">
                    {analytics?.totalDownloads ?? overview?.totalDownloads ?? 0}
                  </div>
                  <p className="admin-workspace__kpi-caption">Scholar downloads generated</p>
                </div>
              </div>

              <div className="admin-workspace__panel">
                <h3 className="admin-workspace__panel-title" style={{ marginBottom: '16px' }}>Status Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analytics?.statusBreakdown || {
                    PUBLISHED: analytics?.publishedNotes || 0,
                    UNPUBLISHED: analytics?.unpublishedNotes || 0
                  }).map(([st, cnt]) => (
                    <div key={st}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500 }}>{st}</span>
                        <span style={{ fontWeight: 600 }}>{cnt}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, cnt * 10)}%`,
                            backgroundColor: ['PUBLISHED', 'APPROVED'].includes(st) ? '#137333' : '#b06000'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
