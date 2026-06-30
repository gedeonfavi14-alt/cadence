import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import DishGrid from '../components/DishGrid';
import DishFullscreen from '../components/DishFullscreen';
import OrderCart from '../components/OrderCart';
import { useRealtimeDishes } from '../hooks/useRealtimeDishes';

const CATEGORIES = ["Entrées", "Plats principaux", "Accompagnements", "Desserts", "Boissons"];

export default function CustomerMenu() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenState, setFullscreenState] = useState(null);
  const [cart, setCart] = useState({});
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  
  const scrollContainerRef = useRef(null);
  const { setClientView } = useTheme();
  const { restaurant: loggedInRestaurant } = useAuth();

  const isOwnerViewing = loggedInRestaurant?.id === restaurantId;

  useEffect(() => {
    setClientView(true);
    return () => setClientView(false);
  }, []); // Empty dependency array prevents infinite loops

  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  async function fetchData() {
    try {
      // 1. Fetch Restaurant
      const { data: restoData, error: restoError } = await supabase
        .from('restaurants')
        .select('name, logo_url')
        .eq('id', restaurantId)
        .single();

      if (restoError) throw restoError;
      setRestaurant(restoData);

      // 2. Fetch Active Dishes
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (dishesError) throw dishesError;
      setDishes(dishesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Realtime listener for deactivations
  useRealtimeDishes(restaurantId, (payload) => {
    if (payload.eventType === 'UPDATE') {
      const updatedDish = payload.new;
      setDishes(prev => prev.map(d =>
        d.id === updatedDish.id ? { ...d, active: updatedDish.active, price: updatedDish.price } : d
      ));

      if (!updatedDish.active && cart[updatedDish.id]) {
        setCart(prev => {
          const newCart = { ...prev };
          delete newCart[updatedDish.id];
          return newCart;
        });
      }
    }
  });

  const handleCategoryScroll = (e) => {
    const container = e.target;
    // Calculate index based on scroll position. Adding small offset to handle edge cases
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index !== activeCategoryIndex && index >= 0 && index < CATEGORIES.length) {
      setActiveCategoryIndex(index);
    }
  };

  const handleTabClick = (idx) => {
    setActiveCategoryIndex(idx);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: idx * scrollContainerRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleDishClick = (dish, categoryIndex) => {
    if (!dish.active) return;
    setFullscreenState({ dishId: dish.id, categoryIndex });
  };

  const updateCart = (dish, quantityChange) => {
    setCart(prev => {
      const current = prev[dish.id]?.quantity || 0;
      const next = current + quantityChange;

      if (next <= 0) {
        const newCart = { ...prev };
        delete newCart[dish.id];
        return newCart;
      }

      return {
        ...prev,
        [dish.id]: {
          ...dish,
          quantity: next
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="w-8 h-8 border-4 border-olive border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white px-4 text-center">
        <div>
          <span className="text-6xl mb-4 block">😢</span>
          <h1 className="text-2xl font-bold mb-2">Restaurant introuvable</h1>
          <p className="text-gray-400">Veuillez scanner un code QR valide.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 flex flex-col">
      {/* Header & Tabs */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 shrink-0">
        <header className="px-4 py-3 flex items-center gap-3">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-white/20" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">🍽️</div>
          )}
          <h1 className="font-bold text-lg">{restaurant.name}</h1>
        </header>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto snap-x hide-scrollbar swipe-horizontal">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat}
              onClick={() => handleTabClick(idx)}
              className={`whitespace-nowrap px-4 py-3 font-semibold text-sm transition-colors ${
                activeCategoryIndex === idx ? 'text-olive border-b-2 border-olive' : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Feed Container (Horizontal Snap) */}
      <main 
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar swipe-horizontal w-full"
        onScroll={handleCategoryScroll}
      >
        {CATEGORIES.map((cat, idx) => {
          // Si le plat n'a pas de catégorie, on le met dans "Entrées" par défaut pour ne pas le perdre
          const categoryDishes = dishes.filter(d => 
            d.category === cat || (!d.category && idx === 0)
          );

          return (
            <div key={cat} className="w-full shrink-0 snap-start p-1 min-h-[50vh]">
              <DishGrid
                items={categoryDishes}
                isClient={true}
                trackViews={!isOwnerViewing}
                onDishClick={(dish) => handleDishClick(dish, idx)}
              />
            </div>
          );
        })}
      </main>

      {/* Fullscreen Feed */}
      {fullscreenState !== null && (
        <DishFullscreen
          categories={CATEGORIES}
          dishes={dishes.filter(d => d.active)} // Only pass active dishes
          initialCategoryIndex={fullscreenState.categoryIndex}
          initialDishId={fullscreenState.dishId}
          isClient={true}
          trackViews={!isOwnerViewing}
          onClose={() => setFullscreenState(null)}
          onAddToCart={(dish) => {
            updateCart(dish, 1);
          }}
        />
      )}

      {/* Cart Button & Modal */}
      <OrderCart
        cart={cart}
        restaurantId={restaurantId}
        onCartUpdate={updateCart}
        onOrderSuccess={() => setCart({})}
      />
    </div>
  );
}
