import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Container from '../components/layout/Container.jsx';
import SEO from '../components/common/SEO.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlatformConfig } from '../context/PlatformConfigContext.jsx';
import './HomePage.css';

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'PJ Study',
      description: 'Your Entire Study World, One Place. Educational notes and curriculum discovery.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://pjstudy.com/notes/explore?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'EducationalOrganization',
      name: 'PJ Study Academic Library',
      description: 'Curated university study materials, peer-reviewed notes, and course taxonomies.'
    }
  ]
};

/**
 * World-Class EdTech Landing Page for PJ Study.
 * Editorial typography, Apple-inspired clarity, deep forest green branding,
 * and high-converting product showcase previews.
 */
export function HomePage() {
  const { isAuthenticated } = useAuth();
  const { publicConfig } = usePlatformConfig();
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('catalog');

  const heroConfig = publicConfig?.homepage?.hero;
  const heroBadge = heroConfig?.badge || 'Academic Portal';
  const heroHeadline = heroConfig?.title || 'Everything You Need to Study Smarter.';
  const heroDescription = heroConfig?.subtitle ||
    'Discover syllabus-accurate notes, lecture manuscripts, and curriculum solutions tailored ';
  const heroCtaText = heroConfig?.primaryCtaText || 'Explore Study Notes';

  return (
    <div className="home-root">
      <SEO
        title="PJ Study | Academic Library"
        description="Discover organized academic notes, study resources, and course-wise learning materials with PJ Study"
        canonical="/"
        schema={HOME_SCHEMA}
      />
      {/* =========================================================================
          1. HERO SECTION — Split Layout with High-Fidelity Product Showcase
          ========================================================================= */}
      <section className="hero-section">
        <Container size="default" className="hero-container">
          <div className="hero-grid">
            {/* LEFT COLUMN: Editorial Value Proposition */}
            <div className="hero-content">
              <div className="hero-eyebrow-wrap">
                <span className="hero-eyebrow-dot" aria-hidden="true" />
                <span className="hero-eyebrow">{heroBadge}</span>
              </div>

              <h1 className="hero-headline">
                {heroHeadline}
              </h1>

              <p className="hero-description">
                {heroDescription}
              </p>

              <div className="hero-actions">
                <Link to="/notes/explore" className="hero-btn-link">
                  <Button
                    variant="primary"
                    size="lg"
                    className="hero-primary-btn"
                    icon={
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    }
                    iconPosition="right"
                  >
                    {heroCtaText}
                  </Button>
                </Link>

                <a href="#how-it-works" className="hero-btn-link">
                  <Button variant="secondary" size="lg" className="hero-secondary-btn">
                    How It Works
                  </Button>
                </a>
              </div>

              {/* Supported Academic Programs Strip */}
              <div className="hero-programs">
                <span className="hero-programs-label">Curated Degrees:</span>
                <div className="hero-programs-pills">
                  <span className="hero-program-pill">B.Tech</span>
                  <span className="hero-program-pill">BCA</span>
                  <span className="hero-program-pill">B.Sc.</span>
                  <span className="hero-program-pill">MCA</span>
                  <span className="hero-program-pill">M.Tech</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Realistic Interactive Product UI Showcase */}
            <div className="hero-showcase" aria-hidden="true">
              <div className="showcase-glow" />
              <div className="showcase-window">
                {/* Mock Window Top Bar */}
                <div className="showcase-window-bar">
                  <div className="showcase-traffic-lights">
                    <span className="traffic-dot traffic-dot--red" />
                    <span className="traffic-dot traffic-dot--yellow" />
                    <span className="traffic-dot traffic-dot--green" />
                  </div>
                  <div className="showcase-search-bar">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>Search Data Structures, DBMS, Operating Systems...</span>
                  </div>
                </div>

                {/* Mock UI Filters */}
                <div className="showcase-filter-row">
                  <span className="showcase-filter-pill showcase-filter-pill--active">B.Tech</span>
                  <span className="showcase-filter-pill">BCA</span>
                  <span className="showcase-filter-pill">B.Sc.</span>
                  <span className="showcase-filter-pill">MCA</span>
                  <span className="showcase-filter-pill">M.Tech</span>
                  <span className="showcase-sem-pill">Semester 3</span>
                </div>

                {/* Primary Mock Note Card */}
                <div className="showcase-note-card">
                  <div className="showcase-card-top">
                    <div className="showcase-card-badge">
                      <span className="badge-bullet" />
                      <span>Lecture Notes</span>
                    </div>
                    <span className="showcase-rating-pill">★ 4.9 (28 reviews)</span>
                  </div>

                  <h4 className="showcase-card-title">
                    Data Structures & Algorithms: Divide & Conquer
                  </h4>

                  <p className="showcase-card-abstract">
                    Comprehensive study manuscript covering Recurrence Relations, Master Theorem,
                    Binary Search Trees, and AVL Rotations with annotated proof diagrams.
                  </p>

                  <div className="showcase-card-footer">
                    <div className="showcase-author-meta">
                      <div className="showcase-avatar">CS</div>
                      <div>
                        <span className="showcase-author-name">Scholar Contributor</span>
                        <span className="showcase-author-dept">Computer Science • Sem 3</span>
                      </div>
                    </div>
                    <div className="showcase-action-btn">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>PDF</span>
                    </div>
                  </div>
                </div>

                {/* Floating Micro-Badge 1 */}
                <div className="showcase-floating-badge showcase-floating-badge--top">
                  <div className="floating-badge-icon">✓</div>
                  <div>
                    <span className="floating-badge-title">55+ Subjects Mapped</span>
                    <span className="floating-badge-sub">Semester 1 to 8 Ready</span>
                  </div>
                </div>

                {/* Floating Micro-Badge 2 */}
                <div className="showcase-floating-badge showcase-floating-badge--bottom">
                  <div className="floating-badge-icon floating-badge-icon--gold">★</div>
                  <div>
                    <span className="floating-badge-title">100% Ad-Free Learning</span>
                    <span className="floating-badge-sub">Focused Digital Study</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          2. TRUST & VALUE STRIP — Compact Architectural Credibility
          ========================================================================= */}
      <section className="value-strip">
        <Container size="default">
          <div className="value-strip-grid">
            <div className="value-strip-item">
              <div className="value-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span className="value-strip-text">Organized Academic Resources</span>
            </div>

            <div className="value-strip-separator" aria-hidden="true" />

            <div className="value-strip-item">
              <div className="value-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <span className="value-strip-text">Easy Subject Discovery</span>
            </div>

            <div className="value-strip-separator" aria-hidden="true" />

            <div className="value-strip-item">
              <div className="value-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span className="value-strip-text">Focused Learning Experience</span>
            </div>

            <div className="value-strip-separator" aria-hidden="true" />

            <div className="value-strip-item">
              <div className="value-strip-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span className="value-strip-text">Notes You Can Access Anywhere</span>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          3. FEATURES SECTION — Editorial Bento Grid
          ========================================================================= */}
      <section className="features-section" id="features">
        <Container size="default">
          <div className="section-header text-center">
            <span className="section-eyebrow">BUILT FOR BETTER LEARNING</span>
            <h2 className="section-title">Everything Your Study Routine Needs.</h2>
            <p className="section-desc">
              A focused academic workspace designed to make finding, organizing, and revisiting
              study material easier.
            </p>
          </div>

          <div className="bento-grid">
            {/* Card 1: Large Featured Card */}
            <div className="bento-card bento-card--large bento-card--emerald">
              <div className="bento-card-badge">Core Engine</div>
              <div className="bento-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="bento-card-title">Explore Academic Notes</h3>
              <p className="bento-card-text">
                Browse verified lecture transcripts, past exam solution keys, and comprehensive lab
                manuals organized by course curriculum and standard subject taxonomies.
              </p>
              <div className="bento-mini-categories">
                <span className="mini-cat-tag">Lecture Notes</span>
                <span className="mini-cat-tag">Exam Prep & Solutions</span>
                <span className="mini-cat-tag">Lab Manuals</span>
                <span className="mini-cat-tag">Cheat Sheets</span>
              </div>
            </div>

            {/* Card 2: Course & Semester Discovery */}
            <div className="bento-card">
              <div className="bento-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="bento-card-title">Course & Semester Discovery</h3>
              <p className="bento-card-text">
                Navigate directly into your exact degree program (B.Tech, BCA, B.Sc., MCA, M.Tech)
                and filter through Semesters 1 to 8 without hunting through generic folders.
              </p>
            </div>

            {/* Card 3: Download Study Resources */}
            <div className="bento-card">
              <div className="bento-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="bento-card-title">Download Study Resources</h3>
              <p className="bento-card-text">
                Read formatted markdown notes with syntax highlighting in-browser or download high-fidelity
                PDFs for completely offline, distraction-free study sessions.
              </p>
            </div>

            {/* Card 4: Personal Study Library */}
            <div className="bento-card">
              <div className="bento-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="bento-card-title">Save Notes to Your Library</h3>
              <p className="bento-card-text">
                Organize custom study collections, save one-click bookmarks, and review your full
                download history right inside your personal scholar dashboard.
              </p>
            </div>

            {/* Card 5: Personalized Recommendations */}
            <div className="bento-card">
              <div className="bento-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h3 className="bento-card-title">Personalized Recommendations</h3>
              <p className="bento-card-text">
                Curriculum-aware recommendation engine analyzes your academic degree and current
                semester to suggest highest-yield study resources when exams approach.
              </p>
            </div>

            {/* Card 6: Large Featured Ratings & Reviews */}
            <div className="bento-card bento-card--large bento-card--warm">
              <div className="bento-card-badge">Community Moderation</div>
              <div className="bento-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3 className="bento-card-title">Ratings & Peer Reviews</h3>
              <p className="bento-card-text">
                Every note features honest scholar ratings, helpful votes, and peer reviews so you
                spend study time exclusively on accurate, high-quality course material.
              </p>
              <div className="bento-rating-preview">
                <span className="rating-star-cluster">★★★★★</span>
                <span className="rating-sample-text">Verified student reviews & helpful votes</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          4. HOW IT WORKS — 3-Step Scholar Learning Journey
          ========================================================================= */}
      <section className="process-section" id="how-it-works">
        <Container size="default">
          <div className="section-header text-center">
            <span className="section-eyebrow">SIMPLE 3-STEP JOURNEY</span>
            <h2 className="section-title">From Search to Study in Three Simple Steps.</h2>
            <p className="section-desc">
              Designed around how real scholars actually learn: fast discovery, trusted access, and
              lifelong personal organization.
            </p>
          </div>

          <div className="process-timeline">
            <div className="process-step-card">
              <div className="process-step-header">
                <span className="process-step-num">01</span>
                <div className="process-step-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
              <h3 className="process-step-title">Find Your Notes</h3>
              <p className="process-step-text">
                Browse academic material using course, semester, and subject filters. Search by topic
                or browse the complete curriculum catalog.
              </p>
            </div>

            <div className="process-step-card">
              <div className="process-step-header">
                <span className="process-step-num">02</span>
                <div className="process-step-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              </div>
              <h3 className="process-step-title">Preview and Download</h3>
              <p className="process-step-text">
                Review approved study resources with instant in-browser previews and download verified
                PDF manuscripts for offline revision.
              </p>
            </div>

            <div className="process-step-card">
              <div className="process-step-header">
                <span className="process-step-num">03</span>
                <div className="process-step-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="process-step-title">Organize and Learn</h3>
              <p className="process-step-text">
                Save useful notes into your personal study library, build exam collections, and focus
                on deep comprehension without clutter.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          5. PRODUCT SHOWCASE SECTION — Deep Forest Contrast Environment
          ========================================================================= */}
      <section className="dark-showcase-section">
        <Container size="default">
          <div className="section-header text-center section-header--dark">
            <span className="section-eyebrow section-eyebrow--gold">ONE FOCUSED SPACE</span>
            <h2 className="section-title section-title--light">
              One Focused Space for Your Academic Journey.
            </h2>
            <p className="section-desc section-desc--light">
              A distraction-free interface built for rapid comprehension and organized study
              routines.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="showcase-tabs-nav">
            <button
              type="button"
              className={`showcase-tab-btn ${activeShowcaseTab === 'catalog' ? 'showcase-tab-btn--active' : ''}`}
              onClick={() => setActiveShowcaseTab('catalog')}
            >
              Curriculum Exploration
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeShowcaseTab === 'reader' ? 'showcase-tab-btn--active' : ''}`}
              onClick={() => setActiveShowcaseTab('reader')}
            >
              Document Reading Mode
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeShowcaseTab === 'library' ? 'showcase-tab-btn--active' : ''}`}
              onClick={() => setActiveShowcaseTab('library')}
            >
              Personal Study Library
            </button>
          </div>

          {/* Interactive Screen Display */}
          <div className="showcase-screen-wrap">
            <div className="showcase-screen-frame">
              {activeShowcaseTab === 'catalog' && (
                <div className="screen-content screen-content--catalog">
                  <div className="screen-header-mock">
                    <span className="screen-breadcrumb">Explore / B.Tech / Semester 4</span>
                    <span className="screen-status-badge">12 Subjects Available</span>
                  </div>
                  <div className="screen-grid-mock">
                    <div className="screen-note-item">
                      <span className="item-tag">Operating Systems</span>
                      <h5>CPU Scheduling & Virtual Memory Architecture</h5>
                      <p>Page replacement algorithms, multi-level queue scheduling, and deadlock avoidance.</p>
                      <div className="item-meta">Semester 4 • 4.8 ★ • PDF Download</div>
                    </div>
                    <div className="screen-note-item">
                      <span className="item-tag">Database Management</span>
                      <h5>Relational Algebra & Normalization (1NF to BCNF)</h5>
                      <p>Functional dependencies, lossless decomposition, and ACID transaction isolation levels.</p>
                      <div className="item-meta">Semester 4 • 5.0 ★ • PDF Download</div>
                    </div>
                    <div className="screen-note-item">
                      <span className="item-tag">Computer Networks</span>
                      <h5>TCP/IP Protocol Stack & Subnetting Mechanics</h5>
                      <p>Three-way handshake, congestion window control, and classless inter-domain routing.</p>
                      <div className="item-meta">Semester 5 • 4.9 ★ • PDF Download</div>
                    </div>
                  </div>
                </div>
              )}

              {activeShowcaseTab === 'reader' && (
                <div className="screen-content screen-content--reader">
                  <div className="screen-reader-bar">
                    <span className="screen-doc-title">Database Management Systems — Notes.pdf</span>
                    <span className="screen-doc-zoom">100% • Page 14 of 42</span>
                  </div>
                  <div className="screen-reader-body">
                    <div className="reader-prose">
                      <h3>Chapter 4: B+ Tree Indexing Structures</h3>
                      <p>
                        A <strong>B+ Tree</strong> is an N-ary balanced search tree where all values
                        are stored in leaf nodes, linked sequentially for optimal range scans.
                      </p>
                      <div className="reader-code-block">
                        <code>Order m tree: Each node (except root) has at least ⌈m/2⌉ children.</code>
                      </div>
                      <p>
                        Internal nodes act strictly as search keys, routing queries to leaves with O(log n) efficiency.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeShowcaseTab === 'library' && (
                <div className="screen-content screen-content--library">
                  <div className="screen-header-mock">
                    <span className="screen-breadcrumb">Scholar Dashboard / Saved Collections</span>
                    <span className="screen-status-badge">3 Active Collections</span>
                  </div>
                  <div className="screen-collections-mock">
                    <div className="collection-card-mock">
                      <div className="col-icon">📁</div>
                      <h6>Midterm Exam Prep</h6>
                      <span>6 Saved Manuscripts</span>
                    </div>
                    <div className="collection-card-mock">
                      <div className="col-icon">📁</div>
                      <h6>Data Structures & Algorithms</h6>
                      <span>8 Saved Manuscripts</span>
                    </div>
                    <div className="collection-card-mock">
                      <div className="col-icon">📁</div>
                      <h6>Core Computer Architecture</h6>
                      <span>4 Saved Manuscripts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          6. FOUR FOUNDATIONAL PILLARS — Refined 2x2 Editorial Grid
          ========================================================================= */}
      <section className="pillars-section">
        <Container size="default">
          <div className="section-header text-center">
            <span className="section-eyebrow">ARCHITECTURAL FOUNDATION</span>
            <h2 className="section-title">Four Foundational Pillars</h2>
            <p className="section-desc">
              Every design decision in PJ Study prioritizes academic substance, long-term retention,
              and cognitive clarity.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-num">01</div>
              <h3 className="pillar-title">Academic Organization</h3>
              <p className="pillar-desc">
                Find learning material through structured academic categories and verified syllabus
                taxonomies mapped precisely to university requirements.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-num">02</div>
              <h3 className="pillar-title">Focused Discovery</h3>
              <p className="pillar-desc">
                Search and filter resources without distracting banner ads, algorithmic traps, or
                unverified forum chatter.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-num">03</div>
              <h3 className="pillar-title">Personal Study Library</h3>
              <p className="pillar-desc">
                Keep critical notes easily accessible through bookmarks, custom revision collections,
                and centralized download histories.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-num">04</div>
              <h3 className="pillar-title">Reliable Access</h3>
              <p className="pillar-desc">
                Preview and download approved academic manuscripts with reliable, permanent access
                whenever and wherever your study sessions happen.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          7. PLATFORM PHILOSOPHY — Editorial Split Section
          ========================================================================= */}
      <section className="philosophy-section">
        <Container size="default">
          <div className="philosophy-grid">
            <div className="philosophy-headline-col">
              <span className="philosophy-kicker">OUR ETHOS</span>
              <h2 className="philosophy-headline">
                Less Noise. <br />
                <span className="philosophy-headline-serif">More Learning.</span>
              </h2>
            </div>

            <div className="philosophy-body-col">
              <p className="philosophy-lead">
                Studying should feel focused, not overwhelming. PJ Study brings academic resources,
                clear organization, and useful learning tools into one thoughtfully designed space.
              </p>
              <div className="philosophy-points">
                <div className="philosophy-point">
                  <div className="point-icon">✓</div>
                  <div className="point-content">
                    <strong>Zero Ad Clutter</strong>
                    <span>No pop-ups, no sponsored clutter, and no algorithmic distraction loops.</span>
                  </div>
                </div>

                <div className="philosophy-point">
                  <div className="point-icon">✓</div>
                  <div className="point-content">
                    <strong>Direct Curriculum Alignment</strong>
                    <span>Every manuscript is indexed directly by degree, semester, and course subject.</span>
                  </div>
                </div>

                <div className="philosophy-point">
                  <div className="point-icon">✓</div>
                  <div className="point-content">
                    <strong>Accessible to Every Scholar</strong>
                    <span>Equal, transparent access to high-quality notes for students everywhere.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          8. FINAL CALL-TO-ACTION SECTION — Dark Forest Emerald Accent
          ========================================================================= */}
      <section className="final-cta-section">
        <Container size="narrow">
          <div className="final-cta-card">
            <div className="final-cta-glow" />
            <span className="final-cta-eyebrow">START TODAY</span>
            <h2 className="final-cta-headline">
              Your Next Study Session <br />
              <span className="final-cta-headline-serif">Starts Here.</span>
            </h2>
            <p className="final-cta-body">
              Explore academic notes, discover useful resources, and build a more organized study
              routine.
            </p>

            <div className="final-cta-actions">
              <Link to="/notes/explore" className="final-cta-btn-link">
                <Button variant="primary" size="lg" className="final-cta-primary-btn">
                  Explore Notes
                </Button>
              </Link>

              {isAuthenticated ? (
                <Link to="/dashboard" className="final-cta-btn-link">
                  <Button variant="outline" size="lg" className="final-cta-secondary-btn">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="final-cta-btn-link">
                  <Button variant="outline" size="lg" className="final-cta-secondary-btn">
                    Create Free Account
                  </Button>
                </Link>
              )}
            </div>

            <span className="final-cta-subnote">
              Free for all scholars • No advertisements • Instant access
            </span>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default HomePage;
