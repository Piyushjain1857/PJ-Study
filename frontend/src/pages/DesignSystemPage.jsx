import React, { useState } from 'react';
import Container from '../components/layout/Container.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Badge from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Dropdown from '../components/common/Dropdown.jsx';
import Modal from '../components/common/Modal.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import './DesignSystemPage.css';

/**
 * DesignSystemPage - Complete visual and interactive catalog of PJ Study's design system tokens,
 * typography hierarchy, and reusable accessible components.
 */
export function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingButtons, setIsLoadingButtons] = useState(false);
  const [inputValue, setInputValue] = useState('Introduction to Organic Chemistry');
  const [inputError, setInputError] = useState('');
  const [lastAction, setLastAction] = useState('');

  const colorTokens = [
    { name: '--color-background', hex: '#F9F8F6', label: 'Warm Cream Background' },
    { name: '--color-surface', hex: '#FFFFFF', label: 'Pure Surface White' },
    { name: '--color-text-primary', hex: '#191B18', label: 'Deep Charcoal Text' },
    { name: '--color-text-secondary', hex: '#74756F', label: 'Muted Slate Text' },
    { name: '--color-primary', hex: '#285943', label: 'Library Forest Green' },
    { name: '--color-primary-hover', hex: '#214936', label: 'Deep Green Hover' },
    { name: '--color-accent', hex: '#C58A43', label: 'Antique Gold Accent' },
    { name: '--color-border', hex: '#E6E3DC', label: 'Muted Parchment Border' },
    { name: '--color-success', hex: '#347A55', label: 'Verified Green' },
    { name: '--color-warning', hex: '#B7791F', label: 'Amber Warning' },
    { name: '--color-danger', hex: '#B54747', label: 'Crimson Danger' }
  ];

  const dropdownMenuItems = [
    {
      label: 'Open Note in Reader',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="16"
          height="16"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      onClick: () => setLastAction('Opened Note in Reader')
    },
    {
      label: 'Generate AI Summary',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="16"
          height="16"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" />
        </svg>
      ),
      onClick: () => setLastAction('Generated AI Summary')
    },
    {
      label: 'Archive Note',
      danger: true,
      onClick: () => setLastAction('Archived Note')
    }
  ];

  return (
    <div className="ds-page">
      <Container size="default">
        <PageHeader
          kicker="Design Language"
          title="PJ Study Design System"
          subtitle="A comprehensive catalog of academic editorial design tokens, typography scales, and accessible UI components."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Design System' }]}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLoadingButtons((prev) => !prev)}
            >
              Toggle Button Loading: {isLoadingButtons ? 'ON' : 'OFF'}
            </Button>
          }
        />

        {/* Section 1: Color Tokens */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">Palette</span>
            <h2 className="ds-section__title">Editorial Color Tokens</h2>
            <p className="ds-section__desc">
              Refined palette inspired by prestigious academic libraries, scholarly journals, and
              antique bindings.
            </p>
          </div>

          <div className="ds-swatches-grid">
            {colorTokens.map((token, idx) => (
              <div key={idx} className="ds-swatch card">
                <div
                  className="ds-swatch__color"
                  style={{
                    backgroundColor: token.hex,
                    border: token.hex === '#FFFFFF' ? '1px solid var(--color-border)' : 'none'
                  }}
                />
                <div className="ds-swatch__info">
                  <span className="ds-swatch__name font-mono">{token.name}</span>
                  <span className="ds-swatch__hex font-mono">{token.hex}</span>
                  <span className="ds-swatch__label">{token.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography Hierarchy */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">Typography</span>
            <h2 className="ds-section__title">Editorial Type Scale & Hierarchy</h2>
            <p className="ds-section__desc">
              Instrument Serif for distinguished headlines paired with Inter for clean, legible body
              text.
            </p>
          </div>

          <div className="card ds-type-card">
            <div className="ds-type-row">
              <span className="ds-type-spec font-mono">Display</span>
              <div>
                <h1 className="heading-display">Scholarly Excellence</h1>
                <span className="text-meta">
                  Instrument Serif 400 &bull; clamp(2.75rem, 4.5rem)
                </span>
              </div>
            </div>

            <hr className="divider" />

            <div className="ds-type-row">
              <span className="ds-type-spec font-mono">H1 Page</span>
              <div>
                <h1 className="heading-page">Microbial Ecology and Cellular Synthesis</h1>
                <span className="text-meta">
                  Instrument Serif 400 &bull; clamp(2.25rem, 3.25rem)
                </span>
              </div>
            </div>

            <hr className="divider" />

            <div className="ds-type-row">
              <span className="ds-type-spec font-mono">H2 Section</span>
              <div>
                <h2 className="heading-section">Curriculum Notes & Lecture Materials</h2>
                <span className="text-meta">
                  Instrument Serif 400 &bull; clamp(1.75rem, 2.35rem)
                </span>
              </div>
            </div>

            <hr className="divider" />

            <div className="ds-type-row">
              <span className="ds-type-spec font-mono">H3 Subsection</span>
              <div>
                <h3 className="heading-subsection">Active Recall & Distributed Practice</h3>
                <span className="text-meta">
                  Instrument Serif 400 &bull; clamp(1.4rem, 1.75rem)
                </span>
              </div>
            </div>

            <hr className="divider" />

            <div className="ds-type-row">
              <span className="ds-type-spec font-mono">Body Large</span>
              <div>
                <p className="body-large">
                  PJ Study provides a serene, deliberate study environment built upon verified
                  lecture notes, structured taxonomy, and document-grounded artificial intelligence.
                </p>
                <span className="text-meta">Inter 400 &bull; 1.125rem (18px)</span>
              </div>
            </div>

            <hr className="divider" />

            <div className="ds-type-row">
              <span className="ds-type-spec font-mono">Editorial Accent</span>
              <div>
                <p className="heading-subsection">
                  "Knowledge emerges not from hurried skimming, but from{' '}
                  <span className="text-serif-italic text-accent">
                    disciplined, contemplative inquiry
                  </span>
                  ."
                </p>
                <span className="text-meta">Instrument Serif Italic Accent with Antique Gold</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Buttons */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">Action Components</span>
            <h2 className="ds-section__title">Buttons & States</h2>
            <p className="ds-section__desc">
              Variants, sizes, loading spinners, and disabled states.
            </p>
          </div>

          <div className="card d-flex flex-col gap-6">
            <div>
              <h4 className="heading-card mb-3">Variants</h4>
              <div className="d-flex flex-wrap items-center gap-3">
                <Button variant="primary" isLoading={isLoadingButtons}>
                  Primary Button
                </Button>
                <Button variant="secondary" isLoading={isLoadingButtons}>
                  Secondary Button
                </Button>
                <Button variant="outline" isLoading={isLoadingButtons}>
                  Outline Button
                </Button>
                <Button variant="ghost" isLoading={isLoadingButtons}>
                  Ghost Button
                </Button>
                <Button variant="danger" isLoading={isLoadingButtons}>
                  Danger Button
                </Button>
              </div>
            </div>

            <hr className="divider" />

            <div>
              <h4 className="heading-card mb-3">Sizes</h4>
              <div className="d-flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  Small (32px)
                </Button>
                <Button variant="primary" size="md">
                  Medium (40px)
                </Button>
                <Button variant="primary" size="lg">
                  Large (48px)
                </Button>
              </div>
            </div>

            <hr className="divider" />

            <div>
              <h4 className="heading-card mb-3">With Icons & Disabled</h4>
              <div className="d-flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="16"
                      height="16"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  }
                >
                  Upload Note
                </Button>
                <Button
                  variant="secondary"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="16"
                      height="16"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  }
                  iconPosition="right"
                >
                  Export PDF
                </Button>
                <Button variant="primary" disabled>
                  Disabled Primary
                </Button>
                <Button variant="secondary" disabled>
                  Disabled Secondary
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Inputs */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">Form Fields</span>
            <h2 className="ds-section__title">Inputs & Validation States</h2>
            <p className="ds-section__desc">
              Accessible text inputs with labels, helper text, error messages, and search icons.
            </p>
          </div>

          <div className="card">
            <div className="grid grid-cols-1 grid-cols-2-md gap-6">
              <Input
                label="Note Title"
                placeholder="e.g. Principles of Quantum Mechanics"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="Provide a clear, academic subject title."
                required
              />

              <Input
                label="Search Course Catalog"
                placeholder="Search by course code (e.g. CS101, BIO204)..."
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
                helperText="Search across 40+ verified university departments."
              />

              <Input
                label="Author Attribution (With Error Demo)"
                placeholder="Institutional author ID"
                value={inputError ? '' : 'INVALID_ID_9921'}
                error={inputError || 'Academic author ID was not found in university directory.'}
                onChange={() => setInputError('')}
              />

              <Input
                label="Archival System Code (Disabled)"
                value="LIB-ARCHIVE-SECURE-2026"
                disabled
                helperText="System-assigned identifier cannot be altered."
              />
            </div>
          </div>
        </section>

        {/* Section 5: Badges & Status Indicators */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">Indicators</span>
            <h2 className="ds-section__title">Badges & Verification Tags</h2>
            <p className="ds-section__desc">
              Semantic status markers for study materials, verification levels, and system health.
            </p>
          </div>

          <div className="card d-flex flex-wrap items-center gap-4">
            <Badge variant="default" label="Default Tag" />
            <Badge variant="success" label="Verified Curriculum" dot />
            <Badge variant="warning" label="Pending Peer Review" dot />
            <Badge variant="error" label="Revision Required" dot />
            <Badge variant="verified" label="Academic Scholar" dot />
            <Badge variant="success" label="Active Sync" dot pulse />
            <Badge variant="default" size="sm" label="Small Badge" />
            <Badge variant="verified" size="sm" label="Peer Reviewed" />
          </div>
        </section>

        {/* Section 6: Avatars */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">Identity</span>
            <h2 className="ds-section__title">Avatars & Fallbacks</h2>
            <p className="ds-section__desc">
              Student and educator avatars with intelligent initials generation and size scales.
            </p>
          </div>

          <div className="card d-flex items-center gap-6">
            <div className="d-flex items-center gap-3">
              <Avatar name="Piyush Jain" size="lg" />
              <div>
                <span className="font-semibold d-block text-sm">Piyush Jain</span>
                <span className="text-meta">Size Large (48px)</span>
              </div>
            </div>

            <div className="d-flex items-center gap-3">
              <Avatar name="Elena Rostova" size="md" />
              <div>
                <span className="font-semibold d-block text-sm">Elena Rostova</span>
                <span className="text-meta">Size Medium (36px)</span>
              </div>
            </div>

            <div className="d-flex items-center gap-3">
              <Avatar name="Marcus Chen" size="sm" />
              <div>
                <span className="font-semibold d-block text-sm">Marcus Chen</span>
                <span className="text-meta">Size Small (28px)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Dropdowns & Overlays */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">Interactive Overlays</span>
            <h2 className="ds-section__title">Dropdowns & Modal Dialogs</h2>
            <p className="ds-section__desc">
              Accessible overlay components adhering to modern dialog specifications.
            </p>
          </div>

          <div className="card d-flex flex-wrap items-center gap-4">
            <Dropdown
              trigger={
                <Button variant="secondary">
                  Open Action Menu
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </Button>
              }
              items={dropdownMenuItems}
              align="left"
            />

            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Launch Accessible Modal
            </Button>

            {lastAction && <Badge variant="verified" label={`Last Triggered: ${lastAction}`} dot />}
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Scholarly Review Submission"
            description="Verify your notes meet academic integrity criteria before submission."
            actions={
              <>
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                  Confirm & Submit
                </Button>
              </>
            }
          >
            <div className="d-flex flex-col gap-3">
              <p>
                By publishing to PJ Study, you affirm that these study notes are your original
                intellectual synthesis and follow your institution's honor code.
              </p>
              <div className="p-3 bg-surface-subtle border radius-small">
                <span className="font-semibold d-block text-sm mb-1">
                  Accessibility Highlights:
                </span>
                <ul className="text-secondary text-sm d-flex flex-col gap-1">
                  <li>
                    &bull; Implemented with native HTML5 <code>&lt;dialog&gt;</code> element
                  </li>
                  <li>
                    &bull; Focus trap, Escape key dismissal, and backdrop click handled
                    automatically
                  </li>
                  <li>
                    &bull; Page scroll chaining contained via{' '}
                    <code>overscroll-behavior: contain</code>
                  </li>
                </ul>
              </div>
            </div>
          </Modal>
        </section>

        {/* Section 8: Skeletons & EmptyState */}
        <section className="ds-section">
          <div className="ds-section__header">
            <span className="editorial-kicker">States & Feedback</span>
            <h2 className="ds-section__title">Skeletons & Empty States</h2>
            <p className="ds-section__desc">
              Graceful loading placeholders and empty data containers.
            </p>
          </div>

          <div className="grid grid-cols-1 grid-cols-2-md gap-6">
            <div className="card d-flex flex-col gap-4">
              <h4 className="heading-card">Skeleton Placeholders</h4>
              <div className="d-flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 d-flex flex-col gap-2">
                  <Skeleton variant="text" width="60%" height={14} />
                  <Skeleton variant="text" width="40%" height={12} />
                </div>
              </div>
              <Skeleton variant="rectangular" height={100} />
              <div className="d-flex flex-col gap-2">
                <Skeleton variant="text" height={12} count={3} />
              </div>
            </div>

            <EmptyState
              title="No Study Notes Uploaded Yet"
              description="Your notebook is currently empty. Upload your first course lecture notes or explore the university catalog."
              action={
                <Button variant="primary" size="sm">
                  Upload First Note
                </Button>
              }
            />
          </div>
        </section>
      </Container>
    </div>
  );
}

export default DesignSystemPage;
