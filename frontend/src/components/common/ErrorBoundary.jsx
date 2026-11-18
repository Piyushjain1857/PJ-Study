import React, { Component } from 'react';
import { useRouteError } from 'react-router-dom';

/**
 * Route-level Error Boundary for React Router v6.
 * Catches errors during route rendering and displays an elegant, branded fallback
 * instead of the default unstyled "Unexpected Application Error!" developer screen.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const isDev = Boolean(import.meta.env && import.meta.env.DEV);

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isServerUnavailable =
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.message?.includes('Network Error') ||
    error?.status === 502 ||
    error?.status === 503 ||
    error?.status === 504;

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const badgeText = isOffline
    ? 'Offline Notice'
    : isServerUnavailable
      ? 'Server Unavailable'
      : 'Academic Portal Notice';

  const headingText = isOffline
    ? 'No Internet Connection'
    : isServerUnavailable
      ? 'Academic Server Waking Up'
      : 'Something Went Unexpectedly Wrong';

  const bodyText = isOffline
    ? 'PJ Study could not load this view because your device is currently offline. Please reconnect to the internet and click Try Again.'
    : isServerUnavailable
      ? 'The cloud server took longer to respond or is starting up. Please wait a few moments and click Try Again.'
      : 'The study application encountered an issue while loading this page. Your account and academic resources remain completely secure.';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background, #faf9f6)',
        padding: '24px',
        fontFamily:
          'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        color: 'var(--color-text-primary, #151816)'
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #e6e3da)',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 12px 32px -4px rgba(21, 24, 22, 0.08)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: isOffline ? 'rgba(217, 119, 6, 0.1)' : 'rgba(181, 52, 52, 0.1)',
            color: isOffline ? '#d97706' : 'var(--color-danger, #b53434)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            marginBottom: '16px'
          }}
          aria-hidden="true"
        >
          {isOffline ? '📶' : isServerUnavailable ? '📡' : '⚠️'}
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            backgroundColor: isOffline ? 'rgba(217, 119, 6, 0.08)' : 'rgba(181, 52, 52, 0.08)',
            color: isOffline ? '#d97706' : 'var(--color-danger, #b53434)',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: '4px',
            marginBottom: '12px'
          }}
        >
          {badgeText}
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
            fontSize: '1.65rem',
            fontWeight: 700,
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em'
          }}
        >
          {headingText}
        </h1>

        <p
          style={{
            fontSize: '0.925rem',
            color: 'var(--color-text-secondary, #4b524d)',
            lineHeight: 1.55,
            margin: '0 0 28px 0'
          }}
        >
          {bodyText}
        </p>

        {isDev && error && (
          <details
            style={{
              textAlign: 'left',
              backgroundColor: 'var(--color-surface-subtle, #f7f6f1)',
              border: '1px solid var(--color-border, #e6e3da)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              marginBottom: '24px',
              overflowX: 'auto'
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-danger)' }}>
              Developer Diagnostics: {error?.statusText || error?.name || 'Error'}
            </summary>
            <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {error?.message || (typeof error === 'string' ? error : JSON.stringify(error, null, 2))}
              {error?.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        )}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={handleReload}
            style={{
              backgroundColor: 'var(--color-primary, #1b4d36)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 22px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 140ms ease'
            }}
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary, #151816)',
              border: '1px solid var(--color-border-strong, #b5b1a4)',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Return to Library Home
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Enterprise React Error Boundary for PJ Study.
 * Catches unhandled runtime exceptions in the component tree, preventing
 * complete application crashes and presenting an accessible, helpful recovery screen.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PJ Study Runtime Exception]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env && import.meta.env.DEV);

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-background, #faf9f6)',
            padding: '24px',
            fontFamily:
              'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
            color: 'var(--color-text-primary, #151816)'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e6e3da)',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: '0 12px 32px -4px rgba(21, 24, 22, 0.08)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(181, 52, 52, 0.1)',
                color: 'var(--color-danger, #b53434)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '16px'
              }}
              aria-hidden="true"
            >
              ⚠️
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                backgroundColor: 'rgba(181, 52, 52, 0.08)',
                color: 'var(--color-danger, #b53434)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                borderRadius: '4px',
                marginBottom: '12px'
              }}
            >
              Application Error
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
                fontSize: '1.65rem',
                fontWeight: 700,
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em'
              }}
            >
              Something Went Unexpectedly Wrong
            </h1>

            <p
              style={{
                fontSize: '0.925rem',
                color: 'var(--color-text-secondary, #4b524d)',
                lineHeight: 1.55,
                margin: '0 0 28px 0'
              }}
            >
              The study application encountered an unhandled exception while rendering this view.
              Your account and stored manuscripts remain completely secure.
            </p>

            {isDev && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  backgroundColor: 'var(--color-surface-subtle, #f7f6f1)',
                  border: '1px solid var(--color-border, #e6e3da)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  marginBottom: '24px',
                  overflowX: 'auto'
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-danger)' }}>
                  Developer Diagnostics: {this.state.error.name || 'Error'}
                </summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  backgroundColor: 'var(--color-primary, #1b4d36)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 22px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 140ms ease'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-primary, #151816)',
                  border: '1px solid var(--color-border-strong, #b5b1a4)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-primary, #151816)',
                  border: '1px solid var(--color-border-strong, #b5b1a4)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Return to Library Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
