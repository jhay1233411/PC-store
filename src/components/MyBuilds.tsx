import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { PCBuild, Product } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { Hammer, Trash2, Calendar, ShoppingCart, Cpu, Monitor, HardDrive, Layout, Zap, Box, Wind, Package } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  CPU: Cpu,
  Motherboard: Layout,
  RAM: Box,
  GPU: Monitor,
  Storage: HardDrive,
  PSU: Zap,
  Case: Box,
  Cooling: Wind
};

interface MyBuildsProps {
  onEdit?: (build: PCBuild) => void;
}

export default function MyBuilds({ onEdit }: MyBuildsProps) {
  const { user } = useAuth();
  const [builds, setBuilds] = useState<PCBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'pc_builds'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBuilds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PCBuild)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'pc_builds');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteBuild = async (buildId: string) => {
    try {
      await deleteDoc(doc(db, 'pc_builds', buildId));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting build:', error);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Hammer className="mx-auto h-16 w-16 text-zinc-300 dark:text-white/10 mb-6" />
        <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Sign in to see your builds</h2>
        <p className="text-zinc-500 dark:text-white/40">Your saved PC configurations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Saved Builds</h1>
          <p className="text-zinc-500 dark:text-white/40 mt-1">Manage and view your custom PC configurations</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
          <span className="text-emerald-600 dark:text-emerald-500 font-bold">{builds.length} Builds</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : builds.length === 0 ? (
        <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-3xl p-12 text-center">
          <Hammer className="mx-auto h-16 w-16 text-zinc-300 dark:text-white/10 mb-6" />
          <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">No builds saved yet</h2>
          <p className="text-zinc-500 dark:text-white/40 mb-8">Start building your dream PC in the PC Builder!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {builds.map((build) => (
              <motion.div
                key={build.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group shadow-sm dark:shadow-none"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {build.name}
                    </h2>
                    <div className="flex items-center gap-2 text-zinc-400 dark:text-white/40 text-xs mt-1">
                      <Calendar size={12} />
                      {new Date(build.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deletingId === build.id ? (
                      <div className="flex items-center gap-2 bg-red-500/10 p-1 rounded-lg border border-red-500/20">
                        <span className="text-[10px] font-bold text-red-500 px-2">Delete?</span>
                        <button
                          onClick={() => handleDeleteBuild(build.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-2 py-1 rounded text-[10px] font-bold transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white px-2 py-1 text-[10px] font-bold transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(build.id)}
                        className="p-2 text-zinc-300 dark:text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  {Object.entries(build.components).map(([category, product]) => {
                    const Icon = CATEGORY_ICONS[category as string] || Package;
                    return (
                      <div key={category} className="bg-zinc-50 dark:bg-black/40 border border-zinc-100 dark:border-white/5 rounded-xl p-2 flex flex-col items-center text-center">
                        <Icon size={14} className="text-emerald-600 dark:text-emerald-500 mb-1" />
                        <span className="text-[8px] uppercase font-black text-zinc-400 dark:text-white/30 truncate w-full">{category}</span>
                        <span className="text-[10px] text-zinc-900 dark:text-white/80 truncate w-full font-bold">{(product as Product).name}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-white/10">
                  <div>
                    <p className="text-[10px] uppercase font-black text-zinc-400 dark:text-white/40">Total Value</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-500">₱{build.totalPrice.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit?.(build)}
                      className="bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                    >
                      <Hammer size={16} />
                      Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
