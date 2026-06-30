import { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX, ShoppingBag } from 'lucide-react';
import { useViewTracking } from '../hooks/useViewTracking';
import { formatFCFA } from '../lib/utils';

export default function DishFullscreen({ 
  items, 
  initialIndex = 0, 
  categories,
  dishes,
  initialCategoryIndex = 0,
  initialDishId,
  isClient = false, 
  trackViews,
  onClose,
  onAddToCart 
}) {
  const actualTrackViews = trackViews !== undefined ? trackViews : isClient;
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef({});
  const { observeElement } = useViewTracking();

  // If we have categories, we are in horizontal-swipe mode
  const isCategorized = Boolean(categories && dishes);
  
  // States for horizontal-swipe mode
  const [currentCatIndex, setCurrentCatIndex] = useState(initialCategoryIndex);
  const [currentDishIndices, setCurrentDishIndices] = useState({}); // { catIndex: dishIndex }
  const horizontalContainerRef = useRef(null);
  const verticalContainerRefs = useRef({});

  // State for simple mode
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const simpleContainerRef = useRef(null);

  // Group dishes by category if categorized
  const groupedDishes = isCategorized ? categories.map((cat, idx) => {
    return dishes.filter(d => d.category === cat || (!d.category && idx === 0));
  }) : [];

  // Initialize scroll positions
  useEffect(() => {
    if (isCategorized) {
      // Set initial horizontal scroll
      if (horizontalContainerRef.current) {
        horizontalContainerRef.current.scrollTo(currentCatIndex * window.innerWidth, 0);
      }
      
      // Find initial dish index and set vertical scroll
      const initialCatDishes = groupedDishes[currentCatIndex];
      const dishIdx = initialCatDishes.findIndex(d => d.id === initialDishId);
      const startingDishIdx = dishIdx !== -1 ? dishIdx : 0;
      
      setCurrentDishIndices(prev => ({ ...prev, [currentCatIndex]: startingDishIdx }));
      
      setTimeout(() => {
        const vContainer = verticalContainerRefs.current[currentCatIndex];
        if (vContainer) {
          vContainer.scrollTo(0, startingDishIdx * window.innerHeight);
        }
      }, 50);

    } else {
      if (simpleContainerRef.current) {
        simpleContainerRef.current.scrollTo(0, initialIndex * window.innerHeight);
      }
    }
  }, []);

  // Handle Horizontal Scroll
  useEffect(() => {
    if (!isCategorized || !horizontalContainerRef.current) return;
    const container = horizontalContainerRef.current;
    
    let scrollTimeout;
    const handleHScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const newCatIndex = Math.round(container.scrollLeft / container.clientWidth);
        if (newCatIndex !== currentCatIndex && newCatIndex >= 0 && newCatIndex < categories.length) {
          setCurrentCatIndex(newCatIndex);
          // When changing category, ensure vertical index is initialized if empty
          setCurrentDishIndices(prev => {
            if (prev[newCatIndex] === undefined) {
              return { ...prev, [newCatIndex]: 0 };
            }
            return prev;
          });
        }
      }, 50);
    };

    container.addEventListener('scroll', handleHScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleHScroll);
  }, [currentCatIndex, isCategorized, categories]);

  // Handle Vertical Scroll for Categorized
  const handleVScroll = (catIdx, e) => {
    const container = e.target;
    const dishIdx = Math.round(container.scrollTop / container.clientHeight);
    if (currentDishIndices[catIdx] !== dishIdx) {
      setCurrentDishIndices(prev => ({ ...prev, [catIdx]: dishIdx }));
    }
  };

  // Handle Vertical Scroll for Simple
  useEffect(() => {
    if (isCategorized || !simpleContainerRef.current) return;
    const container = simpleContainerRef.current;

    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const newIndex = Math.round(container.scrollTop / container.clientHeight);
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
          setCurrentIndex(newIndex);
        }
      }, 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, isCategorized, items]);

  // Autoplay logic
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idStr, video]) => {
      if (!video) return;
      
      let shouldPlay = false;
      if (isCategorized) {
        // Find which dish is currently active
        const activeDishesId = groupedDishes[currentCatIndex]?.[currentDishIndices[currentCatIndex] || 0]?.id;
        if (idStr === activeDishesId) {
          shouldPlay = true;
        }
      } else {
        const activeDishId = items[currentIndex]?.id;
        if (idStr === activeDishId) {
          shouldPlay = true;
        }
      }

      if (shouldPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, currentCatIndex, currentDishIndices, isCategorized]);

  const handleVideoRef = (id) => (el) => {
    videoRefs.current[id] = el;
  };

  const renderDishItem = (item, isNearby = true) => (
    <div 
      key={item.id} 
      className="fullscreen-snap-item"
      ref={(el) => actualTrackViews ? observeElement(el, item.id) : null}
      data-dish-id={item.id}
    >
      <div className="absolute inset-0 z-0 bg-[#111]">
        {item.media_type === 'video' && item.media_url ? (
          isNearby ? (
            <video
              ref={handleVideoRef(item.id)}
              src={item.media_url}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full bg-[#111]" />
          )
        ) : item.media_url ? (
          <img
            src={item.media_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[5rem]">
            🍽️
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {!item.active && (
        <div className="absolute inset-0 z-[2] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-red-500 text-white font-bold px-6 py-3 rounded-xl text-xl uppercase tracking-widest shadow-2xl rotate-[-5deg]">
            {isClient ? 'Rupture de stock' : 'Désactivé'}
          </div>
        </div>
      )}

      <div className="relative z-[5] w-full p-4 pb-8 flex justify-between items-end">
        <div className="flex-1 pr-16">
          {item.category && (
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full mb-2">
              {item.category}
            </span>
          )}
          <h2 className="text-3xl font-bold text-white mb-1 shadow-black drop-shadow-md">{item.name}</h2>
          <div className="text-olive-light font-bold text-xl mb-3">{formatFCFA(item.price)}</div>
          {item.description && (
            <p className="text-white/90 text-sm line-clamp-3 leading-snug drop-shadow-md">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {isClient && item.active && (
        <div className="absolute right-4 bottom-12 z-[10] flex flex-col items-center gap-6">
          <button 
            onClick={() => onAddToCart(item)}
            className="w-14 h-14 bg-olive rounded-full flex flex-col items-center justify-center text-white shadow-lg shadow-olive/50 transition-transform active:scale-90"
          >
            <ShoppingBag size={24} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Global Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pt-safe">
        <button 
          onClick={onClose}
          className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
        >
          <X size={24} />
        </button>
        
        {/* If categorized, maybe show the category name at the top? Optional, but good for UX */}
        {isCategorized && categories[currentCatIndex] && (
          <div className="font-bold text-white/90 text-lg py-1 px-4 bg-black/30 rounded-full backdrop-blur-md">
            {categories[currentCatIndex]}
          </div>
        )}

        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {isCategorized ? (
        <div 
          ref={horizontalContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar swipe-horizontal w-[100dvw] h-[100dvh]"
        >
          {categories.map((cat, idx) => {
            const isNearby = Math.abs(idx - currentCatIndex) <= 1;
            return (
            <div key={cat} className="w-[100dvw] h-[100dvh] shrink-0 snap-start">
              <div 
                ref={(el) => verticalContainerRefs.current[idx] = el}
                className="fullscreen-snap-container hide-scrollbar"
                onScroll={(e) => handleVScroll(idx, e)}
              >
                {groupedDishes[idx].map(item => renderDishItem(item, isNearby))}
                {groupedDishes[idx].length === 0 && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                    <span className="text-4xl mb-4">🍽️</span>
                    <p>Aucun plat dans cette catégorie</p>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div 
          ref={simpleContainerRef}
          className="fullscreen-snap-container hide-scrollbar"
        >
          {items.map(item => renderDishItem(item))}
        </div>
      )}
    </div>
  );
}
