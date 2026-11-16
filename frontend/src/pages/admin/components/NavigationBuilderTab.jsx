import React, { useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';

const ROLES = [
  { id: 'SCHOLAR', label: 'Scholar Navigation' },
  { id: 'ADMIN', label: 'Admin Navigation' },
  { id: 'SUPER_ADMIN', label: 'Super Admin Navigation' }
];

export function NavigationBuilderTab({ onNotify }) {
  const { reloadConfig } = usePlatformConfig();
  const [activeRole, setActiveRole] = useState('SUPER_ADMIN');
  const [navMap, setNavMap] = useState({});
  const [draftNav, setDraftNav] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const loadNav = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await platformConfigService.getNavigation();
      const map = {};
      (data || []).forEach((n) => {
        map[n.roleScope] = n;
      });
      setNavMap(map);
      const cur = map[activeRole] || null;
      setDraftNav(cur?.draftConfig || cur?.publishedConfig || []);
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load navigation: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [activeRole, onNotify]);

  useEffect(() => {
    loadNav();
  }, [loadNav]);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    const cur = navMap[role] || null;
    setDraftNav(cur?.draftConfig || cur?.publishedConfig || []);
  };

  const handleLabelChange = (groupIdx, itemIdx, newLabel) => {
    setDraftNav((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[groupIdx].items[itemIdx].label = newLabel;
      return copy;
    });
  };

  const handleToggleItem = (groupIdx, itemIdx, currentVisible) => {
    setDraftNav((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[groupIdx].items[itemIdx].isVisible = !currentVisible;
      return copy;
    });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await platformConfigService.updateDraftNavigation(activeRole, draftNav);
      onNotify?.({ type: 'success', message: `Navigation draft for ${activeRole} saved successfully.` });
      await loadNav();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to save navigation.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // 1. Persist the current draft items first so server receives all active modifications
      await platformConfigService.updateDraftNavigation(activeRole, draftNav);
      // 2. Publish draft live
      await platformConfigService.publishNavigation(activeRole, `Published ${activeRole} navigation menu`);
      onNotify?.({ type: 'success', message: `Navigation for ${activeRole} published live! Changes are now active in the sidebar.` });
      await loadNav();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to publish navigation.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Reset navigation for ${activeRole} to factory system defaults?`)) return;
    setIsLoading(true);
    try {
      await platformConfigService.resetNavigation(activeRole);
      onNotify?.({ type: 'success', message: `Reset navigation for ${activeRole} to defaults.` });
      await loadNav();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to reset.' });
    } finally {
      setIsLoading(false);
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
      {/* Top Controls Toolbar */}
      <div className="pb-device-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '13px' }}>ROLE HIERARCHY:</strong>
          <div className="pb-device-buttons">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`pb-device-btn ${activeRole === r.id ? 'pb-device-btn--active' : ''}`}
                onClick={() => handleRoleChange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="pb-version-pill">v{navMap[activeRole]?.version || 1} Published</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft} isLoading={isSaving}>
            Save Draft
          </Button>
          <Button variant="primary" size="sm" onClick={handlePublish} isLoading={isPublishing}>
            Publish Live
          </Button>
        </div>
      </div>

      {/* Main 2-Column Layout: Editor Form on Left + Live Sidebar Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* Left: Interactive Navigation Hierarchy Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(Array.isArray(draftNav) ? draftNav : []).map((group, groupIdx) => (
            <div
              key={groupIdx}
              style={{
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                  Group: {group.groupTitle || group.label || `Section ${groupIdx + 1}`}
                </span>
                <Badge variant="primary" size="sm">
                  {(group.items || []).filter(i => i.isVisible !== false).length} / {(group.items || []).length} active
                </Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(group.items || []).map((item, itemIdx) => (
                  <div
                    key={item.to || itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: item.isVisible !== false ? 'var(--color-bg-secondary, #f8fafc)' : '#f1f5f9',
                      opacity: item.isVisible !== false ? 1 : 0.65,
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>📌</span>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleLabelChange(groupIdx, itemIdx, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                          width: '240px',
                          background: '#ffffff'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
                        {item.to}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        className={`admin-action-btn ${item.isVisible !== false ? 'admin-action-btn--primary' : 'admin-action-btn--ghost'}`}
                        style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 600 }}
                        onClick={() => handleToggleItem(groupIdx, itemIdx, item.isVisible !== false)}
                      >
                        {item.isVisible !== false ? 'Visible in Sidebar' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Live Sidebar Preview for this Role */}
        <div
          style={{
            background: 'var(--color-bg-primary, #fcfbf9)',
            border: '2px solid #334155',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: '20px'
          }}
        >
          <div style={{ background: '#1e293b', padding: '10px 14px', color: '#ffffff' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>
              Live Sidebar Preview
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>
              {activeRole} Workspace
            </div>
          </div>

          <div style={{ padding: '16px 12px', maxHeight: '580px', overflowY: 'auto' }}>
            {(Array.isArray(draftNav) ? draftNav : []).map((group, gIdx) => {
              const visibleItems = (group.items || []).filter((i) => i.isVisible !== false);
              if (visibleItems.length === 0) return null;
              return (
                <div key={gIdx} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 6px' }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {visibleItems.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0f172a',
                          background: iIdx === 0 && gIdx === 0 ? 'rgba(15, 118, 110, 0.1)' : 'transparent'
                        }}
                      >
                        <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Click <strong>Publish Live</strong> to update the live application sidebar.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavigationBuilderTab;