/**
 * Format a number as FCFA currency
 * e.g. 1500 → "1 500 FCFA"
 */
export function formatFCFA(amount) {
  if (amount == null || isNaN(amount)) return '0 FCFA';
  const num = Math.round(Number(amount));
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Format a date to French time string
 */
export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date to French date string
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  
  return formatDate(dateStr);
}

/**
 * Calculate conversion rate
 */
export function conversionRate(orders, views) {
  if (!views || views === 0) return 0;
  return ((orders / views) * 100);
}

/**
 * Notification sound as base64 (short bell)
 */
export const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZeLgXRtcH2Kl5+Xi3tuam19i5mjnJOEd29veIWRm56bkIN3cXF5hZGanJyWi394c3R6hI+Wm5uYkId9d3V4gIuUmZqYk4qBe3h3eoSNk5eYl5OLhH57eXuDi5GTlZWTj4mDfnx7fYSKjpGTk5GMh4N/fXx+g4mNkJGRj4uHg4B+fYCEiIuOj4+NioeDgX9+gIOGiYuNjYuJhoSBf3+AgoWHiouLioiGhIKAf4CCg4aIiYqKiIaFg4GAgIGDhYeIiYmIhoWDgoCAgoOFhoeIiIeGhYOCgYGCg4SFhoeHhoWEg4KBgYKDhIWGh4aGhYSCgoGBgoOEhYaGhoWEg4KCgYGCg4SFhoaFhYSEg4KBgoKDhIWFhYWEhIOCgoKCg4OEhYWFhISDgoKCgoKDhISFhYSEg4OCgoKCg4OEhISEhISEg4KCgoKDg4SEhISEg4OCgoKCgoODhISEhISDg4KCgoKDg4OEhISEg4ODgoKCgoKDg4SEhISDg4OCgoKCg4ODg4SEhIODg4KCgoKCg4ODhISDg4ODgoKCgoKDg4OEg4ODg4OCgoKCg4ODg4ODg4ODg4KCgoKCg4ODg4ODg4OCgoKCgoKDg4ODg4ODg4KCgoKCg4ODg4ODg4OCgoKCgoKDg4ODg4ODgoKCgoKCgoODg4ODg4OCgoKCgoKDg4ODg4ODgoKC';
