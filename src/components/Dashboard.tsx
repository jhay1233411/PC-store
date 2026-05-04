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
import { Order, UserProfile, Product } from '../types';
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
  Pencil
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  const [adminEmail, setAdminEmail] = useState('');

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
      return () => {
        unsubscribeOrders();
        unsubscribeProducts();
        unsubscribeUsers();
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
