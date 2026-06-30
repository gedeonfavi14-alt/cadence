import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoThumbnail from './VideoThumbnail';
import { useViewTracking } from '../hooks/useViewTracking';
import { formatFCFA } from '../lib/utils';

export default function DishGrid({ 
  items, 
  isClient = false, 
  trackViews,
  onDishClick, 
  onToggleActive 
}) {
  const actualTrackViews = trackViews !== undefined ? trackViews : isClient;
  const { observeElement, resetCounted } = useViewTracking();
  const navigate = useNavigate();
  
  // Keep track of which element is currently most visible for video autoplay
  const [visibleItems, setVisibleItems] = useState(new Set());

  // Set up intersection observer just for video autoplay control
  useEffect(() => {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        setVisibleItems(prev => {
          const next = new Set(prev);
          entries.forEach(entry => {
            const id = entry.target.dataset.id;
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              next.add(id);
            } else {
              next.delete(id);
            }
          });
          return next;
        });
      },
      { threshold: 0.5 }
    );

    const elements = document.querySelectorAll('.grid-item-media');
    elements.forEach(el => videoObserver.observe(el));

    return () => {
      videoObserver.disconnect();
      resetCounted();
    };
  }, [items, resetCounted]);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted">
        <span className="text-4xl mb-4">🍽️</span>
        <p>Aucun plat à afficher</p>
      </div>
    );
  }

  // Filter out inactive items for clients
  const displayItems = isClient ? items.filter(i => i.active) : items;

  return (
    <div className="grid grid-cols-3 gap-1">
      {displayItems.map(item => (
        <div key={item.id} className="flex flex-col mb-4">
          <div 
            className={`relative aspect-[9/16] bg-secondary overflow-hidden cursor-pointer ${!item.active ? 'opacity-60' : ''}`}
            onClick={() => onDishClick(item)}
            ref={(el) => actualTrackViews ? observeElement(el, item.id) : null} // View tracking only if enabled
            data-dish-id={item.id}
          >
            {/* Media */}
            <div className="grid-item-media w-full h-full" data-id={item.id}>
              {item.media_type === 'video' && item.media_url ? (
                <VideoThumbnail 
                  src={item.media_url} 
                  isVisible={visibleItems.has(item.id)} 
                />
              ) : item.media_url ? (
                <img 
                  src={item.media_url} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Inactive Badge (Restaurateur only) */}
            {!isClient && !item.active && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded">Désactivé</span>
              </div>
            )}

            {/* Edit Button (Restaurateur only) */}
            {!isClient && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/menu-manage/edit/${item.id}`);
                  }}
                  className="w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors border border-white/20 shadow-lg"
                  aria-label="Modifier le plat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Info underneath thumbnail */}
          <div className="mt-1 px-1">
            {/* View count and toggle (Restaurateur only) */}
            {!isClient && (
              <div className="flex items-center justify-between mt-1 mb-1">
                <div className="flex items-center text-[10px] text-muted font-medium">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  {item.views || 0}
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={item.active}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleActive(item);
                    }}
                  />
                  <div className="w-6 h-3 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[10px] after:w-[10px] after:transition-all peer-checked:bg-olive"></div>
                </label>
              </div>
            )}
            
            {/* Minimal client info if needed, but TikTok usually just shows grid. 
                Prompt says "no view counts displayed" for client. */}
          </div>
        </div>
      ))}
    </div>
  );
}
