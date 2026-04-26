import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import './Marketplace.css';

export default function Checkout() {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    phone: '',
    address: '',
    deliveryPreference: 'home_delivery', 
    quantity: 1
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error("Fetch Product Error:", err);
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('You must be logged in to place an order.');
    if (formData.quantity > product.quantity) {
      return alert('Requested quantity exceeds available stock.');
    }
    
    setSubmitting(true);

    try {
      const requestedQty = Number(formData.quantity);
      const newQuantity = product.quantity - requestedQty;

      // 1. Create order
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          product_id: product.id,
          buyer_id: currentUser.uid,
          buyer_name: formData.fullName,
          farmer_id: product.farmer_id,
          quantity_ordered: requestedQty,
          total_price: requestedQty * product.price,
          delivery_address: formData.address,
          contact_number: formData.phone,
          delivery_preference: formData.deliveryPreference,
          status: 'pending'
        }]);

      if (orderError) throw orderError;

      // 2. Update product quantity
      const { error: productError } = await supabase
        .from('products')
        .update({ 
          quantity: newQuantity,
          status: newQuantity === 0 ? 'soldout' : 'available'
        })
        .eq('id', product.id);

      if (productError) throw productError;

      alert('Order placed successfully via Supabase!');
      navigate('/my-orders');
    } catch (err) {
      console.error("Order process failed: ", err);
      alert('Order failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="marketplace-container">Loading checkout...</div>;

  return (
    <div className="marketplace-container">
      <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px' }}>
        <div className="checkout-form-section">
          <h2 className="gradient-text" style={{ marginBottom: '24px' }}>Complete Your Purchase</h2>
          
          <form onSubmit={handleSubmit} className="form-card">
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label>Full Name</label>
              <input 
                type="text" required 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              />
            </div>
            
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label>Phone Number</label>
              <input 
                type="tel" required 
                placeholder="Enter 10-digit mobile number"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label>Delivery Address</label>
              <textarea 
                required 
                rows="3"
                placeholder="House no, Street, Landmark, City, State"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)', resize: 'none' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Delivery Preference</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" name="delivery" value="home_delivery" 
                    checked={formData.deliveryPreference === 'home_delivery'}
                    onChange={e => setFormData({...formData, deliveryPreference: e.target.value})}
                  />
                  Home Delivery
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" name="delivery" value="pickup" 
                    checked={formData.deliveryPreference === 'pickup'}
                    onChange={e => setFormData({...formData, deliveryPreference: e.target.value})}
                  />
                  Pickup from Farm
                </label>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Quantity to Buy (kg)</label>
              <input 
                type="number" required min="1" max={product.quantity}
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Max available: {product.quantity} {product.unit}
              </p>
            </div>

            <div className="payment-note" style={{ background: 'var(--green-50)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <p style={{ fontWeight: 600, color: 'var(--green-800)' }}>💰 Payment Method: Cash on Delivery</p>
              <p style={{ fontSize: '0.85rem' }}>Pay directly to the farmer upon receiving your crops.</p>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {submitting ? 'Processing Order...' : 'Confirm Order'}
            </button>
          </form>
        </div>

        <div className="order-summary-section">
          <div className="form-card" style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '16px' }}>Order Summary</h3>
            <div className="summary-item" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <img src={product.image_url} alt={product.crop_name} style={{ width: '80px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
              <div>
                <p style={{ fontWeight: 600 }}>{product.crop_name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {product.location}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--green-600)', fontWeight: 600 }}>👨‍🌾 Seller: {product.farmer_name || 'Verified Farmer'}</p>
              </div>
            </div>
            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--gray-100)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Price per {product.unit}</span>
              <span>₹{product.price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Quantity</span>
              <span>{formData.quantity} {product.unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', marginTop: '16px', color: 'var(--green-600)' }}>
              <span>Total</span>
              <span>₹{formData.quantity * product.price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
