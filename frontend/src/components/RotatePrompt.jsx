import React from 'react';
import { useRequiresLandscape } from '../hooks/useRequiresLandscape.js';

export default function RotatePrompt() {
  const show = useRequiresLandscape();
  if (!show) return null;

  return (
    <div className="rotate-prompt" role="dialog" aria-label="Rotate device to landscape">
      <div className="rotate-prompt__inner">
        <img
          className="rotate-prompt__logo"
          src="/assets/scrapratslogo.png"
          alt=""
          draggable={false}
        />
        <div className="rotate-prompt__phone" aria-hidden="true">
          <div className="rotate-prompt__phone-screen" />
        </div>
        <h2 className="rotate-prompt__title">ROTATE TO PLAY</h2>
        <p className="rotate-prompt__sub">
          Flip your phone sideways for the full sewer experience.
        </p>
        <p className="rotate-prompt__hint">
          Portrait works for scrolling the site below.
        </p>
      </div>
    </div>
  );
}
