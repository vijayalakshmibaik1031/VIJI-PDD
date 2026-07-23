import { useState, useEffect, useRef } from 'react';
import { useComplaints } from '../context/ComplaintContext';

export default function SwipeToRefresh({ children }) {
  const { refreshAll } = useComplaints();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current || window.scrollY > 0) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0) {
        // Resistance effect
        const dist = Math.min(diff * 0.4, 90);
        setPullDistance(dist);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistance > 60 && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(50);
        try {
          if (refreshAll) {
            await refreshAll();
          } else {
            window.location.reload();
          }
        } catch {
          // fallback
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 600);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, refreshAll]);

  return (
    <div className="relative min-h-screen">
      {/* Swipe Down Pull Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
          style={{ height: `${pullDistance}px`, opacity: pullDistance / 60 }}
        >
          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{isRefreshing ? 'Refreshing data...' : pullDistance > 60 ? 'Release to Refresh' : 'Swipe down to refresh'}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
