import React, { useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import Badge from '../../../components/common/Badge.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';

export function FeatureControlTab({ onNotify }) {
  const { reloadConfig } = usePlatformConfig();
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);

  const loadFeatures = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await platformConfigService.getFeatures();
      setFeatures(data || []);
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load features: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const handleToggle = async (key, currentStatus) => {
    const nextStatus = !currentStatus;
    setUpdatingKey(key);

    // Optimistic UI update
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, isEnabled: nextStatus } : f))
    );

    try {
      await platformConfigService.updateFeature(key, nextStatus);
      await reloadConfig?.();
      onNotify?.({
        type: 'success',
        message: `Feature "${key}" is now ${nextStatus ? 'ENABLED' : 'DISABLED'} platform-wide.`
      });
    } catch (err) {
      // Rollback
      setFeatures((prev) =>
        prev.map((f) => (f.key === key ? { ...f, isEnabled: currentStatus } : f))
      );
      onNotify?.({ type: 'danger', message: `Failed to update feature: ${err.message}` });
    } finally {
      setUpdatingKey(null);
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
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800 }}>Feature Control Center</h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Enable or disable optional system modules in real time. Changes take effect across public visitors, scholar sessions, and administrative workspaces.
        </p>
      </div>

      <div className="pb-feature-grid">
        {features.map((feature) => (
          <div key={feature.key} className="pb-feature-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{feature.name}</strong>
                <Badge variant={feature.isEnabled ? 'success' : 'neutral'} size="sm">
                  {feature.isEnabled ? 'ACTIVE' : 'DISABLED'}
                </Badge>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                {feature.description}
              </p>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#0f766e', background: '#f0fdfa', padding: '2px 6px', borderRadius: '4px' }}>
                key: {feature.key}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: feature.isEnabled ? '#0f766e' : '#94a3b8' }}>
                {feature.isEnabled ? 'Enabled in Production' : 'Turned Off'}
              </span>
              <label className="pb-feature-switch">
                <input
                  type="checkbox"
                  checked={feature.isEnabled}
                  disabled={updatingKey === feature.key}
                  onChange={() => handleToggle(feature.key, feature.isEnabled)}
                />
                <span className="pb-feature-slider" />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureControlTab;
