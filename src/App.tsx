import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Shop from './components/Shop';
import Tutorial from './components/Tutorial';
import Footer from './components/Footer';
import PCBuilder from './components/PCBuilder';
import Dashboard from './components/Dashboard';
import MyBuilds from './components/MyBuilds';
import MyOrders from './components/MyOrders';
import PreBuilts from './components/PreBuilts';
import AuthModal from './components/AuthModal';
import AnnouncementBar from './components/AnnouncementBar';
import AIAssistant from './components/AIAssistant';
import { Product, PCBuild } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { isAuthModalOpen, setAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState<Product[]>([]);
  const [editingBuild, setEditingBuild] = useState<PCBuild['components'] | undefined>(undefined);

  const handleAddToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const handleTabChange = (tab: string, initialBuild?: PCBuild['components']) => {
    if (initialBuild) {
      setEditingBuild(initialBuild);
    } else if (tab === 'builder' && activeTab !== 'builder') {
      // Only clear if we're navigating TO builder without an initial build
      // and we weren't already there (to avoid clearing when clicking builder tab while on it)
      setEditingBuild(undefined);
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Hero onStart={(tab) => handleTabChange(tab)} />;
      case 'shop':
        return <Shop onAddToCart={handleAddToCart} onNavigate={(tab) => handleTabChange(tab)} cart={cart} setCart={setCart} />;
      case 'builder':
        return <PCBuilder onNavigate={(tab) => handleTabChange(tab)} initialBuild={editingBuild} />;
      case 'tutorial':
        return <Tutorial />;
      case 'pre-builts':
        return <PreBuilts 
          onNavigateToBuilder={(initialBuild) => handleTabChange('builder', initialBuild)} 
          onAddToCart={handleAddToCart}
        />;
      case 'dashboard':
        return <Dashboard />;
      case 'my-builds':
        return <MyBuilds onEdit={(build) => {
          handleTabChange('builder', build.components);
        }} />;
      case 'my-orders':
        return <MyOrders />;
      default:
        return <Hero onStart={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-white transition-colors duration-300 selection:bg-emerald-500/30 selection:text-emerald-500">
      <AnnouncementBar />
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        cartCount={cart.length} 
      />
      
      <main>
        {renderContent()}
      </main>

      <Footer />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
      
      <AIAssistant />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
