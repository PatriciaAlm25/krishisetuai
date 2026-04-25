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

const LANGUAGES = [
  'Hindi','Marathi','Tamil','Telugu','Kannada','Malayalam','Bengali',
  'Gujarati','Punjabi','Odia','Assamese','Urdu','English',
];

const CROPS = [
  'Wheat','Rice','Maize','Sugarcane','Cotton','Soybean','Groundnut',
  'Pulses (Dal)','Vegetables','Fruits','Spices','Tea/Coffee','Others',
];

const STEPS = [
  { num: 1, label: 'Basic Info',    icon: '👤' },
  { num: 2, label: 'Farm Details',  icon: '🌾' },
  { num: 3, label: 'Identity',      icon: '🪪' },
  { num: 4, label: 'Account',       icon: '🔑' },
];

const INITIAL = {
  // Step 1
  fullName: '', mobile: '',
  // Step 2
  dob: '', preferredLanguage: '', state: '', district: '', village: '', pincode: '',
  farmerType: '', landSize: '', landOwnership: '', irrigationType: '',
  cropType: '', cropSeason: '', organicFarming: '', crops: [],
  // Step 3
  aadhaar: null, kisanCard: null,
  // Step 4
  email: '', password: '', confirmPassword: '',
};

export default function FarmerForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aadhaarName, setAadhaarName] = useState('');
  const [kisanName, setKisanName] = useState('');

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleCrop = (crop) => {
    setForm(f => ({
      ...f,
      crops: f.crops.includes(crop) ? f.crops.filter(c => c !== crop) : [...f.crops, crop],
    }));
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.fullName.trim()) { setError('Please enter your full name'); return; }
      if (!form.mobile || form.mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    }
    if (step === 2) {
      if (!form.state) { setError('Please select your state'); return; }
      if (!form.district.trim()) { setError('Please enter your district'); return; }
      if (!form.farmerType) { setError('Please select farmer type'); return; }
      if (!form.landSize) { setError('Please enter land size'); return; }
    }
    if (step === 3) {
      // Aadhaar upload is optional for demo but encouraged
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const profileData = {
        role: 'farmer',
        fullName: form.fullName,
        mobile: form.mobile,
        dob: form.dob,
        preferredLanguage: form.preferredLanguage,
        state: form.state,
        district: form.district,
        village: form.village,
        pincode: form.pincode,
        farmerType: form.farmerType,
        landSize: form.landSize,
        landOwnership: form.landOwnership,
        irrigationType: form.irrigationType,
        cropType: form.cropType,
        cropSeason: form.cropSeason,
        organicFarming: form.organicFarming,
        crops: form.crops,
      };
      await register(form.email, form.password, profileData);
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
          <p className="reg-step-subtitle">Let's start with your personal details</p>

          <div className="reg-field">
            <label className="reg-label">Full Name *</label>
            <input
              className="reg-input"
              type="text"
              placeholder="e.g. Rajesh Kumar Sharma"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
            />
          </div>

          <div className="reg-field">
            <label className="reg-label">Mobile Number *</label>
            <div className="reg-input-group">
              <span className="reg-prefix">+91</span>
              <input
                className="reg-input reg-input--flex"
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={form.mobile}
                onChange={e => update('mobile', e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Farm Details ── */}
      {step === 2 && (
        <div className="reg-step-content">
          <h3 className="reg-step-title">Personal & Farm Details</h3>
          <p className="reg-step-subtitle">Tell us about yourself and your farm</p>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">Date of Birth</label>
              <input className="reg-input" type="date" value={form.dob}
                onChange={e => update('dob', e.target.value)} />
            </div>
            <div className="reg-field">
              <label className="reg-label">Preferred Language</label>
              <select className="reg-input" value={form.preferredLanguage}
                onChange={e => update('preferredLanguage', e.target.value)}>
                <option value="">Select Language</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">State *</label>
              <select className="reg-input" value={form.state}
                onChange={e => update('state', e.target.value)}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="reg-field">
              <label className="reg-label">District *</label>
              <input className="reg-input" type="text" placeholder="e.g. Nashik"
                value={form.district} onChange={e => update('district', e.target.value)} />
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">Village / Town</label>
              <input className="reg-input" type="text" placeholder="e.g. Ozar"
                value={form.village} onChange={e => update('village', e.target.value)} />
            </div>
            <div className="reg-field">
              <label className="reg-label">PIN Code</label>
              <input className="reg-input" type="text" placeholder="6-digit PIN"
                maxLength={6} value={form.pincode}
                onChange={e => update('pincode', e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>

          <div className="reg-divider">Farm Information</div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">Type of Farmer *</label>
              <div className="reg-radio-group">
                {[['small', 'Small / Marginal (< 2 acres)'], ['large', 'Large (> 2 acres)']].map(([val, lbl]) => (
                  <label key={val} className={`reg-radio-card ${form.farmerType === val ? 'selected' : ''}`}>
                    <input type="radio" name="farmerType" value={val}
                      onChange={() => update('farmerType', val)} hidden />
                    <span className="reg-radio-icon">{val === 'small' ? '🌱' : '🌳'}</span>
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">Land Size * (in acres)</label>
              <input className="reg-input" type="number" placeholder="e.g. 3.5"
                min="0" step="0.5" value={form.landSize}
                onChange={e => update('landSize', e.target.value)} />
            </div>
            <div className="reg-field">
              <label className="reg-label">Land Ownership</label>
              <div className="reg-radio-group">
                {[['owner', '🏠 Owner'], ['leased', '🤝 Leased']].map(([val, lbl]) => (
                  <label key={val} className={`reg-radio-card ${form.landOwnership === val ? 'selected' : ''}`}>
                    <input type="radio" name="landOwnership" value={val}
                      onChange={() => update('landOwnership', val)} hidden />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">Irrigation Type</label>
              <div className="reg-radio-group">
                {[['irrigated', '💧 Irrigated'], ['rainfed', '🌧️ Rain Fed']].map(([val, lbl]) => (
                  <label key={val} className={`reg-radio-card ${form.irrigationType === val ? 'selected' : ''}`}>
                    <input type="radio" name="irrigationType" value={val}
                      onChange={() => update('irrigationType', val)} hidden />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="reg-field">
              <label className="reg-label">Farming Type</label>
              <div className="reg-radio-group">
                {[['organic', '🌿 Organic'], ['conventional', '🏭 Conventional']].map(([val, lbl]) => (
                  <label key={val} className={`reg-radio-card ${form.organicFarming === val ? 'selected' : ''}`}>
                    <input type="radio" name="organicFarming" value={val}
                      onChange={() => update('organicFarming', val)} hidden />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label">Crop Season</label>
              <div className="reg-radio-group">
                {[['kharif', '☀️ Kharif (Seasonal)'], ['rabi', '❄️ Rabi (Winter)'], ['both', '🔄 Both']].map(([val, lbl]) => (
                  <label key={val} className={`reg-radio-card ${form.cropSeason === val ? 'selected' : ''}`}>
                    <input type="radio" name="cropSeason" value={val}
                      onChange={() => update('cropSeason', val)} hidden />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="reg-field">
            <label className="reg-label">Crops Grown (select all that apply)</label>
            <div className="reg-crops-grid">
              {CROPS.map(crop => (
                <label key={crop} className={`reg-crop-tag ${form.crops.includes(crop) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={form.crops.includes(crop)}
                    onChange={() => toggleCrop(crop)} hidden />
                  {crop}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Identity ── */}
      {step === 3 && (
        <div className="reg-step-content">
          <h3 className="reg-step-title">Identity Verification</h3>
          <p className="reg-step-subtitle">Upload your government ID for authenticity (optional for demo)</p>

          <div className="reg-field">
            <label className="reg-label">Aadhaar Card / Government ID</label>
            <label className="reg-upload-area" htmlFor="aadhaar-upload">
              <div className="reg-upload-icon">🪪</div>
              <div className="reg-upload-text">
                {aadhaarName ? (
                  <><strong>✅ {aadhaarName}</strong><br /><span>Click to change</span></>
                ) : (
                  <><strong>Click to upload Aadhaar</strong><br /><span>PNG, JPG, PDF (max 5MB)</span></>
                )}
              </div>
              <input
                id="aadhaar-upload"
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={e => {
                  update('aadhaar', e.target.files[0]);
                  setAadhaarName(e.target.files[0]?.name || '');
                }}
              />
            </label>
          </div>

          <div className="reg-field">
            <label className="reg-label">Kisan Card / Farmer ID (Optional)</label>
            <label className="reg-upload-area" htmlFor="kisan-upload">
              <div className="reg-upload-icon">📄</div>
              <div className="reg-upload-text">
                {kisanName ? (
                  <><strong>✅ {kisanName}</strong><br /><span>Click to change</span></>
                ) : (
                  <><strong>Click to upload Kisan Card</strong><br /><span>PNG, JPG, PDF (max 5MB)</span></>
                )}
              </div>
              <input
                id="kisan-upload"
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={e => {
                  update('kisanCard', e.target.files[0]);
                  setKisanName(e.target.files[0]?.name || '');
                }}
              />
            </label>
          </div>

          <div className="reg-info-box">
            🔒 Your documents are securely stored and only used for verification purposes. They are never shared without your consent.
          </div>
        </div>
      )}

      {/* ── STEP 4: Account Creation ── */}
      {step === 4 && (
        <form className="reg-step-content" onSubmit={handleSubmit}>
          <h3 className="reg-step-title">Create Your Account</h3>
          <p className="reg-step-subtitle">Set up your login credentials</p>

          <div className="reg-field">
            <label className="reg-label">Email Address *</label>
            <input className="reg-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
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

          <div className="reg-summary">
            <h4>📋 Account Summary</h4>
            <div className="reg-summary-grid">
              <div><span>Name</span><strong>{form.fullName}</strong></div>
              <div><span>Mobile</span><strong>+91 {form.mobile}</strong></div>
              <div><span>State</span><strong>{form.state}</strong></div>
              <div><span>Land Size</span><strong>{form.landSize} acres</strong></div>
              <div><span>Farmer Type</span><strong className="capitalize">{form.farmerType || '—'}</strong></div>
              <div><span>Crops</span><strong>{form.crops.join(', ') || '—'}</strong></div>
            </div>
          </div>

          <button
            type="submit"
            className="reg-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="reg-spinner">⏳ Creating Account...</span>
            ) : (
              '🌾 Create Farmer Account'
            )}
          </button>
        </form>
      )}

      {/* Navigation Buttons */}
      {step < 4 && (
        <div className="reg-nav">
          {step > 1 && (
            <button type="button" className="reg-back-btn" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <button type="button" className="reg-next-btn" onClick={nextStep}>
            {step === 3 ? 'Continue to Account →' : 'Next Step →'}
          </button>
        </div>
      )}
    </div>
  );
}
