import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar       from './components/Navbar';
import Footer       from './components/Footer';
import LandingPage  from './pages/LandingPage/LandingPage';
import RegisterPage from './pages/Register/RegisterPage';
import LoginPage    from './pages/Login/LoginPage';
import Dashboard    from './pages/Dashboard/Dashboard';
import SchemeFinder from './pages/Dashboard/SchemeFinder';
import AISimplify  from './pages/Dashboard/AISimplify';
import ActionGuide from './pages/Dashboard/ActionGuide';
import VoiceAssistant from './pages/Dashboard/VoiceAssistant';
import MandiPrices  from './components/MandiPrices';
import Marketplace  from './pages/Marketplace/Marketplace';
import AddProduct   from './pages/Marketplace/AddProduct';
import Checkout     from './pages/Marketplace/Checkout';
import MyOrders     from './pages/Marketplace/MyOrders';
import FarmerOrders from './pages/Marketplace/FarmerOrders';
import Logistics     from './pages/Logistics/Logistics';
import SmartAlerts    from './pages/Dashboard/SmartAlerts';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

// Layout with Navbar + Footer
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

// Layout without footer (for auth pages)
function AuthLayout({ children }) {
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout><LandingPage /></Layout>} />
      <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
      <Route path="/login"    element={<AuthLayout><LoginPage /></AuthLayout>} />

      {/* Protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      {/* Marketplace */}
      <Route path="/marketplace"          element={<ProtectedRoute><Layout><Marketplace /></Layout></ProtectedRoute>} />
      <Route path="/marketplace/add"      element={<ProtectedRoute><Layout><AddProduct /></Layout></ProtectedRoute>} />
      <Route path="/marketplace/checkout/:id" element={<ProtectedRoute><Layout><Checkout /></Layout></ProtectedRoute>} />
      <Route path="/my-orders"            element={<ProtectedRoute><Layout><MyOrders /></Layout></ProtectedRoute>} />
      <Route path="/farmer-orders"        element={<ProtectedRoute><Layout><FarmerOrders /></Layout></ProtectedRoute>} />

      <Route path="/logistics"     element={<ProtectedRoute><Layout><Logistics /></Layout></ProtectedRoute>} />
      <Route path="/scheme-finder" element={<ProtectedRoute><Layout><SchemeFinder /></Layout></ProtectedRoute>} />
      <Route path="/ai-simplify"   element={<ProtectedRoute><Layout><AISimplify /></Layout></ProtectedRoute>} />
      <Route path="/action-guide"  element={<ProtectedRoute><Layout><ActionGuide /></Layout></ProtectedRoute>} />
      <Route path="/voice-assist"  element={<ProtectedRoute><Layout><VoiceAssistant /></Layout></ProtectedRoute>} />
      <Route path="/alerts"        element={<ProtectedRoute><Layout><SmartAlerts /></Layout></ProtectedRoute>} />
      <Route path="/market-price"  element={<ProtectedRoute><Layout><MandiPrices /></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Coming soon page for features not yet built
function ComingSoon({ title, icon }) {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '120px 20px 60px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '4rem' }}>{icon}</div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--dark)' }}>
        {title}
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.7 }}>
        This feature is coming soon! We're working hard to bring you the best experience.
      </p>
      <div style={{
        background: 'linear-gradient(135deg, var(--green-50), var(--blue-50))',
        border: '1px solid rgba(51,201,139,0.2)',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '0.9rem',
        color: 'var(--green-800)',
        fontWeight: 600,
      }}>
        🚧 Under Development — Check Back Soon!
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
