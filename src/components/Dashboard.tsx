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
    if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) return;

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
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
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const { id, ...data } = editingProduct;
      await updateDoc(doc(db, 'products', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
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
        <div className="text-center py-12 text-white/40">No orders found</div>
      ) : (
        orders.map(order => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-white/40">#{order.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-500' :
                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-500' :
                    order.status === 'processing' ? 'bg-amber-500/20 text-amber-500' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <h3 className="font-medium text-white">{order.userName || order.userEmail}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-white/40">{order.userEmail}</p>
                  <span className="text-white/20">•</span>
                  <p className="text-sm text-white/40">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <span className="text-white/20">•</span>
                  <span className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest">
                    {order.paymentMethod?.replace('_', ' ') || 'GCash'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-500">₱{order.totalPrice.toLocaleString()}</p>
                <div className="flex gap-2 mt-3 justify-end">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                    className="bg-white border border-white/10 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 space-y-6">
              {order.shippingAddress && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Delivery Address</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div>
                      <p className="text-[10px] text-white/20 uppercase font-bold">Recipient</p>
                      <p className="text-sm font-medium text-white">{order.shippingAddress.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/20 uppercase font-bold">Contact</p>
                      <p className="text-sm font-medium text-white">{order.shippingAddress.phone ?? 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-white/20 uppercase font-bold">Address</p>
                      <p className="text-sm font-medium text-white">
                        {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-white/40">₱{item.price.toLocaleString()}</p>
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
        <h2 className="text-xl font-bold text-white">User Management</h2>
        {profile?.role === 'owner' && (
          <button
            onClick={() => setIsAddAdminModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all"
          >
            <Shield size={18} />
            Add Admin
          </button>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">User</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Joined</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.displayName}</p>
                      <p className="text-xs text-white/40">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'owner' ? 'bg-purple-500/20 text-purple-500' :
                    user.role === 'admin' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-white/40">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.uid, e.target.value as UserProfile['role'])}
                    className="bg-white border border-white/10 rounded-lg px-2 py-1 text-xs text-black focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-medium"
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
        <h2 className="text-xl font-bold text-white">Product Inventory</h2>
        <button
          onClick={() => setIsAddProductModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-sm font-bold transition-all"
        >
          <Plus size={18} />
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
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center"
          >
            <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white/40">{product.category}</p>
                <span className="text-white/10">•</span>
                <p className={`text-xs font-bold ${(product.stock ?? 10) > 0 ? 'text-white/40' : 'text-red-500'}`}>
                  {product.stock ?? 10} in stock
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {(product.socket || product.ramType || product.wattage) && (
                  <div className="flex items-center gap-2 mr-2">
                    {product.socket && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                        {product.socket}
                      </span>
                    )}
                    {product.ramType && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                        {product.ramType}
                      </span>
                    )}
                    {product.wattage && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                        {product.wattage}W
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm font-bold text-emerald-500">₱{product.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setIsEditProductModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all text-xs font-bold"
                title="Edit Product"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                onClick={() => deleteProduct(product.id!)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all text-xs font-bold"
                title="Delete Product"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/40">Manage your store, orders, and users from one place.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'orders' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <ShoppingBag size={18} />
            Orders
          </button>
          {(profile?.role === 'owner' || profile?.role === 'admin') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'users' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              <Users size={18} />
              Users
            </button>
          )}
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'products' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'
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
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Product</h2>
                <button onClick={() => setIsAddProductModalOpen(false)} className="text-white/40 hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Product Name</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      required
                      type="text"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                      placeholder="e.g. NVIDIA RTX 4090"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Price (₱)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-bold">₱</span>
                      <input
                        required
                        type="number"
                        value={newProduct.price ?? ''}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Stock</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        required
                        type="number"
                        value={newProduct.stock ?? ''}
                        onChange={e => setNewProduct({...newProduct, stock: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <select
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                        className="w-full bg-white border border-white/10 rounded-xl py-3 pl-10 pr-4 text-black focus:outline-none focus:border-emerald-500 transition-all appearance-none font-medium"
                      >
                       <option value="CPU" className="text-black">CPU</option>
                       <option value="GPU" className="text-black">GPU</option>
                       <option value="RAM" className="text-black">RAM</option>
                       <option value="Storage" className="text-black">Storage</option>
                       <option value="Motherboard" className="text-black">Motherboard</option>
                       <option value="PSU" className="text-black">PSU</option>
                       <option value="Case" className="text-black">Case</option>
                       <option value="Cooling" className="text-black">Cooling</option>
                      </select>
                    </div>
                  </div>

                {/* Compatibility Fields */}
                {(newProduct.category === 'CPU' || newProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Socket (Compatibility)</label>
                    <select
                      value={newProduct.socket || ''}
                      onChange={e => setNewProduct({...newProduct, socket: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    >
                      <option value="">Select Socket</option>
                      <optgroup label="Intel">
                        <option value="LGA1851">LGA1851 (Core Ultra 200S)</option>
                        <option value="LGA1700">LGA1700 (12th/13th/14th Gen)</option>
                        <option value="LGA1200">LGA1200 (10th/11th Gen)</option>
                        <option value="LGA1151">LGA1151 (6th-9th Gen)</option>
                        <option value="LGA1150">LGA1150 (4th Gen)</option>
                        <option value="LGA1155">LGA1155 (2nd/3rd Gen)</option>
                        <option value="LGA2066">LGA2066 (X299)</option>
                      </optgroup>
                      <optgroup label="AMD">
                        <option value="AM5">AM5 (Ryzen 7000/8000/9000)</option>
                        <option value="AM4">AM4 (Ryzen 1000-5000)</option>
                        <option value="AM3+">AM3+ (FX Series)</option>
                        <option value="sTR5">sTR5 (Threadripper 7000)</option>
                        <option value="sWRX8">sWRX8 (Threadripper Pro)</option>
                        <option value="TR4">TR4 (Threadripper 1000/2000)</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {(newProduct.category === 'RAM' || newProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">RAM Type</label>
                    <select
                      value={newProduct.ramType || ''}
                      onChange={e => setNewProduct({...newProduct, ramType: e.target.value as any || undefined})}
                      className="w-full bg-white border border-white/10 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    >
                      <option value="">Select RAM Type</option>
                      <option value="DDR4">DDR4 (Previous Gen / Value)</option>
                      <option value="DDR5">DDR5 (Next Gen / Performance)</option>
                    </select>
                  </div>
                )}

                {newProduct.category === 'PSU' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Wattage</label>
                    <input
                      type="number"
                      value={newProduct.wattage || ''}
                      onChange={e => setNewProduct({...newProduct, wattage: Number(e.target.value) || undefined})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                      placeholder="e.g. 750"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      required
                      type="url"
                      value={newProduct.image}
                      onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Description</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-white/20" size={18} />
                    <textarea
                      required
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all h-24 resize-none"
                      placeholder="Product details..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-xl transition-all mt-4"
                >
                  Create Product
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
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Product</h2>
                <button 
                  onClick={() => {
                    setIsEditProductModalOpen(false);
                    setEditingProduct(null);
                  }} 
                  className="text-white/40 hover:text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Product Name</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      required
                      type="text"
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Price (₱)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-bold">₱</span>
                      <input
                        required
                        type="number"
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Stock</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        required
                        type="number"
                        value={editingProduct.stock ?? ''}
                        onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all no-spinner"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <select
                        value={editingProduct.category}
                        onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                        className="w-full bg-white border border-white/10 rounded-xl py-3 pl-10 pr-4 text-black focus:outline-none focus:border-emerald-500 transition-all appearance-none font-medium"
                      >
                        <option value="CPU" className="text-black">CPU</option>
                        <option value="GPU" className="text-black">GPU</option>
                        <option value="RAM" className="text-black">RAM</option>
                        <option value="Storage" className="text-black">Storage</option>
                        <option value="Motherboard" className="text-black">Motherboard</option>
                        <option value="PSU" className="text-black">PSU</option>
                        <option value="Case" className="text-black">Case</option>
                        <option value="Cooling" className="text-black">Cooling</option>
                      </select>
                    </div>
                  </div>

                {/* Compatibility Fields for Editing */}
                {(editingProduct.category === 'CPU' || editingProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Socket (Compatibility)</label>
                    <select
                      value={editingProduct.socket || ''}
                      onChange={e => setEditingProduct({...editingProduct, socket: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    >
                      <option value="">Select Socket</option>
                      <optgroup label="Intel">
                        <option value="LGA1851">LGA1851 (Core Ultra 200S)</option>
                        <option value="LGA1700">LGA1700 (12th/13th/14th Gen)</option>
                        <option value="LGA1200">LGA1200 (10th/11th Gen)</option>
                        <option value="LGA1151">LGA1151 (6th-9th Gen)</option>
                        <option value="LGA1150">LGA1150 (4th Gen)</option>
                        <option value="LGA1155">LGA1155 (2nd/3rd Gen)</option>
                        <option value="LGA2066">LGA2066 (X299)</option>
                      </optgroup>
                      <optgroup label="AMD">
                        <option value="AM5">AM5 (Ryzen 7000/8000/9000)</option>
                        <option value="AM4">AM4 (Ryzen 1000-5000)</option>
                        <option value="AM3+">AM3+ (FX Series)</option>
                        <option value="sTR5">sTR5 (Threadripper 7000)</option>
                        <option value="sWRX8">sWRX8 (Threadripper Pro)</option>
                        <option value="TR4">TR4 (Threadripper 1000/2000)</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {(editingProduct.category === 'RAM' || editingProduct.category === 'Motherboard') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">RAM Type</label>
                    <select
                      value={editingProduct.ramType || ''}
                      onChange={e => setEditingProduct({...editingProduct, ramType: e.target.value as any || undefined})}
                      className="w-full bg-white border border-white/10 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    >
                      <option value="">Select RAM Type</option>
                      <option value="DDR4">DDR4 (Previous Gen / Value)</option>
                      <option value="DDR5">DDR5 (Next Gen / Performance)</option>
                    </select>
                  </div>
                )}

                {editingProduct.category === 'PSU' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Wattage</label>
                    <input
                      type="number"
                      value={editingProduct.wattage || ''}
                      onChange={e => setEditingProduct({...editingProduct, wattage: Number(e.target.value) || undefined})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      required
                      type="url"
                      value={editingProduct.image}
                      onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Description</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-white/20" size={18} />
                    <textarea
                      required
                      value={editingProduct.description}
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all h-24 resize-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-xl transition-all mt-4"
                >
                  Update Product
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
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Admin</h2>
                <button onClick={() => setIsAddAdminModalOpen(false)} className="text-white/40 hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-white/40 text-sm mb-6">Enter the email address of the user you want to promote to Admin.</p>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">User Email</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      required
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all mt-4"
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
