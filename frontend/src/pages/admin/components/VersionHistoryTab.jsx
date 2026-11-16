import React, { useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import Modal from '../../../components/common/Modal.jsx';

export function VersionHistoryTab({ onNotify }) {
  const { reloadConfig } = usePlatformConfig();
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await platformConfigService.getVersionHistory(filterType);
      setHistory(data || []);
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load history: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [filterType, onNotify]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRollback = async (version) => {
    if (!window.confirm(`Are you sure you want to rollback ${version.entityType}:${version.entityKey} to version v${version.version}? Current live changes will be archived.`)) {
      return;
    }
    setIsRestoring(true);
    try {
      await platformConfigService.rollbackVersion(version.id);
      onNotify?.({ type: 'success', message: `Successfully rolled back ${version.entityKey} to v${version.version}!` });
      await loadHistory();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to rollback version.' });
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton count={4} height="80px" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter Bar */}
      <div className="pb-device-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '13px' }}>CONFIGURATION AUDIT TRAIL:</strong>
          <select
            className="admin-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ fontWeight: 600, minWidth: '180px' }}
          >
            <option value="">All Entities</option>
            <option value="PAGE">Pages (Visual Builder)</option>
            <option value="THEME">Themes & Styles</option>
            <option value="NAVIGATION">Navigation Configurations</option>
            <option value="FEATURE">Feature Flags</option>
          </select>
          <span className="pb-version-pill">{history.length} Version Snapshots</span>
        </div>

        <Button variant="outline" size="sm" onClick={loadHistory}>
          Refresh Ledger
        </Button>
      </div>

      {/* History Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Target Entity</th>
              <th>Version</th>
              <th>Change Summary</th>
              <th>Archived At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '36px' }}>
                  <p className="admin-muted-text">No previous version snapshots found.</p>
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="neutral" size="sm">{item.entityType}</Badge>
                      <strong style={{ fontSize: '13px' }}>{item.entityKey}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="pb-version-pill">v{item.version}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {item.changeSummary || 'Configuration published snapshot'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--ghost"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        onClick={() => setSelectedSnapshot(item)}
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--primary"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        disabled={isRestoring}
                        onClick={() => handleRollback(item)}
                      >
                        Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Snapshot Modal */}
      <Modal
        isOpen={Boolean(selectedSnapshot)}
        onClose={() => setSelectedSnapshot(null)}
        title={`Configuration Snapshot: ${selectedSnapshot?.entityKey} (v${selectedSnapshot?.version})`}
      >
        {selectedSnapshot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Summary: <strong>{selectedSnapshot.changeSummary || 'Snapshot'}</strong> • Archived on {new Date(selectedSnapshot.createdAt).toLocaleString()}
            </p>
            <pre className="admin-audit-modal-json" style={{ maxHeight: '350px' }}>
              {JSON.stringify(selectedSnapshot.snapshot, null, 2)}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedSnapshot(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const snap = selectedSnapshot;
                  setSelectedSnapshot(null);
                  handleRollback(snap);
                }}
              >
                Restore This Snapshot
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VersionHistoryTab;
