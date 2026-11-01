import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import Container from '../components/layout/Container.jsx';
import Modal from '../components/common/Modal.jsx';
import { getHealthStatus } from '../services/api.js';
import './HomePage.css';

/**
 * Editorial HomePage component for PJ Study.
 */
export function HomePage() {
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [exploreModalOpen, setExploreModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadHealth() {
      try {
        const data = await getHealthStatus();
        if (isMounted) {
          setHealthData(data);
          setHealthLoading(false);
        }
      } catch {
        if (isMounted) {
          setHealthLoading(false);
        }
      }
    }
    loadHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const features = [
    {
      step: '01',
      title: 'Discover Study Notes',
      kicker: 'Curated Library',
      description:
        'Access structured, peer-reviewed notes organized by university, subject, and course curriculum. Clear formatting replaces scattered PDFs and disorganized study files.',
      status: 'Phase 1 Foundation'
    },
    {
      step: '02',
      title: 'Read and Organize',
      kicker: 'Focused Reading',
      description:
        'An intentional digital reading environment designed for retention. Annotate key points, categorize topics into custom notebooks, and build a lifelong personal archive.',
      status: 'Phase 1 Foundation'
    },
    {
      step: '03',
      title: 'AI-Powered Learning',
      kicker: 'Intelligent Synthesis',
      description:
        'Ask questions directly against your study materials. Generate contextual summaries, extract difficult formulas, and produce targeted flashcard decks from complex lecture notes.',
      status: 'Roadmap'
    },
    {
      step: '04',
      title: 'Learn Together',
      kicker: 'Community & Attribution',
      description:
        'Contribute verified study notes to help fellow scholars. Every contributor receives verified author badges and recognition based on peer reviews and community feedback.',
      status: 'Roadmap'
    }
  ];

  const steps = [
    {
      number: 'I',
      title: 'Curated Ingestion',
      description:
        'Comprehensive notes uploaded by students and educators are parsed, verified, and mapped to standardized academic taxonomies.'
    },
    {
      number: 'II',
      title: 'Structured Retention',
      description:
        'Clean typography, semantic headings, and distraction-free reader layouts optimize cognitive clarity during intense study sessions.'
    },
    {
      number: 'III',
      title: 'Contextual Recall',
      description:
        'Future AI modules provide active recall exercises, spaced repetition cues, and instant clarification grounded strictly in your source documents.'
    }
  ];

  return (
    <div className="home-root">
      {/* Editorial Hero Section */}
      <section className="home-hero">
        <Container size="default" className="home-hero__container">
          <div className="home-hero__badge-wrap">
            <Badge variant="success" label="Academic Study Platform" dot />
            <span className="home-hero__edition">2026 Edition</span>
          </div>

          <h1 className="home-hero__headline">
            Your Entire Study World, <br className="d-none d-md-block" />
            <span className="text-serif-italic">One Place.</span>
          </h1>

          <p className="home-hero__description">
            Discover quality study notes, organize your learning, and turn complex subjects into
            clear concepts with PJ Study.
          </p>

          <div className="home-hero__actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setExploreModalOpen(true)}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              }
              iconPosition="right"
            >
              Explore Notes
            </Button>
            <Link to="/app">
              <Button variant="secondary" size="lg">
                Start Learning
              </Button>
            </Link>
          </div>

          <div className="home-hero__meta">
            <span>Rigorous Academic Catalog</span>
            <span className="home-hero__meta-dot" aria-hidden="true">
              &bull;
            </span>
            <span>No Advertisements</span>
            <span className="home-hero__meta-dot" aria-hidden="true">
              &bull;
            </span>
            <span>Designed for Deep Focus</span>
          </div>
        </Container>
      </section>

      {/* Concise Platform Introduction */}
      <section className="home-intro">
        <Container size="narrow">
          <div className="home-intro__card card text-center">
            <span className="editorial-kicker">Platform Philosophy</span>
            <h2 className="home-intro__title">Built for Students Who Value Substance Over Noise</h2>
            <p className="home-intro__body">
              Modern academic study shouldn't mean drowning in unverified forum threads or wrestling
              with generic AI chatbots hallucinating facts. PJ Study establishes a calm, verified
              digital sanctuary where structured notes and document-grounded intelligence unite.
            </p>
          </div>
        </Container>
      </section>

      {/* Feature Section */}
      <section id="features" className="home-features">
        <Container size="default">
          <div className="home-features__header">
            <div>
              <span className="editorial-kicker">Core Pillars & Roadmap</span>
              <h2 className="home-features__headline">Four Foundational Pillars</h2>
            </div>
            <p className="home-features__subheading">
              Every feature in PJ Study is architected around academic integrity, readability, and
              genuine cognitive mastery.
            </p>
          </div>

          <div className="home-features__grid">
            {features.map((feat, idx) => (
              <article key={idx} className="feature-card card">
                <div className="feature-card__header">
                  <span className="feature-card__step">{feat.step}</span>
                  <Badge
                    variant={feat.status.includes('Foundation') ? 'success' : 'default'}
                    size="sm"
                    label={feat.status}
                  />
                </div>
                <span className="feature-card__kicker">{feat.kicker}</span>
                <h3 className="feature-card__title">{feat.title}</h3>
                <p className="feature-card__description">{feat.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="home-process">
        <Container size="default">
          <div className="text-center mb-12">
            <span className="editorial-kicker">The Study Workflow</span>
            <h2 className="home-process__headline">How PJ Study Works</h2>
            <p className="home-process__subhead">
              From raw lecture scribbles to refined intellectual mastery in three disciplined
              phases.
            </p>
          </div>

          <div className="home-process__grid">
            {steps.map((st, idx) => (
              <div key={idx} className="process-step">
                <div className="process-step__roman">{st.number}</div>
                <h3 className="process-step__title">{st.title}</h3>
                <p className="process-step__description">{st.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Live System Health & Backend Architecture Card */}
      <section className="home-system">
        <Container size="narrow">
          <div className="system-card card">
            <div className="system-card__header">
              <div>
                <span className="editorial-kicker">Full-Stack Architecture Status</span>
                <h3 className="system-card__title">Live System Connectivity</h3>
              </div>
              <Badge
                variant={healthData?.status === 'healthy' ? 'success' : 'warning'}
                label={healthData?.status === 'healthy' ? 'API Operational' : 'Connecting...'}
                dot
                pulse={healthLoading}
              />
            </div>

            <p className="system-card__desc">
              Connected to backend Express API running Node.js ES modules and Prisma ORM on MySQL.
            </p>

            {healthData && (
              <div className="system-card__metrics">
                <div className="system-metric">
                  <span className="system-metric__label">Product</span>
                  <span className="system-metric__val font-semibold">{healthData.product}</span>
                </div>
                <div className="system-metric">
                  <span className="system-metric__label">API Version</span>
                  <span className="system-metric__val font-mono">{healthData.version}</span>
                </div>
                <div className="system-metric">
                  <span className="system-metric__label">Environment</span>
                  <span className="system-metric__val">{healthData.environment}</span>
                </div>
                <div className="system-metric">
                  <span className="system-metric__label">Uptime</span>
                  <span className="system-metric__val">{healthData.uptimeSeconds}s</span>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Final Call To Action */}
      <section className="home-cta">
        <Container size="narrow">
          <div className="home-cta__inner text-center">
            <span className="editorial-kicker">Join the Community</span>
            <h2 className="home-cta__headline">
              Begin Your Journey to <br />
              <span className="text-serif-italic">Academic Mastery</span>
            </h2>
            <p className="home-cta__body">
              Explore the design system, inspect the student application shell, and stay tuned for
              the upcoming note publishing release.
            </p>
            <div className="home-cta__actions">
              <Link to="/app">
                <Button variant="primary" size="lg">
                  Launch Study Workspace
                </Button>
              </Link>
              <Link to="/design-system">
                <Button variant="outline" size="lg">
                  Inspect Design Tokens
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Explore Notes Preview Modal */}
      <Modal
        isOpen={exploreModalOpen}
        onClose={() => setExploreModalOpen(false)}
        title="Explore Academic Notes"
        description="The note catalog is currently in Phase 1 foundation."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setExploreModalOpen(false)}>
              Close
            </Button>
            <Link to="/app">
              <Button variant="primary" size="sm" onClick={() => setExploreModalOpen(false)}>
                Open Workspace
              </Button>
            </Link>
          </>
        }
      >
        <p className="mb-4">
          The note ingestion pipeline and subject indexing engine are scheduled for implementation
          in <strong>Phase 2</strong>. In this release, the complete design system, application
          shell, and component architecture are active.
        </p>
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-small)'
          }}
        >
          <span className="font-semibold d-block mb-1">Upcoming Verified Subjects:</span>
          <span className="text-secondary text-sm">
            Computer Science, Molecular Biology, Macroeconomics, Organic Chemistry, Jurisprudence,
            and Pure Mathematics.
          </span>
        </div>
      </Modal>
    </div>
  );
}

export default HomePage;
