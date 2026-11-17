import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PwaManager.css';

const DISMISSED_KEY = 'pj_pwa_install_dismissed_until';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Detects if the current user agent is iOS Safari.
 */
function isIosSafari() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWebkit = /WebKit/i.test(ua);
  const isChromeOrFirefox = /CriOS|FxiOS|OPiOS|mercury/i.test(ua);
  return isIos && isWebkit && !isChromeOrFirefox;
}

/**
 * Checks if the application is currently running in standalone (PWA installed) mode.
 */
function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Integrated PWA Lifecycle Manager:
 * 1. Service Worker update notification (safe prompt, never interrupts uploads).
 * 2. Subtle app installation prompt for Chrome/Edge/Android.
 * 3. iOS Safari "Add to Home Screen" instructions.
 * 4. Online / Offline network status banner.
 */
export function PwaManager() {
  const location = useLocation();

  // 1. Service Worker Registration & Update Hook
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check for service worker updates periodically (every 1 hour)
        setInterval(() => {
          r.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('PWA Service Worker registration notice:', error?.message);
    }
  });

  // 2. Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // 3. Network Status State
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showOnlineRestored, setShowOnlineRestored] = useState(false);

  // Check standalone mode on mount
  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
    }
  }, []);

  // Listen to beforeinstallprompt (Chrome, Android, Edge)
  useEffect(() => {
    if (isStandaloneMode()) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user previously dismissed prompt
      const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return;
      }

      // Delay prompt appearance so it doesn't interrupt initial page load
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3500);

      return () => clearTimeout(timer);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowIosPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check iOS Safari eligibility
  useEffect(() => {
    if (isStandaloneMode() || isInstalled) return;

    if (isIosSafari()) {
      const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return;
      }

      const timer = setTimeout(() => {
        setShowIosPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  // Listen to Online / Offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineRestored(true);
      const timer = setTimeout(() => setShowOnlineRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Android/Chrome Install Action
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  }, [deferredPrompt]);

  // Dismiss Install Prompt with cooldown
  const handleDismissInstall = useCallback(() => {
    setShowInstallPrompt(false);
    setShowIosPrompt(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS));
  }, []);

  // Check if current route is an active upload or creation form (prevent reload interruption)
  const isFormActive =
    location.pathname.includes('/notes/new') ||
    location.pathname.includes('/edit') ||
    location.pathname.includes('/admin/ui-builder');

  const handleUpdate = useCallback(() => {
    if (isFormActive) {
      const confirmReload = window.confirm(
        'A new update is available. You have an active form open. Are you sure you want to update now?'
      );
      if (!confirmReload) return;
    }
    updateServiceWorker(true);
  }, [isFormActive, updateServiceWorker]);

  return (
    <>
      {/* 1. Offline & Online Status Banners */}
      {isOffline && (
        <div className="pwa-network-banner pwa-network-banner--offline" role="alert" aria-live="assertive">
          <svg className="pwa-network-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
          <span>You are currently offline. Using cached study workspace. Live notes require an internet connection.</span>
        </div>
      )}

      {showOnlineRestored && !isOffline && (
        <div className="pwa-network-banner pwa-network-banner--online" role="status" aria-live="polite">
          <svg className="pwa-network-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
          <span>Internet connection restored. Live cloud features active.</span>
        </div>
      )}

      {/* 2. New Version Available Update Toast */}
      {needRefresh && (
        <div className="pwa-update-toast" role="alert" aria-live="polite">
          <div className="pwa-update-toast__content">
            <span className="pwa-update-toast__badge">Update Available</span>
            <p className="pwa-update-toast__message">
              A newer version of PJ Study is ready. Refresh to activate new features and security patches.
            </p>
          </div>
          <div className="pwa-update-toast__actions">
            <button
              type="button"
              className="pwa-btn pwa-btn--primary"
              onClick={handleUpdate}
              aria-label="Refresh application to apply update"
            >
              Update Now
            </button>
            <button
              type="button"
              className="pwa-btn pwa-btn--ghost"
              onClick={() => setNeedRefresh(false)}
              aria-label="Dismiss update notification"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* 3. Native PWA Install Banner (Chrome, Android, Edge) */}
      {showInstallPrompt && !isInstalled && deferredPrompt && (
        <aside className="pwa-install-banner" aria-label="Install PJ Study App">
          <div className="pwa-install-banner__brand">
            <div className="pwa-install-banner__logo" aria-hidden="true">
              PJ
            </div>
            <div className="pwa-install-banner__text">
              <span className="pwa-install-banner__title">Install PJ Study</span>
              <span className="pwa-install-banner__desc">Quick access from your home screen with offline workspace.</span>
            </div>
          </div>
          <div className="pwa-install-banner__actions">
            <button
              type="button"
              className="pwa-btn pwa-btn--primary pwa-btn--sm"
              onClick={handleInstallClick}
            >
              Install App
            </button>
            <button
              type="button"
              className="pwa-btn pwa-btn--close"
              onClick={handleDismissInstall}
              aria-label="Close install prompt"
            >
              ×
            </button>
          </div>
        </aside>
      )}

      {/* 4. iOS Safari Add to Home Screen Modal Guidance */}
      {showIosPrompt && !isInstalled && (
        <aside className="pwa-install-banner pwa-install-banner--ios" aria-label="Add PJ Study to iOS Home Screen">
          <div className="pwa-install-banner__brand">
            <div className="pwa-install-banner__logo" aria-hidden="true">
              PJ
            </div>
            <div className="pwa-install-banner__text">
              <span className="pwa-install-banner__title">Install on iPhone / iPad</span>
              <span className="pwa-install-banner__desc">
                Tap the Share icon <span className="pwa-ios-icon" aria-hidden="true">⎋</span> below, then select <strong>Add to Home Screen</strong> <span className="pwa-ios-icon" aria-hidden="true">⊞</span>.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="pwa-btn pwa-btn--close"
            onClick={handleDismissInstall}
            aria-label="Dismiss iOS install guidance"
          >
            ×
          </button>
        </aside>
      )}
    </>
  );
}

export default PwaManager;
