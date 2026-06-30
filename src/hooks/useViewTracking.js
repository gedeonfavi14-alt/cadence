import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Track views for dishes using IntersectionObserver.
 * A view is counted when a dish is visible for >= 2 seconds.
 * 
 * Usage:
 *   const { observeElement } = useViewTracking();
 *   // In component: ref={(el) => observeElement(el, dishId)}
 */
export function useViewTracking() {
  const observerRef = useRef(null);
  const timersRef = useRef(new Map()); // dishId -> timerId
  const countedRef = useRef(new Set()); // dishIds already counted this session

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const dishId = entry.target.dataset.dishId;
          if (!dishId) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Start 2-second timer
            if (!timersRef.current.has(dishId) && !countedRef.current.has(dishId)) {
              const timerId = setTimeout(() => {
                // Increment view
                incrementView(dishId);
                countedRef.current.add(dishId);
                timersRef.current.delete(dishId);
              }, 2000);
              timersRef.current.set(dishId, timerId);
            }
          } else {
            // Cancel timer if element leaves viewport
            if (timersRef.current.has(dishId)) {
              clearTimeout(timersRef.current.get(dishId));
              timersRef.current.delete(dishId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      // Clear all pending timers
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, []);

  async function incrementView(dishId) {
    try {
      // Use RPC or direct update to increment views
      const { data: dish } = await supabase
        .from('dishes')
        .select('views')
        .eq('id', dishId)
        .single();

      if (dish) {
        await supabase
          .from('dishes')
          .update({ views: (dish.views || 0) + 1 })
          .eq('id', dishId);
      }
    } catch (err) {
      // Silent fail for view tracking
    }
  }

  const observeElement = useCallback((element, dishId) => {
    if (element && observerRef.current) {
      element.dataset.dishId = dishId;
      observerRef.current.observe(element);
    }
  }, []);

  const unobserveElement = useCallback((element) => {
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  // Reset counted views (e.g. when navigating to a new page)
  const resetCounted = useCallback(() => {
    countedRef.current.clear();
  }, []);

  return { observeElement, unobserveElement, resetCounted };
}
