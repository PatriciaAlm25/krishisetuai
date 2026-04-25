import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LandingPage.css';

const FEATURES = [
  {
    id: 'marketplace',
    icon: '🛒',
    title: 'Direct Farmer-to-Buyer Marketplace',
    desc: 'Sell produce directly to consumers and businesses at fair prices — no middlemen, more profit for you.',
    color: 'green',
    forRole: 'both',
    path: '/marketplace',
  },
  {
    id: 'logistics',
    icon: '🗺️',
    title: 'Smart Logistics Optimization',
    desc: 'Route and transport-sharing suggestions using map integration, reducing delivery costs.',
    color: 'blue',
    forRole: 'both',
    path: '/logistics',
  },
  {
    id: 'scheme-finder',
    icon: '📋',
    title: 'AI-Powered Scheme Finder',
    desc: 'Get government schemes and subsidies recommended based on your location, crop type, and land size.',
    color: 'green',
    forRole: 'farmer',
    path: '/scheme-finder',
  },
  {
    id: 'ai-simplify',
    icon: '🤖',
    title: 'AI Simplification Engine',
    desc: 'Complex government documents transformed into simple, easy-to-understand language.',
    color: 'blue',
    forRole: 'farmer',
    path: '/ai-simplify',
  },
  {
    id: 'action-guide',
    icon: '📌',
    title: 'Action Guidance System',
    desc: 'Step-by-step instructions to apply for schemes — documents needed, deadlines, and next steps.',
    color: 'green',
    forRole: 'farmer',
    path: '/action-guide',
  },
  {
    id: 'voice-assist',
    icon: '🎙️',
    title: 'Voice-Based Interaction',
    desc: 'Voice input & responses in regional languages — accessible for farmers with low digital literacy.',
    color: 'blue',
    forRole: 'farmer',
    path: '/voice-assist',
  },
  {
    id: 'alerts',
    icon: '🔔',
    title: 'Smart Alerts & Notifications',
    desc: 'Personalized updates on schemes, deadlines, and market opportunities relevant to you.',
    color: 'green',
    forRole: 'both',
    path: '/alerts',
  },
  {
    id: 'market-price',
    icon: '📈',
    title: 'Market Price Intelligence',
    desc: 'Real-time mandi prices and insights — know the best time and place to sell your produce.',
    color: 'blue',
    forRole: 'both',
    path: '/market-price',
  },
];

const STATS = [
  { value: '10M+', label: 'Farmers Served', icon: '👨‍🌾' },
  { value: '₹2.5Cr', label: 'Income Generated', icon: '💰' },
  { value: '500+', label: 'Govt. Schemes Listed', icon: '📜' },
  { value: '28', label: 'States Covered', icon: '🗺️' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register', desc: 'Sign up as a Farmer or Buyer in under 3 minutes', icon: '📝' },
  { step: '02', title: 'Complete Profile', desc: 'Fill in your farm/business details for personalized results', icon: '🎯' },
  { step: '03', title: 'Access Features', desc: 'Get AI-powered recommendations and market access', icon: '🚀' },
  { step: '04', title: 'Grow & Earn', desc: 'Sell directly, find schemes, and maximize your income', icon: '📈' },
];

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <div className="landing">
      {/* ───── HERO ───── */}
      <section className="hero" ref={heroRef}>
        <div className="hero__bg-shapes">
          <div className="hero__shape hero__shape--1" />
          <div className="hero__shape hero__shape--2" />
          <div className="hero__shape hero__shape--3" />
        </div>

        <div className="container hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            🇮🇳 India's #1 AgriTech Platform
          </div>

          <h1 className="hero__title">
            Empowering Farmers<br />
            <span className="gradient-text">with AI & Direct Market</span><br />
            Access
          </h1>

          <p className="hero__subtitle">
            KrishiSetu connects Indian farmers directly to buyers, government schemes, and real-time market intelligence — eliminating middlemen and maximizing your income.
          </p>

          <div className="hero__cta">
            <Link to="/register?role=farmer" className="btn-primary hero__cta-btn">
              🌾 I'm a Farmer
            </Link>
            <Link to="/register?role=buyer" className="btn-accent hero__cta-btn">
              🛒 I'm a Buyer / Retailer
            </Link>
          </div>

          <div className="hero__trust">
            <span>✅ Free to join</span>
            <span>✅ No middlemen</span>
            <span>✅ AI-Powered</span>
            <span>✅ Regional Languages</span>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="hero__float-cards">
          <div className="hero__float-card hero__float-card--1">
            <span>🌾</span>
            <div>
              <p className="hero__float-label">Today's Wheat Price</p>
              <p className="hero__float-value">₹2,150 / quintal</p>
            </div>
          </div>
          <div className="hero__float-card hero__float-card--2">
            <span>🎉</span>
            <div>
              <p className="hero__float-label">New Scheme Found!</p>
              <p className="hero__float-value">PM-KISAN Benefits</p>
            </div>
          </div>
          <div className="hero__float-card hero__float-card--3">
            <span>💰</span>
            <div>
              <p className="hero__float-label">Earnings This Month</p>
              <p className="hero__float-value">₹45,200</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── STATS ───── */}
      <section className="stats">
        <div className="container stats__grid">
          {STATS.map((s, i) => (
            <div key={i} className="stats__card">
              <span className="stats__icon">{s.icon}</span>
              <div className="stats__value">{s.value}</div>
              <div className="stats__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── PROBLEM & SOLUTION ───── */}
      <section className="problem-solution">
        <div className="container">
          <div className="problem-solution__grid">
            <div className="problem-solution__card problem-solution__card--problem">
              <div className="ps__icon">⚠️</div>
              <h3 className="ps__title">The Problem</h3>
              <ul className="ps__list">
                <li>🔴 Farmers earn less due to middlemen taking large cuts</li>
                <li>🔴 Limited direct access to markets and buyers</li>
                <li>🔴 Government scheme information is complex & scattered</li>
                <li>🔴 No personalized guidance for individual farmers</li>
              </ul>
            </div>
            <div className="problem-solution__arrow">→</div>
            <div className="problem-solution__card problem-solution__card--solution">
              <div className="ps__icon">✅</div>
              <h3 className="ps__title">KrishiSetu Solves It</h3>
              <ul className="ps__list">
                <li>🟢 Direct farmer-to-buyer marketplace — zero middlemen</li>
                <li>🟢 AI matches farmers with the right govt. schemes</li>
                <li>🟢 Complex info simplified in your regional language</li>
                <li>🟢 Real-time mandi prices & smart market alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Platform Features</span>
            <h2 className="section-title">Everything a Farmer Needs</h2>
            <p className="section-subtitle">
              8 powerful features, all in one platform — accessible after registration
            </p>
          </div>

          <div className="features__grid">
            {FEATURES.map((f) => (
              <div key={f.id} className={`feature-card feature-card--${f.color}`}>
                <div className="feature-card__locked-badge">🔒 Register to Access</div>
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
                <div className="feature-card__role-tag">
                  {f.forRole === 'both' ? '👥 Farmers & Buyers' : '👨‍🌾 Farmers Only'}
                </div>
                <div className="feature-card__overlay">
                  <Link to="/register" className="feature-card__overlay-btn">
                    Register to Unlock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Process</span>
            <h2 className="section-title">How KrishiSetu Works</h2>
            <p className="section-subtitle">Get started in 4 simple steps</p>
          </div>

          <div className="hiw__steps">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="hiw__step">
                <div className="hiw__step-num">{s.step}</div>
                <div className="hiw__step-icon">{s.icon}</div>
                <h4 className="hiw__step-title">{s.title}</h4>
                <p className="hiw__step-desc">{s.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="hiw__arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA BANNER ───── */}
      <section className="cta-banner">
        <div className="cta-banner__glow" />
        <div className="container cta-banner__inner">
          <div className="cta-banner__text">
            <h2>Ready to Transform Your Farming?</h2>
            <p>Join thousands of farmers already using KrishiSetu to increase income and access government benefits.</p>
          </div>
          <div className="cta-banner__actions">
            <Link to="/register?role=farmer" className="btn-primary">
              🌾 Register as Farmer
            </Link>
            <Link to="/register?role=buyer" className="btn-secondary">
              🛒 Register as Buyer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
