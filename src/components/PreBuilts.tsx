import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Shield, ShoppingCart, ArrowRight, Star, Monitor, Loader2, Mouse, Keyboard, X, Info, CheckCircle2, Sparkles, Box, Wind, Bot } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { PreBuiltPC, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PreBuiltsProps {
  onNavigateToBuilder: (initialBuild?: any) => void;
  onAddToCart: (product: Product) => void;
}

export default function PreBuilts({ onNavigateToBuilder, onAddToCart }: PreBuiltsProps) {
  const { profile } = useAuth();
  const [prebuilts, setPrebuilts] = useState<PreBuiltPC[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPC, setSelectedPC] = useState<PreBuiltPC | null>(null);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    // Fetch Pre-Builts
    const q = query(collection(db, 'prebuilts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPrebuilts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreBuiltPC)));
      setLoading(false);
    });

    // Fetch Products to map specs to objects for the builder
    const pq = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(pq, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    return () => {
      unsubscribe();
      unsubscribeProducts();
    };
  }, []);

  const handleAddToCart = (pc: PreBuiltPC) => {
    const product: Product = {
      id: pc.id,
      name: pc.name,
      price: pc.price,
      image: pc.image,
      category: 'Pre-Built',
      description: `${pc.tier} Series Gaming PC with ${pc.specs.cpu} and ${pc.specs.gpu}.`
    };
    onAddToCart(product);
    setAddedToCartId(pc.id);
    setTimeout(() => setAddedToCartId(null), 2000);
  };

  const handleLoadIntoBuilder = (pc: PreBuiltPC) => {
    // Map the string names in specs to actual Product objects
    const initialSelections: any = {
      CPU: products.find(p => p.name === pc.specs.cpu),
      GPU: products.find(p => p.name === pc.specs.gpu),
      RAM: products.find(p => p.name === pc.specs.ram),
      Storage: products.find(p => p.name === pc.specs.storage),
      Motherboard: pc.specs.motherboard ? products.find(p => p.name === pc.specs.motherboard) : null,
      PSU: pc.specs.psu ? products.find(p => p.name === pc.specs.psu) : null,
      Case: pc.specs.case ? products.find(p => p.name === pc.specs.case) : null,
      Cooling: pc.specs.cooling ? products.find(p => p.name === pc.specs.cooling) : null,
      Monitor: pc.specs.monitor ? products.find(p => p.name === pc.specs.monitor) : null,
      Peripherals_1: pc.specs.peripherals ? products.find(p => p.name === pc.specs.peripherals) : null,
      Peripherals_2: pc.specs.peripherals_2 ? products.find(p => p.name === pc.specs.peripherals_2) : null,
      Peripherals_3: pc.specs.peripherals_3 ? products.find(p => p.name === pc.specs.peripherals_3) : null,
    };
    
    onNavigateToBuilder(initialSelections);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Assembling Listings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium mb-6"
          >
            <Monitor size={16} />
            Ready-to-Ship Gaming Rigs
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            PC MASTER <span className="text-emerald-500 italic">PRE-BUILTS</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg mb-8">
            Professionally assembled, stress-tested, and ready to dominate. Choose your tier and start playing today.
          </p>
        </header>

        {prebuilts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-[40px]">
             <p className="text-zinc-500 font-bold uppercase tracking-widest">No listings available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {prebuilts.map((pc, index) => (
              <motion.div
                key={pc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedPC(pc)}
                className="group cursor-pointer relative bg-zinc-900/50 border border-zinc-800 rounded-[40px] overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                <div className="aspect-[16/9] w-full relative overflow-hidden">
                  <img 
                    src={pc.image} 
                    alt={pc.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  
                  <div className="absolute top-6 left-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      pc.tier === 'Extreme' ? 'bg-purple-500/90 text-white shadow-lg shadow-purple-500/20' :
                      pc.tier === 'High' ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/20' :
                      pc.tier === 'Mid' ? 'bg-emerald-500/90 text-black shadow-lg shadow-emerald-500/20' :
                      'bg-zinc-500/90 text-white shadow-lg shadow-zinc-500/20'
                    }`}>
                      {pc.tier} SERIES
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-8 right-8">
                    <h3 className="text-3xl font-black text-white italic tracking-tight">{pc.name}</h3>
                    <p className="text-emerald-500 font-bold text-xl mt-1">₱ {pc.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-zinc-300">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <Cpu size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-xs">
                          <p className="text-zinc-500 uppercase font-black text-[9px]">Processor</p>
                          <p className="font-medium truncate">{pc.specs.cpu}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-300">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <Zap size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-xs">
                          <p className="text-zinc-500 uppercase font-black text-[9px]">Graphics</p>
                          <p className="font-medium truncate">{pc.specs.gpu}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-zinc-300">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <Shield size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-xs">
                          <p className="text-zinc-500 uppercase font-black text-[9px]">Memory</p>
                          <p className="font-medium truncate">{pc.specs.ram}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-300">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <Star size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-xs">
                          <p className="text-zinc-500 uppercase font-black text-[9px]">Storage</p>
                          <p className="font-medium truncate">{pc.specs.storage}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn uppercase tracking-widest text-xs">
                      VIEW FULL SPECS
                      <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    {!isOwner && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('open-ai-assistant', { detail: { message: `Is the ${pc.name} good for streaming?` } }));
                          }}
                          className="p-4 bg-white/5 text-emerald-500 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                          title="Ask AI about this build"
                        >
                          <Bot size={20} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(pc);
                          }}
                          className="p-4 bg-emerald-500 text-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                          title="Quick Add to Cart"
                        >
                          {addedToCartId === pc.id ? <CheckCircle2 size={20} /> : <ShoppingCart size={20} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedPC && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
              onClick={() => setSelectedPC(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-white/10 w-full max-w-4xl rounded-[40px] overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <div className="relative">
                  <img 
                    src={selectedPC.image} 
                    alt={selectedPC.name} 
                    className="w-full h-64 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setSelectedPC(null)}
                    className="absolute top-6 right-6 p-3 rounded-2xl bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-6 left-8">
                     <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-md mb-2 inline-block italic">
                        {selectedPC.tier} Series
                     </span>
                     <h2 className="text-4xl font-black text-white italic tracking-tight uppercase leading-none">{selectedPC.name}</h2>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Info size={16} />
                          Full Specifications
                        </h3>
                        <div className="space-y-4">
                          {[
                            { label: 'Processor', value: selectedPC.specs.cpu, icon: Cpu },
                            { label: 'Graphics Card', value: selectedPC.specs.gpu, icon: Zap },
                            { label: 'Memory', value: selectedPC.specs.ram, icon: Shield },
                            { label: 'Storage', value: selectedPC.specs.storage, icon: Box },
                            { label: 'Motherboard', value: selectedPC.specs.motherboard, icon: Box },
                            { label: 'Power Supply', value: selectedPC.specs.psu, icon: Zap },
                            { label: 'Case', value: selectedPC.specs.case, icon: Box },
                            { label: 'Cooling', value: selectedPC.specs.cooling, icon: Wind },
                            { label: 'Monitor', value: selectedPC.specs.monitor, icon: Monitor },
                            { label: 'Peripherals', value: selectedPC.specs.peripherals, icon: Mouse },
                          ].filter(s => s.value).map((spec, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-emerald-500/30 transition-all">
                              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                <spec.icon size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">{spec.label}</p>
                                <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{spec.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Sparkles size={16} />
                          Key Features
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedPC.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-800/30 border border-white/5">
                              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                              <span className="text-sm font-medium text-zinc-300">{feature}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-800/30 border border-white/5">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                            <span className="text-sm font-medium text-zinc-300">2-Year Shop Warranty</span>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-800/30 border border-white/5">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                            <span className="text-sm font-medium text-zinc-300">Professionally Cable Managed</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 space-y-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">TOTAL PRICE</p>
                              <p className="text-4xl font-black text-emerald-500 italic leading-none truncate">₱ {selectedPC.price.toLocaleString()}</p>
                           </div>
                           <Zap size={32} className="text-emerald-500/20" />
                        </div>
                        <div className="flex flex-col gap-3">
                          {!isOwner && (
                            <button 
                              onClick={() => handleAddToCart(selectedPC)}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 group/buy uppercase tracking-widest disabled:opacity-50"
                              disabled={addedToCartId === selectedPC.id}
                            >
                              <ShoppingCart size={20} />
                              {addedToCartId === selectedPC.id ? 'ADDED TO CART' : 'SECURE SYSTEM'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-20 p-12 rounded-[50px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-black text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-30" />
          <h2 className="text-4xl font-black italic mb-4 relative z-10">WANT SOMETHING UNIQUE?</h2>
          <p className="text-black/80 font-bold text-lg mb-8 max-w-xl mx-auto relative z-10">
            Use our Expert AI Guided Builder to pick every single component for your dream machine.
          </p>
          <button 
            onClick={() => onNavigateToBuilder()}
            className="px-10 py-5 bg-black text-white font-black rounded-3xl hover:scale-105 transition-transform shadow-2xl relative z-10"
          >
            OPEN PC BUILDER
          </button>
        </motion.div>
      </div>
    </div>
  );
}
