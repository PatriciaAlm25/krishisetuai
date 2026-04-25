import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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
    const productsRef = collection(db, 'products');
    let q = query(productsRef, orderBy('createdAt', 'desc'));

    // If farmer, they might want to see their own products specifically or all? 
    // Usually a marketplace shows everything, but maybe a "My Listings" tab?
    // For now, let's show ALL products to everyone, but farmers see an "Add" button.

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setError("Failed to load products. Please check your Firebase settings.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products
    .filter(p => p.cropName.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => !filterLocation || p.location.toLowerCase().includes(filterLocation.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0; // newest is default from firestore query
    });

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1 className="gradient-text">Direct Marketplace</h1>
          <p>Fresh from the farm, straight to your table.</p>
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
        <div className="loading-state">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No crops found</h3>
          <p>Try adjusting your search or filters.</p>
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
                <p className="farmer-name">By {product.farmerName}</p>
                <div className="product-price">
                  <span className="price">₹{product.price}</span>
                  <span className="unit">/ kg</span>
                </div>
                <div className="product-quantity">Available: {product.quantity} kg</div>
                
                {!isFarmer && (
                   <button className="btn-primary buy-btn" onClick={() => navigate(`/marketplace/checkout/${product.id}`)}>
                     Buy Now
                   </button>
                )}
                {isFarmer && product.farmerId === currentUser.uid && (
                  <div className="own-listing-badge">Your Listing</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
