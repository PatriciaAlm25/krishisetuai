import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__glow" />
      <div className="container footer__inner">
        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="footer__logo-icon">🌾</span>
            <div>
              <div className="footer__logo-name">KrishiSetu</div>
              <div className="footer__logo-hindi">कृषि सेतु</div>
            </div>
          </div>
          <p className="footer__tagline">
            Bridging the gap between farmers and markets with the power of AI and technology.
          </p>
          <div className="footer__badges">
            <span className="footer__badge">🇮🇳 Made for India</span>
            <span className="footer__badge">🤖 AI Powered</span>
          </div>
        </div>

        {/* Features */}
        <div className="footer__col">
          <h4 className="footer__col-title">Features</h4>
          <ul className="footer__links">
            <li><Link to="/marketplace">🛒 Marketplace</Link></li>
            <li><Link to="/logistics">🗺️ Smart Logistics</Link></li>
            <li><Link to="/scheme-finder">📋 Scheme Finder</Link></li>
            <li><Link to="/market-price">📈 Market Prices</Link></li>
            <li><Link to="/alerts">🔔 Smart Alerts</Link></li>
          </ul>
        </div>

        {/* Help */}
        <div className="footer__col">
          <h4 className="footer__col-title">Quick Access</h4>
          <ul className="footer__links">
            <li><Link to="/register">✨ Register</Link></li>
            <li><Link to="/login">🔑 Login</Link></li>
            <li><Link to="/dashboard">📊 Dashboard</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© 2025 KrishiSetu. Empowering India's Farmers.</p>
          <p className="footer__disclaimer">Built with ❤️ for Indian Agriculture</p>
        </div>
      </div>
    </footer>
  );
}
