import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import FarmerForm from './FarmerForm';
import BuyerForm from './BuyerForm';
import './Register.css';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('role') || 'farmer');

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'farmer' || role === 'buyer') setActiveTab(role);
  }, [searchParams]);

  return (
    <div className="register-page">
      {/* Background */}
      <div className="register-page__bg">
        <div className="register-page__shape register-page__shape--1" />
        <div className="register-page__shape register-page__shape--2" />
      </div>

      <div className="register-page__container">
        {/* Left panel */}
        <div className="register-page__panel register-page__panel--left">
          <Link to="/" className="register-back">← Back to Home</Link>
          <div className="register-brand">
            <div className="register-brand__icon">🌾</div>
            <h1 className="register-brand__name">KrishiSetu</h1>
            <p className="register-brand__tagline">कृषि सेतु</p>
          </div>

          <div className="register-features">
            <h3>What you'll get:</h3>
            {activeTab === 'farmer' ? (
              <ul>
                <li>🛒 Direct access to buyers — no middlemen</li>
                <li>📋 AI-matched government schemes</li>
                <li>📈 Real-time mandi price alerts</li>
                <li>🎙️ Voice guidance in your language</li>
                <li>🔔 Personalized scheme reminders</li>
              </ul>
            ) : (
              <ul>
                <li>🌾 Fresh produce directly from farmers</li>
                <li>💰 Better prices than wholesale markets</li>
                <li>🗺️ Smart delivery route optimization</li>
                <li>🔔 Market opportunity alerts</li>
                <li>📈 Real-time price intelligence</li>
              </ul>
            )}
          </div>

          <div className="register-trust">
            <div className="register-trust__item">
              <span className="register-trust__icon">🔒</span>
              <span>Secure & Private</span>
            </div>
            <div className="register-trust__item">
              <span className="register-trust__icon">✅</span>
              <span>Verified Platform</span>
            </div>
            <div className="register-trust__item">
              <span className="register-trust__icon">🆓</span>
              <span>Free to Join</span>
            </div>
          </div>
        </div>

        {/* Right panel — Form */}
        <div className="register-page__panel register-page__panel--right">
          <div className="register-header">
            <h2>Create Your Account</h2>
            <p>Join thousands of farmers and buyers on KrishiSetu</p>
          </div>

          {/* Role Tabs */}
          <div className="register-tabs">
            <button
              className={`register-tab ${activeTab === 'farmer' ? 'active' : ''}`}
              onClick={() => setActiveTab('farmer')}
            >
              🌾 Farmer
            </button>
            <button
              className={`register-tab ${activeTab === 'buyer' ? 'active' : ''}`}
              onClick={() => setActiveTab('buyer')}
            >
              🛒 Buyer / Retailer
            </button>
          </div>

          {/* Form */}
          <div className="register-form-wrapper">
            {activeTab === 'farmer' ? <FarmerForm /> : <BuyerForm />}
          </div>

          <p className="register-login-link">
            Already have an account? <Link to="/login">Login here →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
