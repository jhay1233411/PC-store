import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDocs,
  where,
  addDoc
} from 'firebase/firestore';
import { Order, UserProfile, Product, FlashSale, PreBuiltPC } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { 
  ShoppingBag, 
  Users, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  Shield,
  User as UserIcon,
  Search,
  Filter,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  Tag,
  Info,
  Pencil,
  Zap,
  PowerOff,
  Loader2,
  Monitor,
  Cpu
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'products' | 'sales' | 'prebuilts'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [prebuilts, setPrebuilts] = useState<PreBuiltPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddPreBuiltModalOpen, setIsAddPreBuiltModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isEditPreBuiltModalOpen, setIsEditPreBuiltModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPreBuilt, setEditingPreBuilt] = useState<PreBuiltPC | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: undefined,
    category: 'GPU',
    image: '',
    description: '',
    stock: undefined,
    socket: '',
    ramType: undefined,
    wattage: undefined
  });
  const [newPreBuilt, setNewPreBuilt] = useState<Partial<PreBuiltPC>>({
    name: '',
    tier: 'Mid',
    price: undefined,
    image: '',
    specs: {
      cpu: '',
      gpu: '',
      ram: '',
      storage: '',
      monitor: '',
      peripherals: ''
    },
    features: []
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [newSale, setNewSale] = useState<Partial<FlashSale>>({ 
    message: '', 
    isActive: true,
    discountPercentage: 0,
    productIds: []
  });

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      setLoading(false);
      return;
    }

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    const qProducts = query(collection(db, 'products'), orderBy('category', 'asc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    if (profile.role === 'owner' || profile.role === 'admin') {
      const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });

      const qSales = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
      const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashSale)));
      });

      const qPrebuilts = query(collection(db, 'prebuilts'), orderBy('createdAt', 'desc'));
      const unsubscribePrebuilts = onSnapshot(qPrebuilts, (snapshot) => {
        setPrebuilts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreBuiltPC)));
      });

      return () => {
        unsubscribeOrders();
        unsubscribeProducts();
        unsubscribeUsers();
        unsubscribeSales();
        unsubscribePrebuilts();
      };
    }

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, [profile]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const updateUserRole = async (userId: string, role: UserProfile['role']) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: new Date().toISOString()
      });
      setIsAddProductModalOpen(false);
      setNewProduct({
        name: '',
        price: undefined,
        category: 'GPU',
        image: '',
        description: '',
        stock: undefined,
        socket: '',
        ramType: undefined,
        wattage: undefined
      });
      alert('Product added successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      const { id, ...data } = editingProduct;
      await updateDoc(doc(db, 'products', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
      alert('Product updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${editingProduct.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'users'), where('email', '==', adminEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert('User not found with this email.');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
      setIsAddAdminModalOpen(false);
      setAdminEmail('');
      alert('User promoted to Admin successfully!');
    } catch (error) {
      console.error('Error adding admin:', error);
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSale.message) return;
    setIsSubmitting(true);
    try {
      // Deactivate all other sales first for simplicity (one active at a time)
      const activeSalesQuery = query(collection(db, 'sales'), where('isActive', '==', true));
      const activeSalesSnapshot = await getDocs(activeSalesQuery);
      const deactivationPromises = activeSalesSnapshot.docs.map(d => 
        updateDoc(doc(db, 'sales', d.id), { isActive: false })
      );
      await Promise.all(deactivationPromises);

      await addDoc(collection(db, 'sales'), {
        ...newSale,
        createdAt: new Date().toISOString()
      });
      setNewSale({ message: '', isActive: true, discountPercentage: 0, productIds: [] });
      alert('Flash Sale announced successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSaleStatus = async (saleId: string, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        // If activating, deactivate others
        const activeSalesQuery = query(collection(db, 'sales'), where('isActive', '==', true));
        const activeSalesSnapshot = await getDocs(activeSalesQuery);
        const deactivationPromises = activeSalesSnapshot.docs.map(d => 
          updateDoc(doc(db, 'sales', d.id), { isActive: false })
        );
        await Promise.all(deactivationPromises);
      }
      await updateDoc(doc(db, 'sales', saleId), { isActive: !currentStatus });
    } catch (error) {
      console.error('Error toggling sale:', error);
    }
  };

  const deleteSale = async (saleId: string) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await deleteDoc(doc(db, 'sales', saleId));
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const handleAddPreBuilt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'prebuilts'), {
        ...newPreBuilt,
        createdAt: new Date().toISOString()
      });
      setIsAddPreBuiltModalOpen(false);
      setNewPreBuilt({
        name: '',
        tier: 'Mid',
        price: undefined,
        image: '',
        specs: { cpu: '', gpu: '', ram: '', storage: '', monitor: '', peripherals: '' },
        features: []
      });
      alert('Pre-Built PC added successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'prebuilts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePreBuilt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreBuilt) return;
    setIsSubmitting(true);
    try {
      const { id, ...data } = editingPreBuilt;
      await updateDoc(doc(db, 'prebuilts', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setIsEditPreBuiltModalOpen(false);
      setEditingPreBuilt(null);
      alert('Pre-Built PC updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prebuilts/${editingPreBuilt.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePreBuilt = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Pre-Built PC?')) {
      try {
        await deleteDoc(doc(db, 'prebuilts', id));
      } catch (error) {
        console.error('Error deleting prebuilt:', error);
      }
    }
  };

  const renderOrders = () => (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 dark:text-white/40">No orders found</div>
      ) : (
        orders.map(order => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all shadow-sm"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-zinc-400 dark:text-white/40">#{order.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' :
                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-500' :
                    order.status === 'processing' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-500' :
                    'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-white/60'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white">{order.userName || order.userEmail}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-zinc-500 dark:text-white/40">{order.userEmail}</p>
                  <span className="text-zinc-200 dark:text-white/20">•</span>
                  <p className="text-sm text-zinc-500 dark:text-white/40">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <span className="text-zinc-200 dark:text-white/20">•</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                    {order.paymentMethod?.replace('_', ' ') || 'GCash'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500">₱{order.totalPrice.toLocaleString()}</p>
                <div className="flex gap-2 mt-3 justify-end">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold shadow-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-white/5 space-y-6">
              {order.shippingAddress && (
                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-zinc-100 dark:border-white/5 shadow-sm">
                  <h4 className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-wider mb-2">Delivery Address</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div>
                      <p className="text-[10px] text-zinc-300 dark:text-white/20 uppercase font-black">Recipient</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{order.shippingAddress.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-300 dark:text-white/20 uppercase font-black">Contact</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{order.shippingAddress.phone ?? 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-zinc-300 dark:text-white/20 uppercase font-black">Address</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white leading-relaxed">
                        {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-zinc-100 dark:bg-white/5 rounded-xl">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-white dark:bg-black" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black">₱{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">User Management</h2>
        {profile?.role === 'owner' && (
          <button
            onClick={() => setIsAddAdminModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Shield size={18} />
            Add Admin
          </button>
        )}
      </div>

      <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-100 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-white/40">User</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-white/40">Role</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-white/40">Joined</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">{user.displayName}</p>
                      <p className="text-xs text-zinc-500 dark:text-white/40">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    user.role === 'owner' ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.1)]' :
                    user.role === 'admin' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.1)]' :
                    'bg-zinc-200/50 dark:bg-white/10 border-transparent text-zinc-600 dark:text-white/60'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500 dark:text-white/40 font-medium">
                  {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-right">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.uid, e.target.value as UserProfile['role'])}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-bold shadow-sm"
                    disabled={user.uid === profile?.uid || profile?.role !== 'owner'}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Product Inventory</h2>
        <button
          onClick={() => setIsAddProductModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-sm font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 italic uppercase tracking-tighter"
        >
          <Plus size={18} strokeWidth={3} />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-3xl p-5 flex gap-5 items-center hover:border-emerald-500/30 transition-all group shadow-sm"
          >
            <div className="relative shrink-0">
               <img src={product.image} alt={product.name} className="w-20 h-20 rounded-2xl object-cover bg-white dark:bg-black group-hover:scale-105 transition-transform shadow-sm" referrerPolicy="no-referrer" />
               <div className="absolute -top-2 -right-2 bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-lg italic">
                  {product.category}
               </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white truncate mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors uppercase italic tracking-tight">{product.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${ (product.stock ?? 10) > 0 ? 'bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-white/40' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {product.stock ?? 10} IN STOCK
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {(product.socket || product.ramType || product.wattage) && (
                  <>
                    {product.socket && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter border border-emerald-500/10">
                        {product.socket}
                      </span>
                    )}
                    {product.ramType && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tighter border border-blue-500/10">
                        {product.ramType}
                      </span>
                    )}
                    {product.wattage && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter border border-amber-500/10">
                        {product.wattage}W
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-500 italic tracking-tighter shadow-emerald-500/10 drop-shadow-sm">₱{product.price.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setIsEditProductModalOpen(true);
                }}
                className="p-2.5 rounded-2xl bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-sm"
                title="Edit Product"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => deleteProduct(product.id!)}
                className="p-2.5 rounded-2xl bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-sm"
                title="Delete Product"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Flash Sale Management</h2>
      </div>

      <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] p-8">
        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-6">Announce New Flash Sale</h3>
        <form onSubmit={handleCreateSale} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <Zap className="absolute left-4 top-4 text-emerald-500" size={20} />
                <textarea
                  value={newSale.message}
                  onChange={e => setNewSale({...newSale, message: e.target.value})}
                  placeholder="e.g. 50% OFF ON ALL RTX 5090 CARDS! VALID UNTIL MIDNIGHT!"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all h-24 resize-none font-black italic tracking-tight placeholder:font-normal placeholder:italic uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Discount Percentage (%)</label>
                <input 
                  type="number"
                  value={newSale.discountPercentage || ''}
                  onChange={e => setNewSale({...newSale, discountPercentage: Number(e.target.value)})}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white font-black"
                  placeholder="20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Select Products for Sale</label>
              <div className="max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 space-y-2 custom-scrollbar">
                {products.map(prod => (
                  <label key={prod.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={newSale.productIds?.includes(prod.id)}
                      onChange={e => {
                        const ids = newSale.productIds || [];
                        if (e.target.checked) {
                          setNewSale({...newSale, productIds: [...ids, prod.id]});
                        } else {
                          setNewSale({...newSale, productIds: ids.filter(id => id !== prod.id)});
                        }
                      }}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-emerald-500 transition-all"
                    />
                    <span className="text-sm font-bold text-zinc-600 dark:text-white group-hover:text-emerald-500 transition-colors uppercase italic truncate">
                      {prod.name}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
                {newSale.productIds?.length || 0} Products Selected
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newSale.message}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 italic uppercase tracking-tighter flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
            Broadcast Flash Sale
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] px-4">Previous Announcements</h3>
        {sales.map(sale => (
          <div 
            key={sale.id}
            className={`p-6 rounded-2xl border transition-all flex items-center justify-between gap-6 ${sale.isActive ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 grayscale opacity-60'}`}
          >
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-3 mb-2">
                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${sale.isActive ? 'bg-emerald-500 text-black animate-pulse' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-white/40'}`}>
                    {sale.isActive ? 'LIVE BROADCASTING' : 'INACTIVE'}
                 </span>
                 <span className="text-[10px] text-zinc-400 font-bold">{new Date(sale.createdAt).toLocaleString()}</span>
               </div>
               <p className="font-black italic uppercase tracking-tight text-zinc-900 dark:text-white line-clamp-2">{sale.message}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSaleStatus(sale.id, sale.isActive)}
                className={`p-3 rounded-xl transition-all ${sale.isActive ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}
                title={sale.isActive ? 'Deactivate' : 'Activate'}
              >
                {sale.isActive ? <PowerOff size={18} /> : <Zap size={18} fill="currentColor" />}
              </button>
              <button
                onClick={() => deleteSale(sale.id)}
                className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrebuilts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Pre-Built PC Management</h2>
        <button
          onClick={() => setIsAddPreBuiltModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-sm font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 italic uppercase tracking-tighter"
        >
          <Monitor size={18} />
          Add Pre-Built
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prebuilts.map(pc => (
          <motion.div
            key={pc.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] overflow-hidden hover:border-emerald-500/30 transition-all group shadow-sm flex flex-col"
          >
            <div className="aspect-video relative overflow-hidden">
               <img src={pc.image} alt={pc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
               <div className="absolute top-4 right-4 flex gap-2">
                 <button 
                   onClick={() => { setEditingPreBuilt(pc); setIsEditPreBuiltModalOpen(true); }}
                   className="p-2 rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-emerald-500 hover:text-black transition-all"
                 >
                   <Pencil size={16} />
                 </button>
                 <button 
                   onClick={() => deletePreBuilt(pc.id)}
                   className="p-2 rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-red-500 transition-all"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
            </div>
            <div className="p-6 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">{pc.tier}</span>
                <span className="text-xl font-black text-zinc-900 dark:text-white truncate italic">{pc.name}</span>
              </div>
              <p className="text-2xl font-black text-emerald-500 mb-4">₱{pc.price.toLocaleString()}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 dark:text-white/40 font-bold uppercase tracking-tight">
                 <div className="flex items-center gap-1"><Cpu size={10} /> {pc.specs.cpu.split(' ').slice(0, 3).join(' ')}</div>
                 <div className="flex items-center gap-1"><Zap size={10} /> {pc.specs.gpu.split(' ').slice(0, 3).join(' ')}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs italic">Syncing Store Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-zinc-500 dark:text-white/40">Manage your store, orders, and users from one place.</p>
        </div>
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'orders' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag size={18} />
            Orders
          </button>
          {(profile?.role === 'owner' || profile?.role === 'admin') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'users' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Users size={18} />
              Users
            </button>
          )}
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'products' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Package size={18} />
            Products
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sales' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Zap size={18} />
            Sales
          </button>
          <button
            onClick={() => setActiveTab('prebuilts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'prebuilts' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Monitor size={18} />
            Pre-Builts
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'prebuilts' && renderPrebuilts()}
        </motion.div>
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Add New Product</h2>
                <button onClick={() => setIsAddProductModalOpen(false)} className="text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white uppercase font-black text-[10px] flex items-center gap-2">
                  <XCircle size={20} />
                  Close
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Product Name</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                    <input
                      required
                      type="text"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                      placeholder="e.g. NVIDIA RTX 4090"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Price (₱)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20 font-black">₱</span>
                      <input
                        required
                        type="number"
                        value={newProduct.price ?? ''}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner font-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Stock</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                      <input
                        required
                        type="number"
                        value={newProduct.stock ?? ''}
                        onChange={e => setNewProduct({...newProduct, stock: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner font-black"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                      <select
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none font-bold"
                      >
                       <option value="CPU">CPU</option>
                       <option value="GPU">GPU</option>
                       <option value="RAM">RAM</option>
                       <option value="Storage">Storage</option>
                       <option value="Motherboard">Motherboard</option>
                       <option value="PSU">PSU</option>
                       <option value="Case">Case</option>
                       <option value="Cooling">Cooling</option>
                       <option value="Monitor">Monitor</option>
                       <option value="Mouse">Mouse</option>
                       <option value="Keyboard">Keyboard</option>
                       <option value="Headset">Headset</option>
                      </select>
                    </div>
                  </div>

                {/* Compatibility Fields */}
                {(newProduct.category === 'CPU' || newProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Socket (Compatibility)</label>
                    <select
                      value={newProduct.socket || ''}
                      onChange={e => setNewProduct({...newProduct, socket: e.target.value})}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    >
                      <option value="">Select Socket</option>
                      <optgroup label="Intel" className="text-zinc-400">
                        <option value="LGA1851" className="text-zinc-900 dark:text-white">LGA1851 (Core Ultra 200S)</option>
                        <option value="LGA1700" className="text-zinc-900 dark:text-white">LGA1700 (12th/13th/14th Gen)</option>
                        <option value="LGA1200" className="text-zinc-900 dark:text-white">LGA1200 (10th/11th Gen)</option>
                        <option value="LGA1151" className="text-zinc-900 dark:text-white">LGA1151 (6th-9th Gen)</option>
                        <option value="LGA1150" className="text-zinc-900 dark:text-white">LGA1150 (4th Gen)</option>
                        <option value="LGA1155" className="text-zinc-900 dark:text-white">LGA1155 (2nd/3rd Gen)</option>
                        <option value="LGA2066" className="text-zinc-900 dark:text-white">LGA2066 (X299)</option>
                      </optgroup>
                      <optgroup label="AMD" className="text-zinc-400">
                        <option value="AM5" className="text-zinc-900 dark:text-white">AM5 (Ryzen 7000/8000/9000)</option>
                        <option value="AM4" className="text-zinc-900 dark:text-white">AM4 (Ryzen 1000-5000)</option>
                        <option value="AM3+" className="text-zinc-900 dark:text-white">AM3+ (FX Series)</option>
                        <option value="sTR5" className="text-zinc-900 dark:text-white">sTR5 (Threadripper 7000)</option>
                        <option value="sWRX8" className="text-zinc-900 dark:text-white">sWRX8 (Threadripper Pro)</option>
                        <option value="TR4" className="text-zinc-900 dark:text-white">TR4 (Threadripper 1000/2000)</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {(newProduct.category === 'RAM' || newProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">RAM Type</label>
                    <select
                      value={newProduct.ramType || ''}
                      onChange={e => setNewProduct({...newProduct, ramType: e.target.value as any || undefined})}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    >
                      <option value="">Select RAM Type</option>
                      <option value="DDR4">DDR4 (Previous Gen / Value)</option>
                      <option value="DDR5">DDR5 (Next Gen / Performance)</option>
                    </select>
                  </div>
                )}

                {newProduct.category === 'PSU' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Wattage</label>
                    <input
                      type="number"
                      value={newProduct.wattage || ''}
                      onChange={e => setNewProduct({...newProduct, wattage: Number(e.target.value) || undefined})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold no-spinner"
                      placeholder="e.g. 750"
                    />
                  </div>
                )}

                {(newProduct.category === 'Storage' || newProduct.category === 'RAM') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Capacity / Size</label>
                    <select
                      value={newProduct.capacity || ''}
                      onChange={e => setNewProduct({...newProduct, capacity: e.target.value})}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    >
                      <option value="">Select Capacity</option>
                      <option value="120GB">120GB</option>
                      <option value="240GB">240GB</option>
                      <option value="250GB">250GB</option>
                      <option value="480GB">480GB</option>
                      <option value="500GB">500GB</option>
                      <option value="1TB">1TB</option>
                      <option value="2TB">2TB</option>
                      <option value="4TB">4TB</option>
                      <option value="8TB">8TB</option>
                      <option value="8GB">8GB (RAM)</option>
                      <option value="16GB">16GB (RAM)</option>
                      <option value="32GB">32GB (RAM)</option>
                      <option value="64GB">64GB (RAM)</option>
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                    <input
                      required
                      type="url"
                      value={newProduct.image}
                      onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isHighlyRecommended"
                    checked={newProduct.isHighlyRecommended || false}
                    onChange={e => setNewProduct({...newProduct, isHighlyRecommended: e.target.checked})}
                    className="w-5 h-5 accent-emerald-500"
                  />
                  <label htmlFor="isHighlyRecommended" className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest cursor-pointer">
                    Highly Recommended Component
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Description</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-zinc-300 dark:text-white/20" size={18} />
                    <textarea
                      required
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all h-24 resize-none font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                      placeholder="Product details..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-4 rounded-xl transition-all mt-4 shadow-lg shadow-emerald-500/20 active:scale-95 italic uppercase tracking-tighter flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create Product'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isEditProductModalOpen && editingProduct && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Edit Product</h2>
                <button 
                  onClick={() => {
                    setIsEditProductModalOpen(false);
                    setEditingProduct(null);
                  }} 
                  className="text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white uppercase font-black text-[10px] flex items-center gap-2"
                >
                  <XCircle size={20} />
                  Close
                </button>
              </div>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Product Name</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                    <input
                      required
                      type="text"
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Price (₱)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20 font-black">₱</span>
                      <input
                        required
                        type="number"
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner font-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Stock</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                      <input
                        required
                        type="number"
                        value={editingProduct.stock ?? ''}
                        onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner font-black"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                      <select
                        value={editingProduct.category}
                        onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none font-bold"
                      >
                        <option value="CPU">CPU</option>
                        <option value="GPU">GPU</option>
                        <option value="RAM">RAM</option>
                        <option value="Storage">Storage</option>
                        <option value="Motherboard">Motherboard</option>
                        <option value="PSU">PSU</option>
                        <option value="Case">Case</option>
                        <option value="Cooling">Cooling</option>
                        <option value="Monitor">Monitor</option>
                        <option value="Mouse">Mouse</option>
                        <option value="Keyboard">Keyboard</option>
                        <option value="Headset">Headset</option>
                      </select>
                    </div>
                  </div>

                {/* Compatibility Fields for Editing */}
                {(editingProduct.category === 'CPU' || editingProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Socket (Compatibility)</label>
                    <select
                      value={editingProduct.socket || ''}
                      onChange={e => setEditingProduct({...editingProduct, socket: e.target.value})}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    >
                      <option value="">Select Socket</option>
                      <optgroup label="Intel" className="text-zinc-400">
                        <option value="LGA1851" className="text-zinc-900 dark:text-white">LGA1851 (Core Ultra 200S)</option>
                        <option value="LGA1700" className="text-zinc-900 dark:text-white">LGA1700 (12th/13th/14th Gen)</option>
                        <option value="LGA1200" className="text-zinc-900 dark:text-white">LGA1200 (10th/11th Gen)</option>
                        <option value="LGA1151" className="text-zinc-900 dark:text-white">LGA1151 (6th-9th Gen)</option>
                        <option value="LGA1150" className="text-zinc-900 dark:text-white">LGA1150 (4th Gen)</option>
                        <option value="LGA1155" className="text-zinc-900 dark:text-white">LGA1155 (2nd/3rd Gen)</option>
                        <option value="LGA2066" className="text-zinc-900 dark:text-white">LGA2066 (X299)</option>
                      </optgroup>
                      <optgroup label="AMD" className="text-zinc-400">
                        <option value="AM5" className="text-zinc-900 dark:text-white">AM5 (Ryzen 7000/8000/9000)</option>
                        <option value="AM4" className="text-zinc-900 dark:text-white">AM4 (Ryzen 1000-5000)</option>
                        <option value="AM3+" className="text-zinc-900 dark:text-white">AM3+ (FX Series)</option>
                        <option value="sTR5" className="text-zinc-900 dark:text-white">sTR5 (Threadripper 7000)</option>
                        <option value="sWRX8" className="text-zinc-900 dark:text-white">sWRX8 (Threadripper Pro)</option>
                        <option value="TR4" className="text-zinc-900 dark:text-white">TR4 (Threadripper 1000/2000)</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {(editingProduct.category === 'RAM' || editingProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">RAM Type</label>
                    <select
                      value={editingProduct.ramType || ''}
                      onChange={e => setEditingProduct({...editingProduct, ramType: e.target.value as any || undefined})}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    >
                      <option value="">Select RAM Type</option>
                      <option value="DDR4">DDR4 (Previous Gen / Value)</option>
                      <option value="DDR5">DDR5 (Next Gen / Performance)</option>
                    </select>
                  </div>
                )}

                {editingProduct.category === 'PSU' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Wattage</label>
                    <input
                      type="number"
                      value={editingProduct.wattage || ''}
                      onChange={e => setEditingProduct({...editingProduct, wattage: Number(e.target.value) || undefined})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold no-spinner"
                    />
                  </div>
                )}

                {(editingProduct.category === 'Storage' || editingProduct.category === 'RAM') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Capacity / Size</label>
                    <select
                      value={editingProduct.capacity || ''}
                      onChange={e => setEditingProduct({...editingProduct, capacity: e.target.value})}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    >
                      <option value="">Select Capacity</option>
                      <option value="120GB">120GB</option>
                      <option value="240GB">240GB</option>
                      <option value="250GB">250GB</option>
                      <option value="480GB">480GB</option>
                      <option value="500GB">500GB</option>
                      <option value="1TB">1TB</option>
                      <option value="2TB">2TB</option>
                      <option value="4TB">4TB</option>
                      <option value="8TB">8TB</option>
                      <option value="8GB">8GB (RAM)</option>
                      <option value="16GB">16GB (RAM)</option>
                      <option value="32GB">32GB (RAM)</option>
                      <option value="64GB">64GB (RAM)</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <input
                    type="checkbox"
                    id="editIsHighlyRecommended"
                    checked={editingProduct.isHighlyRecommended || false}
                    onChange={e => setEditingProduct({...editingProduct, isHighlyRecommended: e.target.checked})}
                    className="w-5 h-5 accent-emerald-500"
                  />
                  <label htmlFor="editIsHighlyRecommended" className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest cursor-pointer">
                    Highly Recommended Component
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                    <input
                      required
                      type="url"
                      value={editingProduct.image}
                      onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Description</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-zinc-300 dark:text-white/20" size={18} />
                    <textarea
                      required
                      value={editingProduct.description}
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all h-24 resize-none font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-4 rounded-xl transition-all mt-4 shadow-lg shadow-emerald-500/20 active:scale-95 italic uppercase tracking-tighter flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Update Product'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Pre-Built Modal */}
      <AnimatePresence>
        {isAddPreBuiltModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Add New Pre-Built</h2>
                <button onClick={() => setIsAddPreBuiltModalOpen(false)} className="text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white uppercase font-black text-[10px] flex items-center gap-2">
                  <XCircle size={20} />
                  Close
                </button>
              </div>
              <form onSubmit={handleAddPreBuilt} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Rig Name</label>
                    <input
                      required
                      type="text"
                      value={newPreBuilt.name}
                      onChange={e => setNewPreBuilt({...newPreBuilt, name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                      placeholder="e.g. Phantom Strike"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Price (₱)</label>
                      <input
                        required
                        type="number"
                        value={newPreBuilt.price ?? ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, price: Number(e.target.value)})}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-black no-spinner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Tier</label>
                      <select
                        value={newPreBuilt.tier}
                        onChange={e => setNewPreBuilt({...newPreBuilt, tier: e.target.value as any})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      >
                        <option value="Entry">Entry</option>
                        <option value="Mid">Mid</option>
                        <option value="High">High</option>
                        <option value="Extreme">Extreme</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Image URL</label>
                    <input
                      required
                      type="url"
                      value={newPreBuilt.image}
                      onChange={e => setNewPreBuilt({...newPreBuilt, image: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Technical Specs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">CPU</label>
                      <select
                        required
                        value={newPreBuilt.specs?.cpu}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, cpu: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select CPU</option>
                        {products.filter(p => p.category === 'CPU').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">GPU</label>
                      <select
                        required
                        value={newPreBuilt.specs?.gpu}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, gpu: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select GPU</option>
                        {products.filter(p => p.category === 'GPU').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">RAM</label>
                      <select
                        required
                        value={newPreBuilt.specs?.ram}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, ram: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select RAM</option>
                        {products.filter(p => p.category === 'RAM').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Storage</label>
                      <select
                        required
                        value={newPreBuilt.specs?.storage}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, storage: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Storage</option>
                        {products.filter(p => p.category === 'Storage').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Motherboard</label>
                       <select
                        value={newPreBuilt.specs?.motherboard || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, motherboard: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Motherboard</option>
                        {products.filter(p => p.category === 'Motherboard').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Power Supply</label>
                       <select
                        value={newPreBuilt.specs?.psu || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, psu: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select PSU</option>
                        {products.filter(p => p.category === 'PSU').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Case</label>
                       <select
                        value={newPreBuilt.specs?.case || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, case: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Case</option>
                        {products.filter(p => p.category === 'Case').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cooling</label>
                       <select
                        value={newPreBuilt.specs?.cooling || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, cooling: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Cooling</option>
                        {products.filter(p => p.category === 'Cooling').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Monitor</label>
                      <select
                        value={newPreBuilt.specs?.monitor || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, monitor: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">No Monitor</option>
                        {products.filter(p => p.category === 'Monitor').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peripheral 1</label>
                      <select
                        value={newPreBuilt.specs?.peripherals || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, peripherals: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">None</option>
                        {products.filter(p => ['Mouse', 'Keyboard', 'Headset', 'Peripherals'].includes(p.category)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peripheral 2</label>
                      <select
                        value={newPreBuilt.specs?.peripherals_2 || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, peripherals_2: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">None</option>
                        {products.filter(p => ['Mouse', 'Keyboard', 'Headset', 'Peripherals'].includes(p.category)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peripheral 3</label>
                      <select
                        value={newPreBuilt.specs?.peripherals_3 || ''}
                        onChange={e => setNewPreBuilt({...newPreBuilt, specs: {...newPreBuilt.specs!, peripherals_3: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">None</option>
                        {products.filter(p => ['Mouse', 'Keyboard', 'Headset', 'Peripherals'].includes(p.category)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                </div>

                <div className="md:col-span-2">
                   <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 italic uppercase tracking-tighter flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Publish Pre-Built Rig'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Pre-Built Modal */}
      <AnimatePresence>
        {isEditPreBuiltModalOpen && editingPreBuilt && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Edit Pre-Built</h2>
                <button 
                  onClick={() => { setIsEditPreBuiltModalOpen(false); setEditingPreBuilt(null); }} 
                  className="text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white uppercase font-black text-[10px] flex items-center gap-2"
                >
                  <XCircle size={20} />
                  Close
                </button>
              </div>
              <form onSubmit={handleUpdatePreBuilt} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Rig Name</label>
                    <input
                      required
                      type="text"
                      value={editingPreBuilt.name}
                      onChange={e => setEditingPreBuilt({...editingPreBuilt, name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Price (₱)</label>
                      <input
                        required
                        type="number"
                        value={editingPreBuilt.price}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, price: Number(e.target.value)})}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-black no-spinner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Tier</label>
                      <select
                        value={editingPreBuilt.tier}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, tier: e.target.value as any})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      >
                        <option value="Entry">Entry</option>
                        <option value="Mid">Mid</option>
                        <option value="High">High</option>
                        <option value="Extreme">Extreme</option>
                      </select>
                    </div>
                  </div>
                   <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">Image URL</label>
                    <input
                      required
                      type="url"
                      value={editingPreBuilt.image}
                      onChange={e => setEditingPreBuilt({...editingPreBuilt, image: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Technical Specs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">CPU</label>
                       <select
                        required
                        value={editingPreBuilt.specs.cpu}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, cpu: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select CPU</option>
                        {products.filter(p => p.category === 'CPU').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">GPU</label>
                       <select
                        required
                        value={editingPreBuilt.specs.gpu}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, gpu: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select GPU</option>
                        {products.filter(p => p.category === 'GPU').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">RAM</label>
                       <select
                        required
                        value={editingPreBuilt.specs.ram}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, ram: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select RAM</option>
                        {products.filter(p => p.category === 'RAM').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Storage</label>
                       <select
                        required
                        value={editingPreBuilt.specs.storage}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, storage: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Storage</option>
                        {products.filter(p => p.category === 'Storage').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Motherboard</label>
                       <select
                        value={editingPreBuilt.specs.motherboard || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, motherboard: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Motherboard</option>
                        {products.filter(p => p.category === 'Motherboard').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Power Supply</label>
                       <select
                        value={editingPreBuilt.specs.psu || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, psu: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select PSU</option>
                        {products.filter(p => p.category === 'PSU').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Case</label>
                       <select
                        value={editingPreBuilt.specs.case || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, case: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Case</option>
                        {products.filter(p => p.category === 'Case').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cooling</label>
                       <select
                        value={editingPreBuilt.specs.cooling || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, cooling: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">Select Cooling</option>
                        {products.filter(p => p.category === 'Cooling').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Monitor</label>
                      <select
                        value={editingPreBuilt.specs.monitor || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, monitor: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">No Monitor</option>
                        {products.filter(p => p.category === 'Monitor').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peripheral 1</label>
                      <select
                        value={editingPreBuilt.specs.peripherals || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, peripherals: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">None</option>
                        {products.filter(p => ['Mouse', 'Keyboard', 'Headset', 'Peripherals'].includes(p.category)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peripheral 2</label>
                      <select
                        value={editingPreBuilt.specs.peripherals_2 || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, peripherals_2: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">None</option>
                        {products.filter(p => ['Mouse', 'Keyboard', 'Headset', 'Peripherals'].includes(p.category)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peripheral 3</label>
                      <select
                        value={editingPreBuilt.specs.peripherals_3 || ''}
                        onChange={e => setEditingPreBuilt({...editingPreBuilt, specs: {...editingPreBuilt.specs, peripherals_3: e.target.value}})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="">None</option>
                        {products.filter(p => ['Mouse', 'Keyboard', 'Headset', 'Peripherals'].includes(p.category)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                </div>

                <div className="md:col-span-2">
                   <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 italic uppercase tracking-tighter flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Update Pre-Built Rig'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isAddAdminModalOpen && profile?.role === 'owner' && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Add New Admin</h2>
                <button onClick={() => setIsAddAdminModalOpen(false)} className="text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white uppercase font-black text-[10px] flex items-center gap-2">
                  <XCircle size={20} />
                  Close
                </button>
              </div>
              <p className="text-zinc-500 dark:text-white/40 text-sm mb-6 font-medium">Enter the email address of the user you want to promote to Admin.</p>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">User Email</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-white/20" size={18} />
                    <input
                      required
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-xl transition-all mt-4 shadow-lg shadow-blue-500/20 active:scale-95 italic uppercase tracking-tighter"
                >
                  Promote to Admin
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
