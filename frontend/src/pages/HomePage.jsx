import React, { useState, useEffect } from 'react';
import { getHealthStatus } from '../services/api.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import './HomePage.css';

/**
 * HomePage component displaying PJ Study branding, core platform pillars,
 * roadmap capabilities, and live backend connectivity status.
 */
export function HomePage() {
  const [healthData, setHealthData] = useState(null);
  const [healthStatus, setHealthStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyBackendHealth() {
      try {
        setHealthStatus('checking');
        const data = await getHealthStatus();
        if (isMounted) {
          setHealthData(data);
          setHealthStatus('connected');
          setErrorMessage(null);
        }
      } catch (err) {
        if (isMounted) {
          setHealthStatus('disconnected');
          setErrorMessage(err.message || 'Unable to connect to backend service');
        }
      }
    }

    verifyBackendHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="container home-hero__container">
          <div className="home-hero__badge-wrapper">
            <StatusBadge
              status={
                healthStatus === 'connected'
                  ? 'success'
                  : healthStatus === 'checking'
                    ? 'warning'
                    : 'danger'
              }
              label={
                healthStatus === 'connected'
                  ? 'Full-Stack Connected'
                  : healthStatus === 'checking'
                    ? 'Checking API Connection...'
                    : 'Backend Disconnected'
              }
              pulse={healthStatus === 'checking'}
            />
          </div>

          <h1 className="home-hero__title">PJ Study</h1>
          <p className="home-hero__tagline">Your Entire Study World, One Place.</p>
          <p className="home-hero__lead">
            A comprehensive academic notes and AI-powered study platform. Discover, upload,
            organize, and master academic materials with intelligent tools built for modern
            education.
          </p>

          <div className="home-hero__meta-card card">
            <div className="home-hero__meta-header">
              <h2 className="home-hero__meta-title">Backend Architecture Health Check</h2>
              <span className="home-hero__meta-endpoint">GET /api/v1/health</span>
            </div>

            {healthStatus === 'checking' && (
              <div className="home-hero__status-block">
                <p className="text-muted text-sm">Querying backend API health endpoint...</p>
              </div>
            )}

            {healthStatus === 'connected' && healthData && (
              <div className="home-hero__health-details">
                <div className="home-hero__stat">
                  <span className="home-hero__stat-label">API Status</span>
                  <span className="home-hero__stat-value text-success font-bold">
                    {healthData.status?.toUpperCase()}
                  </span>
                </div>
                <div className="home-hero__stat">
                  <span className="home-hero__stat-label">API Version</span>
                  <span className="home-hero__stat-value">{healthData.version}</span>
                </div>
                <div className="home-hero__stat">
                  <span className="home-hero__stat-label">Environment</span>
                  <span className="home-hero__stat-value">{healthData.environment}</span>
                </div>
                <div className="home-hero__stat">
                  <span className="home-hero__stat-label">Server Timestamp</span>
                  <span className="home-hero__stat-value home-hero__stat-value--mono text-sm">
                    {healthData.timestamp}
                  </span>
                </div>
              </div>
            )}

            {healthStatus === 'disconnected' && (
              <div className="home-hero__error-box">
                <p className="home-hero__error-title">Backend Connection Offline</p>
                <p className="home-hero__error-desc text-sm">
                  {errorMessage}. Ensure the backend Express server is running on port 5000.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="home-features">
        <div className="container">
          <div className="home-features__header text-center">
            <h2 className="home-features__title">Academic Foundation & Upcoming Capabilities</h2>
            <p className="home-features__subtitle">
              Engineered with clean separation of concerns, scalable Node.js architecture, and
              modern standard CSS.
            </p>
          </div>

          <div className="home-features__grid">
            <article className="home-features__card card">
              <div className="home-features__card-icon" aria-hidden="true">
                📚
              </div>
              <h3 className="home-features__card-title">Academic Notes Hub</h3>
              <p className="home-features__card-text">
                Centralized discovery, uploading, reading, and structured organization of verified
                curriculum notes and study material.
              </p>
              <div className="home-features__badge-row">
                <span className="feature-pill">Phase 1 Foundation</span>
              </div>
            </article>

            <article className="home-features__card card">
              <div className="home-features__card-icon" aria-hidden="true">
                🤖
              </div>
              <h3 className="home-features__card-title">AI Study Engine</h3>
              <p className="home-features__card-text">
                Document-grounded AI chat, automatic summary generation, knowledge retrieval, and
                contextual explanation engines.
              </p>
              <div className="home-features__badge-row">
                <span className="feature-pill feature-pill--planned">Planned</span>
              </div>
            </article>

            <article className="home-features__card card">
              <div className="home-features__card-icon" aria-hidden="true">
                🧠
              </div>
              <h3 className="home-features__card-title">Flashcards & Quizzes</h3>
              <p className="home-features__card-text">
                Active recall testing with automated quiz generation, spaced repetition, and
                personalized performance metrics.
              </p>
              <div className="home-features__badge-row">
                <span className="feature-pill feature-pill--planned">Planned</span>
              </div>
            </article>

            <article className="home-features__card card">
              <div className="home-features__card-icon" aria-hidden="true">
                👥
              </div>
              <h3 className="home-features__card-title">Community & Contributions</h3>
              <p className="home-features__card-text">
                Student collaborative contributions, peer-reviewed study decks, and
                educator-moderated quality standards.
              </p>
              <div className="home-features__badge-row">
                <span className="feature-pill feature-pill--planned">Planned</span>
              </div>
            </article>

            <article className="home-features__card card">
              <div className="home-features__card-icon" aria-hidden="true">
                🛡️
              </div>
              <h3 className="home-features__card-title">Admin Dashboard</h3>
              <p className="home-features__card-text">
                Comprehensive platform governance, content moderation, user management, and academic
                category administration.
              </p>
              <div className="home-features__badge-row">
                <span className="feature-pill feature-pill--planned">Planned</span>
              </div>
            </article>

            <article className="home-features__card card">
              <div className="home-features__card-icon" aria-hidden="true">
                ⚡
              </div>
              <h3 className="home-features__card-title">Prisma & MySQL Backend</h3>
              <p className="home-features__card-text">
                Robust relational persistence layer featuring strict schema validation, connection
                lifecycle safety, and versioned REST endpoints.
              </p>
              <div className="home-features__badge-row">
                <span className="feature-pill">Phase 1 Foundation</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
