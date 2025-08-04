import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import SettingsPage from './pages/SettingsPage';
import EmailTestPage from './pages/EmailTestPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';

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
                      <Route path="/orders" element={<OrderHistoryPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/email-test" element={<EmailTestPage />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              } />
            </Routes>
          </Router>
        </InventoryProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
