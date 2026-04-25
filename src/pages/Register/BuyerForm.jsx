import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

const STEPS = [
  { num: 1, label: 'Basic Info',   icon: '👤' },
  { num: 2, label: 'Buyer Type',   icon: '🛒' },
  { num: 3, label: 'Address',      icon: '📍' },
  { num: 4, label: 'Account',      icon: '🔑' },
];

const BUYER_TYPES = [
  { val: 'individual',   label: 'Individual Consumer',   icon: '👤', desc: 'Buying for personal use' },
  { val: 'retailer',     label: 'Retailer',              icon: '🏪', desc: 'Small grocery / vegetable shop' },
  { val: 'wholesaler',   label: 'Wholesaler / Business', icon: '🏭', desc: 'Bulk purchasing for resale' },
  { val: 'restaurant',   label: 'Restaurant / Hotel',    icon: '🍽️', desc: 'Food service business' },
];

const INITIAL = {
  // Step 1
  fullName: '', businessName: '', mobile: '', email: '',
  // Step 2
  buyerType: '',
  // Step 3
  deliveryAddress: '', city: '', state: '', pincode: '',
  // Step 4
  password: '', confirmPassword: '',
};

export default function BuyerForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.fullName.trim()) { setError('Please enter your full name'); return; }
      if (!form.mobile || form.mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    }
    if (step === 2) {
      if (!form.buyerType) { setError('Please select your buyer type'); return; }
    }
    if (step === 3) {
      if (!form.city.trim()) { setError('Please enter your city'); return; }
      if (!form.state) { setError('Please select your state'); return; }
      if (!form.pincode || form.pincode.length !== 6) { setError('Enter a valid 6-digit PIN code'); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const loginEmail = form.email.trim() || `${form.mobile}@krishisetu.in`;
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const profileData = {
        role: 'buyer',
        fullName: form.fullName,
        businessName: form.businessName,
        mobile: form.mobile,
        buyerType: form.buyerType,
        deliveryAddress: form.deliveryAddress,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      };
      await register(loginEmail, form.password, profileData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-form">
      {/* Step Indicator */}
      <div className="reg-steps">
        {STEPS.map(s => (
          <div key={s.num} className={`reg-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
            <div className="reg-step__circle">
              {step > s.num ? '✓' : s.icon}
            </div>
            <span className="reg-step__label">{s.label}</span>
          </div>
        ))}
      </div>

      {error && <div className="reg-error">{error}</div>}

      {/* ── STEP 1: Basic Info ── */}
      {step === 1 && (
        <div className="reg-step-content">
          <h3 className="reg-step-title">Basic Information</h3>
          <p className="reg-step-subtitle">Start with your personal or business details</p>

          <div className="reg-field">
            <label className="reg-label">Full Name / Contact Person *</label>
            <input className="reg-input" type="text" placeholder="e.g. Priya Mehta"
              value={form.fullName} onChange={e => update('fullName', e.target.value)} />
          </div>

          <div className="reg-field">
            <label className="reg-label">Business Name (if applicable)</label>
            <input className="reg-input" type="text" placeholder="e.g. Mehta Vegetables Pvt. Ltd."
              value={form.businessName} onChange={e => update('businessName', e.target.value)} />
          </div>

          <div className="reg-field">
            <label className="reg-label">Mobile Number *</label>
            <div className="reg-input-group">
              <span className="reg-prefix">+91</span>
              <input className="reg-input reg-input--flex" type="tel" placeholder="10-digit mobile"
                maxLength={10} value={form.mobile}
                onChange={e => update('mobile', e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>

          <div className="reg-field">
            <label className="reg-label">Email Address (optional)</label>
            <input className="reg-input" type="email" placeholder="business@example.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
            <span className="reg-hint">Used for login. If blank, mobile is used.</span>
          </div>
        </div>
      )}

      {/* ── STEP 2: Buyer Type ── */}
      {step === 2 && (
        <div className="reg-step-content">
          <h3 className="reg-step-title">Buyer Type Selection</h3>
          <p className="reg-step-subtitle">What best describes your purchasing needs?</p>

          <div className="buyer-type-grid">
            {BUYER_TYPES.map(({ val, label, icon, desc }) => (
              <label
                key={val}
                className={`buyer-type-card ${form.buyerType === val ? 'selected' : ''}`}
                onClick={() => update('buyerType', val)}
              >
                <div className="buyer-type-icon">{icon}</div>
                <div className="buyer-type-label">{label}</div>
                <div className="buyer-type-desc">{desc}</div>
                {form.buyerType === val && <div className="buyer-type-check">✓</div>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Address ── */}
      {step === 3 && (
        <div className="reg-step-content">
          <h3 className="reg-step-title">Delivery Address</h3>
          <p className="reg-step-subtitle">Where should produce be delivered?</p>

          <div className="reg-field">
            <label className="reg-label">Delivery Address</label>
            <textarea className="reg-input reg-textarea" rows={3}
              placeholder="House/Shop No., Street, Area..."
              value={form.deliveryAddress}
              onChange={e => update('deliveryAddress', e.target.value)} />
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">City *</label>
              <input className="reg-input" type="text" placeholder="e.g. Pune"
                value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div className="reg-field">
              <label className="reg-label">State *</label>
              <select className="reg-input" value={form.state}
                onChange={e => update('state', e.target.value)}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="reg-field" style={{ maxWidth: '200px' }}>
            <label className="reg-label">PIN Code *</label>
            <input className="reg-input" type="text" placeholder="6-digit PIN"
              maxLength={6} value={form.pincode}
              onChange={e => update('pincode', e.target.value.replace(/\D/g, ''))} />
          </div>
        </div>
      )}

      {/* ── STEP 4: Account ── */}
      {step === 4 && (
        <form className="reg-step-content" onSubmit={handleSubmit}>
          <h3 className="reg-step-title">Create Your Account</h3>
          <p className="reg-step-subtitle">Almost done — set your login password</p>

          <div className="reg-summary">
            <h4>📋 Account Summary</h4>
            <div className="reg-summary-grid">
              <div><span>Name</span><strong>{form.fullName}</strong></div>
              <div><span>Mobile</span><strong>+91 {form.mobile}</strong></div>
              <div><span>Type</span><strong className="capitalize">{form.buyerType}</strong></div>
              <div><span>City</span><strong>{form.city}, {form.state}</strong></div>
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">Password *</label>
              <input className="reg-input" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
            <div className="reg-field">
              <label className="reg-label">Confirm Password *</label>
              <input className="reg-input" type="password" placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)} />
            </div>
          </div>

          <button type="submit" className="reg-submit-btn reg-submit-btn--buyer" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🛒 Create Buyer Account'}
          </button>
        </form>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="reg-nav">
          {step > 1 && (
            <button type="button" className="reg-back-btn" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <button type="button" className="reg-next-btn" onClick={nextStep}>
            Next Step →
          </button>
        </div>
      )}
    </div>
  );
}
