import React, { useState, useEffect } from 'react';
import './MandiPrices.css';

const API_KEY = import.meta.env.VITE_MANDI_API_KEY;
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export default function MandiPrices() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    state: '',
    commodity: '',
    market: ''
  });

  // Unique values for dropdowns
  const [options, setOptions] = useState({
    states: [],
    commodities: [],
    markets: []
  });

  const fetchPrices = async () => {
    try {
      setRefreshing(true);
      if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        throw new Error('API Key is missing or invalid. Please set VITE_MANDI_API_KEY in your .env file.');
      }

      const response = await fetch(`${BASE_URL}?api-key=${API_KEY}&format=json&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch market data');

      const data = await response.json();
      const newRecords = data.records || [];

      setRecords(newRecords);

      // Populate dropdown options from data
      const states = [...new Set(newRecords.map(r => r.state))].sort();
      const commodities = [...new Set(newRecords.map(r => r.commodity))].sort();
      const markets = [...new Set(newRecords.map(r => r.market))].sort();

      setOptions({ states, commodities, markets });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredRecords = records.filter(r => {
    return (
      (!filters.state || r.state === filters.state) &&
      (!filters.commodity || r.commodity === filters.commodity) &&
      (!filters.market || r.market === filters.market)
    );
  });

  if (loading) {
    return (
      <div className="mandi-container">
        <div className="mandi-status">
          <span className="loader"></span>
          <p>Fetching real-time mandi prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mandi-container">
      <header className="mandi-header">
        <div className="mandi-header__title">
          <h1>Mandi Prices</h1>
          <p>Real-time agricultural market data (Prices in ₹ per Quintal / 100kg)</p>
        </div>
        <button
          className="mandi-refresh-btn"
          onClick={fetchPrices}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </header>

      {error ? (
        <div className="mandi-status">
          <div className="error-msg">
            <strong>Error:</strong> {error}
          </div>
          <p style={{ marginTop: '20px' }}>
            Please ensure you have a valid API key from <strong>data.gov.in</strong>
          </p>
        </div>
      ) : (
        <>
          <div className="mandi-filters">
            <div className="filter-group">
              <label>State</label>
              <select name="state" value={filters.state} onChange={handleFilterChange}>
                <option value="">All States</option>
                {options.states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Commodity</label>
              <select name="commodity" value={filters.commodity} onChange={handleFilterChange}>
                <option value="">All Commodities</option>
                {options.commodities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Market</label>
              <select name="market" value={filters.market} onChange={handleFilterChange}>
                <option value="">All Markets</option>
                {options.markets.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="mandi-grid">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((r, index) => (
                <div key={`${r.market}-${r.commodity}-${index}`} className="mandi-card">
                  <div className="mandi-card__header">
                    <span className="mandi-card__commodity">{r.commodity}</span>
                    <span className="mandi-card__variety">{r.variety}</span>
                  </div>

                  <div className="mandi-card__info">
                    <div className="info-item">
                      <span className="label">State</span>
                      <span className="value">{r.state}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">District</span>
                      <span className="value">{r.district}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Market</span>
                      <span className="value">{r.market}</span>
                    </div>
                  </div>

                  <div className="mandi-card__prices">
                    <div className="price-box">
                      <span className="p-label">Min</span>
                      <span className="p-value">₹{r.min_price}</span>
                      <span className="p-unit">per Quintal</span>
                    </div>
                    <div className="price-box">
                      <span className="p-label">Modal</span>
                      <span className="p-value">₹{r.modal_price}</span>
                      <span className="p-unit">per Quintal</span>
                    </div>
                    <div className="price-box">
                      <span className="p-label">Max</span>
                      <span className="p-value">₹{r.max_price}</span>
                      <span className="p-unit">per Quintal</span>
                    </div>
                  </div>

                  <div className="mandi-card__date">
                    Updated: {r.arrival_date}
                  </div>
                </div>
              ))
            ) : (
              <div className="mandi-empty">
                <h3>No data found</h3>
                <p>Try adjusting your filters or refresh the data.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
