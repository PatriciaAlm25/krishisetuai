import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Marketplace.css'; // Reuse marketplace styles or add specific ones

export default function AddProduct() {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    cropName: '',
    price: '',
    quantity: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setError('Please upload an image of your crop.');
    
    setLoading(true);
    setError('');

    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `products/${currentUser.uid}_${Date.now()}_${image.name}`);
      const snapshot = await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(snapshot.ref);

      // 2. Save product info to Firestore
      await addDoc(collection(db, 'products'), {
        cropName: formData.cropName,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        imageUrl: imageUrl,
        farmerId: currentUser.uid,
        farmerName: userProfile.fullName,
        location: `${userProfile.city}, ${userProfile.state}`,
        createdAt: serverTimestamp()
      });

      navigate('/marketplace');
    } catch (err) {
      console.error("Error adding product:", err);
      setError('Failed to list product. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketplace-container">
      <div className="form-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeInUp 0.6s ease' }}>
        <h2 className="gradient-text" style={{ marginBottom: '24px' }}>List New Crop</h2>
        
        {error && <div className="error-msg" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="image-upload-section" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div 
              className="image-preview-box" 
              onClick={() => fileInputRef.current.click()}
              style={{
                width: '100%',
                height: '250px',
                border: '2px dashed var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                background: 'var(--gray-50)',
                transition: 'all 0.3s ease'
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '2rem', display: 'block' }}>📸</span>
                  Click to Upload or Take Photo
                </div>
              )}
            </div>
            {/* hidden input for file/camera */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Upload from device or use camera
            </p>
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Crop Name</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Organic Wheat"
              value={formData.cropName}
              onChange={(e) => setFormData({...formData, cropName: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Price (₹ per kg)</label>
              <input 
                type="number" 
                required 
                placeholder="45"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Quantity (kg)</label>
              <input 
                type="number" 
                required 
                placeholder="500"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Listing Product...' : 'Confirm & List Crop'}
          </button>
          
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate('/marketplace')}
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px', border: 'none' }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
