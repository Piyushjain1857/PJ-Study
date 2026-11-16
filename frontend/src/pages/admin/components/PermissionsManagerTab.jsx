import React, { useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';

export function PermissionsManagerTab({ onNotify }) {
  const { reloadConfig } = usePlatformConfig();
  const [data, setData] = useState(null);
  const [activeScopes, setActiveScopes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformConfigService.getAdminPermissions();
      setData(res);
      setActiveScopes(res.activeScopes || []);
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load permissions: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const handleToggle = (scopeId) => {
    setActiveScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await platformConfigService.updateAdminPermissions(activeScopes);
      onNotify?.({ type: 'success', message: 'Admin role permission scopes updated successfully!' });
      await loadPermissions();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to save permissions.' });
    } finally {
      setIsSaving(false);
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
      {/* Information Header & Privilege Barrier Guardrail */}
      <div
        style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
              Admin Permission Scopes Manager
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Control the operational capabilities granted to faculty and administrative staff with the ADMIN role.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Active Scopes
          </Button>
        </div>

        {/* Security Invariant Alert */}
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span>🛡️</span>
          <div>
            <strong>RBAC Privilege Escalation Barrier Active:</strong> Super Admin-level privileges (such as assigning roles, altering system settings, or accessing the Visual Builder) cannot be delegated to Admin accounts.
          </div>
        </div>
      </div>

      {/* Permissions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {(data?.supportedScopes || []).map((scope) => {
          const isEnabled = activeScopes.includes(scope.id);
          return (
            <div
              key={scope.id}
              style={{
                background: '#ffffff',
                border: `1px solid ${isEnabled ? '#0f766e' : 'var(--color-border)'}`,
                borderRadius: '8px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: isEnabled ? '0 2px 8px rgba(15, 118, 110, 0.08)' : 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{scope.name}</strong>
                  <Badge variant={isEnabled ? 'success' : 'neutral'} size="sm">
                    {isEnabled ? 'PERMITTED' : 'RESTRICTED'}
                  </Badge>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                  {scope.description}
                </p>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: '#0369a1',
                    background: '#f0f9ff',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  scope: {scope.id}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isEnabled ? '#0f766e' : '#94a3b8' }}>
                  {isEnabled ? 'Scope Granted' : 'Scope Withheld'}
                </span>
                <label className="pb-feature-switch">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(scope.id)}
                  />
                  <span className="pb-feature-slider" />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PermissionsManagerTab;
