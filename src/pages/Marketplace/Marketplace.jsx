import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import './Marketplace.css';

export default function Marketplace() {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const isFarmer = userProfile?.role === 'farmer';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProducts();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchProducts() {
    try {
      // Fetch all products (available and sold) so users can see history or what was sold
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Supabase Error:", err);
      setError(`Failed to load listings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', listingId);
        
        if (error) throw error;
      } catch (err) {
        console.error("Error deleting:", err);
        alert("Failed to delete listing.");
      }
    }
  };

  const filteredProducts = products
    .filter(p => p.crop_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => !filterLocation || p.location.toLowerCase().includes(filterLocation.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1 className="gradient-text">Direct Marketplace</h1>
          <p>{isFarmer ? 'Manage your crops and track your sales.' : 'Fresh from the farm, straight to your table.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isFarmer && (
            <>
              <button className="btn-secondary" onClick={() => navigate('/farmer-orders')}>
                📦 My Sales
              </button>
              <button className="btn-primary" onClick={() => navigate('/marketplace/add')}>
                <span>+</span> List New Crop
              </button>
            </>
          )}
          {!isFarmer && (
            <button className="btn-secondary" onClick={() => navigate('/my-orders')}>
              🛍️ My Orders
            </button>
          )}
        </div>
      </header>

      <section className="marketplace-controls">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search crop name (e.g. Wheat, Tomato)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <input 
            type="text" 
            placeholder="Filter by location..." 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </section>

      {error ? (
        <div className="error-state">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="loading-state">Loading marketplace...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No crops found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const isSold = product.status === 'sold' || product.quantity <= 0;
            return (
              <div key={product.id} className="product-card" style={{ opacity: isSold ? 0.7 : 1 }}>
                <div className="product-image">
                  <img src={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.crop_name} />
                  {isSold && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'var(--red-600)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      zIndex: 2
                    }}>
                      SOLD OUT
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div className="product-badge">{product.location}</div>
                    <div className="farmer-badge" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      👨‍🌾 {product.farmer_name || 'Verified Farmer'}
                    </div>
                  </div>
                  <h3>{product.crop_name}</h3>
                  <div className="product-price">
                    <span className="price">₹{product.price}</span>
                    <span className="unit">/ {product.unit || 'kg'}</span>
                  </div>
                  <div className="product-quantity">
                    {isSold ? (
                      <span style={{ color: 'var(--red-500)', fontWeight: 800 }}>Not Available</span>
                    ) : (
                      <>Available: <span style={{ fontWeight: 800, color: 'var(--green-600)' }}>
                        {product.quantity} {product.unit || 'kg'}
                      </span></>
                    )}
                  </div>
                  
                  {product.farmer_id === currentUser.uid ? (
                    <div className="own-listing-controls">
                      <div className="own-listing-badge">Your Listing</div>
                      <button 
                        className="btn-secondary" 
                        style={{ marginTop: '12px', background: '#fee2e2', color: '#b91c1c', border: 'none', width: '100%' }}
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete Listing
                      </button>
                    </div>
                  ) : (
                    !isFarmer && (
                      <button 
                        className="btn-primary buy-btn" 
                        disabled={isSold}
                        onClick={() => navigate(`/marketplace/checkout/${product.id}`)}
                        style={{ background: isSold ? 'var(--gray-400)' : 'var(--green-600)' }}
                      >
                        {isSold ? 'Out of Stock' : 'Buy Now'}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
