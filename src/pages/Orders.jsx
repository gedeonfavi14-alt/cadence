import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import { supabase } from '../lib/supabase';
import { formatFCFA, formatTime } from '../lib/utils';

export default function Orders() {
  const { restaurant } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id, dish_name, quantity, price_at_time
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id]);

  // Handle realtime updates
  useRealtimeOrders((newOrder) => {
    fetchOrders(); // Reload to get items
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );

      toast.success(newStatus === 'delivered' ? 'Commande livrée !' : 'Statut mis à jour');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  }

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending') return o.status === 'pending';
    if (activeTab === 'delivered') return o.status === 'delivered';
    return true;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-olive border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Commandes en cours</h1>
        <p className="text-text-secondary text-sm">Gérez les demandes de vos tables en temps réel</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-bg-elevated rounded-lg border border-border-light mb-6">
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors relative ${activeTab === 'pending' ? 'bg-card shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('pending')}
        >
          En attente
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'delivered' ? 'bg-card shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('delivered')}
        >
          Livrées
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-border-strong rounded-xl">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
              {activeTab === 'pending' ? <Clock size={28} /> : <CheckCircle2 size={28} />}
            </div>
            <h3 className="font-bold text-lg mb-1">Aucune commande</h3>
            <p className="text-text-secondary text-sm">
              {activeTab === 'pending' ? 'Les nouvelles commandes apparaîtront ici' : 'Aucune commande livrée aujourd\'hui'}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="card relative overflow-hidden group">
              {/* Status accent line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === 'pending' ? 'bg-amber-400' : 'bg-green-500'}`} />
              
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <h3 className="font-bold text-lg">Table {order.table_number}</h3>
                  <div className="text-text-muted text-xs flex items-center gap-1 mt-0.5">
                    <Clock size={12} /> {formatTime(order.created_at)}
                  </div>
                </div>
                
                {order.status === 'pending' ? (
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                    En attente
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Livré
                  </span>
                )}
              </div>

              <div className="bg-bg-elevated rounded-lg p-3 mb-4 pl-4 space-y-2">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex items-start">
                      <span className="font-bold text-olive mr-2">{item.quantity}x</span>
                      <span className="text-text-primary line-clamp-1">{item.dish_name}</span>
                    </div>
                    <span className="text-text-muted shrink-0 ml-2">
                      {formatFCFA(item.price_at_time * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pl-2">
                <div className="font-bold text-lg">{formatFCFA(order.total)}</div>
                
                {order.status === 'pending' ? (
                  <button
                    className="btn btn-primary btn-sm px-5"
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                  >
                    Marquer livré
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm text-text-muted"
                    onClick={() => updateOrderStatus(order.id, 'pending')}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
