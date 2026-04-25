import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const FARMER_FEATURES = [
  { id: 'marketplace',  icon: '🛒', title: 'Marketplace',          desc: 'List your crops & connect with buyers directly',    path: '/marketplace',  color: 'green', badge: 'Active' },
  { id: 'logistics',    icon: '🗺️', title: 'Smart Logistics',      desc: 'Optimize routes and share transport costs',          path: '/logistics',    color: 'blue',  badge: 'New' },
  { id: 'scheme-finder',icon: '📋', title: 'Scheme Finder',        desc: 'AI-matched government schemes for you',              path: '/scheme-finder',color: 'green', badge: 'Recommended' },
  { id: 'ai-simplify',  icon: '🤖', title: 'AI Simplify',          desc: 'Complex policies in simple language',                path: '/ai-simplify',  color: 'blue',  badge: null },
  { id: 'action-guide', icon: '📌', title: 'Action Guide',         desc: 'Step-by-step scheme application help',               path: '/action-guide', color: 'green', badge: null },
  { id: 'voice-assist', icon: '🎙️', title: 'Voice Assistant',      desc: 'Talk to KrishiSetu in your language',                path: '/voice-assist', color: 'blue',  badge: null },
  { id: 'alerts',       icon: '🔔', title: 'Smart Alerts',         desc: 'Personalized scheme & market notifications',         path: '/alerts',       color: 'green', badge: '3 New' },
  { id: 'market-price', icon: '📈', title: 'Market Prices',        desc: 'Live mandi prices across India',                    path: '/market-price', color: 'blue',  badge: 'Live' },
];

const BUYER_FEATURES = [
  { id: 'marketplace',  icon: '🛒', title: 'Browse Marketplace',   desc: 'Find fresh produce directly from farmers',           path: '/marketplace',  color: 'blue',  badge: 'Active' },
  { id: 'logistics',    icon: '🗺️', title: 'Smart Logistics',      desc: 'Optimize your delivery routes and costs',            path: '/logistics',    color: 'green', badge: 'New' },
  { id: 'alerts',       icon: '🔔', title: 'Market Alerts',        desc: 'Get notified about new produce listings',            path: '/alerts',       color: 'blue',  badge: '2 New' },
  { id: 'market-price', icon: '📈', title: 'Market Prices',        desc: 'Compare mandi prices to get best deals',             path: '/market-price', color: 'green', badge: 'Live' },
];

const QUICK_STATS_FARMER = [
  { icon: '🌾', label: 'Crops Listed',      value: '0',     unit: 'items' },
  { icon: '💰', label: 'Total Earnings',    value: '₹0',    unit: 'this month' },
  { icon: '📋', label: 'Eligible Schemes',  value: '12',    unit: 'found for you' },
  { icon: '📈', label: 'Market Price',      value: '↑ 4%',  unit: 'vs last week' },
];

const QUICK_STATS_BUYER = [
  { icon: '📦', label: 'Orders Placed',    value: '0',      unit: 'total' },
  { icon: '💰', label: 'Amount Saved',     value: '₹0',     unit: 'vs retail' },
  { icon: '🌾', label: 'Active Listings',  value: '234',    unit: 'available now' },
  { icon: '🗺️', label: 'Farmers Near You', value: '18',     unit: 'in your area' },
];

export default function Dashboard() {
  const { userProfile } = useAuth();
  const isFarmer = userProfile?.role === 'farmer';
  const features = isFarmer ? FARMER_FEATURES : BUYER_FEATURES;
  const stats    = isFarmer ? QUICK_STATS_FARMER : QUICK_STATS_BUYER;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good Morning';
    if (h < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  return (
    <div className="dashboard">
      {/* Hero Banner */}
      <div className="dashboard__banner">
        <div className="dashboard__banner-shapes">
          <div className="db-shape db-shape--1" />
          <div className="db-shape db-shape--2" />
        </div>
        <div className="container dashboard__banner-content">
          <div className="dashboard__greeting">
            <p className="dashboard__greeting-time">{greeting()}</p>
            <h1 className="dashboard__greeting-name">
              {userProfile?.fullName?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="dashboard__greeting-sub">
              {isFarmer
                ? `${userProfile?.state || 'India'} • ${userProfile?.landSize || '—'} acres • ${userProfile?.crops?.join(', ') || 'Farmer'}`
                : `${userProfile?.buyerType || 'Buyer'} • ${userProfile?.city || ''}, ${userProfile?.state || 'India'}`
              }
            </p>
          </div>
          <div className="dashboard__role-badge">
            <span>{isFarmer ? '🌾' : '🛒'}</span>
            <span>{isFarmer ? 'Farmer Account' : 'Buyer Account'}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container dashboard__section">
        <div className="dashboard__stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="dashboard__stat-card">
              <div className="dashboard__stat-icon">{s.icon}</div>
              <div className="dashboard__stat-value">{s.value}</div>
              <div className="dashboard__stat-label">{s.label}</div>
              <div className="dashboard__stat-unit">{s.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="container dashboard__section">
        <div className="dashboard__section-header">
          <h2>Your Features</h2>
          <p>All tools available for your account</p>
        </div>
        <div className="dashboard__features-grid">
          {features.map(f => (
            <Link key={f.id} to={f.path} className={`db-feature-card db-feature-card--${f.color}`}>
              {f.badge && <div className="db-feature-card__badge">{f.badge}</div>}
              <div className="db-feature-card__icon">{f.icon}</div>
              <h3 className="db-feature-card__title">{f.title}</h3>
              <p className="db-feature-card__desc">{f.desc}</p>
              <div className="db-feature-card__arrow">→</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alert Banner */}
      <div className="container dashboard__section">
        <div className="dashboard__alert-banner">
          <div className="dashboard__alert-left">
            <span className="dashboard__alert-icon">🔔</span>
            <div>
              <h4>New Schemes Available!</h4>
              <p>3 new government schemes match your profile. Check Scheme Finder for details.</p>
            </div>
          </div>
          <Link to="/scheme-finder" className="dashboard__alert-btn">
            View Schemes →
          </Link>
        </div>
      </div>
    </div>
  );
}
