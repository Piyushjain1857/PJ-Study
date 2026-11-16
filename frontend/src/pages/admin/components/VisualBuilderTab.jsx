import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { platformConfigService } from '../../../services/platformConfigService.js';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Input from '../../../components/common/Input.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import { usePlatformConfig } from '../../../context/PlatformConfigContext.jsx';

// =============================================================================
// SUPPORTED PAGES & WORKSPACE CONFIGURATION
// =============================================================================
const SUPPORTED_PAGES = [
  { id: 'scholar_dashboard', label: 'Scholar Dashboard', role: 'SCHOLAR', icon: '📊', route: '/dashboard' },
  { id: 'scholar_explore', label: 'Explore Notes', role: 'SCHOLAR', icon: '🔍', route: '/notes/explore' },
  { id: 'scholar_recommended', label: 'Recommended For You', role: 'SCHOLAR', icon: '✨', route: '/notes/recommended' },
  { id: 'scholar_library', label: 'My Study Library', role: 'SCHOLAR', icon: '📚', route: '/my-notes' },
  { id: 'scholar_profile', label: 'Scholar Profile & Security', role: 'SCHOLAR', icon: '👤', route: '/profile' },
  { id: 'scholar_notifications', label: 'Notification Center', role: 'SCHOLAR', icon: '🔔', route: '/notifications' },
  { id: 'admin_dashboard', label: 'Admin Command Center', role: 'ADMIN', icon: '⚡', route: '/admin-workspace' },
  { id: 'admin_upload', label: 'Direct Manuscript Publishing', role: 'ADMIN', icon: '📤', route: '/notes/new' },
  { id: 'admin_notes', label: 'Curriculum Notes Inventory', role: 'ADMIN', icon: '📑', route: '/admin-workspace/notes' },
  { id: 'homepage', label: 'Public Homepage & Landing', role: 'PUBLIC', icon: '🌐', route: '/' }
];

const DEVICE_VIEWPORTS = {
  desktop: { label: 'Desktop', width: 1200, icon: '🖥️' },
  tablet: { label: 'Tablet', width: 768, icon: '📱' },
  mobile: { label: 'Mobile', width: 390, icon: '📲' }
};

// Approved Component Registry with metadata & default schemas
const COMPONENT_METADATA = {
  welcome_header: { label: 'Welcome & Institutional Announcement', icon: '👋', category: 'Scholar' },
  academic_info: { label: 'KRMU Academic Enrollment Badge', icon: '🏛️', category: 'Scholar' },
  stats_kpi: { label: 'KPI Metric Progress Cards', icon: '📈', category: 'General' },
  activity_chart: { label: 'Weekly Study Trends Chart', icon: '📊', category: 'Scholar' },
  recent_notes: { label: 'Recently Published Manuscripts', icon: '📖', category: 'General' },
  downloads: { label: 'Study Downloads & History', icon: '📥', category: 'Scholar' },
  collections: { label: 'Study Binders & Collections', icon: '📁', category: 'Scholar' },
  recommendations: { label: 'Curated Faculty Recommendations', icon: '⭐', category: 'Scholar' },
  quick_actions: { label: 'Quick Action Shortcuts', icon: '⚡', category: 'Scholar' },

  explore_header: { label: 'Catalog Header & Search Summary', icon: '🔍', category: 'Scholar' },
  search_filters: { label: 'Faceted Academic Filters', icon: '🏷️', category: 'General' },
  notes_catalog: { label: 'Manuscripts Catalog Grid', icon: '📚', category: 'General' },

  rec_header: { label: 'Recommendation Header', icon: '🎯', category: 'Scholar' },
  rec_grid: { label: 'Curated Manuscript Cards', icon: '✨', category: 'Scholar' },

  library_header: { label: 'Library Header & Stats', icon: '🔖', category: 'Scholar' },
  saved_tabs: { label: 'Saved Tabs & Filter Pills', icon: '📑', category: 'Scholar' },
  collections_grid: { label: 'Personal Binder Bins', icon: '🗂️', category: 'Scholar' },

  profile_header: { label: 'Profile Summary Header', icon: '👤', category: 'Scholar' },
  academic_card: { label: 'K.R. Mangalam University Credentials', icon: '🎓', category: 'Scholar' },
  security_settings: { label: 'Password & RBAC Security Preferences', icon: '🔒', category: 'General' },

  notifications_header: { label: 'Notifications Header', icon: '🔔', category: 'General' },
  notifications_feed: { label: 'Live Notifications Stream', icon: '📩', category: 'General' },

  quick_shortcuts: { label: 'Admin Management Shortcuts', icon: '⚡', category: 'Admin' },
  analytics_summary: { label: 'Readership Analytics Card', icon: '📉', category: 'Admin' },
  announcements: { label: 'Platform Announcements Feed', icon: '📢', category: 'Admin' },
  reports_feed: { label: 'Content Reports Queue', icon: '🚩', category: 'Admin' },

  upload_header: { label: 'Publishing Header', icon: '📤', category: 'Admin' },
  file_uploader: { label: 'PDF Document Drag & Drop Vault', icon: '📁', category: 'Admin' },
  metadata_form: { label: 'Course & Curriculum Metadata Form', icon: '📝', category: 'Admin' },

  notes_header: { label: 'Inventory Header & Stats', icon: '📑', category: 'Admin' },
  inventory_filters: { label: 'Curriculum Inventory Filters', icon: '🔎', category: 'Admin' },
  inventory_table: { label: 'Complete Notes Inventory Table', icon: '📋', category: 'Admin' },

  announcement_banner: { label: 'Top Notification Ticker', icon: '📣', category: 'Public' },
  hero: { label: 'Hero Banner & Call to Action', icon: '🌟', category: 'Public' },
  features: { label: 'Platform Capability Cards', icon: '💡', category: 'Public' },
  how_it_works: { label: 'Three-Step Study Workflow', icon: '🔄', category: 'Public' },
  academic_highlights: { label: 'K.R. Mangalam Academic Programs', icon: '🏛️', category: 'Public' },
  trust_cta: { label: 'Institutional Trust CTA', icon: '🛡️', category: 'Public' },
  footer: { label: 'Institutional Footer & Links', icon: '📄', category: 'Public' }
};

// Approved Addable Components Catalog
const ADDABLE_COMPONENTS = [
  { key: 'announcement_banner', name: 'Announcement Banner', icon: '📣', desc: 'Top alert ribbon for campus notices & exam dates', defaultProps: { text: 'Semester examination revision notes are live.', linkText: 'View Notes', linkUrl: '/notes/explore', variant: 'emerald', isVisible: true } },
  { key: 'hero', name: 'Hero Section', icon: '🌟', desc: 'Full-width banner with title, description & CTA actions', defaultProps: { headline: 'Study Smarter with KRMU Notes', description: 'Curriculum-aligned lecture notes and exam guides.', eyebrow: 'Official Academic Portal', primaryCtaText: 'Explore Notes', primaryCtaLink: '/notes/explore', isVisible: true } },
  { key: 'stats_kpi', name: 'Quick Statistics KPI', icon: '📈', desc: 'Metric counters for published notes, reads & downloads', defaultProps: { columns: 4, cards: [{ id: 'published', label: 'Published Notes', show: true }, { id: 'reads', label: 'Catalog Reads', show: true }], isVisible: true } },
  { key: 'academic_info', name: 'Academic Identity Banner', icon: '🏛️', desc: 'Displays enrolled university school, degree & semester', defaultProps: { campusName: 'K.R. Mangalam University', schoolLabel: 'School of Computer Science & Engineering', isVisible: true } },
  { key: 'recent_notes', name: 'Recent Notes Grid', icon: '📖', desc: 'Showcase of recently uploaded and published study materials', defaultProps: { title: 'Recently Published Notes', subtitle: 'Latest study notes uploaded by faculty', isVisible: true } },
  { key: 'recommendations', name: 'Personalized Recommendations', icon: '⭐', desc: 'Hand-picked manuscripts matched to student enrolled courses', defaultProps: { title: 'Recommended For You', subtitle: 'Curated based on your active semester', maxItems: 6, isVisible: true } },
  { key: 'features', name: 'Platform Capabilities Grid', icon: '💡', desc: 'Feature highlights and benefits cards with icons', defaultProps: { title: 'Why PJ Study?', subtitle: 'Engineered for seamless academic preparation', columns: 3, isVisible: true } },
  { key: 'how_it_works', name: 'How It Works Guide', icon: '🔄', desc: 'Three-step curriculum study roadmap for students', defaultProps: { title: 'How PJ Study Works', subtitle: 'Get exam-ready in three simple steps', isVisible: true } },
  { key: 'trust_cta', name: 'Institutional Trust CTA', icon: '🛡️', desc: 'High-converting call to action block for students and faculty', defaultProps: { headline: 'Ready to elevate your academic scores?', description: 'Join fellow KRMU scholars today.', buttonText: 'Explore Catalog Now', buttonLink: '/notes/explore', isVisible: true } }
];

export function VisualBuilderTab({ targetPage = 'scholar_dashboard', onNotify }) {
  const { reloadConfig } = usePlatformConfig();

  // Navigation and active states
  const [selectedPage, setSelectedPage] = useState(targetPage);
  const [workspaceRole, setWorkspaceRole] = useState('ALL');
  const [pageData, setPageData] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const [inspectorTab, setInspectorTab] = useState('content'); // 'content' | 'appearance' | 'layout' | 'visibility'
  const [leftTab, setLeftTab] = useState('layers'); // 'layers' | 'add'

  // Viewport & Canvas options
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState('fit'); // 'fit' | 50 | 75 | 100
  const [isEditMode, setIsEditMode] = useState(true); // true = Edit Mode, false = Preview Mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Canvas container auto-fit measurement
  const canvasContainerRef = useRef(null);
  const [canvasContainerWidth, setCanvasContainerWidth] = useState(0);

  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const updateWidth = () => {
      if (canvasContainerRef.current) {
        setCanvasContainerWidth(canvasContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    let observer;
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      observer = new window.ResizeObserver(updateWidth);
      observer.observe(canvasContainerRef.current);
    }
    window.addEventListener('resize', updateWidth);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Compute scale ratio
  const targetWidth = DEVICE_VIEWPORTS[device]?.width || 1200;
  const fitScale = useMemo(() => {
    if (!canvasContainerWidth) return 0.75;
    // Allow padding
    const availableWidth = Math.max(280, canvasContainerWidth - 48);
    const computed = availableWidth / targetWidth;
    return Math.min(1, Math.max(0.3, Math.round(computed * 100) / 100));
  }, [canvasContainerWidth, targetWidth]);

  const currentScale = zoom === 'fit' ? fitScale : zoom / 100;

  // Drag and drop state
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);

  // Undo / Redo history state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);

  // Modals & Async state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versionHistoryList, setVersionHistoryList] = useState([]);
  const [changeSummary, setChangeSummary] = useState('');

  // Active draft config (derived from history head)
  const draftConfig = history[historyIndex] || null;

  // Sync prop changes
  useEffect(() => {
    if (targetPage && targetPage !== selectedPage) {
      setSelectedPage(targetPage);
    }
  }, [targetPage, selectedPage]);

  // Load target page config from database
  const loadPageConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await platformConfigService.getPageConfig(selectedPage);
      setPageData(data);
      const initialConfig = JSON.parse(JSON.stringify(data.draftConfig || data.publishedConfig || {}));

      // Initialize undo/redo history stack
      setHistory([initialConfig]);
      setHistoryIndex(0);
      setIsDirty(false);

      // Auto-select first section
      const firstSection = initialConfig.section_order?.[0] || Object.keys(initialConfig)[0] || '';
      setActiveSection(firstSection);
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to load page: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPage, onNotify]);

  useEffect(() => {
    loadPageConfig();
  }, [loadPageConfig]);

  // Push new state to bounded Undo/Redo history stack (max 40 entries)
  const pushHistory = useCallback((newConfig) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const next = [...sliced, newConfig];
      if (next.length > 40) next.shift();
      return next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 39));
    setIsDirty(true);
  }, [historyIndex]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setIsDirty(true);
    }
  }, [historyIndex]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setIsDirty(true);
    }
  }, [historyIndex, history.length]);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y / Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Filter pages by workspace
  const filteredPages = useMemo(() => {
    if (workspaceRole === 'ALL') return SUPPORTED_PAGES;
    return SUPPORTED_PAGES.filter((p) => p.role === workspaceRole);
  }, [workspaceRole]);

  // Current page metadata
  const currentPageMeta = useMemo(() => {
    return SUPPORTED_PAGES.find((p) => p.id === selectedPage) || SUPPORTED_PAGES[0];
  }, [selectedPage]);

  // Current section order
  const currentSectionOrder = useMemo(() => {
    if (!draftConfig) return [];
    if (Array.isArray(draftConfig.section_order) && draftConfig.section_order.length > 0) {
      return draftConfig.section_order;
    }
    return Object.keys(draftConfig).filter((k) => k !== 'section_order' && k !== 'sidebar');
  }, [draftConfig]);

  // Move section by direction (▲ / ▼)
  const handleMoveSection = (sectionKey, direction) => {
    if (!draftConfig) return;
    const order = [...currentSectionOrder];
    const currentIndex = order.indexOf(sectionKey);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    const [moved] = order.splice(currentIndex, 1);
    order.splice(targetIndex, 0, moved);

    const newConfig = {
      ...draftConfig,
      section_order: order
    };
    pushHistory(newConfig);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, sectionKey) => {
    setDraggedSection(sectionKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, sectionKey) => {
    e.preventDefault();
    if (draggedSection && draggedSection !== sectionKey) {
      setDragOverSection(sectionKey);
    }
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDrop = (e, targetSection) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSection || !draftConfig) return;

    const order = [...currentSectionOrder];
    const fromIndex = order.indexOf(draggedSection);
    const toIndex = order.indexOf(targetSection);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);

      const newConfig = {
        ...draftConfig,
        section_order: order
      };
      pushHistory(newConfig);
    }
    setDraggedSection(null);
    setDragOverSection(null);
  };

  // Toggle section visibility
  const handleToggleVisibility = (sectionKey) => {
    if (!draftConfig) return;
    const section = draftConfig[sectionKey] || {};
    const current = section.isVisible !== false;

    const newConfig = {
      ...draftConfig,
      [sectionKey]: {
        ...section,
        isVisible: !current
      }
    };
    pushHistory(newConfig);
  };

  // Remove section from page
  const handleRemoveSection = (sectionKey) => {
    if (!draftConfig) return;
    const order = currentSectionOrder.filter((k) => k !== sectionKey);
    const newConfig = {
      ...draftConfig,
      section_order: order,
      [sectionKey]: {
        ...(draftConfig[sectionKey] || {}),
        isVisible: false
      }
    };
    pushHistory(newConfig);
    if (activeSection === sectionKey) {
      setActiveSection(order[0] || '');
    }
  };

  // Add component from library into page
  const handleAddComponent = (comp) => {
    if (!draftConfig) return;
    const order = [...currentSectionOrder];
    if (!order.includes(comp.key)) {
      order.push(comp.key);
    }

    const newConfig = {
      ...draftConfig,
      section_order: order,
      [comp.key]: {
        ...(draftConfig[comp.key] || comp.defaultProps),
        isVisible: true
      }
    };
    pushHistory(newConfig);
    setActiveSection(comp.key);
    setLeftTab('layers');
    onNotify?.({ type: 'success', message: `Added "${comp.name}" to page structure.` });
  };

  // Modify draft field value
  const handleFieldChange = (sectionKey, fieldKey, value) => {
    if (!draftConfig) return;
    const section = draftConfig[sectionKey] || {};
    const newConfig = {
      ...draftConfig,
      [sectionKey]: {
        ...section,
        [fieldKey]: value
      }
    };
    pushHistory(newConfig);
  };

  // Modify appearance preset or token
  const handleAppearanceChange = (sectionKey, appearanceField, value) => {
    if (!draftConfig) return;
    const section = draftConfig[sectionKey] || {};
    const currentApp = section.appearance || {};
    const newConfig = {
      ...draftConfig,
      [sectionKey]: {
        ...section,
        appearance: {
          ...currentApp,
          [appearanceField]: value
        }
      }
    };
    pushHistory(newConfig);
  };

  // Discard draft changes
  const handleDiscardChanges = () => {
    if (!pageData?.publishedConfig) return;
    const published = JSON.parse(JSON.stringify(pageData.publishedConfig));
    pushHistory(published);
    setIsDirty(false);
    onNotify?.({ type: 'info', message: 'Reverted all draft edits to published version.' });
  };

  // Save draft to MySQL
  const handleSaveDraft = async () => {
    if (!draftConfig) return;
    setIsSaving(true);
    try {
      await platformConfigService.updateDraftPage(selectedPage, draftConfig);
      setIsDirty(false);
      onNotify?.({ type: 'success', message: `Draft configuration for ${pageData?.title || selectedPage} saved successfully.` });
      await loadPageConfig();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to save draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish draft live
  const handlePublish = async () => {
    if (!draftConfig) return;
    setIsPublishing(true);
    try {
      await platformConfigService.updateDraftPage(selectedPage, draftConfig);
      await platformConfigService.publishPage(selectedPage, changeSummary || 'Published via Full-Page Visual Studio 3.0');
      setShowPublishModal(false);
      setChangeSummary('');
      setIsDirty(false);
      onNotify?.({
        type: 'success',
        message: `Published ${pageData?.title || selectedPage} live! Changes are visible to users immediately.`
      });
      await loadPageConfig();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to publish changes.' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Open version history modal
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    try {
      const data = await platformConfigService.getVersionHistory('PAGE');
      const filtered = (data || []).filter((item) => item.entityKey === selectedPage);
      setVersionHistoryList(filtered);
    } catch (err) {
      onNotify?.({ type: 'danger', message: `Failed to fetch history: ${err.message}` });
    }
  };

  // Rollback to past version
  const handleRollbackVersion = async (versionId, verNumber) => {
    if (!window.confirm(`Are you sure you want to rollback to Version ${verNumber}? This will restore the published layout and create a new audit snapshot.`)) {
      return;
    }
    try {
      await platformConfigService.rollbackVersion(versionId);
      setShowHistoryModal(false);
      onNotify?.({ type: 'success', message: `Successfully restored Version ${verNumber}!` });
      await loadPageConfig();
      await reloadConfig?.();
    } catch (err) {
      onNotify?.({ type: 'danger', message: err.message || 'Failed to rollback version.' });
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton count={4} height="80px" />
      </div>
    );
  }

  const activeSectionConfig = draftConfig?.[activeSection] || {};
  const activeSectionMeta = COMPONENT_METADATA[activeSection] || { label: activeSection, icon: '📦', category: 'General' };

  // Calculate workspace grid CSS class
  const workspaceClass = [
    'pb-studio-workspace',
    isLeftCollapsed && isRightCollapsed
      ? 'pb-studio-workspace--both-collapsed'
      : isLeftCollapsed
        ? 'pb-studio-workspace--left-collapsed'
        : isRightCollapsed
          ? 'pb-studio-workspace--right-collapsed'
          : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`pb-studio-root ${isFullscreen ? 'pb-studio-root--fullscreen' : ''}`}>
      {/* =========================================================================
          TOP COMMAND TOOLBAR
          ========================================================================= */}
      <div className="pb-studio-toolbar">
        {/* Left: Page Title, Workspace & Unsaved Indicator */}
        <div className="pb-studio-toolbar__left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎨</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Studio 3.0
            </span>
          </div>

          <select
            className="admin-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{ fontWeight: 700, fontSize: '12px', minWidth: '190px', background: '#0f172a', color: '#f8fafc', borderColor: '#334155' }}
          >
            {SUPPORTED_PAGES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.label}
              </option>
            ))}
          </select>

          <span className="pb-version-pill">
            v{pageData?.version || 1}
          </span>

          <span className={`pb-unsaved-badge ${isDirty ? 'pb-unsaved-badge--dirty' : 'pb-unsaved-badge--saved'}`}>
            {isDirty ? '● Unsaved Draft' : '✓ Saved'}
          </span>
        </div>

        {/* Center: Undo/Redo, Mode Switch, Device Presets, Zoom & Panel Toggles */}
        <div className="pb-studio-toolbar__center">
          {/* Undo / Redo */}
          <div className="pb-undo-redo-group" role="group" aria-label="Undo and Redo">
            <button
              type="button"
              className="pb-toolbar-icon-btn"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z / Cmd+Z)"
            >
              ↩
            </button>
            <button
              type="button"
              className="pb-toolbar-icon-btn"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y / Cmd+Shift+Z)"
            >
              ↪
            </button>
          </div>

          {/* Edit Mode vs Preview Mode Toggle */}
          <div className="pb-mode-toggle" role="group" aria-label="Editor Mode">
            <button
              type="button"
              className={`pb-mode-btn ${isEditMode ? 'pb-mode-btn--active' : ''}`}
              onClick={() => setIsEditMode(true)}
            >
              <span>✏️</span> Edit
            </button>
            <button
              type="button"
              className={`pb-mode-btn ${!isEditMode ? 'pb-mode-btn--active' : ''}`}
              onClick={() => setIsEditMode(false)}
            >
              <span>👁️</span> Preview
            </button>
          </div>

          {/* Viewport Presets (Desktop, Tablet, Mobile) */}
          <div className="pb-device-buttons" role="group" aria-label="Device viewport">
            {Object.entries(DEVICE_VIEWPORTS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                className={`pb-device-btn ${device === key ? 'pb-device-btn--active' : ''}`}
                onClick={() => setDevice(key)}
                title={item.label}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Zoom Bar with Auto-Fit */}
          <div className="pb-zoom-bar">
            <button
              type="button"
              className={`pb-zoom-btn ${zoom === 'fit' ? 'pb-zoom-btn--active' : ''}`}
              onClick={() => setZoom('fit')}
              title="Auto-Fit to available screen width"
            >
              Fit
            </button>
            {[50, 75, 100].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`pb-zoom-btn ${zoom === lvl ? 'pb-zoom-btn--active' : ''}`}
                onClick={() => setZoom(lvl)}
              >
                {lvl}%
              </button>
            ))}
          </div>

          {/* Quick Panel Collapse/Expand Toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`pb-panel-toggle-btn ${!isLeftCollapsed ? 'pb-panel-toggle-btn--active' : ''}`}
              onClick={() => setIsLeftCollapsed((prev) => !prev)}
              title={isLeftCollapsed ? 'Show Layers Panel' : 'Hide Layers Panel (Expand Canvas)'}
            >
              <span>📑</span> Layers
            </button>
            <button
              type="button"
              className={`pb-panel-toggle-btn ${!isRightCollapsed ? 'pb-panel-toggle-btn--active' : ''}`}
              onClick={() => setIsRightCollapsed((prev) => !prev)}
              title={isRightCollapsed ? 'Show Inspector Panel' : 'Hide Inspector Panel (Expand Canvas)'}
            >
              <span>⚙️</span> Inspector
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="pb-toolbar-icon-btn"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen Studio'}
          >
            {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
          </button>
        </div>

        {/* Right: History, Discard, Save, Publish */}
        <div className="pb-studio-toolbar__right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistory}
            title="Inspect version rollback history"
          >
            🕒 History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscardChanges}
            disabled={!isDirty}
            title="Revert draft changes to published"
          >
            Discard
          </Button>
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

      {/* =========================================================================
          THREE-PANEL STUDIO WORKSPACE
          ========================================================================= */}
      <div className={workspaceClass}>
        {/* =====================================================================
            PANEL 1: LEFT PAGE & LAYERS PANEL
            ===================================================================== */}
        {isLeftCollapsed ? (
          <div
            className="pb-collapsed-strip"
            onClick={() => setIsLeftCollapsed(false)}
            title="Expand Left Panel"
          >
            <button type="button" className="pb-toolbar-icon-btn">▶</button>
            <span className="pb-collapsed-strip__title">Pages & Layers</span>
          </div>
        ) : (
          <aside className="pb-navigator-panel" aria-label="Page Structure & Layers">
            {/* Header with Collapse Button */}
            <div className="pb-navigator-panel__header" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Layers & Structure</span>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Full page hierarchy</p>
              </div>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
                style={{ color: '#475569' }}
                onClick={() => setIsLeftCollapsed(true)}
                title="Collapse Panel"
              >
                ◀
              </button>
            </div>

            {/* Left Tabs: Layers Tree vs Add Component */}
            <div className="pb-left-panel-tabs">
              <button
                type="button"
                className={`pb-left-tab-btn ${leftTab === 'layers' ? 'pb-left-tab-btn--active' : ''}`}
                onClick={() => setLeftTab('layers')}
              >
                <span>📑</span> Layers ({currentSectionOrder.length})
              </button>
              <button
                type="button"
                className={`pb-left-tab-btn ${leftTab === 'add' ? 'pb-left-tab-btn--active' : ''}`}
                onClick={() => setLeftTab('add')}
              >
                <span>➕</span> Add Component
              </button>
            </div>

            {/* TAB CONTENT: LAYERS TREE */}
            {leftTab === 'layers' ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                {/* Workspace Role Filter Segmented Control */}
                <div className="pb-workspace-filter">
                  {['ALL', 'SCHOLAR', 'ADMIN', 'PUBLIC'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`pb-workspace-btn ${workspaceRole === role ? 'pb-workspace-btn--active' : ''}`}
                      onClick={() => setWorkspaceRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {/* Pages List */}
                <div style={{ maxHeight: '160px', overflowY: 'auto', borderBottom: '1px solid #e2e8f0', padding: '6px' }}>
                  {filteredPages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      className={`pb-page-item ${selectedPage === page.id ? 'pb-page-item--active' : ''}`}
                      onClick={() => setSelectedPage(page.id)}
                      style={{ padding: '6px 8px' }}
                    >
                      <span style={{ fontSize: '14px' }}>{page.icon}</span>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '11px', fontWeight: selectedPage === page.id ? 800 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Section Structure Hierarchy with Drag and Drop */}
                <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Canvas Sections ({currentSectionOrder.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', padding: '6px', gap: '3px' }}>
                  {currentSectionOrder.map((sectionKey, idx) => {
                    const meta = COMPONENT_METADATA[sectionKey] || { label: sectionKey, icon: '📦' };
                    const isSelected = activeSection === sectionKey;
                    const isVisible = draftConfig?.[sectionKey]?.isVisible !== false;

                    return (
                      <React.Fragment key={sectionKey}>
                        {dragOverSection === sectionKey && <div className="pb-drop-indicator" />}
                        <div
                          className={`pb-section-tree-item ${isSelected ? 'pb-section-tree-item--selected' : ''}`}
                          onClick={() => {
                            setActiveSection(sectionKey);
                            setIsRightCollapsed(false); // Open inspector
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, sectionKey)}
                          onDragOver={(e) => handleDragOver(e, sectionKey)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, sectionKey)}
                          style={{ opacity: isVisible ? 1 : 0.55 }}
                        >
                          <span className="pb-drag-handle" title="Drag to reorder">⋮⋮</span>
                          <span style={{ fontSize: '14px' }}>{meta.icon}</span>
                          <span style={{ flex: 1, fontSize: '11px', fontWeight: isSelected ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0f172a' }}>
                            {meta.label}
                          </span>

                          {/* Visibility Eye */}
                          <button
                            type="button"
                            className="pb-tree-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(sectionKey);
                            }}
                            title={isVisible ? 'Hide Section' : 'Show Section'}
                          >
                            {isVisible ? '👁️' : '🚫'}
                          </button>

                          {/* Up / Down Reorder */}
                          <div className="pb-tree-reorder-btns">
                            <button
                              type="button"
                              className="pb-tree-btn"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSection(sectionKey, 'up');
                              }}
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="pb-tree-btn"
                              disabled={idx === currentSectionOrder.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSection(sectionKey, 'down');
                              }}
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>

                          {/* Remove Section */}
                          <button
                            type="button"
                            className="pb-tree-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSection(sectionKey);
                            }}
                            title="Remove Section"
                            style={{ color: '#ef4444' }}
                          >
                            ×
                          </button>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TAB CONTENT: ADD COMPONENT LIBRARY */
              <div className="pb-add-components-panel">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Approved UI Components
                </span>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  Insert supported components into the active page layout.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {ADDABLE_COMPONENTS.map((comp) => {
                    const alreadyAdded = currentSectionOrder.includes(comp.key);
                    return (
                      <button
                        key={comp.key}
                        type="button"
                        className="pb-add-card"
                        onClick={() => handleAddComponent(comp)}
                      >
                        <span className="pb-add-card__icon">{comp.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '12px', color: '#0f172a' }}>{comp.name}</strong>
                            {alreadyAdded && <span style={{ fontSize: '10px', color: '#0f766e', fontWeight: 700 }}>In Page</span>}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{comp.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* =====================================================================
            PANEL 2: CENTER FULL-PAGE LIVE CANVAS
            ===================================================================== */}
        <main
          className="pb-canvas-panel"
          ref={canvasContainerRef}
          aria-label="Full-Page Visual Canvas"
        >
          {/* Zoom & Viewport Indicator Badge */}
          <div className="pb-canvas-zoom-pill">
            <span>{DEVICE_VIEWPORTS[device]?.icon} {DEVICE_VIEWPORTS[device]?.label}</span>
            <span>·</span>
            <span>{Math.round(currentScale * 100)}% {zoom === 'fit' ? '(Auto-Fit)' : ''}</span>
            <span>·</span>
            <span style={{ color: isEditMode ? '#10b981' : '#38bdf8' }}>
              {isEditMode ? 'Click any section to inspect & edit' : 'Live Interactive Preview'}
            </span>
          </div>

          {/* Centered Scaled Canvas Container */}
          <div
            style={{
              width: `${targetWidth * currentScale}px`,
              transition: 'width 0.2s ease',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              className="pb-canvas-viewport"
              style={{
                width: `${targetWidth}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease, width 0.2s ease'
              }}
            >
              {/* Browser Chrome Header */}
              <div className="pb-canvas-browser-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', background: '#0f172a', padding: '3px 10px', borderRadius: '4px' }}>
                    https://pjstudy.krmu.edu.in{currentPageMeta?.route || '/'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                    {targetWidth}px · {DEVICE_VIEWPORTS[device]?.label}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#0f766e', color: '#ffffff', fontWeight: 700 }}>
                    {currentPageMeta?.role || 'PJ STUDY'}
                  </span>
                </div>
              </div>

              {/* AUTHENTIC APPLICATION SHELL (SIDEBAR + TOP HEADER + INTERACTIVE CONTENT) */}
              <div className="pb-canvas-app-shell">
                {/* Genuine mini-sidebar for Admin / Scholar */}
                {renderCanvasSidebar(currentPageMeta?.role)}

                {/* Main Content Area */}
                <div className="pb-canvas-main">
                  {/* Genuine Top Bar Header */}
                  {renderCanvasHeader(currentPageMeta)}

                  {/* Flow of Interactive Sections */}
                  <div className="pb-canvas-body">
                    {currentSectionOrder.map((sectionKey) => {
                      const isSelected = isEditMode && activeSection === sectionKey;
                      const secConfig = draftConfig?.[sectionKey] || {};
                      const isVisible = secConfig.isVisible !== false;
                      const meta = COMPONENT_METADATA[sectionKey] || { label: sectionKey, icon: '📦' };

                      // In Preview Mode, do not show hidden sections
                      if (!isEditMode && !isVisible) return null;

                      return (
                        <div
                          key={sectionKey}
                          className={`pb-interactive-section ${
                            isSelected ? 'pb-interactive-section--selected' : ''
                          } ${!isVisible ? 'pb-interactive-section--hidden' : ''}`}
                          onClick={() => {
                            if (isEditMode) {
                              setActiveSection(sectionKey);
                              setIsRightCollapsed(false); // Auto-open inspector if closed!
                            }
                          }}
                          draggable={isEditMode}
                          onDragStart={(e) => handleDragStart(e, sectionKey)}
                          onDragOver={(e) => handleDragOver(e, sectionKey)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, sectionKey)}
                        >
                          {/* Floating Section Tag Pill (Edit Mode Only) */}
                          {isEditMode && (
                            <div className="pb-section-selection-tag">
                              <span>{meta.icon}</span>
                              <span>{meta.label}</span>
                              {!isVisible && <span style={{ opacity: 0.8 }}>(Hidden)</span>}
                              {isSelected && <span style={{ fontWeight: 800 }}>✓ ACTIVE</span>}
                            </div>
                          )}

                          {/* Render Actual Section UI */}
                          {renderRealCanvasSection(sectionKey, secConfig, selectedPage)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* =====================================================================
            PANEL 3: RIGHT PROPERTIES INSPECTOR
            ===================================================================== */}
        {isRightCollapsed ? (
          <div
            className="pb-collapsed-strip pb-collapsed-strip--right"
            onClick={() => setIsRightCollapsed(false)}
            title="Expand Right Inspector"
          >
            <button type="button" className="pb-toolbar-icon-btn">◀</button>
            <span className="pb-collapsed-strip__title">Properties</span>
          </div>
        ) : (
          <aside className="pb-inspector-panel" aria-label="Component Inspector">
            <div className="pb-inspector-panel__header">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {currentPageMeta?.role === 'ADMIN'
                    ? 'Admin Workspace Section'
                    : currentPageMeta?.role === 'PUBLIC'
                      ? 'Public Homepage Section'
                      : 'Scholar Workspace Section'}
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  {activeSectionMeta.icon} {activeSectionMeta.label}
                </h4>
              </div>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
                style={{ color: '#475569' }}
                onClick={() => setIsRightCollapsed(true)}
                title="Collapse Inspector"
              >
                ▶
              </button>
            </div>

            {/* Context-Sensitive Inspector Tabs */}
            <div className="pb-inspector-tabs">
              <button
                type="button"
                className={`pb-inspector-tab ${inspectorTab === 'content' ? 'pb-inspector-tab--active' : ''}`}
                onClick={() => setInspectorTab('content')}
              >
                Content
              </button>
              <button
                type="button"
                className={`pb-inspector-tab ${inspectorTab === 'appearance' ? 'pb-inspector-tab--active' : ''}`}
                onClick={() => setInspectorTab('appearance')}
              >
                Appearance
              </button>
              <button
                type="button"
                className={`pb-inspector-tab ${inspectorTab === 'layout' ? 'pb-inspector-tab--active' : ''}`}
                onClick={() => setInspectorTab('layout')}
              >
                Layout
              </button>
              <button
                type="button"
                className={`pb-inspector-tab ${inspectorTab === 'visibility' ? 'pb-inspector-tab--active' : ''}`}
                onClick={() => setInspectorTab('visibility')}
              >
                Visibility
              </button>
            </div>

            <div className="pb-inspector-panel__body">
              {/* TAB 1: CONTENT */}
              {inspectorTab === 'content' && (
                <>
                  {activeSectionConfig.title !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Section Heading / Title"
                        value={activeSectionConfig.title || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'title', e.target.value)}
                        placeholder="e.g. Curated Study Materials"
                      />
                    </div>
                  )}

                  {activeSectionConfig.subtitle !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Subtitle / Description"
                        value={activeSectionConfig.subtitle || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'subtitle', e.target.value)}
                        placeholder="e.g. Verified syllabus documents for KRMU students"
                      />
                    </div>
                  )}

                  {activeSectionConfig.headline !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Headline Text"
                        value={activeSectionConfig.headline || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'headline', e.target.value)}
                      />
                    </div>
                  )}

                  {activeSectionConfig.description !== undefined && (
                    <div className="pb-prop-group">
                      <label className="pb-prop-label">Description Text</label>
                      <textarea
                        className="admin-input"
                        rows="3"
                        style={{ width: '100%', resize: 'vertical' }}
                        value={activeSectionConfig.description || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'description', e.target.value)}
                      />
                    </div>
                  )}

                  {activeSectionConfig.text !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Notice / Banner Text"
                        value={activeSectionConfig.text || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'text', e.target.value)}
                      />
                    </div>
                  )}

                  {activeSectionConfig.buttonText !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Button Action Text"
                        value={activeSectionConfig.buttonText || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'buttonText', e.target.value)}
                      />
                    </div>
                  )}

                  {activeSectionConfig.buttonLink !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Safe Link Destination"
                        value={activeSectionConfig.buttonLink || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'buttonLink', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Banner Alert Sub-Object */}
                  {activeSectionConfig.bannerAlert !== undefined && (
                    <div className="pb-prop-group">
                      <span className="pb-prop-label">Institutional Banner Alert</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(activeSectionConfig.bannerAlert?.show)}
                          onChange={(e) =>
                            handleFieldChange(activeSection, 'bannerAlert', {
                              ...activeSectionConfig.bannerAlert,
                              show: e.target.checked
                            })
                          }
                        />
                        Display Notice Banner
                      </label>
                      {activeSectionConfig.bannerAlert?.show && (
                        <div style={{ marginTop: '8px' }}>
                          <Input
                            label="Alert Message"
                            value={activeSectionConfig.bannerAlert?.message || ''}
                            onChange={(e) =>
                              handleFieldChange(activeSection, 'bannerAlert', {
                                ...activeSectionConfig.bannerAlert,
                                message: e.target.value
                              })
                            }
                            placeholder="e.g. End-term examination revision materials are live"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campus Info Sub-Object */}
                  {activeSectionConfig.campusName !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="University / Institution Name"
                        value={activeSectionConfig.campusName || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'campusName', e.target.value)}
                      />
                    </div>
                  )}

                  {activeSectionConfig.schoolLabel !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="School / Department Name"
                        value={activeSectionConfig.schoolLabel || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'schoolLabel', e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: APPEARANCE */}
              {inspectorTab === 'appearance' && (
                <>
                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Style Preset</span>
                    <div className="pb-style-presets">
                      {[
                        { id: 'default', name: 'Clean White', desc: 'Standard card styling' },
                        { id: 'slate', name: 'Slate Gray', desc: 'Soft secondary surface' },
                        { id: 'teal-tint', name: 'KRMU Teal', desc: 'Subtle institutional tint' },
                        { id: 'amber-tint', name: 'Amber Notice', desc: 'High-visibility highlight' },
                        { id: 'dark-card', name: 'Midnight Dark', desc: 'Sleek contrast background' },
                        { id: 'bordered', name: 'Outline Border', desc: 'Crisp bordered card' }
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          className={`pb-style-preset-btn ${
                            (activeSectionConfig.appearance?.preset || 'default') === preset.id
                              ? 'pb-style-preset-btn--active'
                              : ''
                          }`}
                          onClick={() => handleAppearanceChange(activeSection, 'preset', preset.id)}
                        >
                          <span>{preset.name}</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Theme Accent Color</span>
                    <div className="pb-color-swatches">
                      {[
                        { color: '#0f766e', name: 'KRMU Emerald' },
                        { color: '#0369a1', name: 'Scholar Sky' },
                        { color: '#4338ca', name: 'Indigo Faculty' },
                        { color: '#d97706', name: 'Amber Warning' },
                        { color: '#be123c', name: 'Crimson Alert' },
                        { color: '#334155', name: 'Slate Neutral' }
                      ].map((swatch) => (
                        <button
                          key={swatch.color}
                          type="button"
                          className={`pb-color-swatch ${
                            activeSectionConfig.appearance?.accentColor === swatch.color ? 'pb-color-swatch--active' : ''
                          }`}
                          style={{ background: swatch.color }}
                          onClick={() => handleAppearanceChange(activeSection, 'accentColor', swatch.color)}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Border Radius</span>
                    <div className="pb-segmented-grid">
                      {['0px', '4px', '8px', '12px', '16px', '24px'].map((rad) => (
                        <button
                          key={rad}
                          type="button"
                          className={`pb-segmented-btn ${
                            (activeSectionConfig.appearance?.borderRadius || '8px') === rad ? 'pb-segmented-btn--active' : ''
                          }`}
                          onClick={() => handleAppearanceChange(activeSection, 'borderRadius', rad)}
                        >
                          {rad}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Text Alignment</span>
                    <div className="pb-segmented-grid">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          type="button"
                          className={`pb-segmented-btn ${
                            (activeSectionConfig.appearance?.align || 'left') === align ? 'pb-segmented-btn--active' : ''
                          }`}
                          onClick={() => handleAppearanceChange(activeSection, 'align', align)}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3: LAYOUT */}
              {inspectorTab === 'layout' && (
                <>
                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Section Position</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveSection(activeSection, 'up')}
                        disabled={currentSectionOrder.indexOf(activeSection) <= 0}
                      >
                        ▲ Move Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveSection(activeSection, 'down')}
                        disabled={currentSectionOrder.indexOf(activeSection) >= currentSectionOrder.length - 1}
                      >
                        ▼ Move Down
                      </Button>
                    </div>
                  </div>

                  {activeSectionConfig.columns !== undefined && (
                    <div className="pb-prop-group">
                      <span className="pb-prop-label">Grid Columns</span>
                      <div className="pb-segmented-grid">
                        {[1, 2, 3, 4].map((col) => (
                          <button
                            key={col}
                            type="button"
                            className={`pb-segmented-btn ${activeSectionConfig.columns === col ? 'pb-segmented-btn--active' : ''}`}
                            onClick={() => handleFieldChange(activeSection, 'columns', col)}
                          >
                            {col} Col
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Content Padding</span>
                    <div className="pb-segmented-grid">
                      {['compact', 'normal', 'spacious'].map((pad) => (
                        <button
                          key={pad}
                          type="button"
                          className={`pb-segmented-btn ${
                            (activeSectionConfig.appearance?.padding || 'normal') === pad ? 'pb-segmented-btn--active' : ''
                          }`}
                          onClick={() => handleAppearanceChange(activeSection, 'padding', pad)}
                        >
                          {pad.charAt(0).toUpperCase() + pad.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 4: VISIBILITY */}
              {inspectorTab === 'visibility' && (
                <>
                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Section Visibility</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={activeSectionConfig.isVisible !== false}
                        onChange={() => handleToggleVisibility(activeSection)}
                      />
                      Show this section on the live page
                    </label>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                      When hidden, this section is preserved in drafts but excluded from the scholar and visitor viewports.
                    </p>
                  </div>

                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Device Display Rules</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={activeSectionConfig.showOnDesktop !== false}
                        onChange={(e) => handleFieldChange(activeSection, 'showOnDesktop', e.target.checked)}
                      />
                      Display on Desktop & Laptops
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={activeSectionConfig.showOnMobile !== false}
                        onChange={(e) => handleFieldChange(activeSection, 'showOnMobile', e.target.checked)}
                      />
                      Display on Tablet & Mobile Devices
                    </label>
                  </div>

                  <div className="pb-prop-group">
                    <span className="pb-prop-label">Danger Zone</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveSection(activeSection)}
                    >
                      Remove Section from Page
                    </Button>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* =========================================================================
          PUBLISH LIVE MODAL
          ========================================================================= */}
      {showPublishModal && (
        <div className="pb-history-modal">
          <div className="pb-history-card" style={{ maxWidth: '480px' }}>
            <div className="pb-history-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Publish Changes Live
              </h3>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
                style={{ color: '#64748b' }}
                onClick={() => setShowPublishModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Publishing will immediately apply this section ordering, visibility, and properties to all live users visiting <strong>{pageData?.title || selectedPage}</strong>.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Release / Audit Change Summary (Optional)"
                  placeholder="e.g. Reordered recently published notes and updated term notice"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button variant="outline" size="md" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handlePublish} isLoading={isPublishing}>
                  Confirm & Publish Live
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VERSION HISTORY & ROLLBACK MODAL
          ========================================================================= */}
      {showHistoryModal && (
        <div className="pb-history-modal">
          <div className="pb-history-card">
            <div className="pb-history-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Version Audit History & Rollback
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {pageData?.title || selectedPage} · Audit Snapshots
                </span>
              </div>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
                style={{ color: '#64748b' }}
                onClick={() => setShowHistoryModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="pb-history-body">
              {versionHistoryList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  <p>No audit snapshots recorded yet for this page.</p>
                  <span style={{ fontSize: '12px' }}>Publishing new configurations creates safe rollback points automatically.</span>
                </div>
              ) : (
                <table className="pb-history-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Summary</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionHistoryList.map((ver) => (
                      <tr key={ver.id}>
                        <td>
                          <Badge variant="primary" size="sm">v{ver.version}</Badge>
                        </td>
                        <td>
                          <strong style={{ fontSize: '12px' }}>{ver.changeSummary || 'Configuration publication'}</strong>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '11px' }}>
                          {new Date(ver.createdAt).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollbackVersion(ver.id, ver.version)}
                          >
                            Restore This Version
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// AUTHENTIC MINI APP SHELL RENDERERS (SIDEBAR & HEADER)
// =============================================================================

function renderCanvasSidebar(role) {
  if (role === 'PUBLIC') return null;

  const isAdmin = role === 'ADMIN';

  return (
    <aside className="pb-canvas-sidebar" aria-hidden="true">
      {/* Brand Identity */}
      <div className="pb-canvas-sidebar-brand">
        <div className="pb-canvas-sidebar-logo">PJ</div>
        <div>
          <span className="pb-canvas-sidebar-title">PJ Study</span>
          <span className="pb-canvas-sidebar-sub">
            {isAdmin ? 'COMMAND CENTER' : 'SCHOLAR DESK'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="pb-canvas-sidebar-nav">
        <span className="pb-canvas-sidebar-heading">MAIN NAVIGATION</span>
        <div className="pb-canvas-sidebar-item pb-canvas-sidebar-item--active">
          <span>{isAdmin ? '⚡' : '📊'}</span>
          <span>{isAdmin ? 'Overview Dashboard' : 'Scholar Dashboard'}</span>
        </div>
        <div className="pb-canvas-sidebar-item">
          <span>{isAdmin ? '📤' : '🔍'}</span>
          <span>{isAdmin ? 'Direct Upload Note' : 'Explore Notes'}</span>
        </div>
        <div className="pb-canvas-sidebar-item">
          <span>{isAdmin ? '📑' : '✨'}</span>
          <span>{isAdmin ? 'Curriculum Inventory' : 'Recommended'}</span>
        </div>
        <div className="pb-canvas-sidebar-item">
          <span>{isAdmin ? '📢' : '📚'}</span>
          <span>{isAdmin ? 'Announcements' : 'My Study Library'}</span>
        </div>

        <span className="pb-canvas-sidebar-heading" style={{ marginTop: '12px' }}>GOVERNANCE & SYSTEM</span>
        <div className="pb-canvas-sidebar-item">
          <span>{isAdmin ? '🛡️' : '🔔'}</span>
          <span>{isAdmin ? 'Audit Compliance' : 'Notification Center'}</span>
        </div>
        <div className="pb-canvas-sidebar-item">
          <span>{isAdmin ? '⚙️' : '👤'}</span>
          <span>{isAdmin ? 'Platform Settings' : 'Scholar Profile'}</span>
        </div>
      </div>
    </aside>
  );
}

function renderCanvasHeader(pageMeta) {
  const isPublic = pageMeta?.role === 'PUBLIC';

  if (isPublic) {
    return (
      <header className="pb-canvas-top-header" style={{ padding: '0 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0f766e', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
            PJ
          </div>
          <strong style={{ fontSize: '14px', color: '#0f172a' }}>PJ Study</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>· K.R. Mangalam University</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>🏛️ Universities & Schools</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>📚 Explore Notes</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>💡 How It Works</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
              Sign In
            </span>
            <span style={{ padding: '5px 12px', borderRadius: '6px', background: '#0f766e', color: '#ffffff', fontSize: '11px', fontWeight: 700 }}>
              Get Started
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="pb-canvas-top-header">
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{ color: '#64748b' }}>PJ Study</span>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <strong style={{ color: '#0f172a' }}>{pageMeta?.label || 'Workspace'}</strong>
      </div>

      {/* Search Bar & User Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ padding: '5px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '180px' }}>
          <span>🔍</span>
          <span>Search notes, subjects, faculty...</span>
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative', cursor: 'pointer', fontSize: '15px' }}>
          <span>🔔</span>
          <span style={{ position: 'absolute', top: '-4px', right: '-6px', width: '14px', height: '14px', background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            3
          </span>
        </div>

        {/* User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0f766e', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pageMeta?.role === 'ADMIN' ? 'SA' : 'SK'}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
            {pageMeta?.role === 'ADMIN' ? 'Super Admin' : 'Scholar Student'}
          </span>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// REAL PAGE CANVAS VISUAL SECTION RENDERER
// =============================================================================

function renderRealCanvasSection(sectionKey, config, _selectedPage) {
  const align = config.appearance?.align || 'left';
  const preset = config.appearance?.preset || 'default';
  const borderRadius = config.appearance?.borderRadius || '8px';

  let bgStyle = '#ffffff';
  let borderStyle = '1px solid #e2e8f0';
  let textColor = '#0f172a';

  if (preset === 'slate') {
    bgStyle = '#f8fafc';
    borderStyle = '1px solid #e2e8f0';
  } else if (preset === 'teal-tint') {
    bgStyle = 'rgba(15, 118, 110, 0.04)';
    borderStyle = '1px solid rgba(15, 118, 110, 0.2)';
  } else if (preset === 'amber-tint') {
    bgStyle = 'rgba(245, 158, 11, 0.05)';
    borderStyle = '1px solid rgba(245, 158, 11, 0.25)';
  } else if (preset === 'dark-card') {
    bgStyle = '#0f172a';
    borderStyle = '1px solid #1e293b';
    textColor = '#f8fafc';
  } else if (preset === 'bordered') {
    bgStyle = '#ffffff';
    borderStyle = '2px solid #cbd5e1';
  }

  const containerStyle = {
    background: bgStyle,
    border: borderStyle,
    borderRadius,
    padding: '16px 20px',
    textAlign: align,
    color: textColor,
    transition: 'all 0.15s ease'
  };

  switch (sectionKey) {
    case 'welcome_header':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
                {config.title || 'Welcome back to PJ Study'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: preset === 'dark-card' ? '#94a3b8' : '#64748b' }}>
                {config.subtitle || 'Your K.R. Mangalam University academic manuscript library.'}
              </p>
            </div>
            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', fontWeight: 700 }}>
              Active Term 2026
            </span>
          </div>
          {config.bannerAlert?.show && (
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px' }}>📢</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
                {config.bannerAlert.message || 'Semester examination revision notes and past paper solutions are live.'}
              </span>
            </div>
          )}
        </div>
      );

    case 'academic_info':
      return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🏛️</span>
            <div>
              <strong style={{ fontSize: '14px', color: textColor }}>
                {config.campusName || 'K.R. Mangalam University'}
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: preset === 'dark-card' ? '#94a3b8' : '#64748b' }}>
                {config.schoolLabel || 'School of Engineering & Technology'} · Semester 4
              </p>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e', background: '#f0fdf4', padding: '4px 12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            Enrolled Scholar
          </span>
        </div>
      );

    case 'stats_kpi': {
      const cols = config.columns || 4;
      const cards = config.cards || [
        { label: 'Published Notes', value: '142', icon: '📚', trend: '+12% this month' },
        { label: 'Catalog Reads', value: '1,280', icon: '👁️', trend: '+24% this week' },
        { label: 'Active Scholars', value: '350', icon: '🎓', trend: '+8% this term' },
        { label: 'Downloads Facilitated', value: '890', icon: '📥', trend: '+18% this month' }
      ];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px' }}>
          {cards.map((c, i) => (
            <div key={i} className="pb-metric-card" style={{ borderRadius }}>
              <div className="pb-metric-card__header">
                <span className="pb-metric-card__icon">{c.icon || '📈'}</span>
                <span className="pb-metric-card__trend">{c.trend || '+14%'}</span>
              </div>
              <span className="pb-metric-card__val">{c.value || '128'}</span>
              <span className="pb-metric-card__lbl">{c.label || 'Metric'}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'quick_shortcuts':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '14px', color: textColor }}>{config.title || 'Direct Publishing & Management Shortcuts'}</strong>
            <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: 700 }}>Direct Publishing Enabled</span>
          </div>
          <div className="pb-shortcuts-grid">
            <div className="pb-shortcut-item">
              <span className="pb-shortcut-icon">📤</span>
              <div>
                <span className="pb-shortcut-title">Direct Upload Note</span>
                <span className="pb-shortcut-sub">Instant live publishing</span>
              </div>
            </div>
            <div className="pb-shortcut-item">
              <span className="pb-shortcut-icon">📑</span>
              <div>
                <span className="pb-shortcut-title">Curriculum Inventory</span>
                <span className="pb-shortcut-sub">Manage 142 notes</span>
              </div>
            </div>
            <div className="pb-shortcut-item">
              <span className="pb-shortcut-icon">📉</span>
              <div>
                <span className="pb-shortcut-title">Readership Analytics</span>
                <span className="pb-shortcut-sub">Daily engagement metrics</span>
              </div>
            </div>
            <div className="pb-shortcut-item">
              <span className="pb-shortcut-icon">📢</span>
              <div>
                <span className="pb-shortcut-title">Campus Notices</span>
                <span className="pb-shortcut-sub">KRMU student alerts</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'recent_notes':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: textColor }}>{config.title || 'Recently Uploaded Notes'}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                {config.subtitle || 'Latest academic materials published to the student catalog'}
              </p>
            </div>
            <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: 700 }}>View Complete Inventory (142) →</span>
          </div>
          <table className="pb-canvas-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Course & Semester</th>
                <th>Subject Code</th>
                <th>Author</th>
                <th>Status</th>
                <th>Format & Size</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: 'Operating Systems — Deadlock Prevention & Bank Algorithm', course: 'B.Tech CSE · Sem 4', code: 'CSE204', author: 'Prof. Sharma', status: 'Published', fmt: 'PDF · 3.4 MB' },
                { title: 'Database Management Systems — Normalization (1NF to BCNF)', course: 'B.Tech CSE · Sem 4', code: 'CSE206', author: 'Dr. Verma', status: 'Published', fmt: 'PDF · 2.1 MB' },
                { title: 'Compiler Design — Syntax Directed Translation & LR Parsing', course: 'B.Tech CSE · Sem 6', code: 'CSE302', author: 'Prof. Kapoor', status: 'Published', fmt: 'PDF · 4.8 MB' },
                { title: 'Discrete Mathematics — Graph Theory & Shortest Path Trees', course: 'B.Tech CSE · Sem 3', code: 'MAT201', author: 'Dr. Mukherjee', status: 'Published', fmt: 'PDF · 1.9 MB' }
              ].map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.title}</td>
                  <td style={{ color: '#475569' }}>{row.course}</td>
                  <td>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', fontSize: '10px', fontWeight: 700 }}>
                      {row.code}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{row.author}</td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', fontSize: '10px', fontWeight: 800 }}>
                      ● {row.status}
                    </span>
                  </td>
                  <td style={{ color: '#0f766e', fontWeight: 600 }}>{row.fmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'activity_chart':
    case 'analytics_summary':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: textColor }}>{config.title || 'Weekly Study & Readership Velocity'}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Daily manuscript downloads and page reads over the last 7 days</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 700 }}>7 Days</span>
              <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#94a3b8' }}>30 Days</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '110px', padding: '0 12px' }}>
            {[
              { day: 'Mon', val: 45, reads: '140 reads' },
              { day: 'Tue', val: 68, reads: '210 reads' },
              { day: 'Wed', val: 52, reads: '165 reads' },
              { day: 'Thu', val: 88, reads: '290 reads' },
              { day: 'Fri', val: 96, reads: '320 reads' },
              { day: 'Sat', val: 72, reads: '240 reads' },
              { day: 'Sun', val: 64, reads: '200 reads' }
            ].map((bar, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#0f766e' }}>{bar.val}%</span>
                <div style={{ width: '100%', height: `${bar.val}%`, background: 'linear-gradient(180deg, #0f766e, #14b8a6)', borderRadius: '6px' }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'announcements':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '14px', color: textColor }}>{config.title || 'Institutional Announcements'}</strong>
            <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: 700 }}>Create Notice +</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { tag: 'EXAM', title: 'End-Term Examination Schedule & Revision Guides Uploaded', date: 'Today · 10:30 AM', color: '#ef4444' },
              { tag: 'CURRICULUM', title: 'New Lab Manuals for Artificial Intelligence & Machine Learning Live', date: 'Yesterday · 4:15 PM', color: '#0f766e' }
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: `${item.color}15`, color: item.color }}>
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.title}</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'reports_feed':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '14px', color: textColor }}>{config.title || 'Quality & Compliance Reports'}</strong>
            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', fontWeight: 700 }}>
              ✓ 100% Compliant
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            All manuscripts comply with K.R. Mangalam academic honor codes. 0 flagged copyright or syllabus violations.
          </p>
        </div>
      );

    case 'hero':
      return (
        <div style={{ ...containerStyle, textAlign: 'center', padding: '42px 24px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#f0fdf4', padding: '4px 12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            {config.eyebrow || 'K.R. MANGALAM UNIVERSITY ACADEMIC PORTAL'}
          </span>
          <h1 style={{ margin: '14px 0 10px', fontSize: '30px', fontWeight: 900, color: textColor, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {config.headline || config.title || 'Study Smarter with Verified Faculty Lecture Notes'}
          </h1>
          <p style={{ margin: '0 auto 22px', fontSize: '14px', color: preset === 'dark-card' ? '#94a3b8' : '#64748b', maxWidth: '560px', lineHeight: 1.5 }}>
            {config.description || config.subtitle || 'Syllabus-aligned lecture manuscripts, revision manuals, and past exam solutions for KRMU students.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <span style={{ padding: '10px 20px', background: '#0f766e', color: '#ffffff', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>
              {config.primaryCtaText || 'Explore Notes Catalog'}
            </span>
            <span style={{ padding: '10px 20px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>
              Direct Upload Note
            </span>
          </div>
        </div>
      );

    case 'features':
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <strong style={{ fontSize: '16px', color: textColor }}>{config.title || 'Built for Academic Excellence'}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              {config.subtitle || 'Everything K.R. Mangalam students need for exam preparation and coursework'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.columns || 3}, 1fr)`, gap: '14px' }}>
            {[
              { icon: '🎯', title: 'Curriculum-Mapped Notes', desc: 'Lecture manuscripts organized strictly by university school, degree program, and semester syllabus.' },
              { icon: '⚡', title: 'Direct Faculty Publishing', desc: 'Instant live publishing with automatic validation and zero approval bottlenecks.' },
              { icon: '📁', title: 'Personal Study Desk', desc: 'Private bookmarking, organized collections, reading history, and direct PDF downloads.' }
            ].map((f, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '24px' }}>{f.icon}</span>
                <p style={{ margin: '8px 0 4px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{f.title}</p>
                <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, display: 'block' }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'how_it_works':
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <strong style={{ fontSize: '15px', color: textColor }}>{config.title || 'How PJ Study Powers Your Learning'}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              {config.subtitle || 'From initial enrollment to final exam mastery in three streamlined steps.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { step: '1', title: 'Select School & Course', desc: 'Navigate directly to your KRMU faculty and active semester subjects.' },
              { step: '2', title: 'Access Peer-Reviewed Notes', desc: 'Read detailed lecture slides, past question solutions, and concise cheat sheets.' },
              { step: '3', title: 'Build Your Personal Library', desc: 'Bookmark key chapters, track downloads, and review materials before exam deadlines.' }
            ].map((s, idx) => (
              <div key={idx} style={{ padding: '14px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', position: 'relative' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0f766e', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  {s.step}
                </span>
                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{s.title}</p>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'academic_highlights':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: textColor }}>{config.title || 'Official KRMU Campus Taxonomy'}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                {config.subtitle || 'Dedicated curriculum architecture and course catalog for K.R. Mangalam University.'}
              </p>
            </div>
            <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: 700 }}>6 Academic Schools</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              'School of Engineering & Technology (SOET)',
              'School of Management & Commerce (SOMC)',
              'School of Medical & Allied Sciences (SMAS)',
              'School of Legal Studies (SOLS)',
              'School of Basic & Applied Sciences (SBAS)',
              'School of Journalism & Mass Comm (SJMC)'
            ].map((sch, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                🏛️ {sch}
              </div>
            ))}
          </div>
        </div>
      );

    case 'trust_cta':
      return (
        <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #0f766e, #134e4a)', color: '#ffffff', textAlign: 'center', padding: '32px 24px', border: 'none' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
            {config.headline || 'Ready to Elevate Your Academic Journey?'}
          </h3>
          <p style={{ margin: '0 auto 16px', fontSize: '13px', color: '#ccfbf1', maxWidth: '480px' }}>
            {config.description || 'Join thousands of university scholars discovering course-mapped lecture notes and study collections.'}
          </p>
          <span style={{ display: 'inline-block', padding: '8px 20px', background: '#ffffff', color: '#0f766e', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>
            {config.buttonText || 'Get Started Free'}
          </span>
        </div>
      );

    case 'footer':
      return (
        <footer style={{ ...containerStyle, background: '#0f172a', color: '#94a3b8', padding: '24px', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <strong style={{ color: '#ffffff', fontSize: '13px' }}>{config.brandText || 'PJ Study Academic Library'}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                {config.copyright || '© 2026 PJ Study. Dedicated to K.R. Mangalam University Scholars.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#cbd5e1' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Faculty Portal</span>
              <span>KRMU Direct</span>
            </div>
          </div>
        </footer>
      );

    case 'search_filters':
    case 'inventory_filters':
      return (
        <div style={{ ...containerStyle, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px', color: '#94a3b8' }}>
            🔍 Search by course, subject code, or keyword...
          </div>
          <span style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            School: All Schools ▼
          </span>
          <span style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            Semester: All Semesters ▼
          </span>
        </div>
      );

    case 'notes_catalog':
    case 'inventory_table':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong style={{ fontSize: '13px', color: textColor }}>Curriculum Manuscripts</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Displaying 12 of 142 items</span>
          </div>
          <table className="pb-canvas-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>School & Course</th>
                <th>Semester</th>
                <th>Format</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: 'Computer Networks — Transport Layer Protocols', course: 'B.Tech CSE', sem: 'Sem 5', fmt: 'PDF (3.2 MB)' },
                { title: 'Data Structures — AVL & Red-Black Trees', course: 'B.Tech CSE', sem: 'Sem 3', fmt: 'PDF (2.1 MB)' },
                { title: 'Discrete Mathematics — Graph Theory', course: 'B.Tech CSE', sem: 'Sem 3', fmt: 'PDF (1.8 MB)' }
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.title}</td>
                  <td style={{ color: '#475569' }}>{row.course}</td>
                  <td style={{ color: '#475569' }}>{row.sem}</td>
                  <td style={{ color: '#0f766e', fontWeight: 600 }}>{row.fmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'file_uploader':
      return (
        <div style={{ ...containerStyle, border: '2px dashed #cbd5e1', textAlign: 'center', padding: '28px 16px' }}>
          <span style={{ fontSize: '36px' }}>📄</span>
          <p style={{ margin: '8px 0 2px', fontSize: '14px', fontWeight: 700, color: textColor }}>
            Upload Lecture Notes & Curriculum Manuscripts
          </p>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Supported formats: {config.allowedTypes || 'PDF, JPG, PNG'} (Max {config.maxMb || 25} MB) · Direct Publishing
          </span>
        </div>
      );

    case 'announcement_banner':
      return (
        <div style={{ ...containerStyle, background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>📣</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#065f46' }}>
              {config.text || 'Important notice for all students.'}
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
            {config.linkText || 'Learn More'} →
          </span>
        </div>
      );

    default:
      return (
        <div style={containerStyle}>
          <strong style={{ fontSize: '13px', color: textColor }}>{config.title || sectionKey}</strong>
          {config.subtitle && (
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: preset === 'dark-card' ? '#94a3b8' : '#64748b' }}>
              {config.subtitle}
            </p>
          )}
        </div>
      );
  }
}

export default VisualBuilderTab;
