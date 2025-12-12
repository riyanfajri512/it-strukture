import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle, TrendingUp, ClipboardCheck, LogOut, Plus, Edit2, Trash2, Search, X, Save, CheckCircle } from 'lucide-react';

// --- SUPABASE CLIENT HELPER CLASS ---
class SupabaseClient {
  constructor(url, key) {
    this.url = 'https://fdmfdjiinxbkqobvlxcj.supabase.co';
    this.key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWZkamlpbnhia3FvYnZseGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTY4MDMsImV4cCI6MjA4MDA5MjgwM30.1EJLRYRazj3btIdsboO53N98esLnyMc-vG6yUvjXK54';
    this.authListeners = [];
  }

  async request(endpoint, options = {}) {
    const headers = {
      'apikey': this.key,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = localStorage.getItem('supabase_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.url}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    return { data: response.ok ? data : null, error: response.ok ? null : data };
  }

  auth = {
    signInWithPassword: async ({ email, password }) => {
      const { data, error } = await this.request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data?.access_token) {
        localStorage.setItem('supabase_token', data.access_token);
        localStorage.setItem('supabase_user', JSON.stringify(data.user));
        this.notifyAuthChange(data);
      }

      return { data, error };
    },

    signUp: async ({ email, password, options = {} }) => {
      const { data, error } = await this.request('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          password,
          data: options.data 
        })
      });

      return { data, error };
    },

    signOut: async () => {
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('supabase_user');
      this.notifyAuthChange(null);
      return { error: null };
    },

    getSession: async () => {
      const token = localStorage.getItem('supabase_token');
      const user = localStorage.getItem('supabase_user');
      
      if (token && user) {
        return { 
          data: { 
            session: { 
              access_token: token, 
              user: JSON.parse(user) 
            } 
          } 
        };
      }
      return { data: { session: null } };
    },

    onAuthStateChange: (callback) => {
      this.authListeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authListeners = this.authListeners.filter(cb => cb !== callback);
            }
          }
        }
      };
    },

    notifyAuthChange(session) {
      this.authListeners.forEach(callback => callback('SIGNED_IN', session));
    }
  };

  from(table) {
    return new QueryBuilder(this, table);
  }
}

class QueryBuilder {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.selectQuery = '*';
    this.filters = [];
    this.orderQuery = null;
    this.limitQuery = null;
    this.singleQuery = false;
  }

  select(columns = '*') {
    this.selectQuery = columns;
    return this;
  }

  eq(column, value) {
    this.filters.push(`${column}=eq.${value}`);
    return this;
  }

  order(column, options = {}) {
    this.orderQuery = `${column}.${options.ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(count) {
    this.limitQuery = count;
    return this;
  }

  single() {
    this.singleQuery = true;
    return this;
  }

  async insert(data) {
    const endpoint = `/rest/v1/${this.table}`;
    const result = await this.client.request(endpoint, {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(Array.isArray(data) ? data : [data])
    });

    if (result.data && Array.isArray(result.data) && result.data.length === 1) {
      return { ...result, data: result.data[0] };
    }
    return result;
  }

  async update(data) {
    const filterString = this.filters.length > 0 ? `?${this.filters.join('&')}` : '';
    const endpoint = `/rest/v1/${this.table}${filterString}`;
    
    return await this.client.request(endpoint, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
  }

  async delete() {
    const filterString = this.filters.length > 0 ? `?${this.filters.join('&')}` : '';
    const endpoint = `/rest/v1/${this.table}${filterString}`;
    
    return await this.client.request(endpoint, {
      method: 'DELETE'
    });
  }

  async then(resolve, reject) {
    try {
      let query = `?select=${this.selectQuery}`;
      if (this.filters.length > 0) query += `&${this.filters.join('&')}`;
      if (this.orderQuery) query += `&order=${this.orderQuery}`;
      if (this.limitQuery) query += `&limit=${this.limitQuery}`;

      const endpoint = `/rest/v1/${this.table}${query}`;
      const result = await this.client.request(endpoint);

      if (this.singleQuery && result.data && Array.isArray(result.data)) {
        result.data = result.data[0] || null;
      }
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
}

// Inisialisasi Supabase
const supabase = new SupabaseClient(
  'https://fdmfdjiinxbkqobvlxcj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWZkamlpbnhia3FvYnZseGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTY4MDMsImV4cCI6MjA4MDA5MjgwM30.1EJLRYRazj3btIdsboO53N98esLnyMc-vG6yUvjXK54'
);

// --- MAIN APP COMPONENT ---
export default function InventoryApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCurrentUser(session.user.email);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCurrentUser(session.user.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCurrentUser = async (email) => {
    const { data } = await supabase
      .from('users')
      .select('*, roles(nama), locations(nama)')
      .eq('email', email)
      .single();
    setCurrentUser(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading Inventory System...</div>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-10">
      <Header user={currentUser} onLogout={() => supabase.auth.signOut()} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'categories' && <CategoriesPage />}
        {activeTab === 'opname' && <StockOpnamePage currentUser={currentUser} />}
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nama } }
        });
        if (error) throw error;
        alert('Check your email for verification link!');
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Package className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Inventory System</h1>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required={!isLogin} />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required minLength={6} />
          </div>

          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Package className="w-8 h-8 text-blue-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory System</h1>
            <p className="text-sm text-gray-400">Real-time Stock Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-medium">{user?.nama || 'User'}</p>
            <p className="text-sm text-gray-400">{user?.roles?.nama || 'Staff'} • {user?.locations?.nama || 'N/A'}</p>
          </div>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'categories', label: 'Kategori', icon: Package },
    { id: 'opname', label: 'Stock Opname', icon: ClipboardCheck },
  ];

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, lowStock: 0, categories: 0 });
  const [stockData, setStockData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: products } = await supabase
      .from('products')
      .select('*, product_categories(nama), stock_live(quantity)')
      .eq('is_active', true);

    const { data: categories } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true);

    const lowStock = products?.filter(p => {
      const qty = p.stock_live?.[0]?.quantity || 0;
      return qty < p.min_stock;
    }) || [];

    setStats({
      total: products?.length || 0,
      lowStock: lowStock.length,
      categories: categories?.length || 0
    });

    const categoryStats = categories?.map(cat => ({
      name: cat.nama,
      value: products?.filter(p => p.category_id === cat.id).length || 0
    })) || [];
    setStockData(categoryStats);

    setLowStockItems(lowStock.slice(0, 5));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Package} label="Total Produk" value={stats.total} color="blue" />
        <StatCard icon={AlertTriangle} label="Low Stock Alert" value={stats.lowStock} color="red" />
        <StatCard icon={Package} label="Kategori" value={stats.categories} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Produk per Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Low Stock Alert (Top 5)</h3>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Semua stok aman! 🎉</p>
            ) : (
              lowStockItems.map((item) => {
                const qty = item.stock_live?.[0]?.quantity || 0;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-gray-800">{item.nama}</p>
                      <p className="text-sm text-gray-600">{item.product_categories?.nama}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-600 font-bold">{qty} pcs</p>
                      <p className="text-xs text-gray-500">Min: {item.min_stock}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500' };
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${colors[color]} p-4 rounded-xl`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '', barcode: '', nama: '', category_id: '',
    harga_beli: '', harga_jual: '', harga_grosir: '',
    unit: 'PCS', min_stock: 10, max_stock: 1000
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_categories(nama), stock_live(quantity, location_id, locations(nama))')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('product_categories').select('*').eq('is_active', true);
    setCategories(data || []);
  };

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').eq('is_active', true);
    setLocations(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      harga_beli: parseFloat(formData.harga_beli),
      harga_jual: parseFloat(formData.harga_jual),
      harga_grosir: parseFloat(formData.harga_grosir),
      min_stock: parseInt(formData.min_stock),
      max_stock: parseInt(formData.max_stock),
    };

    if (editingProduct) {
      await supabase.from('products').update(dataToSubmit).eq('id', editingProduct.id);
    } else {
      const { data: newProduct } = await supabase.from('products').insert([dataToSubmit]).select().single();
      if (newProduct && locations.length > 0) {
        // Initialize stock 0 for all locations
        const stockEntries = locations.map(loc => ({
          product_id: newProduct.id,
          location_id: loc.id,
          quantity: 0
        }));
        await supabase.from('stock_live').insert(stockEntries);
      }
    }
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code, barcode: product.barcode || '', nama: product.nama,
      category_id: product.category_id, harga_beli: product.harga_beli,
      harga_jual: product.harga_jual, harga_grosir: product.harga_grosir,
      unit: product.unit, min_stock: product.min_stock, max_stock: product.max_stock
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus produk ini? (Soft Delete)')) {
      await supabase.from('products').update({ is_active: false }).eq('id', id);
      fetchProducts();
    }
  };

  const resetForm = () => {
    setFormData({
      code: '', barcode: '', nama: '', category_id: '',
      harga_beli: '', harga_jual: '', harga_grosir: '',
      unit: 'PCS', min_stock: 10, max_stock: 1000
    });
  };

  const filteredProducts = products.filter(p =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari produk (Nama / Kode)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" /> Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hrg Jual</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const totalStock = product.stock_live?.reduce((sum, sl) => sum + sl.quantity, 0) || 0;
                const isLowStock = totalStock < product.min_stock;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.code}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.nama}</div>
                        {product.barcode && <div className="text-xs text-gray-500">{product.barcode}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.product_categories?.nama}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      Rp {product.harga_jual?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {totalStock} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
                  <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
                  <input type="number" value={formData.harga_beli} onChange={(e) => setFormData({...formData, harga_beli: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                  <input type="number" value={formData.harga_jual} onChange={(e) => setFormData({...formData, harga_jual: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Grosir</label>
                  <input type="number" value={formData.harga_grosir} onChange={(e) => setFormData({...formData, harga_grosir: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label>
                  <input type="number" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
                  <input type="number" value={formData.max_stock} onChange={(e) => setFormData({...formData, max_stock: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({ code: '', nama: '', deskripsi: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('product_categories').select('*').eq('is_active', true);
    setCategories(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCat) {
      await supabase.from('product_categories').update(formData).eq('id', editingCat.id);
    } else {
      await supabase.from('product_categories').insert([formData]);
    }
    setShowModal(false);
    setEditingCat(null);
    setFormData({ code: '', nama: '', deskripsi: '' });
    fetchCategories();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus kategori ini?')) {
      await supabase.from('product_categories').update({ is_active: false }).eq('id', id);
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Daftar Kategori</h2>
        <button
          onClick={() => { setEditingCat(null); setFormData({code:'', nama:'', deskripsi:''}); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Tambah Kategori
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white p-6 rounded-xl shadow-lg relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => { setEditingCat(cat); setFormData(cat); setShowModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{cat.nama}</h3>
            <p className="text-xs text-blue-600 font-mono bg-blue-50 inline-block px-2 py-1 rounded mb-3">{cat.code}</p>
            <p className="text-gray-600 text-sm">{cat.deskripsi || 'Tidak ada deskripsi'}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Kode Kategori</label>
                <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Nama Kategori</label>
                <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Deskripsi</label>
                <textarea value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border p-2 rounded hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StockOpnamePage({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [opnameData, setOpnameData] = useState({});
  const [loading, setLoading] = useState(false);

  // Wrap fetchStock in useCallback to prevent re-creation on every render
  const fetchStock = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*, stock_live(id, quantity, location_id)')
      .eq('is_active', true)
      .order('nama', { ascending: true });
    
    const userLocId = currentUser?.location_id;
    
    const mapped = data?.map(p => {
      const stockEntry = userLocId 
        ? p.stock_live?.find(s => s.location_id === userLocId)
        : p.stock_live?.[0]; // Fallback to first stock if user has no location (Admin view)
        
      return {
        ...p,
        current_qty: stockEntry?.quantity || 0,
        stock_id: stockEntry?.id
      };
    });

    setProducts(mapped || []);
  }, [currentUser]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleInputChange = (id, val) => {
    setOpnameData({ ...opnameData, [id]: parseInt(val) || 0 });
  };

  const handleSaveOpname = async () => {
    if (!window.confirm('Apakah anda yakin ingin menyimpan perubahan stok ini?')) return;
    setLoading(true);

    try {
      const updates = Object.keys(opnameData).map(async (productId) => {
        // Fix: Use strict equality by converting p.id to string or productId to number
        const product = products.find(p => String(p.id) === productId);
        const newQty = opnameData[productId];
        
        if (product && product.stock_id) {
          // Update existing stock
          return supabase.from('stock_live').update({ quantity: newQty }).eq('id', product.stock_id);
        } else if (product && currentUser?.location_id) {
          // Insert new stock record if not exists
          return supabase.from('stock_live').insert({
            product_id: product.id,
            location_id: currentUser.location_id,
            quantity: newQty
          });
        }
      });

      await Promise.all(updates);
      alert('Stock Opname Berhasil Disimpan!');
      setOpnameData({});
      fetchStock();
    } catch (err) {
      alert('Gagal menyimpan opname');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stock Opname</h2>
          <p className="text-gray-500 text-sm">Lokasi: <span className="font-semibold text-blue-600">{currentUser?.locations?.nama || 'Global / Admin View'}</span></p>
        </div>
        <button 
          onClick={handleSaveOpname}
          disabled={loading || Object.keys(opnameData).length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold transition"
        >
          <CheckCircle className="w-5 h-5" />
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 uppercase text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3 text-center">Stok Sistem</th>
              <th className="px-4 py-3 text-center">Fisik (Input)</th>
              <th className="px-4 py-3 text-center">Selisih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map(p => {
              const fisik = opnameData[p.id] !== undefined ? opnameData[p.id] : p.current_qty;
              const selisih = fisik - p.current_qty;
              
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-800">{p.nama}</p>
                    <p className="text-xs text-gray-500">{p.code}</p>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-600">{p.current_qty}</td>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="number" 
                      className="w-24 text-center border-2 border-blue-100 focus:border-blue-500 rounded-lg py-1 px-2"
                      placeholder={p.current_qty}
                      onChange={(e) => handleInputChange(p.id, e.target.value)}
                    />
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${selisih < 0 ? 'text-red-500' : selisih > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    {selisih > 0 ? `+${selisih}` : selisih}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}