import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { FlashSale } from '../types';
import { Zap, Timer, X } from 'lucide-react';

export default function AnnouncementBar() {
  const [activeSale, setActiveSale] = useState<FlashSale | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'sales'),
      where('isActive', '==', true),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const sale = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FlashSale;
        setActiveSale(sale);
        setIsVisible(true);
      } else {
        setActiveSale(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!activeSale || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-emerald-500 text-black overflow-hidden relative z-[60]"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-6 relative">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Zap size={16} fill="currentColor" />
            </motion.div>
            <span className="text-xs font-black uppercase tracking-widest italic">
              FLASH SALE DETECTED:
            </span>
          </div>
          
          <p className="text-sm font-black italic uppercase tracking-tighter truncate max-w-2xl">
            {activeSale.message}
          </p>

          <div className="hidden md:flex items-center gap-4 border-l border-black/20 pl-6">
            <div className="flex items-center gap-2">
              <Timer size={14} />
              <span className="text-[10px] font-black uppercase tracking-tight">Limited Time Offer</span>
            </div>
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            className="absolute right-4 p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
