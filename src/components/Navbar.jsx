import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">🌾</div>
          <div className="navbar__logo-text">
            <span className="navbar__logo-name">KrishiSetu</span>
            <span className="navbar__logo-tagline">कृषि सेतु</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar__links">
          <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          {currentUser && (
            <>
              <Link to="/dashboard" className={`navbar__link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/marketplace" className={`navbar__link ${location.pathname === '/marketplace' ? 'active' : ''}`}>Market</Link>
              <Link to="/my-orders" className={`navbar__link ${location.pathname === '/my-orders' ? 'active' : ''}`}>My Orders</Link>
              <Link to="/scheme-finder" className={`navbar__link ${location.pathname === '/scheme-finder' ? 'active' : ''}`}>Schemes</Link>
              <Link to="/market-price" className={`navbar__link ${location.pathname === '/market-price' ? 'active' : ''}`}>Mandi Prices</Link>
            </>
          )}
        </div>

        {/* Auth Actions */}
        <div className="navbar__actions">
          {currentUser ? (
            <div className="navbar__user">
              <div className="navbar__avatar">
                {userProfile?.fullName?.[0]?.toUpperCase() || '🌾'}
              </div>
              <span className="navbar__username">{userProfile?.fullName?.split(' ')[0] || 'User'}</span>
              <button className="navbar__logout" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar__login-btn">Login</Link>
              <Link to="/register" className="btn-primary navbar__register-btn">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar__mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="navbar__mobile-link">🏠 Home</Link>
        {currentUser ? (
          <>
            <Link to="/dashboard" className="navbar__mobile-link">📊 Dashboard</Link>
            <Link to="/marketplace" className="navbar__mobile-link">🛒 Marketplace</Link>
            <Link to="/my-orders" className="navbar__mobile-link">📦 My Orders</Link>
            <Link to="/scheme-finder" className="navbar__mobile-link">📋 Schemes</Link>
            <Link to="/market-price" className="navbar__mobile-link">📈 Mandi Prices</Link>
            <button className="navbar__mobile-logout" onClick={handleLogout}>🚪 Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar__mobile-link">🔑 Login</Link>
            <Link to="/register" className="navbar__mobile-link navbar__mobile-cta">✨ Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
