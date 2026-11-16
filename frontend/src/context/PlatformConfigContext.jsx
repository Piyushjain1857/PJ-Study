import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { platformConfigService } from '../services/platformConfigService.js';
import { useAuth } from './AuthContext.jsx';

const PlatformConfigContext = createContext(null);

/**
 * Injects dynamic CSS variables into document.documentElement style based on theme tokens.
 */
function applyThemeCustomProperties(themeConfig) {
  if (!themeConfig || typeof themeConfig !== 'object') return;
  const root = document.documentElement;

  if (themeConfig.primaryColor) root.style.setProperty('--color-primary', themeConfig.primaryColor);
  if (themeConfig.accentColor) root.style.setProperty('--color-accent', themeConfig.accentColor);
  if (themeConfig.bgPrimary) root.style.setProperty('--color-bg-primary', themeConfig.bgPrimary);
  if (themeConfig.bgSecondary) root.style.setProperty('--color-bg-secondary', themeConfig.bgSecondary);
  if (themeConfig.textPrimary) root.style.setProperty('--color-text-primary', themeConfig.textPrimary);
  if (themeConfig.textSecondary) root.style.setProperty('--color-text-secondary', themeConfig.textSecondary);
  if (themeConfig.borderColor) root.style.setProperty('--color-border', themeConfig.borderColor);

  if (themeConfig.borderRadius === 'sm') {
    root.style.setProperty('--radius-sm', '2px');
    root.style.setProperty('--radius-md', '4px');
    root.style.setProperty('--radius-lg', '8px');
  } else if (themeConfig.borderRadius === 'lg') {
    root.style.setProperty('--radius-sm', '8px');
    root.style.setProperty('--radius-md', '14px');
    root.style.setProperty('--radius-lg', '20px');
  } else if (themeConfig.borderRadius === 'full') {
    root.style.setProperty('--radius-sm', '8px');
    root.style.setProperty('--radius-md', '16px');
    root.style.setProperty('--radius-lg', '9999px');
  } else {
    // Default md
    root.style.setProperty('--radius-sm', '4px');
    root.style.setProperty('--radius-md', '8px');
    root.style.setProperty('--radius-lg', '12px');
  }

  if (themeConfig.fontFamily === 'serif') {
    root.style.setProperty('--font-sans', 'Georgia, Cambria, serif');
  } else if (themeConfig.fontFamily === 'mono') {
    root.style.setProperty('--font-sans', 'ui-monospace, Menlo, monospace');
  } else {
    root.style.setProperty('--font-sans', 'Inter, system-ui, -apple-system, sans-serif');
  }
}

export function PlatformConfigProvider({ children }) {
  const { user } = useAuth();
  const [publicConfig, setPublicConfig] = useState(null);
  const [workspaceConfig, setWorkspaceConfig] = useState(null);
  const [features, setFeatures] = useState({});
  const [theme, setTheme] = useState(null);
  const [navigation, setNavigation] = useState(null);
  const [pageConfig, setPageConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      if (user) {
        const wsData = await platformConfigService.getWorkspaceConfig();
        if (wsData) {
          setWorkspaceConfig(wsData);
          setTheme(wsData.theme);
          setFeatures(wsData.features || {});
          setNavigation(wsData.navigation);
          setPageConfig(wsData.pageConfig);
          applyThemeCustomProperties(wsData.theme);
        }
      } else {
        const pubData = await platformConfigService.getPublicConfig();
        if (pubData) {
          setPublicConfig(pubData);
          setTheme(pubData.theme);
          setFeatures(pubData.features || {});
          applyThemeCustomProperties(pubData.theme);
        }
      }
    } catch (err) {
      // Graceful fallback to default CSS and application states
      console.warn('PlatformConfigProvider: loaded default layout tokens', err?.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isFeatureEnabled = useCallback(
    (featureKey) => {
      if (!features || Object.keys(features).length === 0) return true; // Default enabled
      if (typeof features[featureKey] === 'boolean') return features[featureKey];
      if (features[featureKey]?.isEnabled !== undefined) return features[featureKey].isEnabled;
      return true;
    },
    [features]
  );

  const value = {
    publicConfig,
    workspaceConfig,
    theme,
    features,
    navigation,
    pageConfig,
    isLoading,
    isFeatureEnabled,
    reloadConfig: fetchConfig
  };

  return (
    <PlatformConfigContext.Provider value={value}>
      {children}
    </PlatformConfigContext.Provider>
  );
}

export function usePlatformConfig() {
  const ctx = useContext(PlatformConfigContext);
  if (!ctx) {
    return {
      publicConfig: null,
      workspaceConfig: null,
      theme: null,
      features: {},
      navigation: null,
      pageConfig: null,
      isLoading: false,
      isFeatureEnabled: () => true,
      reloadConfig: () => {}
    };
  }
  return ctx;
}

export default PlatformConfigContext;
