import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import './Marketplace.css';

export default function MyOrders() {
  const { currentUser, userProfile } = useAuth();
  const isFarmer = userProfile?.role === 'farmer';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryInputs, setDeliveryInputs] = useState({});

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    let q;
    if (isFarmer) {
      q = query(ordersRef, where('farmerId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    } else {
      q = query(ordersRef, where('buyerId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Orders Error:", err);
      setError(`Failed to load orders: ${err.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.uid, isFarmer]);

  const handleUpdateDeliveryDate = async (orderId) => {
    const date = deliveryInputs[orderId];
    if (!date) return alert('Please enter a delivery date/time.');

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryDate: date,
        status: 'confirmed'
      });
      alert('Delivery date updated and buyer notified!');
    } catch (err) {
      console.error(err);
      alert('Failed to update.');
    }
  };

  const handleMarkAsDelivered = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'delivered'
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1 className="gradient-text">{isFarmer ? 'Customer Orders' : 'My Purchases'}</h1>
          <p>{isFarmer ? 'Manage orders from buyers' : 'Track your crop purchases'}</p>
        </div>
      </header>

      {error ? (
        <div className="error-state" style={{ color: 'red', textAlign: 'center', padding: '50px' }}>
          <h3>⚠️ Error</h3>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="loading-state">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>{isFarmer ? 'New orders will appear here.' : 'Go to the marketplace to buy crops!'}</p>
        </div>
      ) : (
        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order, index) => (
            <div key={order.id} className="order-card" style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-sm)',
              borderLeft: `6px solid ${order.status === 'sold' ? 'var(--gray-300)' : order.status === 'confirmed' ? 'var(--green-400)' : 'var(--blue-400)'}`,
              animation: 'fadeInUp 0.5s ease',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '20px'
            }}>
              <div className="order-details">
                {isFarmer && order.status === 'pending' && (
                   <div className="notification-badge" style={{ 
                     background: 'var(--blue-600)', 
                     color: 'white', 
                     padding: '2px 10px', 
                     borderRadius: '10px', 
                     fontSize: '0.75rem', 
                     display: 'inline-block',
                     marginBottom: '10px'
                   }}>
                     New Customer Order #{orders.length - index}
                   </div>
                )}
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{order.cropName}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <p><strong>Quantity:</strong> {order.quantityOrdered} kg</p>
                  <p><strong>Total:</strong> ₹{order.totalPrice}</p>
                  <p><strong>Status:</strong> <span style={{ 
                    color: order.status === 'delivered' ? 'var(--green-600)' : order.status === 'confirmed' ? 'var(--blue-600)' : 'var(--orange-500)',
                    fontWeight: 700,
                    textTransform: 'capitalize'
                  }}>{order.status}</span></p>
                  <p><strong>Order Date:</strong> {order.createdAt?.toDate().toLocaleDateString()}</p>
                </div>

                <div className="delivery-info" style={{ marginTop: '16px', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                   {order.deliveryDate ? (
                      <p><strong>Scheduled Delivery:</strong> {order.deliveryDate}</p>
                   ) : (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        {isFarmer ? 'Please provide a delivery date/time to confirm.' : 'Waiting for farmer to provide delivery date.'}
                      </p>
                   )}
                </div>
                
                {isFarmer && (
                   <div className="buyer-details" style={{ marginTop: '16px', fontSize: '0.9rem' }}>
                      <p><strong>Delivery To:</strong> {order.deliveryAddress}</p>
                      <p><strong>Contact:</strong> {order.contactNumber}</p>
                   </div>
                )}
              </div>

              <div className="order-actions" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                {isFarmer && order.status !== 'delivered' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Delivery Date/Time</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 26th April, 10 AM"
                        value={deliveryInputs[order.id] || ''}
                        onChange={(e) => setDeliveryInputs({...deliveryInputs, [order.id]: e.target.value})}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--gray-300)' }}
                      />
                      <button className="btn-secondary" style={{ padding: '8px', fontSize: '0.85rem' }} onClick={() => handleUpdateDeliveryDate(order.id)}>
                        Confirm Date
                      </button>
                    </div>
                    <button className="btn-primary" style={{ background: 'var(--gray-700)' }} onClick={() => handleMarkAsDelivered(order.id)}>
                      Mark as Delivered
                    </button>
                  </>
                )}
                
                {!isFarmer && order.status === 'delivered' && (
                   <div style={{ textAlign: 'center', color: 'var(--green-600)', fontWeight: 600 }}>
                      ✅ Delivered
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
