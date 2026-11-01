import React, { useState, useRef, useEffect, useId } from 'react';
import './Dropdown.css';

/**
 * Reusable Dropdown component for user menus, filters, and action overflow.
 *
 * @param {{
 *   trigger: React.ReactNode,
 *   items?: Array<{
 *     label: string,
 *     icon?: React.ReactNode,
 *     onClick?: () => void,
 *     disabled?: boolean,
 *     danger?: boolean,
 *     href?: string
 *   }>,
 *   align?: 'left' | 'right',
 *   children?: React.ReactNode,
 *   className?: string
 * }} props
 */
export function Dropdown({ trigger, items = [], align = 'right', children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const menuId = useId();

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <div
      ref={containerRef}
      className={`dropdown ${isOpen ? 'dropdown--open' : ''} ${className}`.trim()}
    >
      <div
        className="dropdown__trigger"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        {trigger}
      </div>

      {isOpen && (
        <div id={menuId} className={`dropdown__menu dropdown__menu--align-${align}`} role="menu">
          {items.length > 0
            ? items.map((item, index) => {
                const itemClass = `dropdown__item ${item.danger ? 'dropdown__item--danger' : ''} ${
                  item.disabled ? 'dropdown__item--disabled' : ''
                }`.trim();

                const handleClick = () => {
                  if (item.disabled) return;
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                };

                if (item.href) {
                  return (
                    <a
                      key={index}
                      href={item.href}
                      role="menuitem"
                      className={itemClass}
                      onClick={handleClick}
                    >
                      {item.icon && <span className="dropdown__item-icon">{item.icon}</span>}
                      <span>{item.label}</span>
                    </a>
                  );
                }

                return (
                  <button
                    key={index}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className={itemClass}
                    onClick={handleClick}
                  >
                    {item.icon && <span className="dropdown__item-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                );
              })
            : children}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
