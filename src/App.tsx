import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Shop from './components/Shop';
import Tutorial from './components/Tutorial';
import Chatbot from './components/Chatbot';
import Footer from './components/Footer';
import PCBuilder from './components/PCBuilder';
import Dashboard from './components/Dashboard';
import MyBuilds from './components/MyBuilds';
import MyOrders from './components/MyOrders';
import AISupport from './components/AISupport';
import AuthModal from './components/AuthModal';
import { Product, PCBuild } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { isAuthModalOpen, setAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState<Product[]>([]);
  const [editingBuild, setEditingBuild] = useState<PCBuild['components'] | undefined>(undefined);

  const handleAddToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'builder') {
      setEditingBuild(undefined);
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Hero onStart={handleTabChange} />;
      case 'shop':
        return <Shop onAddToCart={handleAddToCart} onNavigate={handleTabChange} cart={cart} setCart={setCart} />;
      case 'builder':
        return <PCBuilder onNavigate={handleTabChange} initialBuild={editingBuild} />;
      case 'tutorial':
        return <Tutorial />;
      case 'support':
        return <AISupport />;
      case 'dashboard':
        return <Dashboard />;
      case 'my-builds':
        return <MyBuilds onEdit={(build) => {
          setEditingBuild(build.components);
          setActiveTab('builder');
        }} />;
      case 'my-orders':
        return <MyOrders />;
      default:
        return <Hero onStart={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 selection:text-emerald-500">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        cartCount={cart.length} 
      />
      
      <main>
        {renderContent()}
      </main>

      <Footer />

      <Chatbot />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
