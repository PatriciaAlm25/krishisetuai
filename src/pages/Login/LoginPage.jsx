import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please enter email and password'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="login-page">
      <div className="login-page__bg">
        <div className="login-bg-shape login-bg-shape--1" />
        <div className="login-bg-shape login-bg-shape--2" />
      </div>

      <div className="login-card">
        <Link to="/" className="login-back">← Back to Home</Link>

        <div className="login-brand">
          <span className="login-brand-icon">🌾</span>
          <div>
            <h1 className="login-brand-name">KrishiSetu</h1>
            <p className="login-brand-hindi">कृषि सेतु</p>
          </div>
        </div>

        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Login to access your dashboard and features</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '⏳ Logging in...' : '🔑 Login to KrishiSetu'}
          </button>
        </form>

        <div className="login-divider"><span>Don't have an account?</span></div>

        <div className="login-register-links">
          <Link to="/register?role=farmer" className="login-reg-btn login-reg-btn--farmer">
            🌾 Register as Farmer
          </Link>
          <Link to="/register?role=buyer" className="login-reg-btn login-reg-btn--buyer">
            🛒 Register as Buyer
          </Link>
        </div>
      </div>
    </div>
  );
}
