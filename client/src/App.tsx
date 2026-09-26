import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OperationsPage from './pages/OperationsPage';
import MoveHistoryPage from './pages/MoveHistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import NewOperationModal from './components/NewOperationModal';
import NewProductModal from './components/NewProductModal';
import api from './services/api';
import { Product, Location, Category } from './types';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  const [isNewOpOpen, setIsNewOpOpen] = useState(false);
  const [isNewProdOpen, setIsNewProdOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchGlobalData = async () => {
    try {
      const [prodRes, locRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses/locations/all'),
        api.get('/products/categories'),
      ]);
      setProducts(prodRes.data.products || []);
      setLocations(locRes.data.locations || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error('Error fetching global options:', err);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchGlobalData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading StockSense IMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100">
      {/* Top Navigation Bar matching Architecture Diagram */}
      <Navbar
        onNewOperation={() => setIsNewOpOpen(true)}
        onNewProduct={() => setIsNewProdOpen(true)}
      />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/ledger" element={<MoveHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Global Modals triggered from Top Navbar */}
      {isNewOpOpen && (
        <NewOperationModal
          onClose={() => setIsNewOpOpen(false)}
          onSuccess={() => {
            fetchGlobalData();
            window.location.reload();
          }}
          products={products}
          locations={locations}
        />
      )}

      {isNewProdOpen && (
        <NewProductModal
          onClose={() => setIsNewProdOpen(false)}
          onSuccess={() => {
            fetchGlobalData();
            window.location.reload();
          }}
          categories={categories}
          locations={locations}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
