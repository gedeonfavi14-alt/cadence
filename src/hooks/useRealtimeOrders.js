import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { NOTIFICATION_SOUND } from '../lib/utils';

export function useRealtimeOrders(onNewOrder) {
  const { restaurant } = useAuth();
  const audioRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.8;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch (e) {
      // Silent fail
    }
  }, []);

  const showBrowserNotification = useCallback((order) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍽️ Nouvelle commande !', {
        body: `Table ${order.table_number} — Commande reçue`,
        icon: '/icon-192.png',
        tag: `order-${order.id}`,
        renotify: true,
        vibrate: [200, 100, 200]
      });
    }
  }, []);

  useEffect(() => {
    if (!restaurant?.id) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    channelRef.current = supabase
      .channel(`orders-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`
        },
        (payload) => {
          const newOrder = payload.new;
          playNotificationSound();
          showBrowserNotification(newOrder);
          if (onNewOrder) onNewOrder(newOrder);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [restaurant?.id, onNewOrder, playNotificationSound, showBrowserNotification]);

  return { playNotificationSound };
}
