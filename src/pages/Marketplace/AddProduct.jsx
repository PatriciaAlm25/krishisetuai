import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import './Marketplace.css'; 

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
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image) return setError('Please upload an image of your crop.');
    
    setLoading(true);
    setError('');

    try {
      // 1. Upload to Supabase Storage
      const fileExt = image.name.split('.').pop();
      const fileName = `${currentUser.uid}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('crops')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('crops')
        .getPublicUrl(filePath);

      // 2. Save metadata to Supabase Database
      const { error: dbError } = await supabase
        .from('products')
        .insert([{
          farmer_id: currentUser?.uid || 'anonymous_farmer',
          crop_name: formData.cropName,
          quantity: Number(formData.quantity),
          price: Number(formData.price),
          unit: 'kg',
          location: `${userProfile?.city || 'Unknown'}, ${userProfile?.state || 'India'}`,
          image_url: publicUrl,
          status: 'available'
        }]);

      if (dbError) throw dbError;

      alert('✅ Crop listed successfully in Supabase!');
      navigate('/marketplace');
    } catch (err) {
      console.error("Listing Error:", err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketplace-container">
      <div className="form-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeInUp 0.6s ease' }}>
        <h2 className="gradient-text" style={{ marginBottom: '24px' }}>List New Crop (Supabase)</h2>
        
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
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Upload to Supabase Storage
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
