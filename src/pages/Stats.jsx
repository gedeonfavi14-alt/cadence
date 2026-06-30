import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatFCFA, conversionRate } from '../lib/utils';

export default function Stats() {
  const { restaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgBasket: 0,
    topDishesByViews: [],
    topDishesByOrders: [],
    performanceTable: []
  });

  useEffect(() => {
    if (restaurant?.id) {
      fetchAnalytics();
    }
  }, [restaurant?.id]);

  async function fetchAnalytics() {
    try {
      // 1. Fetch Orders for Revenue & Avg Basket (ONLY Delivered orders as per prompt)
      const { data: orders } = await supabase
        .from('orders')
        .select('total, id')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'delivered');

      let totalRev = 0;
      let totalOrd = orders?.length || 0;
      
      if (orders) {
        totalRev = orders.reduce((sum, o) => sum + Number(o.total), 0);
      }
      const avgB = totalOrd > 0 ? totalRev / totalOrd : 0;

      // 2. Fetch Dishes for Views and Orders count
      const { data: dishes } = await supabase
        .from('dishes')
        .select(`
          id, 
          name, 
          views,
          order_items (quantity, orders!inner(status))
        `)
        .eq('restaurant_id', restaurant.id);

      let totViews = 0;
      let dishStats = [];

      if (dishes) {
        dishes.forEach(dish => {
          totViews += (dish.views || 0);
          
          // Calculate orders and revenue for this dish (only from delivered orders)
          let dishOrders = 0;
          let dishRev = 0;
          
          if (dish.order_items) {
            dish.order_items.forEach(oi => {
              if (oi.orders?.status === 'delivered') {
                dishOrders += oi.quantity;
                // We don't have price in this query easily, let's approximate or just rely on quantity for now.
                // Actually we need price_at_time. Let's fetch order_items directly for revenue calculation per dish.
              }
            });
          }
          
          dishStats.push({
            id: dish.id,
            name: dish.name,
            views: dish.views || 0,
            orders: dishOrders,
            revenue: 0 // Will calculate in next step
          });
        });
      }

      // 3. Fetch specific order_items for accurate dish revenue
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('dish_id, quantity, price_at_time, orders!inner(status)')
        .eq('orders.restaurant_id', restaurant.id)
        .eq('orders.status', 'delivered');

      if (orderItems && dishStats.length > 0) {
        const revMap = {};
        orderItems.forEach(oi => {
          if (!revMap[oi.dish_id]) revMap[oi.dish_id] = 0;
          revMap[oi.dish_id] += (oi.quantity * oi.price_at_time);
        });
        
        dishStats = dishStats.map(ds => ({
          ...ds,
          revenue: revMap[ds.id] || 0
        }));
      }

      // Calculate conversion rates
      dishStats = dishStats.map(ds => ({
        ...ds,
        convRate: conversionRate(ds.orders, ds.views)
      }));

      // Sortings
      const byViews = [...dishStats].sort((a, b) => b.views - a.views).slice(0, 5);
      const byOrders = [...dishStats].sort((a, b) => b.orders - a.orders).slice(0, 5);
      const byConv = [...dishStats].sort((a, b) => b.convRate - a.convRate);

      setStats({
        totalViews: totViews,
        totalOrders: totalOrd,
        totalRevenue: totalRev,
        avgBasket: avgB,
        topDishesByViews: byViews,
        topDishesByOrders: byOrders,
        performanceTable: byConv
      });

    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-olive border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Heureux de vous revoir,</h1>
        <p className="text-olive font-bold text-lg">{restaurant?.name}</p>
      </div>

      {/* Main KPIs (Exact Order as prompt: Views, Orders, Rev, Avg Basket) */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="card flex flex-col gap-1 p-4">
          <Users size={20} className="text-blue-500 mb-1" />
          <div className="text-2xl font-bold">{stats.totalViews}</div>
          <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Total vues</div>
        </div>
        
        <div className="card flex flex-col gap-1 p-4">
          <ShoppingBag size={20} className="text-orange-500 mb-1" />
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Total commandes</div>
        </div>
        
        <div className="card flex flex-col gap-1 p-4 col-span-2 bg-olive/10 border-olive/30">
          <Wallet size={20} className="text-olive mb-1" />
          <div className="text-3xl font-bold text-olive">{formatFCFA(stats.totalRevenue)}</div>
          <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Chiffre d'Affaires</div>
        </div>
        
        <div className="card flex flex-col gap-1 p-4 col-span-2">
          <TrendingUp size={20} className="text-purple-500 mb-1" />
          <div className="text-xl font-bold">{formatFCFA(stats.avgBasket)}</div>
          <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Panier moyen</div>
        </div>
      </div>

      {/* Top Lists */}
      <div className="space-y-6 mb-8">
        <div>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span> Top par Vues
          </h3>
          <div className="card p-0 overflow-hidden">
            {stats.topDishesByViews.map((dish, i) => (
              <div key={dish.id} className="flex justify-between items-center p-3 border-b border-border-light last:border-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="font-bold text-text-muted w-4">{i+1}</span>
                  <span className="font-medium truncate">{dish.name}</span>
                </div>
                <span className="font-bold bg-bg-elevated px-2 py-1 rounded text-sm">{dish.views}</span>
              </div>
            ))}
            {stats.topDishesByViews.length === 0 && (
              <div className="p-4 text-center text-text-muted text-sm">Pas de données</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span> Top par Commandes
          </h3>
          <div className="card p-0 overflow-hidden">
            {stats.topDishesByOrders.map((dish, i) => (
              <div key={dish.id} className="flex justify-between items-center p-3 border-b border-border-light last:border-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="font-bold text-text-muted w-4">{i+1}</span>
                  <span className="font-medium truncate">{dish.name}</span>
                </div>
                <span className="font-bold bg-bg-elevated px-2 py-1 rounded text-sm">{dish.orders}</span>
              </div>
            ))}
            {stats.topDishesByOrders.length === 0 && (
              <div className="p-4 text-center text-text-muted text-sm">Pas de données</div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-olive rounded-full"></span> Performance des plats
        </h3>
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-bg-elevated text-text-secondary text-xs uppercase">
                <th className="p-3 font-semibold w-full">Plat</th>
                <th className="p-3 font-semibold text-right">Vues</th>
                <th className="p-3 font-semibold text-right">Cmds</th>
                <th className="p-3 font-semibold text-right">Revenu</th>
                <th className="p-3 font-semibold text-right">Conv.</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {stats.performanceTable.map((dish) => (
                <tr key={dish.id} className="border-b border-border-light last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="p-3 font-medium truncate max-w-[120px]">{dish.name}</td>
                  <td className="p-3 text-right">{dish.views}</td>
                  <td className="p-3 text-right">{dish.orders}</td>
                  <td className="p-3 text-right font-medium">{formatFCFA(dish.revenue)}</td>
                  <td className="p-3 text-right font-bold text-olive">{dish.convRate.toFixed(1)}%</td>
                </tr>
              ))}
              {stats.performanceTable.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-text-muted">Aucun plat dans le menu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
