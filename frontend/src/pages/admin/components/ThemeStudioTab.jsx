import React, { useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';

const SCOPES = [
  { id: 'PUBLIC', label: 'Public Website' },
  { id: 'SCHOLAR', label: 'Scholar Workspace' },
  { id: 'ADMIN', label: 'Admin Workspace' },
  { id: 'SUPER_ADMIN', label: 'Super Admin Command' }
];

export function ThemeStudioTab({ onNotify }) {
  const { reloadConfig } = usePlatformConfig();
  const [activeScope, setActiveScope] = useState('SCHOLAR');
  const [themes, setThemes] = useState({});
  const [activeTheme, setActiveTheme] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

  const loadThemes = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await platformConfigService.getThemes();
      const map = {};
      (list || []).forEach((t) => {
        map[t.roleScope] = t;
      });
      setThemes(map);
      const cur = map[activeScope] || null;
      setActiveTheme(cur);
      setDraftConfig(cur?.draftConfig || cur?.publishedConfig || {});
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load themes: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [activeScope, onNotify]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleScopeChange = (scope) => {
    setActiveScope(scope);
    const cur = themes[scope] || null;
    setActiveTheme(cur);
    setDraftConfig(cur?.draftConfig || cur?.publishedConfig || {});
  };

  const handleColorChange = (key, hex) => {
    setDraftConfig((prev) => ({
      ...prev,
      [key]: hex
    }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await platformConfigService.updateDraftTheme(activeScope, draftConfig);
      onNotify?.({ type: 'success', message: `Theme draft for ${activeScope} saved successfully.` });
      await loadThemes();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to save theme draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // 1. Save active draft tokens to backend first
      await platformConfigService.updateDraftTheme(activeScope, draftConfig);
      // 2. Publish live
      await platformConfigService.publishTheme(activeScope, changeSummary || 'Theme updated');
      setChangeSummary('');
      onNotify?.({ type: 'success', message: `Theme for ${activeScope} published live!` });
      await loadThemes();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to publish theme.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Reset ${activeScope} theme back to factory system defaults?`)) return;
    setIsLoading(true);
    try {
      await platformConfigService.resetTheme(activeScope);
      onNotify?.({ type: 'success', message: `${activeScope} theme restored to defaults.` });
      await loadThemes();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to reset theme.' });
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
      {/* Scope Selector Header */}
      <div className="pb-device-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <strong style={{ fontSize: '13px' }}>WORKSPACE SCOPE:</strong>
          <div className="pb-device-buttons">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`pb-device-btn ${activeScope === s.id ? 'pb-device-btn--active' : ''}`}
                onClick={() => handleScopeChange(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="pb-version-pill">v{activeTheme?.version || 1} Published</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft} isLoading={isSaving}>
            Save Draft
          </Button>
          <Button variant="primary" size="sm" onClick={handlePublish} isLoading={isPublishing}>
            Publish Theme
          </Button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="pb-split-layout">
        {/* Left: Token Controls */}
        <div className="pb-inspector">
          <div className="pb-inspector-header">
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Design Tokens & Variables</h4>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Values compile directly into scoped CSS custom properties
            </span>
          </div>

          <div className="pb-inspector-body">
            {/* Color Palette */}
            <div className="pb-section-card">
              <div className="pb-section-card-header">
                <strong style={{ fontSize: '13px' }}>🎨 Brand Color Palette</strong>
              </div>
              <div className="pb-section-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="pb-color-swatch-group">
                    <input
                      type="color"
                      className="pb-color-picker"
                      value={draftConfig?.primaryColor || '#0f766e'}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, display: 'block' }}>Primary Brand</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{draftConfig?.primaryColor || '#0f766e'}</span>
                    </div>
                  </div>

                  <div className="pb-color-swatch-group">
                    <input
                      type="color"
                      className="pb-color-picker"
                      value={draftConfig?.accentColor || '#f59e0b'}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, display: 'block' }}>Accent Gold / Attention</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{draftConfig?.accentColor || '#f59e0b'}</span>
                    </div>
                  </div>

                  <div className="pb-color-swatch-group">
                    <input
                      type="color"
                      className="pb-color-picker"
                      value={draftConfig?.bgPrimary || '#fcfbf9'}
                      onChange={(e) => handleColorChange('bgPrimary', e.target.value)}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, display: 'block' }}>Canvas Background</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{draftConfig?.bgPrimary || '#fcfbf9'}</span>
                    </div>
                  </div>

                  <div className="pb-color-swatch-group">
                    <input
                      type="color"
                      className="pb-color-picker"
                      value={draftConfig?.textPrimary || '#0f172a'}
                      onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, display: 'block' }}>Primary Text</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{draftConfig?.textPrimary || '#0f172a'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shape & Corner Radius */}
            <div className="pb-section-card">
              <div className="pb-section-card-header">
                <strong style={{ fontSize: '13px' }}>📐 Corner Radius Tokens</strong>
                <Badge variant="neutral" size="sm">{draftConfig?.borderRadius || 'md'}</Badge>
              </div>
              <div className="pb-section-card-body">
                <div className="input-group">
                  <select
                    className="admin-select"
                    value={draftConfig?.borderRadius || 'md'}
                    onChange={(e) => handleColorChange('borderRadius', e.target.value)}
                  >
                    <option value="sm">Subtle (2px / 4px)</option>
                    <option value="md">Balanced Standard (4px / 8px)</option>
                    <option value="lg">Modern Rounded (8px / 14px)</option>
                    <option value="full">Pill Radius (Full Curved)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Typography Presets */}
            <div className="pb-section-card">
              <div className="pb-section-card-header">
                <strong style={{ fontSize: '13px' }}>✍️ Typography Preset</strong>
                <Badge variant="neutral" size="sm">{draftConfig?.fontFamily || 'sans'}</Badge>
              </div>
              <div className="pb-section-card-body">
                <div className="input-group">
                  <select
                    className="admin-select"
                    value={draftConfig?.fontFamily || 'sans'}
                    onChange={(e) => handleColorChange('fontFamily', e.target.value)}
                  >
                    <option value="sans">Inter (Modern Clean Sans)</option>
                    <option value="serif">Academic Editorial (Classical Serif)</option>
                    <option value="mono">Technical (Monospace Clarity)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Token Component Showcase */}
        <div style={{ padding: '24px', background: draftConfig?.bgPrimary || '#fcfbf9' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                padding: '24px',
                background: '#ffffff',
                border: `1px solid ${draftConfig?.borderColor || '#e2e8f0'}`,
                borderRadius: draftConfig?.borderRadius === 'lg' ? '16px' : draftConfig?.borderRadius === 'sm' ? '4px' : '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: draftConfig?.primaryColor || '#0f766e',
                    letterSpacing: '0.05em'
                  }}
                >
                  Live Theme Preview ({activeScope})
                </span>
                <Badge variant="success" size="sm">
                  Accessible Contrast AA
                </Badge>
              </div>

              <h3
                style={{
                  margin: '0 0 8px',
                  color: draftConfig?.textPrimary || '#0f172a',
                  fontFamily: draftConfig?.fontFamily === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif'
                }}
              >
                K.R. Mangalam University — Academic Portal
              </h3>
              <p style={{ margin: '0 0 20px', color: draftConfig?.textSecondary || '#64748b', fontSize: '14px' }}>
                Curated lecture notes, syllabus guides, and verified academic repositories for undergraduate and postgraduate schools.
              </p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: draftConfig?.primaryColor || '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: draftConfig?.borderRadius === 'lg' ? '12px' : draftConfig?.borderRadius === 'sm' ? '4px' : '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Primary Action
                </button>

                <button
                  type="button"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: 'transparent',
                    color: draftConfig?.primaryColor || '#0f766e',
                    border: `1px solid ${draftConfig?.primaryColor || '#0f766e'}`,
                    borderRadius: draftConfig?.borderRadius === 'lg' ? '12px' : draftConfig?.borderRadius === 'sm' ? '4px' : '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Secondary Outline
                </button>

                <span
                  style={{
                    padding: '6px 14px',
                    backgroundColor: `${draftConfig?.accentColor || '#f59e0b'}22`,
                    color: draftConfig?.accentColor || '#d97706',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  ★ Accent Token
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeStudioTab;
