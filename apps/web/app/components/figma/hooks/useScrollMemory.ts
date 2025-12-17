import { useEffect, useRef } from 'react';

/**
 * Custom hook for remembering scroll positions across page changes
 * @param pageKey - Unique key for the current page
 */
export function useScrollMemory(pageKey: string) {
  const scrollPositions = useRef<Record<string, number>>({});
  const isRestoringRef = useRef(false);

  useEffect(() => {
    // Restore scroll position when page loads
    const savedPosition = scrollPositions.current[pageKey] || 0;
    
    if (savedPosition > 0) {
      isRestoringRef.current = true;
      // Use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant' as ScrollBehavior
        });
        // Reset flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      if (!isRestoringRef.current) {
        scrollPositions.current[pageKey] = window.scrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageKey]);

  // Manual save function (useful for programmatic navigation)
  const saveScrollPosition = () => {
    scrollPositions.current[pageKey] = window.scrollY;
  };

  // Manual reset function
  const resetScrollPosition = () => {
    scrollPositions.current[pageKey] = 0;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return { saveScrollPosition, resetScrollPosition };
}
