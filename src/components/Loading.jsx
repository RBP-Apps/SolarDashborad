import React from 'react';

/**
 * Loading — shown only over the area that is loading (a table card, a tab's content), never over the whole page,
 * so the sidebar, header and tabs stay usable while data arrives.
 *
 *   <Loading />                          centered spinner for an empty area (page / tab content)
 *   <Loading overlay show={loading} />   covers its `relative` parent while `loading` is true; the rows underneath stay visible
 *   label                                text under the spinner ('' hides it)
 */
export default function Loading({ label = 'Loading...', overlay = false, show = true, className = '' }) {
  if (!show) return null;

  const spinner = (
    <div className="flex flex-col items-center gap-2" role="status" aria-live="polite">
      <div className="w-8 h-8 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
      {label && <p className="text-[12px] font-medium text-gray-500">{label}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className={`absolute inset-0 z-20 flex items-center justify-center bg-white/70 animate-in fade-in duration-150 ${className}`}>
        {spinner}
      </div>
    );
  }

  return <div className={`flex-1 flex items-center justify-center py-16 ${className}`}>{spinner}</div>;
}
