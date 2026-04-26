import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
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
    deliveryPreference: 'home_delivery', // or 'pickup'
    quantity: 1
  });

  useEffect(() => {
    async function fetchProduct() {
      const docRef = doc(db, 'crop_listings', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/marketplace');
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.quantity > product.quantity) {
      return alert('Requested quantity exceeds available stock.');
    }
    
    setSubmitting(true);

    try {
      const listingRef = doc(db, 'crop_listings', id);
      const orderRef = doc(collection(db, 'orders'));

      await runTransaction(db, async (transaction) => {
        const listingDoc = await transaction.get(listingRef);
        if (!listingDoc.exists()) throw "Listing does not exist!";

        const newQuantity = listingDoc.data().quantity - Number(formData.quantity);
        if (newQuantity < 0) throw "Not enough stock!";

        // Update listing
        transaction.update(listingRef, {
          quantity: newQuantity,
          status: newQuantity === 0 ? 'soldout' : 'available'
        });

        // Create order
        transaction.set(orderRef, {
          buyerId: currentUser.uid,
          farmerId: product.farmerId,
          listingId: product.id,
          cropName: product.cropName,
          quantityOrdered: Number(formData.quantity),
          deliveryAddress: formData.address,
          contactNumber: formData.phone,
          totalPrice: Number(formData.quantity) * product.pricePerUnit,
          status: 'pending',
          createdAt: serverTimestamp()
        });
      });

      alert('Order placed successfully!');
      navigate('/my-orders');
    } catch (err) {
      console.error("Transaction failed: ", err);
      alert('Order failed: ' + err);
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
              <img src={product.imageUrl} alt={product.cropName} style={{ width: '80px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
              <div>
                <p style={{ fontWeight: 600 }}>{product.cropName}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{product.location}</p>
              </div>
            </div>
            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--gray-100)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Price per {product.unit}</span>
              <span>₹{product.pricePerUnit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Quantity</span>
              <span>{formData.quantity} {product.unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', marginTop: '16px', color: 'var(--green-600)' }}>
              <span>Total</span>
              <span>₹{formData.quantity * product.pricePerUnit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
