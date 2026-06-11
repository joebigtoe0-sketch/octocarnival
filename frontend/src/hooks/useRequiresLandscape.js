import { useEffect, useState } from 'react';

/** True on phones/tablets held in portrait — game should not be played until rotated. */
export function useRequiresLandscape() {
  const [required, setRequired] = useState(false);

  useEffect(() => {
    const check = () => {
      const vv = window.visualViewport;
      const w  = vv?.width  ?? window.innerWidth;
      const h  = vv?.height ?? window.innerHeight;
      const touchOrNarrow = window.matchMedia('(pointer: coarse)').matches || w <= 900;
      setRequired(touchOrNarrow && h > w);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', check);

    const mq = window.matchMedia('(orientation: portrait)');
    if (mq.addEventListener) mq.addEventListener('change', check);
    else mq.addListener(check);

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      if (vv) vv.removeEventListener('resize', check);
      if (mq.removeEventListener) mq.removeEventListener('change', check);
      else mq.removeListener(check);
    };
  }, []);

  return required;
}
