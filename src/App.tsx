import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EmailTestPage from './pages/EmailTestPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { BrandingProvider } from './contexts/BrandingContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function ProtectedRoute({ children, feature }: { children: React.ReactNode; feature?: 'analytics' | 'orders' | 'settings' }) {
  const { hasAccess } = useAuth();
  
  // If a feature is specified and user doesn't have access, redirect to inventory
  if (feature && !hasAccess(feature)) {
    return <Navigate to="/inventory" />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/" /> : <>{children}</>;
}

function App() {
  return (
    <div className="tablet-mobile">
      <BrandingProvider>
        <AuthProvider>
          <InventoryProvider>
            <Router>
              <Routes>
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
              <Route path="/*" element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<InventoryPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/analytics" element={
                        <ProtectedRoute feature="analytics">
                          <AnalyticsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/orders" element={
                        <ProtectedRoute feature="orders">
                          <OrderHistoryPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute feature="settings">
                          <SettingsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/email-test" element={<EmailTestPage />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              } />
            </Routes>
          </Router>
        </InventoryProvider>
      </AuthProvider>
    </BrandingProvider>
    </div>
  );
}

export default App;
