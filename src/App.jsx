import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('shop'); // 'shop', 'track', 'admin', 'auth'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('natural_cocos_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [orders, setOrders] = useState([]);

  // Load orders from MongoDB
  useEffect(() => {
    fetchOrders();
    fetch(`${API_URL}/init-admin`, { method: 'POST' }).catch(() => {});
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('natural_cocos_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const [trackingInput, setTrackingInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const products = [
    {
      id: 'nc-500ml',
      name: 'Natural Cocos Pure Coconut Oil - 500ml',
      category: 'daily',
      volume: '500 ml Glass Jar',
      price: 1250,
      originalPrice: 1400,
      rating: 4.9,
      reviews: 84,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
      description: '100% Raw, Cold-Pressed Organic Virgin Coconut Oil extracted from fresh kernel. Perfect for daily cooking, hair treatment, and skincare.',
      badge: 'Best Seller'
    },
    {
      id: 'nc-1000ml',
      name: 'Natural Cocos Pure Coconut Oil - 1000ml',
      category: 'daily',
      volume: '1 Liter Family Pack',
      price: 2300,
      originalPrice: 2600,
      rating: 5.0,
      reviews: 112,
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800',
      description: 'Family value jar of unrefined, high-purity organic extra virgin coconut oil. Rich in Lauric acid and natural antioxidants.',
      badge: 'Value Pack'
    },
    {
      id: 'nc-hair-250ml',
      name: 'Natural Cocos Hair & Scalp Nourish Oil - 250ml',
      category: 'beauty',
      volume: '250 ml Dropper Bottle',
      price: 950,
      originalPrice: 1100,
      rating: 4.8,
      reviews: 49,
      image: 'https://images.unsplash.com/photo-1608248597262-83812700e167?auto=format&fit=crop&q=80&w=800',
      description: 'Specially filtered extra virgin coconut oil infused with natural botanical nutrients for deep moisture, shine, and hair root strength.',
      badge: 'Beauty Specialty'
    }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 3000 || subtotal === 0 ? 0 : 350;
  const grandTotal = subtotal + shippingFee;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const endpoint = authMode === 'signup' ? `${API_URL}/signup` : `${API_URL}/signin`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }

      setCurrentUser(data);
      setCurrentView(data.role === 'admin' ? 'admin' : 'shop');
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      setAuthError('Server connection error. Please verify backend server status.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('shop');
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const orderPayload = {
      userEmail: currentUser ? currentUser.email : formData.email,
      ...formData,
      items: [...cart],
      subtotal,
      shipping: shippingFee,
      total: grandTotal
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const savedOrder = await res.json();

      setOrders([savedOrder, ...orders]);
      setLastPlacedOrderId(savedOrder.id);
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (err) {
      alert('Order placement failed. Please verify server connection.');
    }
  };

  const handleTrackSearch = (e) => {
    e.preventDefault();
    const found = orders.find(o => o.id.toUpperCase() === trackingInput.trim().toUpperCase());
    setSearchedOrder(found || null);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setOrders(orders.map(o => o.id === orderId ? updated : o));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-amber-300 selection:text-emerald-950">
      
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-100 text-xs sm:text-sm py-2.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-emerald-800/50 shadow-inner">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        <span>🌿 Islandwide Fast Delivery | 100% Raw Cold-Pressed Guarantee</span>
      </div>

      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => setCurrentView('shop')}
            className="flex items-center gap-3 cursor-pointer group transform transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 p-2.5 rounded-2xl shadow-md group-hover:rotate-6 transition-transform duration-300">
              <svg className="w-6 h-6 fill-amber-300" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-emerald-950 block leading-none">
                NATURAL <span className="text-amber-600">COCOS</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-stone-400">
                Pure Organic Goodness
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-stone-600 text-sm">
            <button 
              onClick={() => setCurrentView('shop')} 
              className={`transition-all duration-200 hover:text-emerald-900 relative py-1 ${currentView === 'shop' ? 'text-emerald-900 font-bold' : ''}`}
            >
              Shop Catalog
              {currentView === 'shop' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-900 rounded-full"></span>}
            </button>

            <button 
              onClick={() => setCurrentView('track')} 
              className={`transition-all duration-200 hover:text-emerald-900 relative py-1 ${currentView === 'track' ? 'text-emerald-900 font-bold' : ''}`}
            >
              Track Order
              {currentView === 'track' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-900 rounded-full"></span>}
            </button>
            
            {currentUser && currentUser.role === 'admin' && (
              <button 
                onClick={() => setCurrentView('admin')} 
                className={`transition-all duration-200 hover:text-emerald-900 relative py-1 flex items-center gap-1.5 ${currentView === 'admin' ? 'text-emerald-900 font-bold' : ''}`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Admin Dashboard ({orders.length})
                {currentView === 'admin' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-900 rounded-full"></span>}
              </button>
            )}
          </nav>

          {/* Cart & Authentication */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-emerald-50 hover:bg-emerald-100 text-emerald-900 p-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              aria-label="View Cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-stone-200">
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-900">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">{currentUser.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('signin'); setCurrentView('auth'); }}
                className="hidden sm:inline-flex bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-emerald-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 px-6 py-4 space-y-3 font-medium text-stone-700">
            <button onClick={() => { setCurrentView('shop'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-semibold">Shop Catalog</button>
            <button onClick={() => { setCurrentView('track'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-semibold">Track Order</button>
            {currentUser && currentUser.role === 'admin' && (
              <button onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-semibold text-emerald-900">Admin Dashboard</button>
            )}
            {currentUser ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-red-600 font-bold border-t pt-3">Logout ({currentUser.name})</button>
            ) : (
              <button onClick={() => { setAuthMode('signin'); setCurrentView('auth'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-emerald-900 font-bold border-t pt-3">Sign In / Sign Up</button>
            )}
          </div>
        )}
      </header>

      {/* AUTHENTICATION VIEW */}
      {currentView === 'auth' && (
        <div className="max-w-md mx-auto px-4 py-20">
          <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-800 to-amber-500"></div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-stone-900">
                {authMode === 'signin' ? 'Welcome Back!' : 'Create an Account'}
              </h2>
              <p className="text-stone-500 text-xs mt-1">
                {authMode === 'signin' ? 'Sign in to track orders and save preferences' : 'Register to easily manage your Coconut Oil purchases'}
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Nuwan Perera"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="nuwan@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md text-sm mt-2 active:scale-95"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-stone-600 border-t border-stone-100 pt-4">
              {authMode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="text-emerald-800 font-bold hover:underline">
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button onClick={() => { setAuthMode('signin'); setAuthError(''); }} className="text-emerald-800 font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHOP VIEW */}
      {currentView === 'shop' && (
        <main>
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white py-24 lg:py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  ✨ 100% Raw & Cold-Pressed
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                  Pure Sri Lankan Coconut Oil For <span className="text-amber-400">Health & Beauty</span>
                </h1>
                <p className="text-emerald-100/90 text-base sm:text-lg max-w-xl font-light leading-relaxed">
                  Extracted without heat or chemical intervention to preserve vital nutrients, natural aroma, and essential Lauric acid.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <a
                    href="#products"
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-4 rounded-2xl shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-center"
                  >
                    Shop Products
                  </a>
                  <button
                    onClick={() => setCurrentView('track')}
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-4 rounded-2xl backdrop-blur-sm border border-white/20 transition-all duration-200 text-center hover:scale-105 active:scale-95"
                  >
                    Track Existing Order
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 group">
                  <img
                    src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=1000"
                    alt="Natural Cocos Coconut Oil Jar"
                    className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent flex items-end p-6">
                    <div>
                      <p className="text-white font-bold text-lg">Natural Cocos Organic Extra Virgin</p>
                      <p className="text-amber-300 text-xs font-medium">Sustainably crafted in Sri Lanka</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Catalog */}
          <section id="products" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-amber-700 font-bold uppercase tracking-widest text-xs">Organic Collection</span>
              <h2 className="text-3xl sm:text-4xl font-black text-stone-900 mt-2">
                Choose Your Natural Cocos Jar
              </h2>
              <p className="text-stone-600 mt-2 text-sm sm:text-base">
                Small-batch cold-pressed oils crafted for optimal freshness and purity.
              </p>

              {/* Category Filter Pills */}
              <div className="flex justify-center gap-2 mt-8">
                {[
                  { id: 'all', label: 'All Products' },
                  { id: 'daily', label: 'Culinary & Daily' },
                  { id: 'beauty', label: 'Hair & Beauty Care' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      activeCategory === cat.id 
                        ? 'bg-emerald-900 text-white shadow-md' 
                        : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-stone-200/95 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    <div className="relative h-64 overflow-hidden bg-stone-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-4 left-4 bg-emerald-900/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                        {product.badge}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-1 text-amber-500 text-sm mb-2 font-bold">
                        ★ {product.rating} <span className="text-stone-400 text-xs font-normal">({product.reviews} reviews)</span>
                      </div>

                      <h3 className="text-xl font-bold text-stone-900 mb-2 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-stone-100 mt-auto flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-900">
                          Rs. {product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-stone-400 line-through">
                            Rs. {product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-medium">{product.volume}</span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* TRACK ORDER VIEW */}
      {currentView === 'track' && (
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-stone-900">Live Order Tracking</h2>
            <p className="text-stone-600 text-sm mt-2">Enter your Order ID (e.g., NC-1001) to view real-time delivery status.</p>
          </div>

          <form onSubmit={handleTrackSearch} className="flex gap-3 mb-10 max-w-xl mx-auto">
            <input
              type="text"
              required
              placeholder="Enter Order Reference (e.g. NC-1001)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 font-bold uppercase text-sm shadow-sm"
            />
            <button
              type="submit"
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-md active:scale-95 text-sm"
            >
              Track Order
            </button>
          </form>

          {searchedOrder ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-stone-100 gap-4">
                <div>
                  <span className="text-xs uppercase font-bold text-stone-400">Order Reference</span>
                  <h3 className="text-2xl font-black text-emerald-900">{searchedOrder.id}</h3>
                  <p className="text-xs text-stone-500 mt-1">Order Date: {searchedOrder.date}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                  searchedOrder.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                  searchedOrder.status === 'Dispatched' ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  Status: {searchedOrder.status}
                </div>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className={`p-3.5 rounded-2xl text-xs font-bold ${['Pending', 'Dispatched', 'Delivered'].includes(searchedOrder.status) ? 'bg-emerald-900 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}>
                  1. Order Received
                </div>
                <div className={`p-3.5 rounded-2xl text-xs font-bold ${['Dispatched', 'Delivered'].includes(searchedOrder.status) ? 'bg-emerald-900 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}>
                  2. Dispatched
                </div>
                <div className={`p-3.5 rounded-2xl text-xs font-bold ${searchedOrder.status === 'Delivered' ? 'bg-emerald-900 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}>
                  3. Delivered
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-4 text-sm text-stone-600 border-t border-stone-100">
                <div>
                  <h4 className="font-bold text-stone-900 mb-2">Delivery Details</h4>
                  <p><strong className="text-stone-700">Name:</strong> {searchedOrder.name}</p>
                  <p><strong className="text-stone-700">Phone:</strong> {searchedOrder.phone}</p>
                  <p><strong className="text-stone-700">Address:</strong> {searchedOrder.address}, {searchedOrder.city}</p>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 mb-2">Order Items</h4>
                  {searchedOrder.items.map((item, idx) => (
                    <p key={idx} className="text-xs text-stone-600">{item.name} (x{item.quantity})</p>
                  ))}
                  <p className="font-black text-emerald-900 mt-3 text-base">Total: Rs. {searchedOrder.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : trackingInput && (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200">
              <p className="text-stone-500 font-medium">No record found for Order Reference "{trackingInput}".</p>
            </div>
          )}
        </div>
      )}

      {/* ADMIN DASHBOARD VIEW */}
      {currentView === 'admin' && currentUser && currentUser.role === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
              <span className="text-amber-600 font-bold uppercase tracking-wider text-xs">Seller Portal</span>
              <h2 className="text-3xl font-black text-stone-900 mt-1">Admin Order Fulfillment</h2>
              <p className="text-stone-600 text-sm">Review orders saved in MongoDB and update customer fulfillment statuses.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="bg-stone-50 text-stone-700 uppercase font-bold text-xs border-b border-stone-200">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-stone-400 font-medium">No customer orders recorded yet.</td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="p-4 font-bold text-emerald-900">{order.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-stone-900">{order.name}</p>
                          <p className="text-xs text-stone-500">{order.phone} • {order.city}</p>
                        </td>
                        <td className="p-4 text-xs">
                          {order.items.map((i, idx) => (
                            <div key={idx}>{i.name} (x{i.quantity})</div>
                          ))}
                        </td>
                        <td className="p-4 font-bold text-stone-900">Rs. {order.total.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'Dispatched' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => updateOrderStatus(order.id, 'Dispatched')}
                            className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                          >
                            Dispatch
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'Delivered')}
                            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                          >
                            Deliver
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                <h3 className="text-xl font-black text-stone-900">Your Shopping Cart ({totalItems})</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-700 text-xl font-bold p-2">✕</button>
              </div>

              <div className="py-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-stone-400 py-12 text-sm font-medium">Your cart is currently empty.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/60">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                      <div className="flex-1">
                        <h4 className="font-bold text-stone-900 text-sm leading-snug">{item.name}</h4>
                        <p className="text-xs text-emerald-900 font-bold mt-1">Rs. {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-sm">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-stone-600 font-bold text-xs px-1">-</button>
                        <span className="text-xs font-bold text-stone-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-stone-600 font-bold text-xs px-1">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="border-t border-stone-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Islandwide Shipping</span>
                  <span className="font-bold text-stone-900">{shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee}`}</span>
                </div>
                <div className="flex justify-between text-base font-black text-emerald-950 pt-2 border-t">
                  <span>Grand Total</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-4 rounded-2xl transition-all shadow-md active:scale-95 text-sm mt-2"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-stone-900">Complete Order</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-stone-400 hover:text-stone-700 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Nuwan Perera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="nuwan@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="077 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Delivery Address</label>
                <input
                  type="text"
                  required
                  placeholder="No. 45, Temple Road"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">City / Town</label>
                <input
                  type="text"
                  required
                  placeholder="Colombo"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                />
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mt-2">
                <div className="flex justify-between text-xs text-stone-600 mb-1">
                  <span>Items Total ({totalItems})</span>
                  <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600 mb-2">
                  <span>Shipping Fee</span>
                  <span className="font-bold">{shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-950 pt-2 border-t">
                  <span>Total Payable (Cash on Delivery)</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 text-sm mt-4"
              >
                Confirm & Place Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS NOTIFICATION MODAL */}
      {lastPlacedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
            <h3 className="text-2xl font-black text-stone-900">Order Placed Successfully!</h3>
            <p className="text-sm text-stone-600">
              Thank you for choosing Natural Cocos. Your order reference ID is <strong className="text-emerald-900">{lastPlacedOrderId}</strong>.
            </p>
            <button
              onClick={() => { setLastPlacedOrderId(null); setCurrentView('track'); }}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm mt-2"
            >
              Track Order Live
            </button>
          </div>
        </div>
      )}

      {/* Modern Footer */}
      <footer className="bg-emerald-950 text-emerald-100 py-12 mt-20 border-t border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">NATURAL <span className="text-amber-400">COCOS</span></span>
          </div>
          <p className="text-xs text-emerald-300 max-w-md mx-auto font-light">
            Bringing 100% pure, chemical-free cold-pressed coconut oil straight from Sri Lankan orchards to your doorstep.
          </p>
          <p className="text-[11px] text-emerald-500 pt-4 border-t border-emerald-900/50">
            © {new Date().getFullYear()} Natural Cocos. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}