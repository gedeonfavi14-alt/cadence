import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Listens for realtime changes on the dishes table for a given restaurant.
 * Used on client side to detect deactivations.
 * @param {string} restaurantId
 * @param {function} onDishChange - Called with (payload) on UPDATE
 */
export function useRealtimeDishes(restaurantId, onDishChange) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;

    channelRef.current = supabase
      .channel(`dishes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dishes',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          if (onDishChange) onDishChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dishes',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          if (onDishChange) onDishChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'dishes',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          if (onDishChange) onDishChange(payload);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [restaurantId, onDishChange]);
}
