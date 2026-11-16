import React, { useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Input from '../../../components/common/Input.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';

const DEVICE_WIDTHS = {
  desktop: { label: 'Desktop', width: '100%', icon: '🖥️' },
  laptop: { label: 'Laptop (1024px)', width: '1024px', icon: '💻' },
  tablet: { label: 'Tablet (768px)', width: '768px', icon: '📱' },
  mobile_l: { label: 'Mobile L (430px)', width: '430px', icon: '📲' },
  mobile_m: { label: 'Mobile M (390px)', width: '390px', icon: '📱' },
  mobile_s: { label: 'Mobile S (320px)', width: '320px', icon: '📳' }
};

export function VisualBuilderTab({ targetPage = 'scholar_dashboard', onNotify }) {
  const { reloadConfig } = usePlatformConfig();
  const [selectedPage, setSelectedPage] = useState(targetPage);
  const [pageData, setPageData] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeSection, setActiveSection] = useState('welcome_header');
  const [changeSummary, setChangeSummary] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (targetPage) setSelectedPage(targetPage);
  }, [targetPage]);

  // Load page configuration
  const loadPageConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await platformConfigService.getPageConfig(selectedPage);
      setPageData(data);
      setDraftConfig(data.draftConfig || data.publishedConfig);
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load ${selectedPage}: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPage, onNotify]);

  useEffect(() => {
    loadPageConfig();
  }, [loadPageConfig]);

  // Handle draft field change
  const handleFieldChange = (sectionKey, fieldKey, value) => {
    setDraftConfig((prev) => {
      const currentSection = prev[sectionKey] || {};
      return {
        ...prev,
        [sectionKey]: {
          ...currentSection,
          [fieldKey]: value
        }
      };
    });
  };

  // Handle nested banner alert change
  const handleBannerChange = (sectionKey, bannerField, value) => {
    setDraftConfig((prev) => {
      const currentSection = prev[sectionKey] || {};
      const currentBanner = currentSection.bannerAlert || {};
      return {
        ...prev,
        [sectionKey]: {
          ...currentSection,
          bannerAlert: {
            ...currentBanner,
            [bannerField]: value
          }
        }
      };
    });
  };

  // Save Draft to MySQL
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await platformConfigService.updateDraftPage(selectedPage, draftConfig);
      onNotify?.({ type: 'success', message: `Draft configuration for ${pageData?.title || selectedPage} saved successfully.` });
      await loadPageConfig();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to save draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Draft live
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // 1. Save current draft state to backend before publishing
      await platformConfigService.updateDraftPage(selectedPage, draftConfig);
      // 2. Publish draft live
      await platformConfigService.publishPage(selectedPage, changeSummary || 'Published via Visual Builder');
      setShowPublishModal(false);
      setChangeSummary('');
      onNotify?.({ type: 'success', message: `Successfully published ${pageData?.title || selectedPage} live! Changes are now visible to users.` });
      await loadPageConfig();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to publish changes.' });
    } finally {
      setIsPublishing(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Toolbar: Page Selector + Device Controls */}
      <div className="pb-device-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="pb-page-select" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            PAGE:
          </label>
          <select
            id="pb-page-select"
            className="admin-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{ fontWeight: 600, minWidth: '220px' }}
          >
            <option value="homepage">Public Homepage (Landing)</option>
            <option value="scholar_dashboard">Scholar Dashboard Workspace</option>
            <option value="admin_dashboard">Admin Operations Dashboard</option>
          </select>
          <span className="pb-version-pill">
            v{pageData?.version || 1} Published
          </span>
        </div>

        {/* Device Switcher */}
        <div className="pb-device-buttons" role="group" aria-label="Device viewport preview">
          {Object.entries(DEVICE_WIDTHS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              className={`pb-device-btn ${device === key ? 'pb-device-btn--active' : ''}`}
              onClick={() => setDevice(key)}
              title={item.label}
            >
              <span>{item.icon}</span>
              <span className="hide-on-mobile">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            isLoading={isSaving}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPublishModal(true)}
          >
            Publish Live
          </Button>
        </div>
      </div>

      {/* Main Split Builder Stage */}
      <div className="pb-split-layout">
        {/* Left Side: Controlled Component Inspector */}
        <div className="pb-inspector">
          <div className="pb-inspector-header">
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Component Inspector</h4>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Configure supported properties and layout tokens
            </span>
          </div>

          <div className="pb-inspector-body">
            {/* SCHOLAR DASHBOARD INSPECTION */}
            {selectedPage === 'scholar_dashboard' && draftConfig && (
              <>
                {/* Section 1: Welcome Header */}
                <div className="pb-section-card">
                  <div
                    className="pb-section-card-header"
                    onClick={() => setActiveSection(activeSection === 'welcome_header' ? '' : 'welcome_header')}
                  >
                    <strong style={{ fontSize: '13px' }}>👋 Welcome Header</strong>
                    <Badge variant={draftConfig.welcome_header?.isVisible ? 'success' : 'neutral'} size="sm">
                      {draftConfig.welcome_header?.isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  {activeSection === 'welcome_header' && (
                    <div className="pb-section-card-body">
                      <Input
                        label="Heading Title"
                        value={draftConfig.welcome_header?.title || ''}
                        onChange={(e) => handleFieldChange('welcome_header', 'title', e.target.value)}
                        placeholder="e.g. Your Personal Study Hub"
                      />
                      <Input
                        label="Subtitle Description"
                        value={draftConfig.welcome_header?.subtitle || ''}
                        onChange={(e) => handleFieldChange('welcome_header', 'subtitle', e.target.value)}
                        placeholder="Study progress and library access"
                      />
                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(draftConfig.welcome_header?.bannerAlert?.show)}
                            onChange={(e) => handleBannerChange('welcome_header', 'show', e.target.checked)}
                          />
                          Display Institutional Announcement Banner
                        </label>
                        {draftConfig.welcome_header?.bannerAlert?.show && (
                          <div style={{ marginTop: '8px' }}>
                            <Input
                              label="Banner Notice Text"
                              value={draftConfig.welcome_header?.bannerAlert?.message || ''}
                              onChange={(e) => handleBannerChange('welcome_header', 'message', e.target.value)}
                              placeholder="e.g. Mid-term examination syllabus notes are live."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Stats KPI Cards Layout */}
                <div className="pb-section-card">
                  <div
                    className="pb-section-card-header"
                    onClick={() => setActiveSection(activeSection === 'stats_kpi' ? '' : 'stats_kpi')}
                  >
                    <strong style={{ fontSize: '13px' }}>📊 KPI Metric Cards</strong>
                    <Badge variant="primary" size="sm">
                      {draftConfig.stats_kpi?.columns || 4} Columns
                    </Badge>
                  </div>
                  {activeSection === 'stats_kpi' && (
                    <div className="pb-section-card-body">
                      <div className="input-group">
                        <label className="input-label">Grid Layout Preset</label>
                        <select
                          className="admin-select"
                          value={draftConfig.stats_kpi?.columns || 4}
                          onChange={(e) => handleFieldChange('stats_kpi', 'columns', Number(e.target.value))}
                        >
                          <option value={1}>1 Column (Stacked Full)</option>
                          <option value={2}>2 Columns (Balanced Split)</option>
                          <option value={4}>4 Columns (Compact SaaS Cards)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600 }}>Active Metric Cards:</span>
                        {(draftConfig.stats_kpi?.cards || []).map((card, idx) => (
                          <label key={card.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={card.show !== false}
                              onChange={(e) => {
                                const newCards = [...draftConfig.stats_kpi.cards];
                                newCards[idx] = { ...card, show: e.target.checked };
                                handleFieldChange('stats_kpi', 'cards', newCards);
                              }}
                            />
                            {card.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Learning Activity Chart */}
                <div className="pb-section-card">
                  <div
                    className="pb-section-card-header"
                    onClick={() => setActiveSection(activeSection === 'activity_chart' ? '' : 'activity_chart')}
                  >
                    <strong style={{ fontSize: '13px' }}>📈 Activity Analytics Chart</strong>
                    <Badge variant={draftConfig.activity_chart?.isVisible ? 'success' : 'neutral'} size="sm">
                      {draftConfig.activity_chart?.isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  {activeSection === 'activity_chart' && (
                    <div className="pb-section-card-body">
                      <Input
                        label="Chart Module Title"
                        value={draftConfig.activity_chart?.chartTitle || ''}
                        onChange={(e) => handleFieldChange('activity_chart', 'chartTitle', e.target.value)}
                        placeholder="Study & Reading Velocity"
                      />
                      <div className="input-group">
                        <label className="input-label">Default Time Range</label>
                        <select
                          className="admin-select"
                          value={draftConfig.activity_chart?.defaultRange || '7d'}
                          onChange={(e) => handleFieldChange('activity_chart', 'defaultRange', e.target.value)}
                        >
                          <option value="7d">Last 7 Days</option>
                          <option value="30d">Last 30 Days</option>
                          <option value="90d">Last 90 Days</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* HOMEPAGE INSPECTION */}
            {selectedPage === 'homepage' && draftConfig && (
              <>
                {/* Section 1: Hero Section */}
                <div className="pb-section-card">
                  <div
                    className="pb-section-card-header"
                    onClick={() => setActiveSection(activeSection === 'hero' ? '' : 'hero')}
                  >
                    <strong style={{ fontSize: '13px' }}>🎯 Hero Showcase</strong>
                    <Badge variant={draftConfig.hero?.isVisible ? 'success' : 'neutral'} size="sm">
                      {draftConfig.hero?.isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  {activeSection === 'hero' && (
                    <div className="pb-section-card-body">
                      <Input
                        label="Badge Pill"
                        value={draftConfig.hero?.badge || ''}
                        onChange={(e) => handleFieldChange('hero', 'badge', e.target.value)}
                        placeholder="e.g. K.R. Mangalam University Academic Repository"
                      />
                      <Input
                        label="Hero Headline Title"
                        value={draftConfig.hero?.title || ''}
                        onChange={(e) => handleFieldChange('hero', 'title', e.target.value)}
                      />
                      <Input
                        label="Subtitle Paragraph"
                        value={draftConfig.hero?.subtitle || ''}
                        onChange={(e) => handleFieldChange('hero', 'subtitle', e.target.value)}
                      />
                      <Input
                        label="Primary CTA Button Text"
                        value={draftConfig.hero?.primaryCtaText || ''}
                        onChange={(e) => handleFieldChange('hero', 'primaryCtaText', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Section 2: Features Cards */}
                <div className="pb-section-card">
                  <div
                    className="pb-section-card-header"
                    onClick={() => setActiveSection(activeSection === 'features' ? '' : 'features')}
                  >
                    <strong style={{ fontSize: '13px' }}>✨ Feature Pillars</strong>
                    <Badge variant={draftConfig.features?.isVisible ? 'success' : 'neutral'} size="sm">
                      {draftConfig.features?.isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  {activeSection === 'features' && (
                    <div className="pb-section-card-body">
                      <Input
                        label="Section Title"
                        value={draftConfig.features?.title || ''}
                        onChange={(e) => handleFieldChange('features', 'title', e.target.value)}
                      />
                      <Input
                        label="Section Subtitle"
                        value={draftConfig.features?.subtitle || ''}
                        onChange={(e) => handleFieldChange('features', 'subtitle', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ADMIN DASHBOARD INSPECTION */}
            {selectedPage === 'admin_dashboard' && draftConfig && (
              <>
                <div className="pb-section-card">
                  <div
                    className="pb-section-card-header"
                    onClick={() => setActiveSection(activeSection === 'header' ? '' : 'header')}
                  >
                    <strong style={{ fontSize: '13px' }}>🛡️ Command Overview Header</strong>
                  </div>
                  {activeSection === 'header' && (
                    <div className="pb-section-card-body">
                      <Input
                        label="Overview Title"
                        value={draftConfig.header?.title || ''}
                        onChange={(e) => handleFieldChange('header', 'title', e.target.value)}
                      />
                      <Input
                        label="Overview Subtitle"
                        value={draftConfig.header?.subtitle || ''}
                        onChange={(e) => handleFieldChange('header', 'subtitle', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="pb-inspector-actions">
            <Button variant="outline" size="sm" onClick={loadPageConfig} style={{ width: '100%' }}>
              Discard Changes
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveDraft} isLoading={isSaving} style={{ width: '100%' }}>
              Save Draft
            </Button>
          </div>
        </div>

        {/* Right Side: Responsive Device Preview Canvas */}
        <div className="pb-preview-stage">
          <div
            className="pb-device-frame"
            style={{ width: DEVICE_WIDTHS[device]?.width || '100%' }}
          >
            <div className="pb-device-frame-header">
              <div className="pb-device-frame-dots">
                <div className="pb-device-frame-dot" style={{ background: '#ef4444' }} />
                <div className="pb-device-frame-dot" style={{ background: '#f59e0b' }} />
                <div className="pb-device-frame-dot" style={{ background: '#10b981' }} />
              </div>
              <div className="pb-device-frame-url">
                pjstudy.krmangalam.edu.in/{selectedPage === 'homepage' ? '' : selectedPage.replace('_', '/')}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {DEVICE_WIDTHS[device]?.label}
              </span>
            </div>

            <div className="pb-device-frame-content">
              {/* LIVE PREVIEW OF SCHOLAR DASHBOARD */}
              {selectedPage === 'scholar_dashboard' && draftConfig && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Announcement Banner */}
                  {draftConfig.welcome_header?.bannerAlert?.show && (
                    <div
                      style={{
                        padding: '10px 16px',
                        background: '#e6f4ea',
                        border: '1px solid #b7e1cd',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#137333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>📢</span>
                      <strong>{draftConfig.welcome_header?.bannerAlert?.message}</strong>
                    </div>
                  )}

                  {/* Welcome Header */}
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                      {draftConfig.welcome_header?.title || 'Welcome back, Scholar'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary, #64748b)' }}>
                      {draftConfig.welcome_header?.subtitle}
                    </p>
                  </div>

                  {/* KPI Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${draftConfig.stats_kpi?.columns || 4}, 1fr)`,
                      gap: '12px'
                    }}
                  >
                    {(draftConfig.stats_kpi?.cards || [])
                      .filter((c) => c.show !== false)
                      .map((card, idx) => (
                        <div
                          key={card.id || idx}
                          style={{
                            padding: '14px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{card.label}</span>
                          <strong style={{ fontSize: '20px', color: '#0f172a' }}>
                            {idx === 0 ? '12' : idx === 1 ? '48' : idx === 2 ? '5' : '124'}
                          </strong>
                        </div>
                      ))}
                  </div>

                  {/* Activity Chart Mock */}
                  {draftConfig.activity_chart?.isVisible && (
                    <div
                      style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px' }}>{draftConfig.activity_chart?.chartTitle}</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Range: {draftConfig.activity_chart?.defaultRange}</span>
                      </div>
                      <div
                        style={{
                          height: '90px',
                          background: 'linear-gradient(180deg, rgba(15,118,110,0.12) 0%, rgba(15,118,110,0.01) 100%)',
                          borderBottom: '2px solid #0f766e',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-around',
                          padding: '0 10px'
                        }}
                      >
                        {[30, 45, 60, 40, 80, 65, 90].map((h, i) => (
                          <div
                            key={i}
                            style={{
                              width: '12px',
                              height: `${h}%`,
                              background: '#0f766e',
                              borderRadius: '3px 3px 0 0'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE PREVIEW OF HOMEPAGE */}
              {selectedPage === 'homepage' && draftConfig && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'center' }}>
                  <div style={{ padding: '24px 12px' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        fontSize: '12px',
                        fontWeight: 700,
                        marginBottom: '12px'
                      }}
                    >
                      {draftConfig.hero?.badge || 'K.R. Mangalam University'}
                    </div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 10px', color: '#0f172a', lineHeight: 1.2 }}>
                      {draftConfig.hero?.title}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '500px', margin: '0 auto 20px' }}>
                      {draftConfig.hero?.subtitle}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <div
                        style={{
                          padding: '10px 20px',
                          background: '#0f766e',
                          color: '#ffffff',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        {draftConfig.hero?.primaryCtaText || 'Explore Notes'}
                      </div>
                    </div>
                  </div>

                  {/* Feature Pillars */}
                  {draftConfig.features?.isVisible && (
                    <div style={{ textAlign: 'left', padding: '0 12px' }}>
                      <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: '#0f172a' }}>{draftConfig.features?.title}</h3>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>{draftConfig.features?.subtitle}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        {(draftConfig.features?.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px'
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>{item.icon}</span>
                            <h4 style={{ margin: '6px 0 4px', fontSize: '13px' }}>{item.title}</h4>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Live Modal */}
      {showPublishModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '24px',
              width: '460px',
              maxWidth: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Publish Changes Live</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Publishing will update the live production configuration for <strong>{pageData?.title || selectedPage}</strong>. All users will receive this version immediately.
            </p>
            <Input
              label="Change Summary (Audit Log)"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g. Updated welcome header and 2-column KPI metrics"
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setShowPublishModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublish}
                isLoading={isPublishing}
              >
                Confirm & Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualBuilderTab;
