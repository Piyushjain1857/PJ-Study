import React from 'react';
import { Link } from 'react-router-dom';
import './PageHeader.css';

/**
 * Reusable PageHeader component with breadcrumbs, editorial title, and action slots.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   kicker?: string,
 *   breadcrumbs?: Array<{ label: string, href?: string }>,
 *   actions?: React.ReactNode,
 *   className?: string
 * }} props
 */
export function PageHeader({ title, subtitle, kicker, breadcrumbs = [], actions, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="page-header__breadcrumbs">
          <ol className="page-header__breadcrumb-list">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={idx} className="page-header__breadcrumb-item">
                  {crumb.href && !isLast ? (
                    <Link to={crumb.href} className="page-header__breadcrumb-link">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className="page-header__breadcrumb-current"
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && (
                    <span className="page-header__breadcrumb-sep" aria-hidden="true">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="page-header__content">
        <div className="page-header__titles">
          {kicker && <span className="editorial-kicker">{kicker}</span>}
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>

        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}

export default PageHeader;
