import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';

// The page is exactly as tall as the part of the screen that is really visible. When the on-screen keyboard opens
// (iPhone and Android) the visible height shrinks, so the bottom bar sits right above the keyboard with no gap.
const Layout = () => {
  const ref = useRef(null);

  useEffect(() => {
    const vv = window.visualViewport;
    const fit = () => {
      if (!ref.current) return;
      ref.current.style.height = `${vv ? vv.height : window.innerHeight}px`;
      // iPhone scrolls the whole page up when a field is focused; keep the page itself in place
      if (window.scrollY || document.documentElement.scrollTop) window.scrollTo(0, 0);
    };
    fit();
    vv?.addEventListener('resize', fit);
    vv?.addEventListener('scroll', fit);
    window.addEventListener('resize', fit);
    return () => {
      vv?.removeEventListener('resize', fit);
      vv?.removeEventListener('scroll', fit);
      window.removeEventListener('resize', fit);
    };
  }, []);

  return (
    <div ref={ref} className="fixed top-0 left-0 w-full flex flex-col bg-white overflow-hidden" style={{ height: '100dvh' }}>
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
