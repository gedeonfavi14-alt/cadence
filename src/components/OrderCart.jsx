import { useState } from 'react';
import { ShoppingBag, Minus, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { formatFCFA } from '../lib/utils';

export default function OrderCart({ cart, restaurantId, onCartUpdate, onOrderSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  async function handleOrder() {
    if (!tableNumber.trim()) {
      toast.error('Veuillez saisir votre numéro de table');
      return;
    }

    if (totalItems === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_number: tableNumber.trim(),
          total: total,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsToInsert = cartItems.map(item => ({
        order_id: order.id,
        dish_id: item.id,
        dish_name: item.name,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Commande envoyée en cuisine !');
      setIsOpen(false);
      setTableNumber('');
      if (onOrderSuccess) onOrderSuccess();
      
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  if (totalItems === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && totalItems > 0 && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[110] bg-olive text-white px-6 py-4 rounded-full shadow-lg shadow-olive/30 flex items-center gap-3 animate-fade-in transition-transform hover:scale-105 active:scale-95"
        >
          <ShoppingBag size={24} />
          <span className="font-bold text-lg">{formatFCFA(total)}</span>
          <div className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border-2 border-black">
            {totalItems}
          </div>
        </button>
      )}

      {/* Cart Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-[#1A1A1A] w-full max-h-[85vh] rounded-t-3xl shadow-2xl flex flex-col animate-slide-up text-white border-t border-white/10">
            {/* Handle for visual affordance */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
            
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-olive" /> Ma Commande
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/10">
                <label className="block text-sm font-medium text-gray-400 mb-2">Numéro de table *</label>
                <input
                  type="text"
                  placeholder="Ex: 12, Terrasse 3..."
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-olive focus:ring-1 focus:ring-olive transition-colors text-lg font-bold"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Votre panier est vide</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      {item.media_url && item.media_type === 'photo' ? (
                        <img src={item.media_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-black/50 flex items-center justify-center text-2xl">🍽️</div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                        <div className="text-olive font-semibold">{formatFCFA(item.price)}</div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-black/40 rounded-full p-1 border border-white/10">
                        <button 
                          onClick={() => onCartUpdate(item, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onCartUpdate(item, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-olive text-white hover:bg-olive-light"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-black/40 border-t border-white/10 pb-safe">
              <div className="flex justify-between items-center mb-4 text-lg">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-2xl">{formatFCFA(total)}</span>
              </div>
              <button 
                className="btn btn-primary btn-full py-4 text-lg"
                onClick={handleOrder}
                disabled={loading || totalItems === 0 || !tableNumber.trim()}
              >
                {loading ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Confirmer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
