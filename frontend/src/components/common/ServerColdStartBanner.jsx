import React, { useState, useEffect } from 'react';
import './ServerColdStartBanner.css';

/**
 * ServerColdStartBanner provides immediate, transparent feedback when requests
 * to the Render Free Plan backend take longer than 3.5s due to container spin-up.
 */
export function ServerColdStartBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleServerDelay(event) {
      setIsVisible(Boolean(event.detail?.isSlow));
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('pj:server-delay', handleServerDelay);
      return () => {
        window.removeEventListener('pj:server-delay', handleServerDelay);
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <aside
      className="pj-coldstart-banner"
      role="status"
      aria-live="polite"
      aria-label="Server connecting notice"
    >
      <div className="pj-coldstart-content">
        <span className="pj-coldstart-pulse" aria-hidden="true" />
        <span className="pj-coldstart-text">
          <strong>Waking free-tier server:</strong> PJ Study is spinning up on Render. Requests may take a moment on first load. Thank you for your patience!
        </span>
      </div>
    </aside>
  );
}

export default ServerColdStartBanner;
