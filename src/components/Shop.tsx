import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Search, Filter, Trash2, X, CreditCard, CheckCircle2, Wallet, Landmark, Star, AlertTriangle, Monitor, Cpu, HardDrive } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { Product, Order, Notification, ShippingAddress } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ReviewSystem from './ReviewSystem';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';

interface ShopProps {
  onAddToCart: (product: Product) => void;
  onNavigate?: (tab: string) => void;
  cart: Product[];
  setCart: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function Shop({ onAddToCart, onNavigate, cart, setCart }: ShopProps) {
  const { user, profile, setAuthModalOpen } = useAuth();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState<'All' | 'Intel' | 'AMD'>('All');
  const [selectedSocket, setSelectedSocket] = useState('All');
  const [selectedRamType, setSelectedRamType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('gcash');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    zipCode: ''
  });

  const INTEL_SOCKETS = ['LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA2066'];
  const AMD_SOCKETS = ['AM5', 'AM4', 'AM3+', 'sTR5', 'sWRX8', 'TR4'];

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('category', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    // Compatibility Logic
    let matchesBrand = true;
    if (selectedBrand !== 'All') {
      if (product.category === 'CPU' || product.category === 'Motherboard') {
        const isIntelSocket = product.socket && INTEL_SOCKETS.includes(product.socket);
        const isAmdSocket = product.socket && AMD_SOCKETS.includes(product.socket);
        
        if (selectedBrand === 'Intel') {
          matchesBrand = !!isIntelSocket || product.name.toLowerCase().includes('intel');
        } else {
          matchesBrand = !!isAmdSocket || product.name.toLowerCase().includes('amd') || product.name.toLowerCase().includes('ryzen');
        }
      }
    }

    const matchesSocket = selectedSocket === 'All' || product.socket === selectedSocket;
    const matchesRamType = selectedRamType === 'All' || product.ramType === selectedRamType;

    return matchesSearch && matchesCategory && matchesBrand && matchesSocket && matchesRamType;
  });

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (
      !shippingAddress.fullName || 
      !shippingAddress.phone || 
      !shippingAddress.street || 
      !shippingAddress.city || 
      !shippingAddress.province || 
      !shippingAddress.zipCode
    ) {
      alert('Please fill in all delivery information.');
      return;
    }

    setIsCheckingOut(true);

    try {
      const order: Omit<Order, 'id'> = {
        userId: user.uid,
        userEmail: user.email || '',
        userName: profile?.displayName || 'Unknown Customer',
        items: cart,
        totalPrice,
        status: 'pending',
        paymentMethod,
        shippingAddress,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), order);

      // Decrement stock for each item
      for (const item of cart) {
        if (item.id) {
          const productRef = doc(db, 'products', item.id);
          const currentStock = item.stock ?? 10;
          await updateDoc(productRef, {
            stock: Math.max(0, currentStock - 1)
          });
        }
      }

      setCheckoutSuccess(true);
      setCart([]);
      setTimeout(() => {
        setCheckoutSuccess(false);
        setIsCartOpen(false);
        if (onNavigate) {
          const isAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner';
          onNavigate(isAdminOrOwner ? 'dashboard' : 'my-orders');
        }
      }, 3000);
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const isAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner';

  return (
    <div className="bg-black min-h-screen py-12 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Component Shop</h2>
            <p className="text-zinc-400 mt-2">Premium parts for your next masterpiece.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full sm:w-48 transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all ${
                showFilters || selectedBrand !== 'All' || selectedSocket !== 'All' || selectedRamType !== 'All'
                ? 'bg-emerald-500 border-emerald-500 text-black'
                : 'bg-zinc-900 border-white/10 text-white hover:bg-white/5'
              }`}
            >
              <Filter size={16} />
              {showFilters ? 'Hide Logic' : 'Smart Filters'}
            </button>

            {!isAdminOrOwner && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 bg-zinc-900 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                   <span className="absolute -right-1 -top-1 bg-emerald-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat 
                ? 'bg-emerald-500 text-black' 
                : 'bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Compatibility Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Brand Filter */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <Monitor size={12} className="text-emerald-500" />
                    Platform
                  </p>
                  <div className="flex gap-2">
                    {['All', 'Intel', 'AMD'].map((brand) => (
                      <button
                        key={brand}
                        onClick={() => {
                          setSelectedBrand(brand as any);
                          setSelectedSocket('All');
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          selectedBrand === brand
                          ? 'bg-emerald-500 border-emerald-500 text-black'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Socket Filter */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <Cpu size={12} className="text-emerald-500" />
                    Socket Compatibility
                  </p>
                  <select
                    value={selectedSocket}
                    onChange={(e) => setSelectedSocket(e.target.value)}
                    className="w-full bg-white border border-white/10 rounded-xl py-2 px-4 text-xs font-bold text-black focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                  >
                    <option value="All">All Sockets</option>
                    {(selectedBrand === 'All' || selectedBrand === 'Intel') && (
                      <optgroup label="Intel Sockets">
                        {INTEL_SOCKETS.map(s => <option key={s} value={s}>{s}</option>)}
                      </optgroup>
                    )}
                    {(selectedBrand === 'All' || selectedBrand === 'AMD') && (
                      <optgroup label="AMD Sockets">
                        {AMD_SOCKETS.map(s => <option key={s} value={s}>{s}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* RAM Type Filter */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <HardDrive size={12} className="text-emerald-500" />
                    Memory Type
                  </p>
                  <div className="flex gap-2">
                    {['All', 'DDR4', 'DDR5'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedRamType(type)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          selectedRamType === type
                          ? 'bg-emerald-500 border-emerald-500 text-black'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                    {product.category}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-white">₱{product.price.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold uppercase ${(product.stock ?? 10) > 0 ? 'text-white/40' : 'text-red-500'}`}>
                      {(product.stock ?? 10) > 0 ? `${product.stock ?? 10} in stock` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                   {product.socket && (
                     <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-tighter">
                       {product.socket}
                     </span>
                   )}
                   {product.ramType && (
                     <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-tighter">
                       {product.ramType}
                     </span>
                   )}
                   {product.wattage && (
                     <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-tighter">
                       {product.wattage}W
                     </span>
                   )}
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2 mb-6">
                  {product.description}
                </p>
                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-2.5 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all"
                  >
                    <Star size={14} className="fill-current" />
                    View Reviews
                  </button>
                  {!isAdminOrOwner && (
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={(product.stock ?? 10) <= 0}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-3 text-sm font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {(product.stock ?? 10) > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24">
            <p className="text-zinc-500 text-lg">No components found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="text-emerald-500" />
                  Your Cart
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/40 gap-4">
                    <ShoppingCart size={48} />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Items in Cart</h4>
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                            <p className="text-xs text-emerald-500 font-bold mt-1">₱{item.price.toLocaleString()}</p>
                          </div>
                          <button onClick={() => removeFromCart(idx)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Delivery Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] text-white/40 mb-1 block">Full Name</label>
                          <input
                            type="text"
                            value={shippingAddress.fullName}
                            onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-white/40 mb-1 block">Phone Number</label>
                          <input
                            type="text"
                            value={shippingAddress.phone}
                            onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="0917XXXXXXX"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-white/40 mb-1 block">Street Address</label>
                          <input
                            type="text"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="123 Sakura St."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">City</label>
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Manila"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Province</label>
                          <input
                            type="text"
                            value={shippingAddress.province}
                            onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Metro Manila"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-white/40 mb-1 block">Zip Code</label>
                          <input
                            type="text"
                            value={shippingAddress.zipCode}
                            onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="1000"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-white/10 bg-black/40">
                <div className="mb-6">
                  <label className="text-xs font-bold text-white/40 uppercase mb-3 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('gcash')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === 'gcash' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <Wallet size={16} />
                      GCash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('paymaya')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === 'paymaya' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <Wallet size={16} />
                      PayMaya
                    </button>
                    <button
                      onClick={() => setPaymentMethod('visa')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === 'visa' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <CreditCard size={16} />
                      Visa / Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === 'bank_transfer' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <Landmark size={16} />
                      Bank Transfer
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-white/60">Total Amount</span>
                  <span className="text-2xl font-bold text-emerald-500">₱{totalPrice.toLocaleString()}</span>
                </div>

                {checkoutSuccess ? (
                  <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3 text-emerald-500">
                    <CheckCircle2 size={24} />
                    <span className="font-bold">Order placed successfully!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isCheckingOut}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={20} />
                        Checkout Now
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Details Modal for Reviews */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-white/10 rounded-3xl z-[90] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Visual Side */}
                <div className="w-full md:w-2/5 h-64 md:h-auto relative">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:bg-gradient-to-r" />
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/60 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content Side */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{selectedProduct.category}</span>
                      <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{selectedProduct.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">₱{selectedProduct.price.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">MSRP</p>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                    {selectedProduct.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {selectedProduct.wattage && (
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Power Draw</p>
                        <p className="text-lg font-bold text-white">{selectedProduct.wattage}W</p>
                      </div>
                    )}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Stock Status</p>
                      <p className={`text-lg font-bold ${selectedProduct.stock && selectedProduct.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {selectedProduct.stock && selectedProduct.stock > 0 ? 'In Stock' : 'Sold Out'}
                      </p>
                    </div>
                  </div>

                  {/* GPU Reviews Component */}
                  <ReviewSystem 
                    productId={selectedProduct.id} 
                    productName={selectedProduct.name} 
                  />

                  <div className="mt-12">
                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={(selectedProduct.stock ?? 10) <= 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-50"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
