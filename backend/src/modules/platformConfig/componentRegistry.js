/**
 * PJ Study Controlled UI Component Registry & Schema Validator.
 * Prevents arbitrary code execution, raw script injection, and unsafe HTML
 * while allowing schema-driven customization by the Super Admin.
 */

// Regex patterns to block unsafe HTML, script tags, javascript: URIs, event handlers
const UNSAFE_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=/gi,
  /vbscript\s*:/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi
];

// Hex, rgb, or hsl color validation
const COLOR_REGEX = /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|transparent)$/;

/**
 * Sanitizes any string field by stripping malicious tags or throwing an error if unsafe.
 */
export function sanitizeString(val, fieldName = 'Field') {
  if (typeof val !== 'string') return val;
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(val)) {
      const err = new Error(`${fieldName} contains prohibited executable or script content.`);
      err.statusCode = 422;
      throw err;
    }
  }
  return val.trim();
}

/**
 * Validates a color value
 */
export function validateColor(color, fieldName = 'Color') {
  if (!color || typeof color !== 'string') return color;
  const trimmed = color.trim();
  if (!COLOR_REGEX.test(trimmed)) {
    const err = new Error(`${fieldName} must be a valid hex or rgb(a) color.`);
    err.statusCode = 422;
    throw err;
  }
  return trimmed;
}

/**
 * Component Registry Specification
 */
export const COMPONENT_REGISTRY = Object.freeze({
  // --- HOMEPAGE COMPONENTS ---
  hero: {
    name: 'Hero Section',
    allowedProps: [
      'headline',
      'highlightText',
      'description',
      'eyebrow',
      'primaryCtaText',
      'primaryCtaLink',
      'secondaryCtaText',
      'secondaryCtaLink',
      'align',
      'showShowcase',
      'isVisible'
    ],
    validate(props) {
      if (props.headline) sanitizeString(props.headline, 'Hero headline');
      if (props.description) sanitizeString(props.description, 'Hero description');
      if (props.eyebrow) sanitizeString(props.eyebrow, 'Hero eyebrow');
      if (props.primaryCtaText) sanitizeString(props.primaryCtaText, 'Primary CTA text');
      if (props.primaryCtaLink) sanitizeString(props.primaryCtaLink, 'Primary CTA link');
      if (props.align && !['left', 'center'].includes(props.align)) {
        throw new Error('Hero align must be "left" or "center".');
      }
      return true;
    }
  },

  announcement_banner: {
    name: 'Announcement Banner',
    allowedProps: ['text', 'linkText', 'linkUrl', 'variant', 'isVisible', 'priority'],
    validate(props) {
      if (props.text) sanitizeString(props.text, 'Banner text');
      if (props.linkText) sanitizeString(props.linkText, 'Banner link text');
      if (props.linkUrl) sanitizeString(props.linkUrl, 'Banner link URL');
      if (props.variant && !['emerald', 'amber', 'info', 'neutral'].includes(props.variant)) {
        throw new Error('Banner variant must be emerald, amber, info, or neutral.');
      }
      return true;
    }
  },

  features: {
    name: 'Features Grid',
    allowedProps: ['title', 'subtitle', 'columns', 'items', 'isVisible'],
    validate(props) {
      if (props.title) sanitizeString(props.title, 'Features title');
      if (props.subtitle) sanitizeString(props.subtitle, 'Features subtitle');
      if (Array.isArray(props.items)) {
        if (props.items.length > 8) throw new Error('Maximum 8 feature items allowed.');
        for (const item of props.items) {
          if (item.title) sanitizeString(item.title, 'Feature item title');
          if (item.description) sanitizeString(item.description, 'Feature item description');
        }
      }
      return true;
    }
  },

  how_it_works: {
    name: 'How It Works Steps',
    allowedProps: ['title', 'subtitle', 'steps', 'isVisible'],
    validate(props) {
      if (props.title) sanitizeString(props.title, 'Steps title');
      if (Array.isArray(props.steps)) {
        if (props.steps.length > 6) throw new Error('Maximum 6 steps allowed.');
        for (const step of props.steps) {
          if (step.title) sanitizeString(step.title, 'Step title');
          if (step.description) sanitizeString(step.description, 'Step description');
        }
      }
      return true;
    }
  },

  academic_highlights: {
    name: 'Academic Campus Highlights',
    allowedProps: ['title', 'subtitle', 'campusName', 'stats', 'isVisible'],
    validate(props) {
      if (props.title) sanitizeString(props.title, 'Highlights title');
      if (props.campusName) sanitizeString(props.campusName, 'Campus name');
      return true;
    }
  },

  trust_cta: {
    name: 'Call to Action Section',
    allowedProps: ['headline', 'description', 'buttonText', 'buttonLink', 'isVisible'],
    validate(props) {
      if (props.headline) sanitizeString(props.headline, 'CTA headline');
      if (props.description) sanitizeString(props.description, 'CTA description');
      if (props.buttonText) sanitizeString(props.buttonText, 'CTA button text');
      if (props.buttonLink) sanitizeString(props.buttonLink, 'CTA button link');
      return true;
    }
  },

  footer: {
    name: 'Footer Block',
    allowedProps: ['brandText', 'copyright', 'links', 'isVisible'],
    validate(props) {
      if (props.brandText) sanitizeString(props.brandText, 'Footer brand text');
      if (props.copyright) sanitizeString(props.copyright, 'Footer copyright');
      return true;
    }
  },

  // --- WORKSPACE & DASHBOARD COMPONENTS ---
  welcome_header: {
    name: 'Welcome Header Block',
    allowedProps: ['title', 'subtitle', 'bannerAlert', 'isVisible'],
    validate(props) {
      if (props.title) sanitizeString(props.title, 'Welcome title');
      if (props.subtitle) sanitizeString(props.subtitle, 'Welcome subtitle');
      if (props.bannerAlert && typeof props.bannerAlert === 'object') {
        if (props.bannerAlert.message) sanitizeString(props.bannerAlert.message, 'Banner alert message');
      }
      return true;
    }
  },

  stats_kpi: {
    name: 'KPI Stats Grid',
    allowedProps: ['columns', 'cards', 'isVisible'],
    validate(props) {
      if (props.columns && ![2, 3, 4].includes(Number(props.columns))) {
        throw new Error('KPI grid columns must be 2, 3, or 4.');
      }
      if (Array.isArray(props.cards)) {
        for (const card of props.cards) {
          if (card.label) sanitizeString(card.label, 'KPI Card label');
        }
      }
      return true;
    }
  },

  activity_chart: {
    name: 'Learning Activity Chart',
    allowedProps: ['chartTitle', 'defaultRange', 'chartType', 'isVisible'],
    validate(props) {
      if (props.chartTitle) sanitizeString(props.chartTitle, 'Activity chart title');
      if (props.defaultRange && !['7d', '30d', '90d'].includes(props.defaultRange)) {
        throw new Error('Default range must be 7d, 30d, or 90d.');
      }
      return true;
    }
  },

  workspace_sections: {
    name: 'Workspace Sections Layout',
    allowedProps: ['sections', 'columns', 'isVisible'],
    validate(props) {
      if (Array.isArray(props.sections)) {
        for (const s of props.sections) {
          if (s.title) sanitizeString(s.title, 'Section title');
          if (s.order !== undefined && typeof s.order !== 'number') {
            throw new Error('Section order must be a number.');
          }
        }
      }
      return true;
    }
  }
});

/**
 * Validates a complete page configuration object against the component registry
 */
export function validatePageConfiguration(pageKey, config) {
  if (!config || typeof config !== 'object') {
    const err = new Error('Configuration payload must be an object.');
    err.statusCode = 422;
    throw err;
  }

  for (const [componentKey, componentProps] of Object.entries(config)) {
    const spec = COMPONENT_REGISTRY[componentKey];
    if (!spec) {
      const err = new Error(`Component type "${componentKey}" is not registered in the schema registry.`);
      err.statusCode = 422;
      throw err;
    }
    spec.validate(componentProps);
  }

  return true;
}

/**
 * Validates a theme token object
 */
export function validateThemeConfiguration(theme) {
  if (!theme || typeof theme !== 'object') {
    const err = new Error('Theme configuration must be an object.');
    err.statusCode = 422;
    throw err;
  }

  if (theme.primaryColor) validateColor(theme.primaryColor, 'Primary color');
  if (theme.secondaryColor) validateColor(theme.secondaryColor, 'Secondary color');
  if (theme.accentColor) validateColor(theme.accentColor, 'Accent color');
  if (theme.backgroundColor) validateColor(theme.backgroundColor, 'Background color');
  if (theme.surfaceColor) validateColor(theme.surfaceColor, 'Surface color');
  if (theme.textPrimary) validateColor(theme.textPrimary, 'Primary text color');
  if (theme.textSecondary) validateColor(theme.textSecondary, 'Secondary text color');

  if (theme.borderRadius && !['0px', '4px', '6px', '8px', '12px', '16px', '9999px'].includes(theme.borderRadius)) {
    const err = new Error('Border radius must be a supported token (0px, 4px, 6px, 8px, 12px, 16px, 9999px).');
    err.statusCode = 422;
    throw err;
  }

  if (theme.fontPreset && !['jakarta-inter', 'system', 'editorial-serif', 'compact-sans'].includes(theme.fontPreset)) {
    const err = new Error('Font preset must be jakarta-inter, system, editorial-serif, or compact-sans.');
    err.statusCode = 422;
    throw err;
  }

  if (theme.logoText) sanitizeString(theme.logoText, 'Logo text');
  if (theme.logoBadge) sanitizeString(theme.logoBadge, 'Logo badge');

  return true;
}
