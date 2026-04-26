import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './SmartAlerts.css';

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const MANDI_API_KEY = import.meta.env.VITE_MANDI_API_KEY;

export default function SmartAlerts() {
  const { userProfile } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchAllAlerts = async () => {
      setLoading(true);
      try {
        const results = [];

        // 1. Fetch Agriculture News from India
        if (NEWS_API_KEY) {
          try {
            const newsRes = await fetch(
              `https://newsapi.org/v2/everything?q=agriculture+india+farming&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
            );
            if (newsRes.ok) {
              const newsData = await newsRes.json();
              newsData.articles.forEach((art, i) => {
                results.push({
                  id: `news-${i}`,
                  category: 'news',
                  title: art.title,
                  desc: art.description,
                  source: art.source.name,
                  date: new Date(art.publishedAt).toLocaleDateString(),
                  link: art.url,
                  icon: '📰',
                  priority: 'medium'
                });
              });
            }
          } catch (e) { console.error("News fetch failed", e); }
        }

        // 2. Fetch Mandi Price Alerts (Specific to Farmer's state if possible)
        if (MANDI_API_KEY) {
          try {
            const stateFilter = userProfile?.state ? `&filters[state]=${userProfile.state}` : '';
            const mandiRes = await fetch(
              `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${MANDI_API_KEY}&format=json&limit=10${stateFilter}`
            );
            if (mandiRes.ok) {
              const mandiData = await mandiRes.json();
              mandiData.records.forEach((rec, i) => {
                results.push({
                  id: `price-${i}`,
                  category: 'price',
                  title: `${rec.commodity} Price Update`,
                  desc: `Modal price in ${rec.market}, ${rec.state} is ₹${rec.modal_price}/quintal.`,
                  source: 'Agmarknet',
                  date: rec.arrival_date,
                  icon: '📈',
                  priority: rec.modal_price > 5000 ? 'high' : 'low'
                });
              });
            }
          } catch (e) { console.error("Mandi fetch failed", e); }
        }

        // 3. Static Scheme Alerts (Simulated for newness)
        results.push({
          id: 'scheme-new-1',
          category: 'scheme',
          title: 'PM-Kisan 17th Installment',
          desc: 'The next installment of PM-Kisan is expected to be released soon. Ensure your e-KYC is updated.',
          source: 'Govt of India',
          date: 'Today',
          icon: '📋',
          priority: 'high'
        });

        // Sort by priority and date (simulated)
        setAlerts(results.sort((a, b) => (a.priority === 'high' ? -1 : 1)));
      } catch (err) {
        console.error("Alerts fetching failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAlerts();
  }, [userProfile]);

  const filteredAlerts = activeTab === 'all' 
    ? alerts 
    : alerts.filter(a => a.category === activeTab);

  if (userProfile?.role !== 'farmer') {
    return (
      <div className="alerts-error">
        <div className="alerts-error-content">
          <span>🔒</span>
          <h2>Farmer Access Only</h2>
          <p>This feature provides specialized agricultural alerts. Please switch to a Farmer account to view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-alerts">
      <div className="alerts-container">
        <header className="alerts-header">
          <div className="alerts-title-area">
            <h1>Smart Alerts 🔔</h1>
            <p>Real-time updates tailored for your farm in {userProfile?.state || 'India'}</p>
          </div>
          <div className="alerts-tabs">
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All</button>
            <button className={activeTab === 'news' ? 'active' : ''} onClick={() => setActiveTab('news')}>News</button>
            <button className={activeTab === 'price' ? 'active' : ''} onClick={() => setActiveTab('price')}>Prices</button>
            <button className={activeTab === 'scheme' ? 'active' : ''} onClick={() => setActiveTab('scheme')}>Schemes</button>
          </div>
        </header>

        {loading ? (
          <div className="alerts-loading">
            <div className="alerts-loader"></div>
            <p>Scanning for latest updates...</p>
          </div>
        ) : (
          <div className="alerts-grid">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <div key={alert.id} className={`alert-card alert-card--${alert.priority} alert-card--${alert.category}`}>
                  <div className="alert-card__icon">{alert.icon}</div>
                  <div className="alert-card__content">
                    <div className="alert-card__meta">
                      <span className="alert-card__tag">{alert.category}</span>
                      <span className="alert-card__date">{alert.date}</span>
                    </div>
                    <h3 className="alert-card__title">{alert.title}</h3>
                    <p className="alert-card__desc">{alert.desc}</p>
                    <div className="alert-card__footer">
                      <span className="alert-card__source">Source: {alert.source}</span>
                      {alert.link && (
                        <a href={alert.link} target="_blank" rel="noopener noreferrer" className="alert-card__link">
                          Read More →
                        </a>
                      )}
                    </div>
                  </div>
                  {alert.priority === 'high' && <div className="alert-card__urgent">URGENT</div>}
                </div>
              ))
            ) : (
              <div className="alerts-empty">
                <h3>No alerts found</h3>
                <p>Check back later for more updates.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
