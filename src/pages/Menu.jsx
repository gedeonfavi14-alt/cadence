import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import DishGrid from '../components/DishGrid';
import DishFullscreen from '../components/DishFullscreen';

const CATEGORIES = ["Entrées", "Plats principaux", "Accompagnements", "Desserts", "Boissons"];

export default function Menu() {
  const { restaurant } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenState, setFullscreenState] = useState(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (restaurant?.id) {
      fetchDishes();
    }
  }, [restaurant?.id]);

  async function fetchDishes() {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDishes(data || []);
    } catch (err) {
      toast.error('Erreur de chargement du menu');
    } finally {
      setLoading(false);
    }
  }

  async function toggleDishActive(dish) {
    try {
      const newActive = !dish.active;
      const { error } = await supabase
        .from('dishes')
        .update({ active: newActive })
        .eq('id', dish.id);

      if (error) throw error;
      
      setDishes(prev => prev.map(d => 
        d.id === dish.id ? { ...d, active: newActive } : d
      ));
      
      toast.success(`Plat ${newActive ? 'activé' : 'désactivé'}`);
    } catch (err) {
      toast.error('Erreur lors de la modification');
    }
  }

  const handleCategoryScroll = (e) => {
    const container = e.target;
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
    setFullscreenState({ dishId: dish.id, categoryIndex });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-olive border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalViews = dishes.reduce((sum, dish) => sum + (dish.views || 0), 0);

  return (
    <div className="animate-fade-in pb-4">
      {/* Profile Header (TikTok Style) */}
      <div className="flex flex-col items-center mb-4 pt-4">
        {restaurant?.logo_url ? (
          <img 
            src={restaurant.logo_url} 
            alt={restaurant.name} 
            className="w-24 h-24 rounded-full object-cover border-2 border-border-light mb-3"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-bg-elevated flex items-center justify-center text-3xl mb-3 border-2 border-border-light">
            🍽️
          </div>
        )}
        <h1 className="text-xl font-bold">@{restaurant?.name?.replace(/\s+/g, '').toLowerCase() || 'restaurant'}</h1>
        
        <div className="flex items-center gap-6 mt-3 mb-5">
          <div className="text-center">
            <div className="font-bold text-lg">{dishes.length}</div>
            <div className="text-xs text-text-secondary">Plats</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{totalViews}</div>
            <div className="text-xs text-text-secondary">Vues</div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/menu-manage/add')}
          className="btn btn-primary w-[200px]"
        >
          <Plus size={18} /> Ajouter un plat
        </button>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-[53px] z-20 bg-bg-primary border-b border-border-light">
        <div className="flex overflow-x-auto snap-x hide-scrollbar swipe-horizontal">
          {CATEGORIES.map((cat, idx) => {
            const count = dishes.filter(d => d.category === cat || (!d.category && idx === 0)).length;
            return (
              <button
                key={cat}
                onClick={() => handleTabClick(idx)}
                className={`whitespace-nowrap px-4 py-3 font-semibold text-sm transition-colors ${
                  activeCategoryIndex === idx ? 'text-olive border-b-2 border-olive' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Feed Container (Horizontal Snap) */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar swipe-horizontal w-full"
        onScroll={handleCategoryScroll}
      >
        {CATEGORIES.map((cat, idx) => {
          const categoryDishes = dishes.filter(d => 
            d.category === cat || (!d.category && idx === 0)
          );

          return (
            <div key={cat} className="w-full shrink-0 snap-start p-1 min-h-[50vh]">
              <DishGrid
                items={categoryDishes}
                isClient={false}
                trackViews={false}
                onDishClick={(dish) => handleDishClick(dish, idx)}
                onToggleActive={toggleDishActive}
              />
            </div>
          );
        })}
      </div>

      {/* Fullscreen View */}
      {fullscreenState !== null && (
        <DishFullscreen
          categories={CATEGORIES}
          dishes={dishes}
          initialCategoryIndex={fullscreenState.categoryIndex}
          initialDishId={fullscreenState.dishId}
          isClient={false}
          onClose={() => setFullscreenState(null)}
        />
      )}
    </div>
  );
}
