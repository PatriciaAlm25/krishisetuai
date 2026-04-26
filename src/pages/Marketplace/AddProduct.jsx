import { useState, useRef, useEffect } from 'react';
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

  // Disable long retries for storage uploads
  storage.maxUploadRetryTime = 2000; // 2 seconds instead of 10 minutes

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
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas for compression
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Shrink to 800px max
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_WIDTH) {
              width *= MAX_WIDTH / height;
              height = MAX_WIDTH;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed Base64 JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality
          setImagePreview(compressedBase64);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked. Image:", image);
    
    if (!image) return setError('Please upload an image of your crop.');
    
    setLoading(true);
    setError('');

    try {
      // Use the Base64 image preview directly since Storage is unavailable
      const imageUrl = imagePreview || 'https://images.pexels.com/photos/2252542/pexels-photo-2252542.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

      console.log("Saving listing with Base64 image...");
      await addDoc(collection(db, 'crop_listings'), {
        farmerId: currentUser?.uid || 'anonymous_farmer',
        cropName: formData.cropName,
        quantity: Number(formData.quantity),
        pricePerUnit: Number(formData.price),
        unit: 'kg',
        location: `${userProfile?.city || 'Unknown'}, ${userProfile?.state || 'India'}`,
        imageUrl: imageUrl,
        status: 'available',
        createdAt: serverTimestamp()
      });

      alert('✅ Crop listed successfully with your image!');
      navigate('/marketplace');
    } catch (err) {
      console.error("CRITICAL ERROR IN LISTING:", err);
      setError(`Error: ${err.message || 'Unknown error'}`);
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
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
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
