import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import './Marketplace.css';

export default function MyOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    fetchOrders();

    const subscription = supabase
      .channel('my_orders_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products ( crop_name, location, image_url, farmer_name )
        `)
        .eq('buyer_id', currentUser.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Supabase Orders Error:", err);
      setError(`Failed to load orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const getStatusDisplay = (status) => {
    const statuses = {
      pending: { label: 'Ordered', color: '#f59e0b', icon: '📝' },
      confirmed: { label: 'Confirmed', color: '#10b981', icon: '✅' },
      on_the_way: { label: 'On the Way', color: '#3b82f6', icon: '🚚' },
      arrived: { label: 'Arrived at Point', color: '#8b5cf6', icon: '📍' },
      delivered: { label: 'Delivered', color: '#059669', icon: '📦' }
    };
    return statuses[status] || { label: status, color: '#6b7280', icon: '❓' };
  };

  if (loading) return <div className="marketplace-container">Loading orders...</div>;

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1 className="gradient-text">My Orders</h1>
          <p>Track your purchases and stay updated on delivery status.</p>
        </div>
      </header>

      {error ? (
        <div className="error-state">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Browse the marketplace to find fresh crops from farmers!</p>
          <button className="btn-primary" onClick={() => window.location.href='/marketplace'} style={{ marginTop: '20px' }}>
            Go to Marketplace
          </button>
        </div>
      ) : (
        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map((order, index) => {
            const status = getStatusDisplay(order.status);
            return (
              <div key={order.id} className="form-card" style={{ 
                borderLeft: `6px solid ${status.color}`,
                padding: '30px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{status.icon}</span>
                      <span style={{ color: status.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {status.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{order.products?.crop_name || 'Unknown Crop'}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--green-700)', fontWeight: 600, marginTop: '4px' }}>
                      👨‍🌾 Seller: {order.products?.farmer_name || 'Verified Farmer'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--green-600)', margin: 0 }}>₹{order.total_price}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cash on Delivery</p>
                  </div>
                </div>

                <div className="order-progress-stepper" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative', padding: '0 10px' }}>
                   {['pending', 'confirmed', 'on_the_way', 'arrived', 'delivered'].map((s, idx) => {
                      const isActive = ['pending', 'confirmed', 'on_the_way', 'arrived', 'delivered'].indexOf(order.status) >= idx;
                      return (
                        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                           <div style={{ 
                             width: '12px', height: '12px', borderRadius: '50%', 
                             background: isActive ? status.color : 'var(--gray-300)',
                             marginBottom: '8px',
                             transition: 'all 0.3s ease'
                           }} />
                           <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isActive ? 'var(--dark)' : 'var(--text-muted)' }}>
                             {s.replace(/_/g, ' ').toUpperCase()}
                           </span>
                        </div>
                      );
                   })}
                   <div style={{ 
                     position: 'absolute', top: '5px', left: '20px', right: '20px', height: '2px', 
                     background: 'var(--gray-200)', zIndex: 1 
                   }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '0.95rem', borderTop: '1px solid var(--gray-100)', paddingTop: '20px' }}>
                  <div className="details-col">
                    <p><strong>⚖️ Quantity:</strong> {order.quantity_ordered} kg</p>
                    <p><strong>🏠 Delivery Preference:</strong> {order.delivery_preference === 'home_delivery' ? 'Home Delivery' : 'Farm Pickup'}</p>
                  </div>
                  <div className="details-col">
                    {order.status === 'pending' ? (
                       <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                         ⌛ Waiting for farmer confirmation and schedule...
                       </p>
                    ) : (
                       <>
                         <p><strong>📅 Scheduled:</strong> {order.delivery_date} at {order.delivery_time}</p>
                         <p><strong>📍 Pickup/Delivery Address:</strong> {order.delivery_address}</p>
                       </>
                    )}
                  </div>
                </div>

                {order.status === 'delivered' && (
                  <div style={{ marginTop: '20px', textAlign: 'center', padding: '12px', background: 'var(--green-50)', color: 'var(--green-800)', borderRadius: '8px', fontWeight: 600 }}>
                    🤝 Order completed! Hope you enjoyed the fresh produce.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
