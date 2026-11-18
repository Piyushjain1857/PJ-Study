import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService.js';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { Input } from '../common/Input.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

export function AdminEmailManager() {
  const { liveActivities: socketActivities } = useNotifications();
  const [subTab, setSubTab] = useState('logs'); // 'logs' | 'failed' | 'templates' | 'broadcast' | 'live'

  // Email Logs State
  const [logsData, setLogsData] = useState({ items: [], pagination: {}, summary: {} });
  const [logsLoading, setLogsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [page, setPage] = useState(1);
  const [retryingId, setRetryingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ subject: '', htmlBody: '', textBody: '', isActive: true });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Broadcast Email State
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', priority: 'NORMAL', targetUrl: '' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Live Activities State
  const [liveActivities, setLiveActivities] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  // Fetch Delivery Logs
  const fetchLogs = useCallback(async (targetPage = 1, status = statusFilter, recipient = recipientQuery) => {
    setLogsLoading(true);
    try {
      const data = await adminService.getEmailDeliveryLogs({
        page: targetPage,
        limit: 15,
        status: status !== 'ALL' ? status : undefined,
        recipient: recipient || undefined
      });
      if (data) {
        setLogsData(data);
        setPage(targetPage);
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to load email logs.' });
    } finally {
      setLogsLoading(false);
    }
  }, [statusFilter, recipientQuery]);

  // Fetch Templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await adminService.getNotificationTemplates();
      if (data) setTemplates(data);
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to load templates.' });
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Fetch Live Activities
  const fetchLiveActivities = useCallback(async () => {
    setLiveLoading(true);
    try {
      const data = await adminService.getLiveActivity(30);
      if (data) setLiveActivities(data);
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to load live activities.' });
    } finally {
      setLiveLoading(false);
    }
  }, []);

  // Merge socket live activities
  useEffect(() => {
    if (socketActivities && socketActivities.length > 0) {
      setLiveActivities((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const newOnes = socketActivities.filter((a) => !ids.has(a.id));
        return [...newOnes, ...prev].slice(0, 50);
      });
    }
  }, [socketActivities]);

  // Tab switch effect
  useEffect(() => {
    setFeedback({ type: '', message: '' });
    if (subTab === 'logs') {
      fetchLogs(1, 'ALL');
    } else if (subTab === 'failed') {
      fetchLogs(1, 'FAILED');
    } else if (subTab === 'templates') {
      fetchTemplates();
    } else if (subTab === 'live') {
      fetchLiveActivities();
    }
  }, [subTab, fetchLogs, fetchTemplates, fetchLiveActivities]);

  // Retry Failed Email
  const handleRetry = async (id) => {
    setRetryingId(id);
    setFeedback({ type: '', message: '' });
    try {
      const res = await adminService.retryEmailDelivery(id);
      setFeedback({ type: 'success', message: res.message || 'Email retry sent!' });
      fetchLogs(page, subTab === 'failed' ? 'FAILED' : statusFilter);
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to retry email delivery.' });
    } finally {
      setRetryingId(null);
    }
  };

  // Save Template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setIsSavingTemplate(true);
    setFeedback({ type: '', message: '' });

    try {
      await adminService.updateNotificationTemplate(editingTemplate.key, templateForm);
      setFeedback({ type: 'success', message: `Template "${editingTemplate.name}" updated successfully!` });
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to update template.' });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Broadcast Email
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;
    setIsBroadcasting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await adminService.broadcastEmail(broadcastForm);
      setFeedback({ type: 'success', message: res.message || 'Platform broadcast email sent successfully!' });
      setBroadcastForm({ title: '', message: '', priority: 'NORMAL', targetUrl: '' });
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to dispatch broadcast email.' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const summary = logsData.summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Super Admin Email Header */}
      <div className="d-flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
            Email Deliverability, Templates & Live Platform Stream
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Enterprise SMTP logging, transactional template customization, real-time Socket.IO broadcasts & failure recovery.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (subTab === 'templates') fetchTemplates();
              else if (subTab === 'live') fetchLiveActivities();
              else fetchLogs(page);
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {feedback.message && (
        <div className={`auth-alert auth-alert--${feedback.type}`}>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', overflowX: 'auto' }}>
        {[
          { key: 'logs', label: 'All Delivery Logs' },
          { key: 'failed', label: 'Failed Deliveries' },
          { key: 'templates', label: 'Notification Templates' },
          { key: 'broadcast', label: 'Send Announcement' },
          { key: 'live', label: 'Live Platform Stream' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: subTab === tab.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: subTab === tab.key ? '#FFFFFF' : 'var(--color-text-primary)',
              fontWeight: subTab === tab.key ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1 & 2: LOGS & FAILED DELIVERIES */}
      {(subTab === 'logs' || subTab === 'failed') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Dispatched</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>{summary.total ?? 0}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#16A34A', fontWeight: 600 }}>Successfully Delivered</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16A34A', marginTop: '4px' }}>{summary.sent ?? 0}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#DC2626', fontWeight: 600 }}>Failed Attempts</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC2626', marginTop: '4px' }}>{summary.failed ?? 0}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 600 }}>Delivery Rate</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>{summary.successRate ?? 100}%</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by recipient email..."
              value={recipientQuery}
              onChange={(e) => setRecipientQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1, subTab === 'failed' ? 'FAILED' : statusFilter, recipientQuery)}
              style={{
                flex: '1',
                minWidth: '240px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontSize: '0.85rem'
              }}
            />
            {subTab === 'logs' && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchLogs(1, e.target.value, recipientQuery);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(1, subTab === 'failed' ? 'FAILED' : statusFilter, recipientQuery)}
            >
              Filter
            </Button>
          </div>

          {/* Logs Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '10px 14px' }}>Recipient</th>
                  <th style={{ padding: '10px 14px' }}>Subject</th>
                  <th style={{ padding: '10px 14px' }}>Template</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px' }}>Attempts</th>
                  <th style={{ padding: '10px 14px' }}>Timestamp</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      Loading delivery logs...
                    </td>
                  </tr>
                ) : logsData.items.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No email delivery logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logsData.items.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{log.recipient}</td>
                      <td style={{ padding: '10px 14px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.subject}>
                        {log.subject}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <code style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: 'var(--color-surface-subtle)', borderRadius: '4px' }}>
                          {log.templateKey || 'generic'}
                        </code>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge variant={log.status === 'SENT' ? 'success' : log.status === 'FAILED' ? 'danger' : 'warning'}>
                          {log.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{log.attempts || 1}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        {log.status === 'FAILED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={retryingId === log.id}
                            onClick={() => handleRetry(log.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logsData.pagination?.totalPages > 1 && (
            <div className="d-flex items-center justify-between" style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Page {logsData.pagination.page} of {logsData.pagination.totalPages} ({logsData.pagination.totalItems} total entries)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || logsLoading}
                  onClick={() => fetchLogs(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= logsData.pagination.totalPages || logsLoading}
                  onClick={() => fetchLogs(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: NOTIFICATION TEMPLATES */}
      {subTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {editingTemplate ? (
            <div style={{ padding: '20px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div className="d-flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Edit Template: {editingTemplate.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)}>
                  Close
                </Button>
              </div>

              <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input
                  label="Subject Line"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))}
                  required
                />

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '6px' }}>
                    HTML Content Body
                  </label>
                  <textarea
                    rows={8}
                    value={templateForm.htmlBody}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, htmlBody: e.target.value }))}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '6px' }}>
                    Plaintext Fallback
                  </label>
                  <textarea
                    rows={4}
                    value={templateForm.textBody}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, textBody: e.target.value }))}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)'
                    }}
                  />
                </div>

                {editingTemplate.variables && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Available dynamic variables: {JSON.stringify(editingTemplate.variables)}
                  </div>
                )}

                <div className="d-flex items-center gap-2" style={{ marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="template-active"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, isActive: e.target.checked }))}
                    style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="template-active" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    Enable this template for operational dispatch
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingTemplate(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSavingTemplate}>
                    Save Template
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {templatesLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>
                  Loading notification templates...
                </div>
              ) : templates.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>
                  No templates found.
                </div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.key}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div className="d-flex items-center justify-between" style={{ marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{tpl.name}</strong>
                        <Badge variant={tpl.isActive ? 'success' : 'neutral'}>
                          {tpl.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '6px' }}>
                        Subject: {tpl.subject}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                        {tpl.description}
                      </p>
                    </div>

                    <div className="d-flex items-center justify-between" style={{ marginTop: '8px' }}>
                      <code style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{tpl.key}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setTemplateForm({
                            subject: tpl.subject,
                            htmlBody: tpl.htmlBody,
                            textBody: tpl.textBody || '',
                            isActive: tpl.isActive
                          });
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: BROADCAST ANNOUNCEMENT */}
      {subTab === 'broadcast' && (
        <div style={{ maxWidth: '640px', padding: '24px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>Send Platform-Wide Email Announcement</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Broadcast an email notification to all active enrolled scholars and faculty. Non-urgent broadcasts respect scholars' notification preferences.
          </p>

          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Announcement Title"
              placeholder="e.g. End-Term Examination Schedule & Revision Notes"
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm((p) => ({ ...p, title: e.target.value }))}
              required
            />

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '6px' }}>
                Announcement Message
              </label>
              <textarea
                rows={5}
                placeholder="Write the full announcement text for scholars..."
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm((p) => ({ ...p, message: e.target.value }))}
                style={{
                  width: '100%',
                  fontSize: '0.85rem',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)'
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '6px' }}>
                  Priority Level
                </label>
                <select
                  value={broadcastForm.priority}
                  onChange={(e) => setBroadcastForm((p) => ({ ...p, priority: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent (Bypasses Non-Mandatory Mute)</option>
                </select>
              </div>

              <div>
                <Input
                  label="Target Link (Optional)"
                  placeholder="/notes/explore"
                  value={broadcastForm.targetUrl}
                  onChange={(e) => setBroadcastForm((p) => ({ ...p, targetUrl: e.target.value }))}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isBroadcasting}
              style={{ marginTop: '10px' }}
            >
              Dispatch Platform Broadcast Email
            </Button>
          </form>
        </div>
      )}

      {/* SUB-TAB 5: LIVE PLATFORM ACTIVITIES STREAM */}
      {subTab === 'live' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="d-flex items-center justify-between" style={{ padding: '12px 16px', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div className="d-flex items-center gap-2">
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#16A34A',
                  animation: 'pulse 2s infinite'
                }}
              />
              <strong style={{ fontSize: '0.875rem' }}>Socket.IO Real-Time Stream Connected</strong>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Showing {liveActivities.length} recent live activities
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {liveLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading live activities...
              </div>
            ) : liveActivities.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No platform activity recorded yet.
              </div>
            ) : (
              liveActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: '14px 18px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div className="d-flex items-center gap-2" style={{ marginBottom: '4px' }}>
                      <Badge
                        variant={
                          act.type?.includes('NOTE')
                            ? 'success'
                            : act.type?.includes('SECURITY')
                              ? 'danger'
                              : act.type?.includes('ANNOUNCEMENT')
                                ? 'primary'
                                : 'neutral'
                        }
                      >
                        {act.type || 'ACTIVITY'}
                      </Badge>
                      <strong style={{ fontSize: '0.9rem' }}>{act.title}</strong>
                    </div>
                    {act.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {act.description}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {act.actor?.name || 'System'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                      {new Date(act.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEmailManager;
