import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Order, Product } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { Package, Truck, CheckCircle2, Clock, MapPin, Receipt, ChevronDown, ChevronUp } from 'lucide-react';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="text-zinc-400" size={16} />;
      case 'processing': return <Package className="text-amber-500 animate-pulse" size={16} />;
      case 'shipped': return <Truck className="text-blue-500" size={16} />;
      case 'delivered': return <CheckCircle2 className="text-emerald-500" size={16} />;
      default: return <Clock className="text-zinc-400" size={16} />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'processing': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Receipt className="mx-auto h-16 w-16 text-white/10 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Sign in to track your orders</h2>
        <p className="text-white/40">Your purchase history and shipping updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Order Tracking</h1>
          <p className="text-white/40 mt-1">Track your hardware deliveries and purchase history</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
          <span className="text-emerald-500 font-bold">{orders.length} Orders</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/40 text-sm animate-pulse">Syncing with logistics...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
          <Receipt className="mx-auto h-16 w-16 text-white/10 mb-6" />
          <h2 className="text-xl font-bold mb-2">No orders yet</h2>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">Once you purchase a build or component, you can track its delivery status right here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900/50 border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden transition-all group"
              >
                {/* Order Header / Summary View */}
                <div 
                  className="p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      getStatusColor(order.status)
                    )}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-mono text-white/30 tracking-widest uppercase">#{order.id.slice(0, 8)}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border",
                          getStatusColor(order.status)
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                        <span className="text-white/10 text-sm font-normal">•</span>
                        <span className="text-emerald-500">₱{order.totalPrice.toLocaleString()}</span>
                      </h3>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Shipping Progress Bar */}
                  <div className="hidden lg:flex flex-1 max-w-md mx-8 items-center gap-4">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(getStepProgress(order.status) / 4) * 100}%` }}
                        className="absolute h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      {[1, 2, 3, 4].map((step) => (
                        <div 
                          key={step} 
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-500",
                            getStepProgress(order.status) >= step ? "bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,1)]" : "bg-white/10"
                          )} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                    <div className="text-left lg:text-right">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Method</p>
                        <p className="text-xs font-bold text-white/60 uppercase">{order.paymentMethod.replace('_', ' ')}</p>
                    </div>
                    {expandedOrder === order.id ? <ChevronUp className="text-white/20" /> : <ChevronDown className="text-white/20" />}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-8 border-t border-white/5 bg-black/40 space-y-8">
                        {/* Status Timeline */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className={cn("p-4 rounded-2xl border transition-all", getStepProgress(order.status) >= 1 ? "bg-white/5 border-white/10 opacity-100" : "opacity-30 border-transparent")}>
                             <Clock size={18} className={getStepProgress(order.status) >= 1 ? "text-white/60 mb-3" : "text-white/20 mb-3"} />
                             <p className="text-[10px] font-black uppercase text-white/40 mb-1">Step 01</p>
                             <p className="text-xs font-bold text-white">Pending</p>
                           </div>
                           <div className={cn("p-4 rounded-2xl border transition-all", getStepProgress(order.status) >= 2 ? "bg-amber-500/5 border-amber-500/20 opacity-100" : "opacity-30 border-transparent")}>
                             <Package size={18} className={getStepProgress(order.status) >= 2 ? "text-amber-500 mb-3" : "text-white/20 mb-3"} />
                             <p className="text-[10px] font-black uppercase text-white/40 mb-1">Step 02</p>
                             <p className="text-xs font-bold text-white">Processing</p>
                           </div>
                           <div className={cn("p-4 rounded-2xl border transition-all", getStepProgress(order.status) >= 3 ? "bg-blue-500/5 border-blue-500/20 opacity-100" : "opacity-30 border-transparent")}>
                             <Truck size={18} className={getStepProgress(order.status) >= 3 ? "text-blue-500 mb-3" : "text-white/20 mb-3"} />
                             <p className="text-[10px] font-black uppercase text-white/40 mb-1">Step 03</p>
                             <p className="text-xs font-bold text-white">Shipped</p>
                           </div>
                           <div className={cn("p-4 rounded-2xl border transition-all", getStepProgress(order.status) >= 4 ? "bg-emerald-500/5 border-emerald-500/20 opacity-100" : "opacity-30 border-transparent")}>
                             <CheckCircle2 size={18} className={getStepProgress(order.status) >= 4 ? "text-emerald-500 mb-3" : "text-white/20 mb-3"} />
                             <p className="text-[10px] font-black uppercase text-white/40 mb-1">Step 04</p>
                             <p className="text-xs font-bold text-white">Delivered</p>
                           </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                          {/* Shipping Info */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                                <MapPin size={12} className="text-emerald-500" />
                                <span>Shipping Destination</span>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                              <p className="text-sm font-bold text-white mb-1">{order.shippingAddress.fullName}</p>
                              <p className="text-xs text-white/60 mb-3">{order.shippingAddress.phone}</p>
                              <p className="text-sm text-white/80 leading-relaxed">
                                {order.shippingAddress.street}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.province}<br />
                                {order.shippingAddress.zipCode}
                              </p>
                            </div>
                          </div>

                          {/* Item List */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                                <Receipt size={12} className="text-emerald-500" />
                                <span>Order Summary</span>
                            </div>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-black" referrerPolicy="no-referrer" />
                                    <p className="text-xs font-bold text-zinc-300 truncate">{item.name}</p>
                                  </div>
                                  <p className="text-xs font-black text-emerald-500 ml-4 shrink-0">₱{item.price.toLocaleString()}</p>
                                </div>
                              ))}
                              <div className="pt-4 flex justify-between items-end">
                                <div>
                                  <p className="text-[9px] font-black text-white/20 uppercase tracking-wider">Subtotal</p>
                                  <p className="text-sm font-bold text-white/60">₱{order.totalPrice.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">Total Paid</p>
                                  <p className="text-2xl font-black text-emerald-500 tracking-tighter shadow-emerald-500/20">₱{order.totalPrice.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
