import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import './Marketplace.css';

export default function FarmerOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState({
    date: '',
    time: '',
    location: ''
  });

  useEffect(() => {
    if (!currentUser) return;
    fetchOrders();

    const subscription = supabase
      .channel('orders_changes')
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
          products ( crop_name, location, image_url )
        `)
        .eq('farmer_id', currentUser.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const updateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          ...additionalData
        })
        .eq('id', orderId);

      if (error) throw error;
      alert(`Order updated to ${newStatus.replace(/_/g, ' ')}!`);
      fetchOrders();
    } catch (err) {
      console.error("Error updating order:", err);
      alert('Failed to update order.');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (!deliveryDetails.date || !deliveryDetails.time || !deliveryDetails.location) {
      return alert('Please provide all details (Date, Time, and Location).');
    }

    await updateOrderStatus(orderId, 'confirmed', {
      delivery_date: deliveryDetails.date,
      delivery_time: deliveryDetails.time,
      delivery_address: deliveryDetails.location // Update location if farmer provides a different one
    });
    setConfirmingId(null);
    setDeliveryDetails({ date: '', time: '', location: '' });
  };

  const markAsSold = async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', productId);
      
      if (error) throw error;
      alert('Product marked as SOLD. It will no longer be visible for purchase.');
    } catch (err) {
      console.error("Error marking as sold:", err);
    }
  };

  if (loading) return <div className="marketplace-container">Loading orders...</div>;

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1 className="gradient-text">Sales Dashboard</h1>
          <p>Manage your orders and track delivery progress.</p>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>When customers buy your crops, they will appear here.</p>
        </div>
      ) : (
        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order, index) => (
            <div key={order.id} className="form-card" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '20px', 
              borderLeft: `6px solid ${
                order.status === 'pending' ? 'var(--orange-400)' : 
                order.status === 'delivered' ? 'var(--green-500)' : 'var(--blue-400)'
              }`
            }}>
              <div className="order-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span className="product-badge" style={{ 
                    background: order.status === 'pending' ? '#fff7ed' : '#f0fdf4', 
                    color: order.status === 'pending' ? '#c2410c' : '#15803d',
                    padding: '6px 12px',
                    borderRadius: '50px',
                    fontSize: '0.8rem'
                  }}>
                    {order.status.toUpperCase().replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Order #{orders.length - index} — {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem' }}>{order.products?.crop_name || 'Unknown Crop'}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '1rem' }}>
                  <div className="info-block">
                    <p style={{ marginBottom: '8px' }}><strong>👤 Buyer:</strong> {order.buyer_name}</p>
                    <p style={{ marginBottom: '8px' }}><strong>⚖️ Quantity:</strong> {order.quantity_ordered} kg</p>
                    <p style={{ marginBottom: '8px' }}><strong>💰 Total:</strong> ₹{order.total_price}</p>
                  </div>
                  <div className="info-block">
                    <p style={{ marginBottom: '8px' }}><strong>📞 Contact:</strong> {order.contact_number}</p>
                    <p style={{ marginBottom: '8px' }}><strong>📍 Address:</strong> {order.delivery_address}</p>
                    <p style={{ marginBottom: '8px' }}><strong>🚛 Preference:</strong> {order.delivery_preference === 'home_delivery' ? 'Home Delivery' : 'Farm Pickup'}</p>
                  </div>
                </div>

                {order.status !== 'pending' && (
                  <div style={{ marginTop: '20px', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <p><strong>📅 Scheduled:</strong> {order.delivery_date} at {order.delivery_time}</p>
                    <p><strong>📍 Pickup/Delivery Point:</strong> {order.delivery_address}</p>
                  </div>
                )}
              </div>

              <div className="order-actions" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', minWidth: '220px' }}>
                {order.status === 'pending' && (
                  confirmingId === order.id ? (
                    <div className="confirmation-form" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                      <input 
                        type="date" 
                        value={deliveryDetails.date}
                        onChange={e => setDeliveryDetails({...deliveryDetails, date: e.target.value})}
                        style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
                      />
                      <input 
                        type="time" 
                        value={deliveryDetails.time}
                        onChange={e => setDeliveryDetails({...deliveryDetails, time: e.target.value})}
                        style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Location/Meeting Point"
                        value={deliveryDetails.location}
                        onChange={e => setDeliveryDetails({...deliveryDetails, location: e.target.value})}
                        style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" onClick={() => handleConfirmOrder(order.id)} style={{ flex: 1, padding: '10px' }}>Confirm</button>
                        <button className="btn-secondary" onClick={() => setConfirmingId(null)} style={{ flex: 1, padding: '10px' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-primary" onClick={() => setConfirmingId(order.id)} style={{ width: '100%' }}>
                      Confirm Order
                    </button>
                  )
                )}

                {order.status === 'confirmed' && (
                  <button className="btn-primary" style={{ background: 'var(--blue-600)' }} onClick={() => updateOrderStatus(order.id, 'on_the_way')}>
                    Mark as On the Way
                  </button>
                )}

                {order.status === 'on_the_way' && (
                  <button className="btn-primary" style={{ background: 'var(--blue-800)' }} onClick={() => updateOrderStatus(order.id, 'arrived')}>
                    Mark as Arrived
                  </button>
                )}

                {order.status === 'arrived' && (
                  <button className="btn-primary" style={{ background: 'var(--green-600)' }} onClick={() => updateOrderStatus(order.id, 'delivered')}>
                    Mark as Delivered
                  </button>
                )}

                {order.status === 'delivered' && (
                   <div style={{ textAlign: 'center' }}>
                      <p style={{ color: 'var(--green-600)', fontWeight: 800, marginBottom: '10px' }}>✅ DELIVERED</p>
                      <button className="btn-secondary" style={{ background: '#fef3c7', color: '#92400e', border: 'none' }} onClick={() => markAsSold(order.product_id)}>
                        Mark Product as SOLD 🏷️
                      </button>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
