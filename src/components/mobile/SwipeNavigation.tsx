import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeNavigationProps {
  children: React.ReactNode;
}

export function SwipeNavigation({ children }: SwipeNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);
    
    // Only trigger swipe if horizontal movement > 100px and greater than vertical
    const minSwipeDistance = 100;
    const maxEdgeStart = 50; // Must start from left edge
    
    // Check if swipe started from left edge and is primarily horizontal
    if (
      touchStartX.current <= maxEdgeStart &&
      deltaX > minSwipeDistance &&
      deltaX > deltaY * 1.5 // Horizontal movement should be 1.5x vertical
    ) {
      // Don't navigate back if we're on the home page
      if (location.pathname !== '/') {
        navigate(-1);
      }
    }

    // Reset values
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchEnd]);

  return (
    <div ref={containerRef} className="min-h-screen">
      {children}
    </div>
  );
}
