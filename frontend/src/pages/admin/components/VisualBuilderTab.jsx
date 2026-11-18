import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { platformConfigService } from '../../../services/platformConfigService.js';
import Button from '../../../components/common/Button.jsx';
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
  // Scholar Dashboard
  welcome_header: { label: 'Welcome & Institutional Announcement', icon: '👋', category: 'Scholar' },
  quick_search: { label: 'Smart Notes Search Bar', icon: '🔍', category: 'Scholar' },
  academic_info: { label: 'KRMU Academic Enrollment Badge', icon: '🏛️', category: 'Scholar' },
  stats_kpi: { label: 'KPI Metric Progress Cards', icon: '📈', category: 'General' },
  activity_chart: { label: 'Weekly Study Trends Chart', icon: '📊', category: 'Scholar' },
  recent_notes: { label: 'Recently Published Manuscripts', icon: '📖', category: 'General' },
  recommendations: { label: 'Curated Faculty Recommendations', icon: '⭐', category: 'Scholar' },
  bottom_split: { label: 'Library & Campus Announcements Split', icon: '📑', category: 'Scholar' },
  library_preview: { label: 'My Library Preview', icon: '🔖', category: 'Scholar' },
  downloads: { label: 'Study Downloads & History', icon: '📥', category: 'Scholar' },
  collections: { label: 'Study Binders & Collections', icon: '📁', category: 'Scholar' },
  quick_actions: { label: 'Quick Action Shortcuts', icon: '⚡', category: 'Scholar' },

  // Admin Dashboard / Command Center
  quick_shortcuts: { label: 'Direct Publishing & Management Shortcuts', icon: '⚡', category: 'Admin' },
  analytics_summary: { label: 'Readership Analytics Card', icon: '📉', category: 'Admin' },
  announcements: { label: 'Platform Announcements Feed', icon: '📢', category: 'Admin' },
  reports_feed: { label: 'Content Reports & Quality Queue', icon: '🚩', category: 'Admin' },

  // Scholar Explore Notes
  explore_header: { label: 'Catalog Header & Search Summary', icon: '🔍', category: 'Scholar' },
  search_filters: { label: 'Curriculum Multi-Select Filters', icon: '🏷️', category: 'General' },
  notes_catalog: { label: 'Curriculum Manuscripts Catalog', icon: '📚', category: 'General' },

  // Scholar Recommendations
  rec_header: { label: 'Recommendation Header', icon: '🎯', category: 'Scholar' },
  rec_grid: { label: 'Curated Manuscript Cards Grid', icon: '✨', category: 'Scholar' },

  // Scholar Library
  library_header: { label: 'Library Header & Storage Stats', icon: '🔖', category: 'Scholar' },
  saved_tabs: { label: 'Saved Tabs & Filter Pills', icon: '📑', category: 'Scholar' },
  collections_grid: { label: 'Personal Binder Bins', icon: '🗂️', category: 'Scholar' },

  // Scholar Profile
  profile_header: { label: 'Profile Summary Header', icon: '👤', category: 'Scholar' },
  academic_card: { label: 'K.R. Mangalam University Credentials', icon: '🎓', category: 'Scholar' },
  security_settings: { label: 'Password & RBAC Security Preferences', icon: '🔒', category: 'General' },

  // Scholar Notifications
  notifications_header: { label: 'Notification Center Header', icon: '🔔', category: 'General' },
  notifications_feed: { label: 'Live Notifications Stream', icon: '📩', category: 'General' },

  // Admin Upload Note
  upload_header: { label: 'Direct Publishing Header', icon: '📤', category: 'Admin' },
  file_uploader: { label: 'PDF Document Drag & Drop Vault', icon: '📁', category: 'Admin' },
  metadata_form: { label: 'Course & Curriculum Metadata Form', icon: '📝', category: 'Admin' },

  // Admin Curriculum Inventory
  notes_header: { label: 'Inventory Header & Storage KPI', icon: '📑', category: 'Admin' },
  inventory_filters: { label: 'Curriculum Inventory Filters', icon: '🔎', category: 'Admin' },
  inventory_table: { label: 'Complete Notes Inventory Table', icon: '📋', category: 'Admin' },

  // Public Homepage
  announcement_banner: { label: 'Top Notification Ticker', icon: '📣', category: 'Public' },
  hero: { label: 'Hero Banner & Call to Action', icon: '🌟', category: 'Public' },
  features: { label: 'Platform Capabilities Bento Grid', icon: '💡', category: 'Public' },
  how_it_works: { label: 'Three-Step Curriculum Roadmap', icon: '🔄', category: 'Public' },
  academic_highlights: { label: 'K.R. Mangalam Academic Programs', icon: '🏛️', category: 'Public' },
  trust_cta: { label: 'Institutional Trust CTA', icon: '🛡️', category: 'Public' },
  footer: { label: 'Institutional Academic Footer', icon: '📄', category: 'Public' }
};

// Approved Addable Components Catalog
const ADDABLE_COMPONENTS = [
  { key: 'announcement_banner', name: 'Announcement Banner', icon: '📣', desc: 'Top alert ribbon for campus notices & exam dates', defaultProps: { text: 'Semester examination revision notes are live.', linkText: 'View Notes', linkUrl: '/notes/explore', isVisible: true } },
  { key: 'hero', name: 'Hero Section', icon: '🌟', desc: 'Full-width banner with title, description & CTA actions', defaultProps: { headline: 'Study Smarter with KRMU Notes', description: 'Curriculum-aligned lecture notes and exam guides.', eyebrow: 'Official Academic Portal', primaryCtaText: 'Explore Notes', primaryCtaLink: '/notes/explore', isVisible: true } },
  { key: 'stats_kpi', name: 'Quick Statistics KPI', icon: '📈', desc: 'Metric counters for published notes, reads & downloads', defaultProps: { columns: 4, cards: [{ id: 'published', label: 'Published Notes', show: true }, { id: 'reads', label: 'Catalog Reads', show: true }], isVisible: true } },
  { key: 'academic_info', name: 'Academic Identity Banner', icon: '🏛️', desc: 'Displays enrolled university school, degree & semester', defaultProps: { campusName: 'K.R. Mangalam University', schoolLabel: 'School of Computer Science & Engineering', isVisible: true } },
  { key: 'recent_notes', name: 'Recent Notes Grid', icon: '📖', desc: 'Showcase of recently uploaded and published study materials', defaultProps: { title: 'Recently Published Notes', subtitle: 'Latest study notes uploaded by faculty', isVisible: true } },
  { key: 'recommendations', name: 'Personalized Recommendations', icon: '⭐', desc: 'Hand-picked manuscripts matched to student enrolled courses', defaultProps: { title: 'Recommended For You', subtitle: 'Curated based on your active semester', maxItems: 6, isVisible: true } },
  { key: 'features', name: 'Platform Capabilities Grid', icon: '💡', desc: 'Feature highlights and benefits cards with icons', defaultProps: { title: 'Why PJ Study?', subtitle: 'Organized course notes and exam revision materials', columns: 3, isVisible: true } },
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
  const [zoom, setZoom] = useState('100'); // '100' (default 1:1) | 'fit' | 75 | 50
  const [isEditMode, setIsEditMode] = useState(true); // true = Edit Mode, false = Preview Mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [showBrowserFrame, setShowBrowserFrame] = useState(true);

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
    if (!canvasContainerWidth) return 1;
    const availableWidth = Math.max(280, canvasContainerWidth - 48);
    const computed = availableWidth / targetWidth;
    return Math.min(1, Math.max(0.3, Math.round(computed * 100) / 100));
  }, [canvasContainerWidth, targetWidth]);

  const currentScale = zoom === 'fit' ? fitScale : Number(zoom) / 100;

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

  // Filter supported pages based on active role tab
  const filteredPages = useMemo(() => {
    if (workspaceRole === 'ALL') return SUPPORTED_PAGES;
    return SUPPORTED_PAGES.filter((p) => p.role === workspaceRole);
  }, [workspaceRole]);

  // Current page metadata
  const currentPageMeta = useMemo(() => {
    return SUPPORTED_PAGES.find((p) => p.id === selectedPage) || SUPPORTED_PAGES[0];
  }, [selectedPage]);

  // Active section order in the canvas
  const currentSectionOrder = useMemo(() => {
    if (!draftConfig) return [];
    if (Array.isArray(draftConfig.section_order) && draftConfig.section_order.length > 0) {
      return draftConfig.section_order;
    }
    // Fallback: exclude non-section system keys
    const systemKeys = new Set(['version', 'lastUpdated', 'updatedBy', 'title', 'themePreset', 'section_order', 'customCSS', 'headCode', 'footerCode', 'layout']);
    return Object.keys(draftConfig).filter((k) => !systemKeys.has(k));
  }, [draftConfig]);

  // Auto-select first section when section order updates or page changes
  useEffect(() => {
    if (currentSectionOrder.length > 0 && (!activeSection || !currentSectionOrder.includes(activeSection))) {
      setActiveSection(currentSectionOrder[0]);
    }
  }, [currentSectionOrder, activeSection]);

  // Drag and Drop handlers for section reordering
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

  // Move section up or down in order
  const handleMoveSection = (sectionKey, direction) => {
    if (!draftConfig) return;
    const order = [...currentSectionOrder];
    const idx = order.indexOf(sectionKey);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;

    const [moved] = order.splice(idx, 1);
    order.splice(targetIdx, 0, moved);

    pushHistory({
      ...draftConfig,
      section_order: order
    });
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

  // Toggle Focus Mode (maximize canvas)
  const toggleFocusMode = () => {
    if (isLeftCollapsed && isRightCollapsed) {
      setIsLeftCollapsed(false);
      setIsRightCollapsed(false);
    } else {
      setIsLeftCollapsed(true);
      setIsRightCollapsed(true);
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

  const isNaturalDesktopScale = device === 'desktop' && (zoom === 100 || zoom === '100');

  return (
    <div className={`pb-studio-root ${isFullscreen ? 'pb-studio-root--fullscreen' : ''}`}>
      {/* =========================================================================
          TOP COMMAND TOOLBAR
          ========================================================================= */}
      <div className="pb-studio-toolbar">
        {/* Left: Exit to Admin, Page Title, Workspace & Unsaved Indicator */}
        <div className="pb-studio-toolbar__left">
          <Link
            to="/admin"
            className="pb-toolbar-back-btn"
            title="Return to Super Admin Dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '4px',
              background: 'var(--color-bg-primary, #F5F4F0)',
              border: '1px solid var(--color-border, #D7D9D3)',
              color: 'var(--color-text-primary, #202620)',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>←</span>
            <span>Exit to Admin</span>
          </Link>

          <div style={{ width: '1px', height: '18px', background: 'var(--color-border, #D7D9D3)', margin: '0 2px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>🎨</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary, #202620)', letterSpacing: '-0.01em' }}>
              Studio 3.0
            </span>
          </div>

          <select
            className="admin-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{
              fontWeight: 700,
              fontSize: '12px',
              minWidth: '200px',
              background: '#FFFFFF',
              color: 'var(--color-text-primary, #202620)',
              borderColor: 'var(--color-border, #D7D9D3)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
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
            {['100', 'fit', 75, 50].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`pb-zoom-btn ${String(zoom) === String(lvl) ? 'pb-zoom-btn--active' : ''}`}
                onClick={() => setZoom(lvl)}
              >
                {lvl === 'fit' ? 'Fit' : `${lvl}%`}
              </button>
            ))}
          </div>

          {/* Focus Mode & Chrome Frame Toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`pb-panel-toggle-btn ${isLeftCollapsed && isRightCollapsed ? 'pb-panel-toggle-btn--active' : ''}`}
              onClick={toggleFocusMode}
              title={isLeftCollapsed && isRightCollapsed ? 'Restore Side Panels' : 'Focus Mode: Maximize Canvas View'}
            >
              <span>⛶</span> {isLeftCollapsed && isRightCollapsed ? 'Exit Focus' : 'Full Canvas'}
            </button>
            <button
              type="button"
              className={`pb-panel-toggle-btn ${showBrowserFrame ? 'pb-panel-toggle-btn--active' : ''}`}
              onClick={() => setShowBrowserFrame((prev) => !prev)}
              title="Toggle Browser Mockup Chrome Header"
            >
              <span>🌐</span> Frame
            </button>
          </div>

          {/* Quick Panel Collapse/Expand Toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`pb-panel-toggle-btn ${!isLeftCollapsed ? 'pb-panel-toggle-btn--active' : ''}`}
              onClick={() => setIsLeftCollapsed((prev) => !prev)}
              title={isLeftCollapsed ? 'Show Layers Panel' : 'Hide Layers Panel'}
            >
              <span>📑</span> Layers
            </button>
            <button
              type="button"
              className={`pb-panel-toggle-btn ${!isRightCollapsed ? 'pb-panel-toggle-btn--active' : ''}`}
              onClick={() => setIsRightCollapsed((prev) => !prev)}
              title={isRightCollapsed ? 'Show Inspector Panel' : 'Hide Inspector Panel'}
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
            {isFullscreen ? '✕ Exit' : 'Fullscreen'}
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
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary, #202620)' }}>Layers & Structure</span>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>Full page hierarchy</p>
              </div>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
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
                <div style={{ maxHeight: '160px', overflowY: 'auto', borderBottom: '1px solid var(--color-border, #D7D9D3)', padding: '6px' }}>
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
                <div style={{ padding: '8px 12px', background: 'var(--color-bg-primary, #F5F4F0)', borderBottom: '1px solid var(--color-border, #D7D9D3)', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary, #626A62)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                          <span style={{ flex: 1, fontSize: '11px', fontWeight: isSelected ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-primary, #202620)' }}>
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
                              title="Move section up"
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
                              title="Move section down"
                            >
                              ▼
                            </button>
                          </div>

                          {/* Delete Action */}
                          <button
                            type="button"
                            className="pb-tree-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSection(sectionKey);
                            }}
                            title="Remove section from page"
                          >
                            ✕
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
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary, #626A62)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Approved UI Components ({ADDABLE_COMPONENTS.length})
                </span>
                {ADDABLE_COMPONENTS.map((comp) => {
                  const isAlreadyAdded = currentSectionOrder.includes(comp.key);
                  return (
                    <div
                      key={comp.key}
                      className="pb-add-card"
                      onClick={() => handleAddComponent(comp)}
                    >
                      <span className="pb-add-card__icon">{comp.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <strong style={{ fontSize: '12px', color: 'var(--color-text-primary, #202620)' }}>{comp.name}</strong>
                          {isAlreadyAdded && (
                            <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontWeight: 700 }}>
                              Active
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                          {comp.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        {/* =====================================================================
            PANEL 2: CENTER FULL-PAGE REAL CANVAS
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
            <span>{isNaturalDesktopScale ? '100% (Natural Scale)' : `${Math.round(currentScale * 100)}%`} {zoom === 'fit' ? '(Auto-Fit)' : ''}</span>
            <span>·</span>
            <span style={{ color: isEditMode ? 'var(--color-primary, #245C46)' : '#2563EB', fontWeight: 600 }}>
              {isEditMode ? 'Click any section to inspect & edit' : 'Live Interactive Preview'}
            </span>
          </div>

          {/* Centered Scaled Canvas Container */}
          <div
            style={{
              width: isNaturalDesktopScale
                ? '100%'
                : `${targetWidth * currentScale}px`,
              maxWidth: isNaturalDesktopScale ? '1200px' : undefined,
              transition: 'width 0.15s ease',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              className="pb-canvas-viewport"
              style={{
                width: isNaturalDesktopScale
                  ? '100%'
                  : `${targetWidth}px`,
                transform: isNaturalDesktopScale
                  ? 'none'
                  : `scale(${currentScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease, width 0.15s ease'
              }}
            >
              {/* Browser Chrome Header (Optional toggleable) */}
              {showBrowserFrame && (
                <div className="pb-canvas-browser-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary, #626A62)', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', padding: '2px 10px', borderRadius: '4px' }}>
                      https://pjstudy.krmu.edu.in{currentPageMeta?.route || '/'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)', fontWeight: 600 }}>
                      {device === 'desktop' ? 'Full Width' : `${targetWidth}px`} · {DEVICE_VIEWPORTS[device]?.label}
                    </span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--color-primary, #245C46)', color: '#ffffff', fontWeight: 700 }}>
                      {currentPageMeta?.role || 'PJ STUDY'}
                    </span>
                  </div>
                </div>
              )}

              {/* AUTHENTIC APPLICATION SHELL (INTERACTIVE CONTENT) */}
              <div className="pb-canvas-app-shell" style={{ width: '100%', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Main Content Area */}
                <div className="pb-canvas-main" style={{ width: '100%', background: '#FFFFFF' }}>
                  {/* Genuine Top Bar Header */}
                  {renderCanvasHeader(currentPageMeta)}

                  {/* Flow of Interactive Sections */}
                  <div className="pb-canvas-body" style={{ width: '100%', boxSizing: 'border-box' }}>
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
                              setIsRightCollapsed(false); // Auto-open inspector if closed
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
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary, #245C46)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {currentPageMeta?.role === 'ADMIN'
                    ? 'Admin Workspace Section'
                    : currentPageMeta?.role === 'PUBLIC'
                      ? 'Public Homepage Section'
                      : 'Scholar Workspace Section'}
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary, #202620)' }}>
                  {activeSectionMeta.icon} {activeSectionMeta.label}
                </h4>
              </div>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
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
                  {/* Title / Heading Input */}
                  <div className="pb-prop-group">
                    <Input
                      label="Section Heading / Title"
                      value={activeSectionConfig.title || activeSectionConfig.headline || ''}
                      onChange={(e) => handleFieldChange(activeSection, activeSectionConfig.headline !== undefined ? 'headline' : 'title', e.target.value)}
                      placeholder="e.g. Curated Study Materials"
                    />
                  </div>

                  {/* Subtitle / Description Input */}
                  <div className="pb-prop-group">
                    <label className="pb-prop-label">Subtitle / Description</label>
                    <textarea
                      className="admin-input"
                      rows="2"
                      style={{ width: '100%', resize: 'vertical', fontSize: '12px' }}
                      value={activeSectionConfig.subtitle || activeSectionConfig.description || ''}
                      onChange={(e) => handleFieldChange(activeSection, activeSectionConfig.description !== undefined ? 'description' : 'subtitle', e.target.value)}
                      placeholder="e.g. Verified syllabus documents for KRMU students"
                    />
                  </div>

                  {/* Eyebrow (Hero / Banners) */}
                  {activeSectionConfig.eyebrow !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Eyebrow Kicker"
                        value={activeSectionConfig.eyebrow || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'eyebrow', e.target.value)}
                        placeholder="e.g. OFFICIAL ACADEMIC PORTAL"
                      />
                    </div>
                  )}

                  {/* Search Placeholder */}
                  {activeSectionConfig.placeholder !== undefined && (
                    <div className="pb-prop-group">
                      <Input
                        label="Search Input Placeholder"
                        value={activeSectionConfig.placeholder || ''}
                        onChange={(e) => handleFieldChange(activeSection, 'placeholder', e.target.value)}
                        placeholder="e.g. Search notes, subjects, faculty..."
                      />
                    </div>
                  )}

                  {/* Primary CTA Button */}
                  {(activeSectionConfig.primaryCtaText !== undefined || activeSectionConfig.buttonText !== undefined) && (
                    <div className="pb-prop-group">
                      <Input
                        label="Primary CTA Text"
                        value={activeSectionConfig.primaryCtaText || activeSectionConfig.buttonText || ''}
                        onChange={(e) => handleFieldChange(activeSection, activeSectionConfig.primaryCtaText !== undefined ? 'primaryCtaText' : 'buttonText', e.target.value)}
                      />
                      <Input
                        label="Primary CTA Link"
                        value={activeSectionConfig.primaryCtaLink || activeSectionConfig.buttonLink || ''}
                        onChange={(e) => handleFieldChange(activeSection, activeSectionConfig.primaryCtaLink !== undefined ? 'primaryCtaLink' : 'buttonLink', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Banner Alert Toggle & Message */}
                  {activeSectionConfig.bannerAlert !== undefined && (
                    <div className="pb-prop-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(activeSectionConfig.bannerAlert?.show)}
                          onChange={(e) => {
                            const current = activeSectionConfig.bannerAlert || {};
                            handleFieldChange(activeSection, 'bannerAlert', {
                              ...current,
                              show: e.target.checked
                            });
                          }}
                        />
                        Display Notice Banner
                      </label>
                      {activeSectionConfig.bannerAlert?.show && (
                        <div style={{ marginTop: '8px' }}>
                          <Input
                            label="Notice Banner Message"
                            value={activeSectionConfig.bannerAlert?.message || ''}
                            onChange={(e) => {
                              const current = activeSectionConfig.bannerAlert || {};
                              handleFieldChange(activeSection, 'bannerAlert', {
                                ...current,
                                message: e.target.value
                              });
                            }}
                            placeholder="e.g. Examination schedules are now live."
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Columns Count Control (KPIs, Features) */}
                  {activeSectionConfig.columns !== undefined && (
                    <div className="pb-prop-group">
                      <label className="pb-prop-label">Grid Columns ({activeSectionConfig.columns})</label>
                      <div className="pb-segmented-grid">
                        {[2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            className={`pb-segmented-btn ${activeSectionConfig.columns === num ? 'pb-segmented-btn--active' : ''}`}
                            onClick={() => handleFieldChange(activeSection, 'columns', num)}
                          >
                            {num} Columns
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KPI Cards Item Editor */}
                  {activeSection === 'stats_kpi' && Array.isArray(activeSectionConfig.cards) && (
                    <div className="pb-prop-group">
                      <label className="pb-prop-label">KPI Metric Cards ({activeSectionConfig.cards.length})</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeSectionConfig.cards.map((card, cIdx) => (
                          <div
                            key={card.id || cIdx}
                            style={{
                              padding: '8px 10px',
                              background: 'var(--color-bg-primary, #F5F4F0)',
                              border: '1px solid var(--color-border, #D7D9D3)',
                              borderRadius: '4px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary, #202620)' }}>
                                Card {cIdx + 1}: {card.label || card.id}
                              </span>
                              <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}>
                                <input
                                  type="checkbox"
                                  checked={card.show !== false}
                                  onChange={(e) => {
                                    const updatedCards = [...activeSectionConfig.cards];
                                    updatedCards[cIdx] = { ...card, show: e.target.checked };
                                    handleFieldChange(activeSection, 'cards', updatedCards);
                                  }}
                                />
                                Show
                              </label>
                            </div>
                            <Input
                              label="Metric Title"
                              value={card.label || ''}
                              onChange={(e) => {
                                const updatedCards = [...activeSectionConfig.cards];
                                updatedCards[cIdx] = { ...card, label: e.target.value };
                                handleFieldChange(activeSection, 'cards', updatedCards);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: APPEARANCE */}
              {inspectorTab === 'appearance' && (
                <>
                  <div className="pb-prop-group">
                    <label className="pb-prop-label">Visual Style Preset</label>
                    <div className="pb-style-presets">
                      {[
                        { id: 'default', label: 'Clean White', desc: 'Crisp white surface' },
                        { id: 'slate', label: 'Subtle Canvas', desc: 'Ivory #F5F4F0 background' },
                        { id: 'teal-tint', label: 'Subtle Sage', desc: 'Soft #EDF5F0 green tint' },
                        { id: 'bordered', label: 'Strong Border', desc: 'Solid crisp neutral boundary' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          className={`pb-style-preset-btn ${(activeSectionConfig.appearance?.preset || 'default') === st.id ? 'pb-style-preset-btn--active' : ''}`}
                          onClick={() => handleAppearanceChange(activeSection, 'preset', st.id)}
                        >
                          <span style={{ fontWeight: 700 }}>{st.label}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)' }}>{st.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pb-prop-group">
                    <label className="pb-prop-label">Text Alignment</label>
                    <div className="pb-segmented-grid">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          type="button"
                          className={`pb-segmented-btn ${(activeSectionConfig.appearance?.align || 'left') === align ? 'pb-segmented-btn--active' : ''}`}
                          onClick={() => handleAppearanceChange(activeSection, 'align', align)}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pb-prop-group">
                    <label className="pb-prop-label">Border Radius</label>
                    <div className="pb-segmented-grid">
                      {[
                        { label: '3px', val: '3px' },
                        { label: '5px', val: '5px' },
                        { label: '7px', val: '7px' }
                      ].map((rad) => (
                        <button
                          key={rad.val}
                          type="button"
                          className={`pb-segmented-btn ${(activeSectionConfig.appearance?.borderRadius || '5px') === rad.val ? 'pb-segmented-btn--active' : ''}`}
                          onClick={() => handleAppearanceChange(activeSection, 'borderRadius', rad.val)}
                        >
                          {rad.label}
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
                    <label className="pb-prop-label">Vertical Padding</label>
                    <div className="pb-segmented-grid">
                      {['compact', 'standard', 'spacious'].map((pad) => (
                        <button
                          key={pad}
                          type="button"
                          className={`pb-segmented-btn ${(activeSectionConfig.layout?.padding || 'standard') === pad ? 'pb-segmented-btn--active' : ''}`}
                          onClick={() => {
                            const current = activeSectionConfig.layout || {};
                            handleFieldChange(activeSection, 'layout', { ...current, padding: pad });
                          }}
                        >
                          {pad.charAt(0).toUpperCase() + pad.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pb-prop-group">
                    <label className="pb-prop-label">Container Width</label>
                    <div className="pb-segmented-grid">
                      {['boxed', 'full'].map((w) => (
                        <button
                          key={w}
                          type="button"
                          className={`pb-segmented-btn ${(activeSectionConfig.layout?.width || 'boxed') === w ? 'pb-segmented-btn--active' : ''}`}
                          onClick={() => {
                            const current = activeSectionConfig.layout || {};
                            handleFieldChange(activeSection, 'layout', { ...current, width: w });
                          }}
                        >
                          {w === 'boxed' ? 'Boxed (1200px)' : 'Full Width'}
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={activeSectionConfig.isVisible !== false}
                        onChange={(e) => handleFieldChange(activeSection, 'isVisible', e.target.checked)}
                      />
                      Display this section on live page
                    </label>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                      When hidden, this section is preserved in drafts but excluded from student and admin views.
                    </p>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveSection(activeSection)}
                      style={{ width: '100%' }}
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
          PUBLISH MODAL
          ========================================================================= */}
      {showPublishModal && (
        <div className="pb-history-modal" onClick={() => setShowPublishModal(false)}>
          <div className="pb-history-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pb-history-header">
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--color-text-primary, #202620)' }}>Publish Layout Changes Live</strong>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                  Target: {currentPageMeta?.label} (v{pageData?.version || 1})
                </p>
              </div>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
                onClick={() => setShowPublishModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-primary, #202620)', lineHeight: 1.5 }}>
                Publishing pushes your draft modifications live to all authenticated scholars and staff immediately. A rollback snapshot will be created in the version audit log.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary, #626A62)', marginBottom: '6px' }}>
                  Release Summary / Note (Optional)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%', fontSize: '12px' }}
                  placeholder="e.g. Updated semester exam revision ribbon and KPI layout"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handlePublish} isLoading={isPublishing}>
                  Confirm & Publish Live
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VERSION HISTORY & AUDIT LOG MODAL
          ========================================================================= */}
      {showHistoryModal && (
        <div className="pb-history-modal" onClick={() => setShowHistoryModal(false)}>
          <div className="pb-history-card" onClick={(e) => e.stopPropagation()}>
            <div className="pb-history-header">
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--color-text-primary, #202620)' }}>Version History & Rollback</strong>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                  Audit snapshots for {currentPageMeta?.label}
                </p>
              </div>
              <button
                type="button"
                className="pb-toolbar-icon-btn"
                onClick={() => setShowHistoryModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="pb-history-body">
              {versionHistoryList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary, #626A62)', fontSize: '13px' }}>
                  No previous published versions recorded for this page yet.
                </div>
              ) : (
                <table className="pb-history-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Summary</th>
                      <th>Published At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionHistoryList.map((ver) => (
                      <tr key={ver.id}>
                        <td style={{ fontWeight: 800, color: 'var(--color-primary, #245C46)' }}>
                          v{ver.version}
                        </td>
                        <td>{ver.changeSummary || 'Layout update'}</td>
                        <td style={{ color: 'var(--color-text-secondary, #626A62)', fontSize: '11px' }}>
                          {ver.createdAt ? new Date(ver.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollbackVersion(ver.id, ver.version)}
                          >
                            Rollback
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
// AUTHENTIC MINI APP SHELL HEADER
// =============================================================================

function renderCanvasHeader(pageMeta) {
  if (pageMeta?.role === 'PUBLIC') {
    return (
      <header className="pb-canvas-top-header" style={{ padding: '0 20px', background: '#FFFFFF', borderBottom: '1px solid var(--color-border, #D7D9D3)', height: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '4px', background: 'var(--color-primary, #245C46)', color: '#FFFFFF', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
            PJ
          </div>
          <strong style={{ fontSize: '13px', color: 'var(--color-text-primary, #202620)' }}>PJ Study</strong>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>· K.R. Mangalam University</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary, #626A62)' }}>Curriculum Notes</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary, #626A62)' }}>Faculties</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary, #626A62)' }}>How It Works</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--color-border, #D7D9D3)', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>
              Sign In
            </span>
            <span style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--color-primary, #245C46)', color: '#FFFFFF', fontSize: '11px', fontWeight: 700 }}>
              Get Started
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="pb-canvas-top-header" style={{ padding: '0 20px', background: '#FFFFFF', borderBottom: '1px solid var(--color-border, #D7D9D3)', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
        <span style={{ color: 'var(--color-text-secondary, #626A62)' }}>PJ Study</span>
        <span style={{ color: 'var(--color-border, #D7D9D3)' }}>/</span>
        <strong style={{ color: 'var(--color-text-primary, #202620)' }}>{pageMeta?.label || 'Workspace'}</strong>
      </div>

      {/* Search Bar & User Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '4px 10px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '160px' }}>
          <span>🔍</span>
          <span>Search notes, subjects...</span>
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative', cursor: 'pointer', fontSize: '14px' }}>
          <span>🔔</span>
          <span style={{ position: 'absolute', top: '-3px', right: '-5px', width: '12px', height: '12px', background: '#DC2626', color: '#fff', borderRadius: '50%', fontSize: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            2
          </span>
        </div>

        {/* User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary, #245C46)', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pageMeta?.role === 'ADMIN' ? 'SA' : 'SK'}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>
            {pageMeta?.role === 'ADMIN' ? 'Super Admin' : 'Scholar'}
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
  const borderRadius = config.appearance?.borderRadius || '5px';

  let bgStyle = '#FFFFFF';
  let borderStyle = '1px solid var(--color-border, #D7D9D3)';
  let textColor = 'var(--color-text-primary, #202620)';

  if (preset === 'slate') {
    bgStyle = 'var(--color-bg-primary, #F5F4F0)';
  } else if (preset === 'teal-tint') {
    bgStyle = '#EDF5F0';
    borderStyle = '1px solid var(--color-border, #D7D9D3)';
    textColor = 'var(--color-primary, #245C46)';
  } else if (preset === 'dark-card') {
    bgStyle = 'var(--color-text-primary, #202620)';
    borderStyle = '1px solid #333833';
    textColor = '#FFFFFF';
  } else if (preset === 'bordered') {
    bgStyle = '#FFFFFF';
    borderStyle = '2px solid var(--color-border-strong, #B9BFB7)';
  }

  const containerStyle = {
    background: bgStyle,
    border: borderStyle,
    borderRadius,
    padding: '16px 20px',
    textAlign: align,
    color: textColor,
    transition: 'all 0.12s ease-out'
  };

  switch (sectionKey) {
    // -------------------------------------------------------------------------
    // SCHOLAR & ADMIN: WELCOME HEADER
    // -------------------------------------------------------------------------
    case 'welcome_header':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
                {config.title || config.headline || 'Welcome back to PJ Study'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: preset === 'dark-card' ? '#A3A8A3' : 'var(--color-text-secondary, #626A62)' }}>
                {config.subtitle || config.description || 'Your K.R. Mangalam University academic manuscript library.'}
              </p>
            </div>
            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontWeight: 700, border: '1px solid var(--color-border, #D7D9D3)' }}>
              Active Term 2026
            </span>
          </div>
          {config.bannerAlert?.show && (
            <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '4px', background: '#EDF5F0', border: '1px solid var(--color-border, #D7D9D3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>📢</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary, #245C46)' }}>
                {config.bannerAlert.message || 'Semester examination revision notes and past paper solutions are live.'}
              </span>
            </div>
          )}
        </div>
      );

    // -------------------------------------------------------------------------
    // SCHOLAR: QUICK SEARCH
    // -------------------------------------------------------------------------
    case 'quick_search':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', padding: '8px 12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary, #626A62)' }}>🔍</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #626A62)', flex: 1 }}>{config.placeholder || 'Search notes, subjects, courses, or professors...'}</span>
            <span style={{ background: 'var(--color-primary, #245C46)', color: '#fff', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
              Search Catalog
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary, #626A62)', textTransform: 'uppercase' }}>Quick Filters:</span>
            {['All Notes', 'Operating Systems', 'DBMS', 'Networks', 'Discrete Math'].map((t, idx) => (
              <span key={idx} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', color: 'var(--color-text-primary, #202620)', fontWeight: 500 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // SCHOLAR: ACADEMIC INFO BANNER
    // -------------------------------------------------------------------------
    case 'academic_info':
      return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🏛️</span>
            <div>
              <strong style={{ fontSize: '13px', color: textColor }}>
                {config.campusName || 'K.R. Mangalam University'}
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                {config.schoolLabel || 'School of Engineering & Technology'} · Semester 4
              </p>
            </div>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary, #245C46)', background: '#EDF5F0', padding: '3px 10px', borderRadius: '4px', border: '1px solid var(--color-border, #D7D9D3)' }}>
            Enrolled Scholar
          </span>
        </div>
      );

    // -------------------------------------------------------------------------
    // STATS KPI CARDS
    // -------------------------------------------------------------------------
    case 'stats_kpi': {
      const cols = config.columns || 4;
      const defaultCards = [
        { label: 'Published Notes', value: '142', icon: '📚', trend: '+12% this month', show: true },
        { label: 'Catalog Reads', value: '1,280', icon: '👁️', trend: '+24% this week', show: true },
        { label: 'Active Scholars', value: '350', icon: '🎓', trend: '+8% this term', show: true },
        { label: 'Downloads Facilitated', value: '890', icon: '📥', trend: '+18% this month', show: true }
      ];
      const rawCards = Array.isArray(config.cards) && config.cards.length > 0 ? config.cards : defaultCards;
      const visibleCards = rawCards.filter((c) => c.show !== false);
      const cardsToRender = visibleCards.length > 0 ? visibleCards : defaultCards;

      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cols, cardsToRender.length || 1)}, 1fr)`, gap: '10px' }}>
          {cardsToRender.map((c, i) => (
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

    // -------------------------------------------------------------------------
    // ADMIN: QUICK SHORTCUTS
    // -------------------------------------------------------------------------
    case 'quick_shortcuts':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '13px', color: textColor }}>{config.title || 'Direct Publishing & Management Shortcuts'}</strong>
            <span style={{ fontSize: '10px', color: 'var(--color-primary, #245C46)', fontWeight: 700 }}>Direct Publishing Enabled</span>
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

    // -------------------------------------------------------------------------
    // RECENT NOTES (TABLE / CARDS)
    // -------------------------------------------------------------------------
    case 'recent_notes':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <strong style={{ fontSize: '13px', color: textColor }}>{config.title || 'Recently Published Notes'}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                {config.subtitle || 'Latest academic materials published to the student catalog'}
              </p>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-primary, #245C46)', fontWeight: 600 }}>View Complete Inventory (142) →</span>
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
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>{row.title}</td>
                  <td style={{ color: 'var(--color-text-secondary, #626A62)' }}>{row.course}</td>
                  <td>
                    <span style={{ padding: '2px 6px', borderRadius: '3px', background: 'var(--color-bg-primary, #F5F4F0)', color: 'var(--color-text-primary, #202620)', fontSize: '10px', fontWeight: 600, border: '1px solid var(--color-border, #D7D9D3)' }}>
                      {row.code}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary, #626A62)' }}>{row.author}</td>
                  <td>
                    <span style={{ padding: '2px 6px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontSize: '10px', fontWeight: 700, border: '1px solid var(--color-border, #D7D9D3)' }}>
                      ● {row.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-primary, #245C46)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.fmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    // -------------------------------------------------------------------------
    // ACTIVITY CHART / ANALYTICS SUMMARY
    // -------------------------------------------------------------------------
    case 'activity_chart':
    case 'analytics_summary':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <strong style={{ fontSize: '13px', color: textColor }}>{config.title || 'Weekly Study & Readership Velocity'}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>Daily manuscript downloads and page reads over the last 7 days</p>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', fontWeight: 600 }}>7 Days</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#FFFFFF', color: 'var(--color-text-secondary, #626A62)' }}>30 Days</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '100px', padding: '0 8px' }}>
            {[
              { day: 'Mon', val: 45 },
              { day: 'Tue', val: 68 },
              { day: 'Wed', val: 52 },
              { day: 'Thu', val: 88 },
              { day: 'Fri', val: 96 },
              { day: 'Sat', val: 72 },
              { day: 'Sun', val: 64 }
            ].map((bar, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--color-primary, #245C46)', fontVariantNumeric: 'tabular-nums' }}>{bar.val}%</span>
                <div style={{ width: '100%', height: `${bar.val}%`, background: 'var(--color-primary, #245C46)', borderRadius: '3px' }} />
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary, #626A62)' }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // SCHOLAR: RECOMMENDATIONS
    // -------------------------------------------------------------------------
    case 'recommendations':
    case 'rec_grid':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <strong style={{ fontSize: '13px', color: textColor }}>{config.title || 'Curated Academic Recommendations'}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                {config.subtitle || 'Recommended based on your enrolled course and semester syllabus'}
              </p>
            </div>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontWeight: 700, border: '1px solid var(--color-border, #D7D9D3)' }}>
              98% Curriculum Alignment
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { title: 'Computer Networks — Transport Layer & Congestion Control', code: 'CSE208', sem: 'Sem 4', rating: '4.9 ★', reads: '310 reads' },
              { title: 'Operating Systems — CPU Scheduling Algorithms & Gantt Charts', code: 'CSE204', sem: 'Sem 4', rating: '4.8 ★', reads: '450 reads' },
              { title: 'Database Systems — SQL Query Optimization & Indexing', code: 'CSE206', sem: 'Sem 4', rating: '4.9 ★', reads: '380 reads' }
            ].map((n, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--color-border, #D7D9D3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'var(--color-bg-primary, #F5F4F0)', color: 'var(--color-text-primary, #202620)', border: '1px solid var(--color-border, #D7D9D3)' }}>{n.code}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-primary, #245C46)', fontWeight: 700 }}>{n.rating}</span>
                </div>
                <strong style={{ fontSize: '12px', color: 'var(--color-text-primary, #202620)', lineHeight: 1.3 }}>{n.title}</strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid var(--color-border-subtle, #E4E6E1)', fontSize: '10px', color: 'var(--color-text-secondary, #626A62)' }}>
                  <span>{n.sem}</span>
                  <span style={{ color: 'var(--color-primary, #245C46)', fontWeight: 600 }}>Preview →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // SCHOLAR: EXPLORE NOTES CATALOG & FILTERS
    // -------------------------------------------------------------------------
    case 'explore_header':
      return (
        <div style={containerStyle}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary, #245C46)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ACADEMIC NOTES DIRECTORY
          </span>
          <h2 style={{ margin: '4px 0 2px', fontSize: '18px', fontWeight: 800, color: textColor }}>
            {config.title || 'Explore Curriculum Study Notes'}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary, #626A62)' }}>
            {config.subtitle || 'Discover verified lecture manuscripts, revision manuals, and past exam solutions for KRMU schools.'}
          </p>
        </div>
      );

    case 'search_filters':
    case 'inventory_filters':
      return (
        <div style={{ ...containerStyle, display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px', padding: '6px 10px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
            🔍 Search by course, subject code, or keyword...
          </div>
          <span style={{ padding: '6px 10px', background: '#FFFFFF', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>
            School: All Schools ▼
          </span>
          <span style={{ padding: '6px 10px', background: '#FFFFFF', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>
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
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, #626A62)', fontVariantNumeric: 'tabular-nums' }}>Displaying 12 of 142 items</span>
          </div>
          <table className="pb-canvas-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>School & Course</th>
                <th>Semester</th>
                <th>Format & Size</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: 'Computer Networks — Transport Layer Protocols', course: 'B.Tech CSE', sem: 'Sem 5', fmt: 'PDF (3.2 MB)' },
                { title: 'Data Structures — AVL & Red-Black Trees', course: 'B.Tech CSE', sem: 'Sem 3', fmt: 'PDF (2.1 MB)' },
                { title: 'Discrete Mathematics — Graph Theory', course: 'B.Tech CSE', sem: 'Sem 3', fmt: 'PDF (1.8 MB)' },
                { title: 'Database Systems — ACID & Serializability', course: 'B.Tech CSE', sem: 'Sem 4', fmt: 'PDF (2.4 MB)' }
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>{row.title}</td>
                  <td style={{ color: 'var(--color-text-secondary, #626A62)' }}>{row.course}</td>
                  <td style={{ color: 'var(--color-text-secondary, #626A62)' }}>{row.sem}</td>
                  <td style={{ color: 'var(--color-primary, #245C46)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.fmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    // -------------------------------------------------------------------------
    // SCHOLAR: LIBRARY & COLLECTIONS
    // -------------------------------------------------------------------------
    case 'library_header':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: textColor }}>
                {config.title || 'My Study Desk & Personal Library'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                {config.subtitle || 'Access your bookmarked study notes, custom binders, and offline reading vault.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
              <span style={{ padding: '3px 8px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontWeight: 700, border: '1px solid var(--color-border, #D7D9D3)' }}>14 Saved</span>
              <span style={{ padding: '3px 8px', borderRadius: '3px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', fontWeight: 600 }}>3 Binders</span>
            </div>
          </div>
        </div>
      );

    case 'saved_tabs':
      return (
        <div style={{ ...containerStyle, padding: '8px 12px', display: 'flex', gap: '6px' }}>
          {['🔖 Saved Manuscripts (14)', '📁 Custom Binders (3)', '📥 Download History (8)'].map((tab, idx) => (
            <span key={idx} style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: idx === 0 ? 700 : 500, background: idx === 0 ? '#EDF5F0' : 'transparent', color: idx === 0 ? 'var(--color-primary, #245C46)' : 'var(--color-text-secondary, #626A62)', border: idx === 0 ? '1px solid var(--color-border, #D7D9D3)' : '1px solid transparent' }}>
              {tab}
            </span>
          ))}
        </div>
      );

    case 'collections_grid':
      return (
        <div style={containerStyle}>
          <strong style={{ fontSize: '13px', color: textColor, display: 'block', marginBottom: '8px' }}>
            Personal Study Binders
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { name: 'End-Term Exam Revision', count: '6 notes', updated: '2h ago' },
              { name: 'Operating Systems Deep Dive', count: '4 notes', updated: 'Yesterday' },
              { name: 'DBMS Lab & Cheat Sheets', count: '4 notes', updated: '3 days ago' }
            ].map((b, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--color-border, #D7D9D3)' }}>
                <span style={{ fontSize: '16px' }}>📁</span>
                <strong style={{ display: 'block', margin: '4px 0 2px', fontSize: '12px', color: 'var(--color-text-primary, #202620)' }}>{b.name}</strong>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)' }}>{b.count} · {b.updated}</span>
              </div>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // SCHOLAR: PROFILE & SECURITY
    // -------------------------------------------------------------------------
    case 'profile_header':
      return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary, #245C46)', color: '#FFFFFF', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            SK
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: textColor }}>
              Siddharth Kapoor
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              PJSocial2024CS042 · B.Tech Computer Science & Engineering · Semester 4
            </p>
          </div>
        </div>
      );

    case 'academic_card':
      return (
        <div style={containerStyle}>
          <strong style={{ fontSize: '13px', color: textColor, display: 'block', marginBottom: '8px' }}>
            Credentials
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ padding: '8px 10px', background: 'var(--color-bg-primary, #F5F4F0)', borderRadius: '4px', border: '1px solid var(--color-border, #D7D9D3)' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)', display: 'block' }}>Faculty</span>
              <strong style={{ fontSize: '11px', color: 'var(--color-text-primary, #202620)' }}>SOET (Engineering)</strong>
            </div>
            <div style={{ padding: '8px 10px', background: 'var(--color-bg-primary, #F5F4F0)', borderRadius: '4px', border: '1px solid var(--color-border, #D7D9D3)' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)', display: 'block' }}>Semester</span>
              <strong style={{ fontSize: '11px', color: 'var(--color-text-primary, #202620)' }}>Semester 4 of 8</strong>
            </div>
            <div style={{ padding: '8px 10px', background: 'var(--color-bg-primary, #F5F4F0)', borderRadius: '4px', border: '1px solid var(--color-border, #D7D9D3)' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)', display: 'block' }}>CGPA</span>
              <strong style={{ fontSize: '11px', color: 'var(--color-primary, #245C46)' }}>8.64 / 10.0</strong>
            </div>
          </div>
        </div>
      );

    case 'security_settings':
      return (
        <div style={containerStyle}>
          <strong style={{ fontSize: '13px', color: textColor, display: 'block', marginBottom: '8px' }}>
            Account Security & Permissions
          </strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--color-bg-primary, #F5F4F0)', borderRadius: '4px', border: '1px solid var(--color-border, #D7D9D3)' }}>
            <div>
              <strong style={{ fontSize: '11px', color: 'var(--color-text-primary, #202620)' }}>Two-Factor Authentication</strong>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-secondary, #626A62)' }}>Enabled via university single sign-on</p>
            </div>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontWeight: 700 }}>Active</span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // SCHOLAR: NOTIFICATIONS
    // -------------------------------------------------------------------------
    case 'notifications_header':
      return (
        <div style={containerStyle}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: textColor }}>
            {config.title || 'Notification Center'}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
            {config.subtitle || 'Stay updated on syllabus releases, exam schedules, and new curriculum notes.'}
          </p>
        </div>
      );

    case 'notifications_feed':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { tag: 'EXAM', title: 'End-Term Exam Schedule Uploaded for Semester 4', time: '10m ago' },
              { tag: 'CURRICULUM', title: 'New Lab Manuals for Artificial Intelligence & ML Published', time: '2h ago' }
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', border: '1px solid var(--color-border, #D7D9D3)' }}>
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>{item.title}</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // ADMIN: UPLOAD NOTE
    // -------------------------------------------------------------------------
    case 'upload_header':
      return (
        <div style={containerStyle}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary, #245C46)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            FACULTY PUBLISHING PORTAL
          </span>
          <h2 style={{ margin: '4px 0 2px', fontSize: '18px', fontWeight: 800, color: textColor }}>
            {config.title || 'Direct Manuscript Publishing'}
          </h2>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
            {config.subtitle || 'Verified faculty author and publish official course manuscripts directly into the student catalog.'}
          </p>
        </div>
      );

    case 'file_uploader':
      return (
        <div style={{ ...containerStyle, border: '2px dashed var(--color-border-strong, #B9BFB7)', textAlign: 'center', padding: '24px 16px', background: 'var(--color-bg-primary, #F5F4F0)' }}>
          <span style={{ fontSize: '28px' }}>📄</span>
          <p style={{ margin: '6px 0 2px', fontSize: '13px', fontWeight: 700, color: textColor }}>
            Upload Lecture Notes & Curriculum Manuscripts
          </p>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
            Supported formats: {config.allowedTypes || 'PDF, JPG, PNG'} (Max {config.maxMb || 25} MB) · Direct Publishing Enabled
          </span>
        </div>
      );

    case 'metadata_form':
      return (
        <div style={containerStyle}>
          <strong style={{ fontSize: '13px', color: textColor, display: 'block', marginBottom: '10px' }}>
            Course & Curriculum Metadata
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '6px 10px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              School: School of Engineering & Technology
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              Course: B.Tech Computer Science & Engineering
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              Semester: Semester 4
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              Subject Code: CSE204 (Operating Systems)
            </div>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // ADMIN: NOTES INVENTORY
    // -------------------------------------------------------------------------
    case 'notes_header':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: textColor }}>
                {config.title || 'Curriculum Notes Inventory'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                {config.subtitle || 'Complete repository of 142 published manuscripts and pending drafts across all faculties.'}
              </p>
            </div>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontWeight: 700, border: '1px solid var(--color-border, #D7D9D3)' }}>
              142 Total Manuscripts
            </span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // PUBLIC HOMEPAGE
    // -------------------------------------------------------------------------
    case 'hero':
      return (
        <div style={{ ...containerStyle, textAlign: 'center', padding: '36px 20px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary, #245C46)', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#EDF5F0', padding: '3px 10px', borderRadius: '4px', border: '1px solid var(--color-border, #D7D9D3)' }}>
            {config.eyebrow || 'K.R. MANGALAM UNIVERSITY ACADEMIC PORTAL'}
          </span>
          <h1 style={{ margin: '12px 0 8px', fontSize: '26px', fontWeight: 800, color: textColor, letterSpacing: '-0.03em', lineHeight: 1.25 }}>
            {config.headline || config.title || 'Study Smarter with Verified Faculty Lecture Notes'}
          </h1>
          <p style={{ margin: '0 auto 18px', fontSize: '13px', color: 'var(--color-text-secondary, #626A62)', maxWidth: '540px', lineHeight: 1.5 }}>
            {config.description || config.subtitle || 'Syllabus-aligned lecture manuscripts, revision manuals, and past exam solutions for KRMU students.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span style={{ padding: '8px 18px', background: 'var(--color-primary, #245C46)', color: '#FFFFFF', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>
              {config.primaryCtaText || 'Explore Notes Catalog'}
            </span>
            <span style={{ padding: '8px 18px', background: '#FFFFFF', border: '1px solid var(--color-border, #D7D9D3)', color: 'var(--color-text-primary, #202620)', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>
              Direct Upload Note
            </span>
          </div>
        </div>
      );

    case 'features':
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <strong style={{ fontSize: '15px', color: textColor }}>{config.title || 'Built for Academic Excellence'}</strong>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              {config.subtitle || 'Everything K.R. Mangalam students need for exam preparation and coursework'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.columns || 3}, 1fr)`, gap: '10px' }}>
            {[
              { icon: '🎯', title: 'Curriculum-Mapped Notes', desc: 'Lecture manuscripts organized strictly by university school, degree program, and semester syllabus.' },
              { icon: '⚡', title: 'Direct Faculty Publishing', desc: 'Instant live publishing with automatic validation and zero approval bottlenecks.' },
              { icon: '📁', title: 'Personal Study Desk', desc: 'Private bookmarking, organized collections, reading history, and direct PDF downloads.' }
            ].map((f, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--color-border, #D7D9D3)' }}>
                <span style={{ fontSize: '20px' }}>{f.icon}</span>
                <p style={{ margin: '6px 0 2px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary, #202620)' }}>{f.title}</p>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, #626A62)', lineHeight: 1.4, display: 'block' }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'how_it_works':
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <strong style={{ fontSize: '14px', color: textColor }}>{config.title || 'How PJ Study Powers Your Learning'}</strong>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              {config.subtitle || 'From initial enrollment to final exam mastery in three streamlined steps.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { step: '1', title: 'Select School & Course', desc: 'Navigate directly to your KRMU faculty and active semester subjects.' },
              { step: '2', title: 'Access Peer-Reviewed Notes', desc: 'Read detailed lecture slides, past question solutions, and concise cheat sheets.' },
              { step: '3', title: 'Build Your Personal Library', desc: 'Bookmark key chapters, track downloads, and review materials before exam deadlines.' }
            ].map((s, idx) => (
              <div key={idx} style={{ padding: '12px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--color-border, #D7D9D3)' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary, #245C46)', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                  {s.step}
                </span>
                <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary, #202620)' }}>{s.title}</p>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'academic_highlights':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <strong style={{ fontSize: '13px', color: textColor }}>{config.title || 'Official KRMU Campus Taxonomy'}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
                {config.subtitle || 'Dedicated curriculum architecture and course catalog'}
              </p>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-primary, #245C46)', fontWeight: 700 }}>6 Academic Faculties</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              'School of Engineering & Technology (SOET)',
              'School of Management & Commerce (SOMC)',
              'School of Medical & Allied Sciences (SMAS)',
              'School of Legal Studies (SOLS)',
              'School of Basic & Applied Sciences (SBAS)',
              'School of Journalism & Mass Comm (SJMC)'
            ].map((sch, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>
                🏛️ {sch}
              </div>
            ))}
          </div>
        </div>
      );

    case 'trust_cta':
      return (
        <div style={{ ...containerStyle, background: 'var(--color-primary, #245C46)', color: '#FFFFFF', textAlign: 'center', padding: '28px 20px', border: 'none' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
            {config.headline || 'Ready to Elevate Your Academic Journey?'}
          </h3>
          <p style={{ margin: '0 auto 14px', fontSize: '12px', color: '#D1E0D7', maxWidth: '460px' }}>
            {config.description || 'Join thousands of university scholars discovering course-mapped lecture notes and study collections.'}
          </p>
          <span style={{ display: 'inline-block', padding: '7px 18px', background: '#FFFFFF', color: 'var(--color-primary, #245C46)', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>
            {config.buttonText || 'Get Started Free'}
          </span>
        </div>
      );

    case 'footer':
      return (
        <footer style={{ ...containerStyle, background: 'var(--color-text-primary, #202620)', color: '#A3A8A3', padding: '20px', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '12px' }}>{config.brandText || 'PJ Study Academic Library'}</strong>
              <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#858B84' }}>
                {config.copyright || '© 2026 PJ Study. Not an official portal authorized by K.R. Mangalam University.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#D7D9D3' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Faculty Portal</span>
              <span>KRMU Direct</span>
            </div>
          </div>
        </footer>
      );

    case 'announcement_banner':
      return (
        <div style={{ ...containerStyle, background: '#EDF5F0', border: '1px solid var(--color-border, #D7D9D3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>📣</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary, #245C46)' }}>
              {config.text || 'Important examination notice for all KRMU scholars.'}
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary, #245C46)' }}>
            {config.linkText || 'Learn More'} →
          </span>
        </div>
      );

    case 'bottom_split':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
          <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: textColor }}>My Library Preview</strong>
              <span style={{ fontSize: '11px', color: 'var(--color-primary, #245C46)', fontWeight: 600 }}>Go to Library →</span>
            </div>
            {['Operating Systems — Deadlock Solutions', 'DBMS — BCNF Normalization'].map((title, i) => (
              <div key={i} style={{ padding: '6px 8px', borderRadius: '4px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>🔖 {title}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-primary, #245C46)', fontWeight: 600 }}>Open</span>
              </div>
            ))}
          </div>
          <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: textColor }}>Campus Announcements</strong>
              <span style={{ fontSize: '13px' }}>📢</span>
            </div>
            <div style={{ padding: '6px 8px', borderRadius: '4px', background: '#EDF5F0', border: '1px solid var(--color-border, #D7D9D3)' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '2px', background: '#FFFFFF', color: 'var(--color-primary, #245C46)' }}>EXAM</span>
              <p style={{ margin: '3px 0 1px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>End-Term Revision Packets Uploaded</p>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)' }}>Today · School of Engineering</span>
            </div>
          </div>
        </div>
      );

    case 'announcements':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '13px', color: textColor }}>{config.title || 'Institutional Announcements'}</strong>
            <span style={{ fontSize: '11px', color: 'var(--color-primary, #245C46)', fontWeight: 600 }}>Create Notice +</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { tag: 'EXAM', title: 'End-Term Examination Schedule & Revision Guides Uploaded', date: 'Today · 10:30 AM' },
              { tag: 'CURRICULUM', title: 'New Lab Manuals for Artificial Intelligence & Machine Learning Live', date: 'Yesterday · 4:15 PM' }
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--color-bg-primary, #F5F4F0)', border: '1px solid var(--color-border, #D7D9D3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', border: '1px solid var(--color-border, #D7D9D3)' }}>
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary, #202620)' }}>{item.title}</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary, #626A62)' }}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'reports_feed':
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <strong style={{ fontSize: '13px', color: textColor }}>{config.title || 'Quality & Compliance Reports'}</strong>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#EDF5F0', color: 'var(--color-primary, #245C46)', fontWeight: 700, border: '1px solid var(--color-border, #D7D9D3)' }}>
              ✓ 100% Compliant
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
            All manuscripts comply with K.R. Mangalam academic honor codes. 0 flagged copyright or syllabus violations.
          </p>
        </div>
      );

    default:
      return (
        <div style={containerStyle}>
          <strong style={{ fontSize: '13px', color: textColor }}>{config.title || config.headline || sectionKey}</strong>
          {(config.subtitle || config.description) && (
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #626A62)' }}>
              {config.subtitle || config.description}
            </p>
          )}
        </div>
      );
  }
}

export default VisualBuilderTab;
