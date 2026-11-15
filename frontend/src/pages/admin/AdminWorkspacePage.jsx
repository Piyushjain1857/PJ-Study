import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import adminWorkspaceService from '../../services/adminWorkspaceService.js';
import noteService from '../../services/noteService.js';
import './AdminWorkspacePage.css';

export default function AdminWorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tab mapping based on URL
  const getTabFromPath = (path) => {
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/assigned')) return 'assigned';
    if (path.includes('/notes')) return 'notes';
    if (path.includes('/moderation')) return 'moderation';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/history')) return 'history';
    return 'overview';
  };

  const activeTab = getTabFromPath(location.pathname);

  // States
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action states
  const [rejectModalNote, setRejectModalNote] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewNote, setPreviewNote] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, queueData, reportsData] = await Promise.all([
        adminWorkspaceService.getOverview(),
        adminWorkspaceService.getQueue({ limit: 20 }),
        adminWorkspaceService.getReports({ limit: 20 })
      ]);
      setOverview(overviewData);
      setQueue(queueData?.notes || []);
      setReports(reportsData?.reports || []);

      if (activeTab === 'analytics') {
        const analyticsData = await adminWorkspaceService.getAnalytics();
        setAnalytics(analyticsData);
      } else if (activeTab === 'history') {
        const historyData = await adminWorkspaceService.getHistory();
        setHistory(historyData?.history || []);
      } else if (activeTab === 'notes' || activeTab === 'assigned') {
        const notesRes = await noteService.getMyNotes({ limit: 50 });
        setMyNotes(notesRes?.notes || notesRes || []);
      }
    } catch (err) {
      console.error('Failed to load admin workspace data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    if (tab === 'overview') navigate('/admin-workspace');
    else navigate(`/admin-workspace/${tab}`);
  };

  const handleApprove = async (noteId) => {
    try {
      await adminWorkspaceService.reviewNote(noteId, 'APPROVE');
      setActionNotice('Manuscript approved and published to academic catalog.');
      setTimeout(() => setActionNotice(''), 4000);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to approve manuscript.');
    }
  };

  const handleOpenReject = (note) => {
    setRejectModalNote(note);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalNote) return;
    if (!rejectionReason.trim()) {
      setError('A constructive rejection reason is required.');
      return;
    }

    try {
      await adminWorkspaceService.reviewNote(rejectModalNote.id, 'REJECT', rejectionReason.trim());
      setRejectModalNote(null);
      setActionNotice('Manuscript rejected with revision feedback.');
      setTimeout(() => setActionNotice(''), 4000);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reject manuscript.');
    }
  };

  return (
    <div className="admin-workspace">
      {/* Header */}
      <div className="admin-workspace__header">
        <div>
          <div className="admin-workspace__badge">
            <span role="img" aria-label="admin">🛡️</span>
            <span>Academic Administrator</span>
          </div>
          <h1 className="admin-workspace__title">Admin Workspace</h1>
          <p className="admin-workspace__subtitle">
            Curriculum content authoring, assigned review queues, and scoped moderation controls for {user?.name || 'Administrator'}.
          </p>
        </div>
        <div className="admin-workspace__header-actions">
          <Link to="/notes/new" className="admin-btn admin-btn--primary">
            <span>+</span>
            <span>Upload Study Note</span>
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
          <span>Command Overview</span>
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'moderation' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('moderation')}
        >
          <span>Approval Queue</span>
          {queue.length > 0 && <span className="admin-workspace__tab-badge">{queue.length}</span>}
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'notes' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('notes')}
        >
          <span>Authorized Notes</span>
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'reports' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          <span>Content Reports</span>
          {reports.length > 0 && <span className="admin-workspace__tab-badge">{reports.length}</span>}
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'analytics' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          <span>Content Analytics</span>
        </button>
        <button
          className={`admin-workspace__tab ${activeTab === 'history' ? 'admin-workspace__tab--active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <span>Moderation History</span>
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
              {/* Scoped KPI Cards */}
              <div className="admin-workspace__kpis">
                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">My Uploaded Notes</span>
                    <div className="admin-workspace__kpi-icon">📝</div>
                  </div>
                  <div className="admin-workspace__kpi-val">{overview?.myUploadedNotes || 0}</div>
                  <p className="admin-workspace__kpi-caption">Manuscripts authored by you</p>
                </div>

                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">Pending Reviews</span>
                    <div className="admin-workspace__kpi-icon" style={{ backgroundColor: '#fef7e0', color: '#b06000' }}>⏳</div>
                  </div>
                  <div className="admin-workspace__kpi-val">{overview?.pendingReviews || 0}</div>
                  <p className="admin-workspace__kpi-caption">Awaiting evaluation in queue</p>
                </div>

                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">Approved Notes</span>
                    <div className="admin-workspace__kpi-icon" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>✓</div>
                  </div>
                  <div className="admin-workspace__kpi-val">{overview?.approvedNotes || 0}</div>
                  <p className="admin-workspace__kpi-caption">Live in public catalog</p>
                </div>

                <div className="admin-workspace__kpi-card">
                  <div className="admin-workspace__kpi-top">
                    <span className="admin-workspace__kpi-label">Revision Needed</span>
                    <div className="admin-workspace__kpi-icon" style={{ backgroundColor: '#fce8e6', color: '#c5221f' }}>✕</div>
                  </div>
                  <div className="admin-workspace__kpi-val">{overview?.rejectedNotes || 0}</div>
                  <p className="admin-workspace__kpi-caption">Rejected with review feedback</p>
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
                    <span className="admin-workspace__kpi-label">Assigned Reports</span>
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
                    <h3 className="admin-workspace__panel-title">My Recent Submissions</h3>
                    <Link to="/my-notes" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                      View All →
                    </Link>
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
                          </tr>
                        </thead>
                        <tbody>
                          {overview.recentUploads.map((n) => (
                            <tr key={n.id}>
                              <td style={{ fontWeight: 500 }}>{n.title}</td>
                              <td style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{n.subjectName}</td>
                              <td>
                                <span className={`admin-badge admin-badge--${n.status.toLowerCase()}`}>
                                  {n.status}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{n.downloads}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                      No manuscripts uploaded yet.
                    </div>
                  )}
                </div>

                {/* Moderation Stream */}
                <div className="admin-workspace__panel">
                  <div className="admin-workspace__panel-header">
                    <h3 className="admin-workspace__panel-title">Recent Moderation Activity</h3>
                    <button onClick={() => handleTabChange('history')} style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                      History →
                    </button>
                  </div>
                  {overview?.recentActivity?.length > 0 ? (
                    <div>
                      {overview.recentActivity.map((a) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '13px' }}>
                          <div>
                            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{a.action.replace(':', ' ')}</span>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                              Entity: {a.entityType} ({a.entityId.slice(0, 8)}...)
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

          {/* TAB 2: MODERATION QUEUE */}
          {activeTab === 'moderation' && (
            <div className="admin-workspace__panel">
              <div className="admin-workspace__panel-header">
                <div>
                  <h3 className="admin-workspace__panel-title">Pending Moderation Queue</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Review incoming study manuscripts, evaluate syllabus relevance, and publish approved notes.
                  </p>
                </div>
                <span className="admin-badge admin-badge--pending">{queue.length} Pending Manuscripts</span>
              </div>

              {queue.length > 0 ? (
                <div>
                  {queue.map((note) => (
                    <div key={note.id} className="admin-queue-card">
                      <div className="admin-queue-card__info">
                        <h4 className="admin-queue-card__title">{note.title}</h4>
                        <div className="admin-queue-card__meta">
                          <span><strong>Course:</strong> {note.course?.name || 'General'}</span>
                          <span><strong>Subject:</strong> {note.subject?.name || 'Curriculum'}</span>
                          <span><strong>Author:</strong> {note.uploadedBy?.name || 'Scholar'}</span>
                          <span><strong>Submitted:</strong> {new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        {note.content && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)', maxHeight: '40px', overflow: 'hidden' }}>
                            {note.content}
                          </p>
                        )}
                      </div>
                      <div className="admin-queue-card__actions">
                        <button
                          className="admin-btn admin-btn--secondary"
                          onClick={() => setPreviewNote(note)}
                        >
                          👁 Preview
                        </button>
                        <button
                          className="admin-btn admin-btn--success"
                          onClick={() => handleApprove(note.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="admin-btn admin-btn--danger"
                          onClick={() => handleOpenReject(note)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-text-primary)' }}>Moderation Queue is Clean</h4>
                  <p style={{ margin: 0, fontSize: '13px' }}>All submitted manuscripts have been reviewed and cataloged.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTHORIZED NOTES */}
          {activeTab === 'notes' && (
            <div className="admin-workspace__panel">
              <div className="admin-workspace__panel-header">
                <div>
                  <h3 className="admin-workspace__panel-title">Authorized Study Manuscripts</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    All study notes and course materials within your administrative authoring scope.
                  </p>
                </div>
                <Link to="/notes/new" className="admin-btn admin-btn--primary">
                  + Upload New
                </Link>
              </div>

              {myNotes.length > 0 ? (
                <div className="admin-workspace__table-container">
                  <table className="admin-workspace__table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Course & Subject</th>
                        <th>Semester</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myNotes.map((note) => (
                        <tr key={note.id}>
                          <td style={{ fontWeight: 600 }}>{note.title}</td>
                          <td style={{ fontSize: '13px' }}>
                            {note.course?.name || 'General'} · {note.subject?.name || 'Curriculum'}
                          </td>
                          <td>Sem {note.semester || 1}</td>
                          <td>
                            <span className={`admin-badge admin-badge--${note.status?.toLowerCase()}`}>
                              {note.status}
                            </span>
                          </td>
                          <td>
                            <Link to={`/notes/${note.id}`} className="admin-btn admin-btn--secondary" style={{ textDecoration: 'none', fontSize: '11px' }}>
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                  No authorized notes found.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTENT REPORTS */}
          {activeTab === 'reports' && (
            <div className="admin-workspace__panel">
              <div className="admin-workspace__panel-header">
                <div>
                  <h3 className="admin-workspace__panel-title">Content & Community Reports</h3>
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

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div>
              <div className="admin-workspace__kpis">
                <div className="admin-workspace__kpi-card">
                  <span className="admin-workspace__kpi-label">Approval Rate</span>
                  <div className="admin-workspace__kpi-val" style={{ color: '#137333' }}>
                    {analytics?.approvalRate ?? 100}%
                  </div>
                  <p className="admin-workspace__kpi-caption">Quality score for your contributions</p>
                </div>
                <div className="admin-workspace__kpi-card">
                  <span className="admin-workspace__kpi-label">Active Published</span>
                  <div className="admin-workspace__kpi-val">
                    {analytics?.statusBreakdown?.APPROVED || 0}
                  </div>
                  <p className="admin-workspace__kpi-caption">Notes verified and active</p>
                </div>
                <div className="admin-workspace__kpi-card">
                  <span className="admin-workspace__kpi-label">In Review Queue</span>
                  <div className="admin-workspace__kpi-val" style={{ color: '#b06000' }}>
                    {(analytics?.statusBreakdown?.PENDING || 0) + (analytics?.statusBreakdown?.PENDING_REVIEW || 0)}
                  </div>
                  <p className="admin-workspace__kpi-caption">Submissions awaiting decision</p>
                </div>
              </div>

              <div className="admin-workspace__panel">
                <h3 className="admin-workspace__panel-title" style={{ marginBottom: '16px' }}>Status Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analytics?.statusBreakdown || {}).map(([st, cnt]) => (
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
                            backgroundColor: st === 'APPROVED' ? '#137333' : st.includes('PENDING') ? '#b06000' : '#c5221f'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: HISTORY */}
          {activeTab === 'history' && (
            <div className="admin-workspace__panel">
              <div className="admin-workspace__panel-header">
                <h3 className="admin-workspace__panel-title">Moderation & Decision History</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Audit Trail</span>
              </div>
              {history.length > 0 ? (
                <div className="admin-workspace__table-container">
                  <table className="admin-workspace__table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Entity ID</th>
                        <th>Details</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600 }}>
                            <span className={`admin-badge ${log.action.includes('approve') ? 'admin-badge--approved' : 'admin-badge--rejected'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{log.entityId}</td>
                          <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {log.metadata ? JSON.stringify(log.metadata) : '—'}
                          </td>
                          <td style={{ fontSize: '12px' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary)' }}>
                  No moderation decisions recorded yet.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* REJECT MODAL */}
      {rejectModalNote && (
        <div className="admin-modal-backdrop" onClick={() => setRejectModalNote(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Reject Manuscript</h3>
              <button
                onClick={() => setRejectModalNote(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Please specify a constructive reason for rejecting <strong>{rejectModalNote.title}</strong>. This feedback will be sent to the author.
              </p>
              <textarea
                className="admin-textarea"
                placeholder="e.g. Scanned pages are blurry, missing chapter 3 diagrams, or incomplete syllabus alignment..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setRejectModalNote(null)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn--danger" onClick={handleConfirmReject}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewNote && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewNote(null)}>
          <div className="admin-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">{previewNote.title}</h3>
              <button
                onClick={() => setPreviewNote(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '16px', background: 'var(--color-surface-hover)', padding: '12px', borderRadius: '6px' }}>
                <div><strong>Course:</strong> {previewNote.course?.name || 'General'}</div>
                <div><strong>Subject:</strong> {previewNote.subject?.name || 'Curriculum'}</div>
                <div><strong>Semester:</strong> Sem {previewNote.semester || 1}</div>
                <div><strong>Uploaded by:</strong> {previewNote.uploadedBy?.name || 'Scholar'}</div>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Manuscript Summary & Abstract:</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-secondary)', padding: '8px', border: '1px solid var(--color-border-subtle)', borderRadius: '4px' }}>
                {previewNote.content || 'No text content provided.'}
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setPreviewNote(null)}>
                Close Preview
              </button>
              <button
                className="admin-btn admin-btn--success"
                onClick={() => {
                  handleApprove(previewNote.id);
                  setPreviewNote(null);
                }}
              >
                ✓ Approve Directly
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
