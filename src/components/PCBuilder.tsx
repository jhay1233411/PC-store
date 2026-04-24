import React, { useState } from 'react';
import { Cpu, Layout, ArrowRight, CheckCircle2, ChevronRight, HardDrive, ShoppingCart, Trash2, X, Wallet, CreditCard, Landmark, Loader2, CheckCircle, Monitor, Zap, Box, Wind, Search, ArrowLeft, Star, Info, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PCBuild, Product, Order, ShippingAddress } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import ReviewSystem from './ReviewSystem';

// 1. MOCK DATA OBJECT
const MOCK_DATA = {
  cpus: [
    { id: 'cpu-1', name: 'Intel Core i9-14900K', socket: 'LGA1700', price: 34500, category: 'CPU' as Product['category'], image: 'https://picsum.photos/seed/cpu1/400/400', description: '24 Cores, 32 Threads, up to 6.0 GHz' },
    { id: 'cpu-2', name: 'AMD Ryzen 9 7950X', socket: 'AM5', price: 31200, category: 'CPU' as Product['category'], image: 'https://picsum.photos/seed/cpu2/400/400', description: '16 Cores, 32 Threads, Zen 4 Architecture' },
    { id: 'cpu-3', name: 'Intel Core i5-13600K', socket: 'LGA1700', price: 17800, category: 'CPU' as Product['category'], image: 'https://picsum.photos/seed/cpu3/400/400', description: '14 Cores, 20 Threads, Hybrid Architecture' },
    { id: 'cpu-4', name: 'AMD Ryzen 7 5800X', socket: 'AM4', price: 14500, category: 'CPU' as Product['category'], image: 'https://picsum.photos/seed/cpu4/400/400', description: '8 Cores, 16 Threads, Zen 3' },
  ],
  motherboards: [
    { id: 'mobo-1', name: 'ASUS ROG Maximus Z790', socket: 'LGA1700', ramType: 'DDR5', price: 28000, category: 'Motherboard' as Product['category'], image: 'https://picsum.photos/seed/mobo1/400/400', description: 'High-end overclocking motherboard' },
    { id: 'mobo-2', name: 'MSI MPG X670E Carbon', socket: 'AM5', ramType: 'DDR5', price: 21500, category: 'Motherboard' as Product['category'], image: 'https://picsum.photos/seed/mobo2/400/400', description: 'Premium AM5 board with PCIe 5.0' },
    { id: 'mobo-3', name: 'Gigabyte B650 AORUS Elite', socket: 'AM5', ramType: 'DDR5', price: 11200, category: 'Motherboard' as Product['category'], image: 'https://picsum.photos/seed/mobo3/400/400', description: 'Great value AM5 motherboard' },
    { id: 'mobo-4', name: 'ASUS TUF Gaming B550', socket: 'AM4', ramType: 'DDR4', price: 8900, category: 'Motherboard' as Product['category'], image: 'https://picsum.photos/seed/mobo4/400/400', description: 'Reliable B550 board for Ryzen 5000' },
    { id: 'mobo-5', name: 'MSI MAG Z690 Tomahawk', socket: 'LGA1700', ramType: 'DDR4', price: 15400, category: 'Motherboard' as Product['category'], image: 'https://picsum.photos/seed/mobo5/400/400', description: 'Balanced Z690 board with DDR4 support' },
  ],
  ram: [
    { id: 'ram-1', name: 'Corsair Vengeance 32GB', ramType: 'DDR5', price: 9200, category: 'RAM' as Product['category'], image: 'https://picsum.photos/seed/ram1/400/400', description: '6000MHz C36 DDR5 Memory Kit' },
    { id: 'ram-2', name: 'G.Skill Trident Z5 32GB', ramType: 'DDR5', price: 10500, category: 'RAM' as Product['category'], image: 'https://picsum.photos/seed/ram2/400/400', description: '6400MHz C32 DDR5 RGB' },
    { id: 'ram-3', name: 'Corsair Vengeance LPX 16GB', ramType: 'DDR4', price: 4200, category: 'RAM' as Product['category'], image: 'https://picsum.photos/seed/ram3/400/400', description: '3600MHz C18 DDR4 Memory' },
    { id: 'ram-4', name: 'Kingston FURY Beast 16GB', ramType: 'DDR4', price: 3800, category: 'RAM' as Product['category'], image: 'https://picsum.photos/seed/ram4/400/400', description: '3200MHz DDR4 Memory' },
  ],
  gpus: [
    { id: 'gpu-1', name: 'RTX 5090 Ti FE', price: 125000, category: 'GPU' as Product['category'], image: 'https://picsum.photos/seed/gpu1/400/400', description: 'Ultimate gaming and AI performance' },
    { id: 'gpu-2', name: 'RTX 5080 FE', price: 85000, category: 'GPU' as Product['category'], image: 'https://picsum.photos/seed/gpu2/400/400', description: 'Next-gen enthusiasts 4K gaming' },
    { id: 'gpu-3', name: 'RX 8900 XTX', price: 78000, category: 'GPU' as Product['category'], image: 'https://picsum.photos/seed/gpu3/400/400', description: 'Top-tier Radeon performance' },
  ],
  storage: [
    { id: 'ssd-1', name: 'Samsung 990 Pro 2TB', price: 12500, category: 'Storage' as Product['category'], image: 'https://picsum.photos/seed/ssd1/400/400', description: 'Fastest Gen4 NVMe SSD' },
    { id: 'ssd-2', name: 'Crucial T700 1TB Gen5', price: 15800, category: 'Storage' as Product['category'], image: 'https://picsum.photos/seed/ssd2/400/400', description: 'Blazing fast PCIe 5.0 SSD' },
  ],
  psus: [
    { id: 'psu-1', name: 'Corsair HX1500i Platinum', price: 18500, category: 'PSU' as Product['category'], image: 'https://picsum.photos/seed/psu1/400/400', description: '1500W 80 PLUS Platinum Digital PSU' },
    { id: 'psu-2', name: 'Seasonic Focus GX-850', price: 7800, category: 'PSU' as Product['category'], image: 'https://picsum.photos/seed/psu2/400/400', description: '850W 80 PLUS Gold Fully Modular' },
  ],
  cases: [
    { id: 'case-1', name: 'Lian Li PC-O11 Dynamic', price: 9500, category: 'Case' as Product['category'], image: 'https://picsum.photos/seed/case1/400/400', description: 'Dual chamber mid-tower chassis' },
    { id: 'case-2', name: 'NZXT H9 Flow', price: 8800, category: 'Case' as Product['category'], image: 'https://picsum.photos/seed/case2/400/400', description: 'Panoramic dual-chamber case' },
  ],
  coolers: [
    { id: 'cool-1', name: 'NZXT Kraken Elite 360', price: 16500, category: 'Cooling' as Product['category'], image: 'https://picsum.photos/seed/cool1/400/400', description: '360mm AIO with LCD display' },
    { id: 'cool-2', name: 'Noctua NH-D15 chromax', price: 6800, category: 'Cooling' as Product['category'], image: 'https://picsum.photos/seed/cool2/400/400', description: 'Legendary dual-tower air cooler' },
  ]
};

interface PCBuilderProps {
  onNavigate?: (tab: string) => void;
  initialBuild?: PCBuild['components'];
}

export default function PCBuilder({ onNavigate, initialBuild }: PCBuilderProps) {
  const { user, profile, setAuthModalOpen } = useAuth();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  
  // Fetch live products from DB
  React.useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDbProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsubscribe();
  }, []);

  // Selection states
  const [selections, setSelections] = useState<Record<string, any>>(initialBuild || {
    CPU: null,
    Motherboard: null,
    RAM: null,
    GPU: null,
    Storage: null,
    PSU: null,
    Case: null,
    Cooling: null,
  });

  const [activeCategory, setActiveCategory] = useState<Product['category'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForReview, setSelectedProductForReview] = useState<any>(null);

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('gcash');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    zipCode: ''
  });

  const categories: { id: Product['category']; label: string; icon: any; guide: string }[] = [
    { id: 'CPU', label: 'Processor', icon: Cpu, guide: 'Slotted into the center of the motherboard. The brain of your PC.' },
    { id: 'Motherboard', label: 'Motherboard', icon: Layout, guide: 'The main circuit board that connects all components together.' },
    { id: 'RAM', label: 'Memory (RAM)', icon: HardDrive, guide: 'Narrow sticks inserted into slots next to the CPU.' },
    { id: 'GPU', label: 'Graphics Card', icon: Monitor, guide: 'Plugged into the long horizontal slot on the bottom half of the board.' },
    { id: 'Storage', label: 'Storage (SSD)', icon: HardDrive, guide: 'Small flat chips (M.2) or boxes mounted in drive bays.' },
    { id: 'PSU', label: 'Power Supply', icon: Zap, guide: 'The heavy box that powers everything, usually at the bottom-rear.' },
    { id: 'Case', label: 'Case / Chassis', icon: Box, guide: 'The structural skeleton that houses and protects all your parts.' },
    { id: 'Cooling', label: 'CPU Cooling', icon: Wind, guide: 'Sits directly on top of the CPU to keep it from overheating.' },
  ];

  // Logic: Get items for the active category with compatibility filtering
  const getAvailableItems = (category: Product['category']) => {
    // RULE 3: If no CPU is selected, do not show Motherboards or RAM
    if ((category === 'Motherboard' || category === 'RAM') && !selections.CPU) {
      return [];
    }

    // Filter live database products first
    const liveItems = dbProducts.filter(p => p.category === category);
    
    let items: any[] = liveItems.length > 0 ? liveItems : [];
    
    // If no live items exist for this category, fallback to MOCK_DATA
    if (items.length === 0) {
      switch (category) {
        case 'CPU': items = MOCK_DATA.cpus; break;
        case 'Motherboard': items = MOCK_DATA.motherboards; break;
        case 'RAM': items = MOCK_DATA.ram; break;
        case 'GPU': items = MOCK_DATA.gpus; break;
        case 'Storage': items = MOCK_DATA.storage; break;
        case 'PSU': items = MOCK_DATA.psus; break;
        case 'Case': items = MOCK_DATA.cases; break;
        case 'Cooling': items = MOCK_DATA.coolers; break;
      }
    }

    // Apply Compatibility Filters
    // RULE 1: CPU -> Motherboard: Filter by "Socket"
    if (category === 'Motherboard' && selections.CPU) {
      items = items.filter(i => i.socket === selections.CPU.socket);
    }
    
    // RULE 2: Motherboard -> RAM: Filter by "RAM_Type"
    if (category === 'RAM' && selections.Motherboard) {
      items = items.filter(i => i.ramType === selections.Motherboard.ramType);
    }

    // Bi-directional constraint (Optional but good for UX)
    if (category === 'CPU' && selections.Motherboard) {
      items = items.filter(i => i.socket === selections.Motherboard.socket);
    }

    if (searchTerm) {
      items = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return items;
  };

  const handleItemSelect = (category: Product['category'], item: any) => {
    const newSelections = { ...selections, [category]: item };

    // Cascade resets for compatibility
    if (category === 'CPU') {
      if (item && selections.Motherboard && item.socket !== selections.Motherboard.socket) {
        newSelections.Motherboard = null;
        newSelections.RAM = null;
      }
    } else if (category === 'Motherboard') {
      if (item && selections.CPU && item.socket !== selections.CPU.socket) {
        newSelections.CPU = null;
      }
      if (item && selections.RAM && item.ramType !== selections.RAM.ramType) {
        newSelections.RAM = null;
      }
    }

    setSelections(newSelections);
    setActiveCategory(null);
    setSearchTerm('');
  };

  const removeItem = (category: string) => {
    setSelections({ ...selections, [category]: null });
  };

  const totalPrice = Object.values(selections).reduce((acc, curr) => acc + (curr?.price || 0), 0);

  const handleSaveBuild = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const buildData = {
        userId: user.uid,
        name: `Custom Build - ${new Date().toLocaleDateString()}`,
        components: selections,
        totalPrice,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'pc_builds'), buildData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'pc_builds');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street) {
      alert('Please fill in all shipping information');
      return;
    }

    setIsCheckingOut(true);
    try {
      const items = Object.values(selections).filter(Boolean);
      const orderData: Omit<Order, 'id'> = {
        userId: user.uid,
        userEmail: user.email || 'Customer',
        userName: profile?.displayName || 'Unknown Builder',
        items: items as Product[],
        totalPrice,
        status: 'pending',
        paymentMethod,
        shippingAddress,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      setCheckoutSuccess(true);
      setSelections({
        CPU: null,
        Motherboard: null,
        RAM: null,
        GPU: null,
        Storage: null,
        PSU: null,
        Case: null,
        Cooling: null,
      });
      setTimeout(() => {
        setCheckoutSuccess(false);
        setIsCheckoutModalOpen(false);
        if (onNavigate) {
          const isAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner';
          onNavigate(isAdminOrOwner ? 'dashboard' : 'my-orders');
        }
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 py-20 min-h-screen font-sans bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-white mb-2 leading-none">
              PC BUILDER <span className="text-emerald-500">EXPRESS</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">Inspired by EasyPC. Built for speed and compatibility.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveBuild}
              disabled={isSaving || totalPrice === 0}
              className="group flex items-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 px-6 py-4 text-xs font-black text-zinc-900 dark:text-white hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
              {saveSuccess ? 'BUILD SAVED!' : 'SAVE CONFIG'}
            </button>
            <button
              onClick={() => setSelections({ CPU: null, Motherboard: null, RAM: null, GPU: null, Storage: null, PSU: null, Case: null, Cooling: null })}
              className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-sm"
              title="Clear All"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* MAIN BUILD LIST */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            {!activeCategory ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-50 dark:bg-zinc-950/50 rounded-[40px] border border-zinc-200 dark:border-white/5 overflow-hidden backdrop-blur-sm shadow-sm"
              >
                <div className="divide-y divide-zinc-200 dark:divide-white/5">
                  {categories.map((cat) => {
                    const selection = selections[cat.id];
                    
                    // Compatibility Logic: Determine if a category is "Locked"
                    const isLocked = (cat.id === 'Motherboard' && !selections.CPU) || 
                                     (cat.id === 'RAM' && !selections.Motherboard);
                    
                    const lockReason = (cat.id === 'Motherboard') ? 'Select CPU First' : 'Select Motherboard First';
                    
                    return (
                      <div 
                        key={cat.id} 
                        className={`flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-6 p-6 transition-colors group relative ${selection ? 'bg-emerald-500/5' : ''} ${isLocked ? 'opacity-50 grayscale' : 'hover:bg-zinc-100 dark:hover:bg-white/[0.02]'}`}
                      >
                        {isLocked && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100/40 dark:bg-black/40 backdrop-blur-[2px] cursor-not-allowed group rounded-[40px]">
                            <div className="flex flex-col items-center gap-2">
                              <Shield size={24} className="text-zinc-400 dark:text-zinc-500 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-black/60 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/5 shadow-sm">
                                {lockReason}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start md:items-center gap-6 flex-1 min-w-0 md:min-w-[400px]">
                          <div className={`h-16 w-16 rounded-3xl flex-shrink-0 flex items-center justify-center transition-all ${selection ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' : 'bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:bg-zinc-300 dark:group-hover:bg-white/10'}`}>
                            <cat.icon size={28} strokeWidth={selection ? 2.5 : 1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{cat.label}</p>
                              <div className="group/guide relative">
                                <Info size={12} className="text-zinc-300 dark:text-zinc-700 hover:text-emerald-500 transition-colors cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 w-56 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[10px] text-zinc-500 dark:text-zinc-400 opacity-0 group-hover/guide:opacity-100 pointer-events-none transition-all z-10 shadow-xl border border-zinc-200 dark:border-white/5">
                                  <div className="font-black text-zinc-900 dark:text-white uppercase mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-2">
                                    <cat.icon size={12} className="text-emerald-500" /> 
                                    <span>Installation Guide</span>
                                  </div>
                                  
                                  {/* Case Map Diagram */}
                                  <div className="grid grid-cols-4 grid-rows-4 gap-1 h-32 mb-4 bg-zinc-50 dark:bg-black/40 rounded-lg p-2 border border-zinc-100 dark:border-white/5">
                                    <div className={`col-span-1 row-span-1 rounded-sm border border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center ${cat.id === 'Cooling' ? 'bg-emerald-500/20 border-emerald-500/50' : ''}`}></div>
                                    <div className={`col-span-2 row-span-2 rounded-sm border border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center ${cat.id === 'Motherboard' ? 'bg-emerald-500/20 border-emerald-500/50' : ''}`}>
                                      <div className={`h-4 w-4 rounded-xs border border-dashed border-zinc-200 dark:border-white/10 ${cat.id === 'CPU' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''}`}></div>
                                      <div className={`h-6 w-1 rounded-xs border border-dashed border-zinc-200 dark:border-white/10 ml-1 ${cat.id === 'RAM' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''}`}></div>
                                    </div>
                                    <div className={`col-span-1 row-span-1 rounded-sm border border-dashed border-zinc-200 dark:border-white/10 ${cat.id === 'Cooling' ? 'bg-emerald-500/20 border-emerald-500/50' : ''}`}></div>
                                    <div className="col-span-1 row-span-1"></div>
                                    <div className={`col-span-3 row-span-1 rounded-sm border border-dashed border-zinc-200 dark:border-white/10 mt-1 flex items-center justify-center ${cat.id === 'GPU' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-emerald-500/50' : ''}`}></div>
                                    <div className={`col-span-2 row-span-1 rounded-sm border border-dashed border-zinc-200 dark:border-white/10 mt-1 ${cat.id === 'PSU' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-emerald-500/50' : ''}`}></div>
                                    <div className={`col-span-1 row-span-1 rounded-sm border border-dashed border-zinc-200 dark:border-white/10 mt-1 ml-1 ${cat.id === 'Storage' ? 'bg-emerald-500/20 border-emerald-500/50' : ''}`}></div>
                                  </div>

                                  <p className="leading-relaxed leading-tight text-zinc-600 dark:text-white/70 italic">
                                    {cat.guide}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {selection ? (
                              <div className="flex items-start md:items-center gap-3 flex-wrap">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white break-words leading-tight">{selection.name}</h3>
                                <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-[10px] font-black shrink-0">ACTIVE</div>
                              </div>
                            ) : (
                              <h3 className="text-lg font-bold text-zinc-300 dark:text-white/20 italic tracking-tight uppercase">NOT SELECTED</h3>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-zinc-100 dark:border-white/5 pt-4 md:pt-0 mt-4 md:mt-0 ml-auto transition-all">
                          {selection && (
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-500 italic tracking-tighter">
                              ₱{selection.price.toLocaleString()}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                             {selection && (
                               <button 
                                 onClick={() => removeItem(cat.id)}
                                 className="h-12 w-12 rounded-2xl flex items-center justify-center bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                               >
                                 <X size={20} />
                               </button>
                             )}
                             <button
                               onClick={() => setActiveCategory(cat.id)}
                               className={`h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${selection ? 'bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10' : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'}`}
                             >
                               {selection ? 'CHANGE' : 'SELECT'}
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white dark:bg-zinc-950/50 rounded-[40px] border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm"
              >
                <div className="p-8 border-b border-zinc-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50 dark:bg-zinc-900/50">
                   <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setActiveCategory(null)}
                        className="h-14 w-14 rounded-2xl flex items-center justify-center bg-zinc-200 dark:bg-white/5 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-white/10 transition-colors shadow-sm"
                      >
                        <ArrowLeft size={24} />
                      </button>
                      <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none mb-1">SELECT {activeCategory}</h2>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Choose compatible hardware</p>
                      </div>
                   </div>
                   <div className="relative w-full md:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                      <input 
                        type="text"
                        placeholder="Search parts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl pl-12 pr-6 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold shadow-inner"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 max-h-[700px] overflow-y-auto scrollbar-hide min-h-[300px]">
                  {getAvailableItems(activeCategory!).length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-20 text-center">
                      <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-zinc-500 mb-6">
                        <Box size={40} className="opacity-20" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-400 dark:text-white mb-2 italic uppercase">No Compatible Parts Found</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-xs mx-auto">
                        We couldn't find any compatible {activeCategory} items for your current selection. 
                        Try changing your CPU or Motherboard to see more options.
                      </p>
                    </div>
                  ) : getAvailableItems(activeCategory!).map((item) => {
                    const isSelected = selections[activeCategory] === item;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemSelect(activeCategory, item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleItemSelect(activeCategory, item);
                          }
                        }}
                        className={`group relative flex items-center gap-6 p-6 rounded-[32px] border transition-all text-left cursor-pointer ${isSelected ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-white/[0.03] shadow-sm'}`}
                      >
                        <div className="h-24 w-24 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-black/20 flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                           <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold leading-tight mb-1 truncate">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                             {item.socket && (
                               <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'bg-black/20 text-black' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'}`}>
                                 {item.socket}
                               </span>
                             )}
                             {item.ramType && (
                               <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'bg-black/20 text-black' : 'bg-blue-500/10 text-blue-600 dark:text-blue-500'}`}>
                                 {item.ramType}
                               </span>
                             )}
                          </div>
                          <p className={`text-xs mb-3 line-clamp-1 italic ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>{item.description}</p>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <p className={`text-xl font-black tracking-tighter italic ${isSelected ? 'text-black' : 'text-emerald-600 dark:text-emerald-500'}`}>₱{item.price.toLocaleString()}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProductForReview(item);
                                  }}
                                  className={`p-2 rounded-xl border transition-all ${isSelected ? 'bg-black/20 border-black/10 text-black hover:bg-black/30' : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-emerald-500 hover:bg-emerald-500 hover:text-black hover:border-emerald-500'}`}
                                >
                                  <Star size={14} className="fill-current" />
                                </button>
                             </div>
                             {isSelected && <CheckCircle2 size={24} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR SUMMARY */}
        <div className="lg:col-span-4 sticky top-28">
           <div className="bg-white dark:bg-zinc-950/50 rounded-[40px] border border-zinc-200 dark:border-white/5 p-8 backdrop-blur-xl shadow-lg transition-colors duration-300">
             <div className="mb-8">
               <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white mb-2">BUILD SUMMARY</h2>
               <div className="h-1 w-12 bg-emerald-500 rounded-full" />
             </div>

             <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10">
               {categories.map(cat => {
                 const selection = selections[cat.id];
                 if (!selection) return null;
                 return (
                    <div key={cat.id} className="flex items-center justify-between gap-4 py-2 group">
                      <div className="flex items-center gap-3 min-w-0">
                         <cat.icon size={14} className="text-emerald-500 flex-shrink-0" />
                         <div className="flex flex-col min-w-0">
                           <span className="text-xs font-bold text-zinc-700 dark:text-white/60 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{selection.name}</span>
                           <span className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-600">
                              {selection.socket || selection.ramType || ''}
                           </span>
                         </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 italic whitespace-nowrap">₱{selection.price.toLocaleString()}</span>
                    </div>
                 );
               })}
             </div>

             <div className="space-y-6 pt-8 border-t border-zinc-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase text-[10px] tracking-widest">Grand Total</span>
                  <p className="text-4xl font-black italic tracking-tighter text-zinc-900 dark:text-white leading-none">₱{totalPrice.toLocaleString()}</p>
                </div>
                
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  disabled={totalPrice === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-black font-black py-6 rounded-[32px] text-lg italic tracking-tighter shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} />
                  ORDER THIS BUILD
                </button>

                <p className="text-[10px] text-zinc-500 dark:text-zinc-600 text-center font-bold px-4 leading-relaxed uppercase tracking-widest">
                  Shipping and taxes calculated at checkout. COMPATIBILITY AUTOMATICALLY VERIFIED.
                </p>
             </div>
           </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 w-full max-w-sm md:max-w-md shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">CHECKOUT</h2>
                   <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">Complete your order</p>
                </div>
                <button onClick={() => setIsCheckoutModalOpen(false)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                <div className="space-y-6">
                  <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 block border-b border-white/5 pb-4">Recipient Details</label>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Full Name</label>
                        <input
                          type="text"
                          value={shippingAddress.fullName}
                          onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Mobile number</label>
                        <input
                          type="text"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
                          placeholder="0917 XXX XXXX"
                        />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Complete Address</label>
                         <textarea
                           value={shippingAddress.street}
                           onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 h-24 resize-none"
                           placeholder="House number, street, barangay..."
                         />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 block border-b border-white/5 pb-4">Payment Selection</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'gcash', label: 'GCash', icon: Wallet },
                        { id: 'paymaya', label: 'Maya', icon: Wallet },
                        { id: 'visa', label: 'Visa/Debit', icon: CreditCard },
                        { id: 'bank_transfer', label: 'Bank', icon: Landmark }
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            paymentMethod === method.id ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                          }`}
                        >
                          <method.icon size={16} />
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end mb-8 bg-zinc-950 p-6 rounded-[32px] border border-white/5 shadow-inner">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total to Pay</p>
                        <span className="text-2xl font-black italic tracking-tighter text-white leading-none">₱{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/20 uppercase tracking-[0.2em]">FREE SHIPPING</div>
                  </div>

                  {checkoutSuccess ? (
                    <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-[32px] p-6 text-center text-emerald-500">
                      <div className="mb-4 flex justify-center">
                         <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                            <CheckCircle2 size={32} />
                         </div>
                      </div>
                      <p className="font-black italic text-xl uppercase tracking-tighter">ORDER PLACED!</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Wait for our confirmation call.</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-black font-black py-6 rounded-[32px] transition-all flex items-center justify-center gap-3 text-lg italic tracking-tighter shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95"
                    >
                      {isCheckingOut ? (
                        <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CreditCard size={20} />
                          CONFIRM ORDER
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedProductForReview && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForReview(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-white/10 rounded-[40px] z-[120] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden bg-black/20">
                    <img src={selectedProductForReview.image} alt={selectedProductForReview.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none mb-1">{selectedProductForReview.name}</h2>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Product Reviews</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProductForReview(null)}
                  className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <ReviewSystem 
                  productId={selectedProductForReview.id} 
                  productName={selectedProductForReview.name} 
                />
              </div>
              <div className="p-8 bg-zinc-900/80 border-t border-white/5">
                <button
                  onClick={() => {
                    handleItemSelect(activeCategory as any, selectedProductForReview);
                    setSelectedProductForReview(null);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-3xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] uppercase tracking-tighter italic text-lg"
                >
                  Select this component
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
