import { useState, useEffect, useRef } from 'react';
import { useComplaints } from '../context/ComplaintContext';

export default function SwipeToRefresh({ children }) {
  const { reload, refreshAll } = useComplaints();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const triggerRefresh = async () => {
      setIsRefreshing(true);
      setPullDistance(50);
      try {
        if (reload) await reload();
        else if (refreshAll) await refreshAll();
      } catch {
        // silent fallback
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    };

    const handleStart = (clientY) => {
      if (window.scrollY === 0) {
        startY.current = clientY;
        isPulling.current = true;
      }
    };

    const handleMove = (clientY) => {
      if (!isPulling.current || window.scrollY > 0) return;
      const diff = clientY - startY.current;
      if (diff > 0) {
        const dist = Math.min(diff * 0.4, 90);
        setPullDistance(dist);
      }
    };

    const handleEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistance > 50 && !isRefreshing) {
        triggerRefresh();
      } else {
        setPullDistance(0);
      }
    };

    // Touch events (Mobile / Tablet)
    const onTouchStart = (e) => handleStart(e.touches[0].clientY);
    const onTouchMove = (e) => handleMove(e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    // Mouse events (Laptop / Desktop drag down)
    const onMouseDown = (e) => {
      if (e.button === 0) handleStart(e.clientY);
    };
    const onMouseMove = (e) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [pullDistance, isRefreshing, reload, refreshAll]);

  return (
    <div className="relative min-h-screen">
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-150"
          style={{ height: `${pullDistance}px`, opacity: Math.max(pullDistance / 50, 0.6) }}
        >
          <div className="flex items-center gap-2 rounded-full bg-slate-900/95 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur border border-slate-700">
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{isRefreshing ? 'Refreshing data...' : pullDistance > 50 ? 'Release to Refresh' : 'Swipe / Drag down to refresh'}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
