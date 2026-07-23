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
      if (isRefreshing) return;
      setIsRefreshing(true);
      setPullDistance(55);
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
      // Only initiate pull-down if scrolled to top of page and dragging from top area
      if (window.scrollY === 0 && clientY < 180) {
        startY.current = clientY;
        isPulling.current = true;
      }
    };

    const handleMove = (clientY) => {
      if (!isPulling.current || window.scrollY > 0) return;
      const diff = clientY - startY.current;
      if (diff > 0) {
        const dist = Math.min(diff * 0.5, 80);
        setPullDistance(dist);
      }
    };

    const handleEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistance >= 25 && !isRefreshing) {
        triggerRefresh();
      } else {
        setPullDistance(0);
      }
    };

    // Touch events (Mobile / Tablet)
    const onTouchStart = (e) => handleStart(e.touches[0].clientY);
    const onTouchMove = (e) => handleMove(e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    // Mouse events (Laptop / Desktop trackpad & mouse)
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
      {/* Top Banner Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-150 pointer-events-none"
          style={{ height: `${Math.max(pullDistance, 45)}px`, opacity: Math.max(pullDistance / 25, 0.9) }}
        >
          <div className="flex items-center gap-2 rounded-full bg-indigo-900/95 border border-indigo-500/50 px-5 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-md">
            <span className={isRefreshing ? 'animate-spin text-indigo-400' : 'text-indigo-400'}>🔄</span>
            <span>{isRefreshing ? 'Syncing live complaints...' : pullDistance >= 25 ? 'Release to Refresh' : 'Drag down to refresh'}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
