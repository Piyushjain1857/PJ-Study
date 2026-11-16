/**
 * Default Seed Configurations for PJ Study Platform Customization Suite.
 * Provides out-of-the-box verified layouts, themes, features, and navigation.
 */

export const DEFAULT_PAGE_CONFIGS = Object.freeze({
  homepage: {
    hero: {
      headline: 'Everything You Need to Study Smarter.',
      highlightText: 'Study Smarter.',
      description: 'Discover organized academic notes, explore subjects effortlessly, and keep your study resources together in one focused learning space.',
      eyebrow: 'THE SMARTER WAY TO STUDY',
      primaryCtaText: 'Explore Study Notes',
      primaryCtaLink: '/notes/explore',
      secondaryCtaText: 'How It Works',
      secondaryCtaLink: '#how-it-works',
      align: 'left',
      showShowcase: true,
      isVisible: true
    },
    announcement_banner: {
      text: 'Semester examination revision notes & lab manuals are now published for KRMU schools.',
      linkText: 'Explore Latest Catalog',
      linkUrl: '/notes/explore',
      variant: 'emerald',
      priority: 'NORMAL',
      isVisible: true
    },
    features: {
      title: 'Academic Excellence, Reimagined',
      subtitle: 'Structured knowledge designed for deep comprehension, peer collaboration, and curriculum mastery.',
      columns: 3,
      items: [
        {
          id: 'feat-1',
          title: 'Curriculum-Mapped Notes',
          description: 'Lecture manuscripts organized strictly by university school, degree program, and semester syllabus.',
          icon: 'book'
        },
        {
          id: 'feat-2',
          title: 'Verified Peer Reviews',
          description: 'Community feedback, helpfulness scoring, and qualitative ratings from enrolled university scholars.',
          icon: 'check'
        },
        {
          id: 'feat-3',
          title: 'Personal Study Desk',
          description: 'Private bookmarking, organized collections, reading history, and direct PDF downloads.',
          icon: 'layers'
        }
      ],
      isVisible: true
    },
    how_it_works: {
      title: 'How PJ Study Powers Your Learning',
      subtitle: 'From initial enrollment to final exam mastery in three streamlined steps.',
      steps: [
        {
          stepNumber: 1,
          title: 'Select School & Course',
          description: 'Navigate directly to your KRMU faculty and active semester subjects.'
        },
        {
          stepNumber: 2,
          title: 'Access Peer-Reviewed Notes',
          description: 'Read detailed lecture slides, past question solutions, and concise cheat sheets.'
        },
        {
          stepNumber: 3,
          title: 'Build Your Personal Library',
          description: 'Bookmark key chapters, track downloads, and review materials before exam deadlines.'
        }
      ],
      isVisible: true
    },
    academic_highlights: {
      title: 'Official KRMU Campus Taxonomy',
      subtitle: 'Dedicated curriculum architecture and course catalog for K.R. Mangalam University.',
      campusName: 'K.R. Mangalam University',
      isVisible: true
    },
    trust_cta: {
      headline: 'Ready to Elevate Your Academic Journey?',
      description: 'Join thousands of university scholars discovering course-mapped lecture notes and study collections.',
      buttonText: 'Get Started Free',
      buttonLink: '/register',
      isVisible: true
    },
    footer: {
      brandText: 'PJ Study Academic Library',
      copyright: '© 2026 PJ Study. Dedicated to K.R. Mangalam University Scholars.',
      isVisible: true
    }
  },

  scholar_dashboard: {
    welcome_header: {
      title: 'Welcome back, Scholar',
      subtitle: 'Track your study progress, access recently saved notes, and manage your academic library.',
      bannerAlert: {
        show: true,
        message: 'Semester examination revision notes and past paper solutions are now live in Explore Notes.',
        variant: 'emerald'
      },
      isVisible: true
    },
    stats_kpi: {
      columns: 4,
      cards: [
        { id: 'saved', label: 'Saved Notes', show: true },
        { id: 'downloads', label: 'Total Downloads', show: true },
        { id: 'collections', label: 'Collections', show: true },
        { id: 'views', label: 'View History', show: true }
      ],
      isVisible: true
    },
    activity_chart: {
      chartTitle: 'Study & Reading Velocity',
      defaultRange: '7d',
      chartType: 'line',
      isVisible: true
    },
    workspace_sections: {
      columns: 2,
      sections: [
        { id: 'recent_notes', title: 'Recently Viewed & Saved', show: true, order: 1 },
        { id: 'downloads', title: 'Download History', show: true, order: 2 },
        { id: 'collections', title: 'My Study Collections', show: true, order: 3 },
        { id: 'recommendations', title: 'Recommended For You', show: true, order: 4 },
        { id: 'quick_actions', title: 'Quick Actions', show: true, order: 5 }
      ],
      isVisible: true
    }
  },

  admin_dashboard: {
    welcome_header: {
      title: 'Admin Operations Workspace',
      subtitle: 'Manage verified academic notes, author study materials, and monitor curriculum compliance.',
      bannerAlert: {
        show: false,
        message: '',
        variant: 'info'
      },
      isVisible: true
    },
    stats_kpi: {
      columns: 4,
      cards: [
        { id: 'published', label: 'Published Notes', show: true },
        { id: 'drafts', label: 'Unpublished / Drafts', show: true },
        { id: 'views', label: 'Catalog Reads', show: true },
        { id: 'downloads', label: 'Downloads Facilitated', show: true }
      ],
      isVisible: true
    },
    workspace_sections: {
      columns: 2,
      sections: [
        { id: 'quick_upload', title: 'Direct Manuscript Publishing', show: true, order: 1 },
        { id: 'notes_management', title: 'Curriculum Notes Inventory', show: true, order: 2 },
        { id: 'reports_feed', title: 'Quality & Compliance Reports', show: true, order: 3 }
      ],
      isVisible: true
    }
  }
});

export const DEFAULT_THEMES = Object.freeze({
  PUBLIC: {
    primaryColor: '#1b4d36',
    secondaryColor: '#143d2a',
    accentColor: '#b47318',
    backgroundColor: '#faf9f6',
    surfaceColor: '#ffffff',
    textPrimary: '#151816',
    textSecondary: '#4b524d',
    borderRadius: '8px',
    fontPreset: 'jakarta-inter',
    logoText: 'PJ Study',
    logoBadge: 'ACADEMIC LIBRARY'
  },
  SCHOLAR: {
    primaryColor: '#1b4d36',
    secondaryColor: '#143d2a',
    accentColor: '#b47318',
    backgroundColor: '#faf9f6',
    surfaceColor: '#ffffff',
    textPrimary: '#151816',
    textSecondary: '#4b524d',
    borderRadius: '8px',
    fontPreset: 'jakarta-inter',
    logoText: 'PJ Study',
    logoBadge: 'SCHOLAR DESK'
  },
  ADMIN: {
    primaryColor: '#1b4d36',
    secondaryColor: '#113824',
    accentColor: '#255eb3',
    backgroundColor: '#f8faf9',
    surfaceColor: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    borderRadius: '8px',
    fontPreset: 'jakarta-inter',
    logoText: 'PJ Study',
    logoBadge: 'ADMIN WORKSPACE'
  },
  SUPER_ADMIN: {
    primaryColor: '#1b4d36',
    secondaryColor: '#0f2f20',
    accentColor: '#c2410c',
    backgroundColor: '#f8fafc',
    surfaceColor: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    borderRadius: '8px',
    fontPreset: 'jakarta-inter',
    logoText: 'PJ Study',
    logoBadge: 'COMMAND CENTER'
  }
});

export const DEFAULT_NAVIGATION = Object.freeze({
  SCHOLAR: [
    {
      label: 'WORKSPACE',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: 'grid', isVisible: true },
        { to: '/notes/explore', label: 'Explore Notes', icon: 'search', isVisible: true },
        { to: '/notes/recommended', label: 'Recommended', icon: 'sparkles', isVisible: true },
        { to: '/my-notes', label: 'My Library', icon: 'bookmark', isVisible: true }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { to: '/notifications', label: 'Notifications', icon: 'bell', isVisible: true },
        { to: '/profile', label: 'Profile & Security', icon: 'user', isVisible: true }
      ]
    }
  ],
  ADMIN: [
    {
      label: 'ADMIN WORKSPACE',
      items: [
        { to: '/admin-workspace', label: 'Dashboard', icon: 'grid', isVisible: true },
        { to: '/admin-workspace/analytics', label: 'Content Analytics', icon: 'bar-chart', isVisible: true }
      ]
    },
    {
      label: 'NOTES MANAGEMENT',
      items: [
        { to: '/notes/new', label: 'Upload Note', icon: 'plus-circle', highlight: true, isVisible: true },
        { to: '/admin-workspace/notes', label: 'All Notes Directory', icon: 'file-text', isVisible: true },
        { to: '/admin-workspace/notes?status=PUBLISHED', label: 'Published Notes', icon: 'check-circle', isVisible: true },
        { to: '/admin-workspace/notes?status=UNPUBLISHED', label: 'Unpublished / Drafts', icon: 'slash', isVisible: true },
        { to: '/admin-workspace/reports', label: 'Reported Content', icon: 'alert-triangle', isVisible: true }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { to: '/profile', label: 'Admin Profile', icon: 'user', isVisible: true }
      ]
    }
  ],
  SUPER_ADMIN: [
    {
      label: 'COMMAND CENTER',
      items: [
        { to: '/admin', label: 'Overview', icon: 'layout', isVisible: true },
        { to: '/admin/analytics', label: 'Advanced Analytics', icon: 'activity', isVisible: true },
        { to: '/admin/activity', label: 'Platform Activity', icon: 'clock', isVisible: true }
      ]
    },
    {
      label: 'PLATFORM BUILDER',
      items: [
        { to: '/admin/ui-builder', label: 'Visual Website Builder', icon: 'code', isVisible: true },
        { to: '/admin/ui-builder/scholar', label: 'Scholar UI Editor', icon: 'user-check', isVisible: true },
        { to: '/admin/ui-builder/admin', label: 'Admin UI Editor', icon: 'shield', isVisible: true },
        { to: '/admin/ui-builder/homepage', label: 'Homepage Editor', icon: 'monitor', isVisible: true },
        { to: '/admin/appearance', label: 'Theme Studio', icon: 'palette', isVisible: true },
        { to: '/admin/navigation', label: 'Navigation Builder', icon: 'compass', isVisible: true },
        { to: '/admin/widgets', label: 'Dashboard Widgets', icon: 'layers', isVisible: true }
      ]
    },
    {
      label: 'PLATFORM CONTROL',
      items: [
        { to: '/admin/features', label: 'Feature Control', icon: 'toggle-right', isVisible: true },
        { to: '/admin/permissions', label: 'Permissions Manager', icon: 'key', isVisible: true },
        { to: '/admin/content', label: 'Content Manager', icon: 'file-text', isVisible: true },
        { to: '/admin/settings', label: 'Platform Settings', icon: 'settings', isVisible: true }
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { to: '/admin/users', label: 'Users', icon: 'users', isVisible: true },
        { to: '/admin/moderators', label: 'Admins', icon: 'shield', isVisible: true },
        { to: '/admin/academics', label: 'Academic Architecture', icon: 'home', isVisible: true },
        { to: '/admin/notes', label: 'Notes Management', icon: 'book', isVisible: true },
        { to: '/admin/reports', label: 'Content Reports', icon: 'flag', isVisible: true }
      ]
    },
    {
      label: 'OPERATIONS',
      items: [
        { to: '/admin/notifications', label: 'Notifications', icon: 'bell', isVisible: true },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: 'clipboard', isVisible: true },
        { to: '/admin/health', label: 'System Health', icon: 'cpu', isVisible: true },
        { to: '/admin/config/history', label: 'Configuration History', icon: 'history', isVisible: true }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { to: '/profile', label: 'Super Admin Profile', icon: 'user', isVisible: true }
      ]
    }
  ]
});

export const DEFAULT_FEATURE_FLAGS = Object.freeze([
  {
    key: 'recommendations',
    name: 'Smart Study Recommendations',
    description: 'Personalized course-based note suggestions on Scholar Dashboard and Explore pages.',
    category: 'DISCOVERY',
    isEnabled: true
  },
  {
    key: 'reviews',
    name: 'Ratings & Peer Reviews',
    description: 'Allows scholars to post 5-star ratings, peer commentary, and mark helpful reviews.',
    category: 'COMMUNITY',
    isEnabled: true
  },
  {
    key: 'collections',
    name: 'Personal Study Collections',
    description: 'Enables scholars to curate custom grouped folders of lecture notes and exam guides.',
    category: 'SCHOLAR',
    isEnabled: true
  },
  {
    key: 'public_profiles',
    name: 'Public Contributor Profiles',
    description: 'Public author pages highlighting published manuscripts, contributions, and badges.',
    category: 'COMMUNITY',
    isEnabled: true
  },
  {
    key: 'academic_announcements',
    name: 'Institutional Announcement Banners',
    description: 'Administrative notification alerts displayed atop scholar and admin dashboards.',
    category: 'ENGAGEMENT',
    isEnabled: true
  },
  {
    key: 'advanced_academic_filters',
    name: 'Multi-Dimensional Academic Filters',
    description: 'Faceted searching across KRMU Schools, Courses, Semesters, and Note Categories.',
    category: 'DISCOVERY',
    isEnabled: true
  },
  {
    key: 'homepage_stats',
    name: 'Homepage Live Counters',
    description: 'Displays live verified counts of published notes, verified subjects, and active scholars.',
    category: 'MARKETING',
    isEnabled: true
  },
  {
    key: 'download_tracking',
    name: 'Learning Analytics Download Velocity',
    description: 'Visualizes weekly and monthly document download trends for enrolled scholars.',
    category: 'ANALYTICS',
    isEnabled: true
  }
]);

export const DEFAULT_ADMIN_PERMISSION_SCOPES = Object.freeze([
  {
    id: 'notes:create',
    label: 'Upload Study Notes',
    description: 'Permits creating and authoring study notes in designated academic courses.',
    isGranted: true
  },
  {
    id: 'notes:review',
    label: 'Direct Publishing',
    description: 'Allows immediate publishing of authored notes into public scholar catalog.',
    isGranted: true
  },
  {
    id: 'notes:update_own',
    label: 'Edit Authored Notes',
    description: 'Modify title, description, attached file, and academic metadata of notes.',
    isGranted: true
  },
  {
    id: 'notes:delete_own',
    label: 'Unpublish & Archive',
    description: 'Take down or archive study notes from the live student discovery index.',
    isGranted: true
  },
  {
    id: 'reports:manage',
    label: 'Manage User Reports',
    description: 'Inspect and action content quality or policy reports submitted by students.',
    isGranted: true
  },
  {
    id: 'analytics:view',
    label: 'View Workspace Analytics',
    description: 'Inspect aggregate catalog reads, download velocity, and subject readership.',
    isGranted: true
  }
]);
