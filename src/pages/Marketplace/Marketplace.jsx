import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, where, deleteDoc, doc } from 'firebase/firestore';
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
    if (!currentUser) return;

    const listingsRef = collection(db, 'crop_listings');
    let q;
    
    if (isFarmer) {
      // Farmer only sees their own listings
      q = query(listingsRef, where('farmerId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    } else {
      // Buyer sees all available listings
      q = query(listingsRef, where('status', '==', 'available'), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(listingsData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error Detail:", err);
      setError(`Failed to load listings: ${err.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isFarmer]);

  const handleDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'crop_listings', listingId));
      } catch (err) {
        console.error("Error deleting:", err);
        alert("Failed to delete listing.");
      }
    }
  };

  const filteredProducts = products
    .filter(p => p.cropName.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => !filterLocation || p.location.toLowerCase().includes(filterLocation.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.pricePerUnit - b.pricePerUnit;
      if (sortBy === 'price-high') return b.pricePerUnit - a.pricePerUnit;
      return 0;
    });

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1 className="gradient-text">Direct Marketplace</h1>
          <p>{isFarmer ? 'Manage your crop listings' : 'Fresh from the farm, straight to your table.'}</p>
        </div>
        {isFarmer && (
          <button className="btn-primary" onClick={() => navigate('/marketplace/add')}>
            <span>+</span> List Your Crop
          </button>
        )}
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
        <div className="error-state" style={{ color: 'red', textAlign: 'center', padding: '50px' }}>
          <h3>⚠️ Error</h3>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="loading-state">Loading marketplace...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No crops found</h3>
          <p>{isFarmer ? 'You haven\'t listed any crops yet.' : 'Try adjusting your search or filters.'}</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.cropName} />
              </div>
              <div className="product-info">
                <div className="product-badge">{product.location}</div>
                <h3>{product.cropName}</h3>
                <div className="product-price">
                  <span className="price">₹{product.pricePerUnit}</span>
                  <span className="unit">/ {product.unit}</span>
                </div>
                <div className="product-quantity">
                  Available: <span style={{ fontWeight: 800, color: product.quantity > 0 ? 'var(--green-600)' : 'var(--red-500)' }}>
                    {product.quantity} {product.unit}
                  </span>
                </div>
                
                {!isFarmer && (
                   <button className="btn-primary buy-btn" onClick={() => navigate(`/marketplace/checkout/${product.id}`)}>
                     Buy Now
                   </button>
                )}
                {isFarmer && (
                  <button 
                    className="btn-secondary" 
                    style={{ marginTop: '12px', background: '#fee2e2', color: '#b91c1c', border: 'none', width: '100%' }}
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete Listing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
