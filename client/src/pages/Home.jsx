import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  Settings, 
  TrendingUp, 
  Users, 
  Package,
  Star,
  ArrowRight,
  Candy,
  Heart,
  Gift
} from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalSweets: 0,
    totalUsers: 0,
    lowStockCount: 0,
    recentPurchases: 0
  });
  const [featuredSweets, setFeaturedSweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://sweet-shop-management-psi.vercel.app/api/sweets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Dashboard API response:', response.data);
      // Handle the new response structure from server
      const sweets = Array.isArray(response.data) ? response.data : 
                    (response.data?.data && Array.isArray(response.data.data)) ? response.data.data : [];
      
      console.log('Processed sweets array:', sweets);
      
      // Calculate stats
      const lowStockCount = sweets.filter(sweet => (sweet.stock || sweet.quantity || 0) < 10).length;
      
      setStats({
        totalSweets: sweets.length,
        totalUsers: isAdmin ? 150 : 0, // Mock data for demo
        lowStockCount,
        recentPurchases: isAdmin ? 45 : user?.purchases || 12 // Mock data
      });

      // Get featured sweets (first 3)
      setFeaturedSweets(sweets.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, description }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <Icon size={24} color="white" />
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        <p className="stat-description">{description}</p>
      </div>
    </div>
  );

  const SweetCard = ({ sweet }) => (
    <div className="featured-sweet-card">
      <div className="sweet-image-placeholder">
        <Candy size={40} color="var(--primary-orange)" />
      </div>
      <div className="sweet-info">
        <h4 className="sweet-name">{sweet.name}</h4>
        <p className="sweet-category">{sweet.category}</p>
        <div className="sweet-price">₹{sweet.price}</div>
        <div className="sweet-stock">
          {sweet.quantity > 10 ? (
            <span className="stock-good">In Stock ({sweet.quantity})</span>
          ) : sweet.quantity > 0 ? (
            <span className="stock-low">Low Stock ({sweet.quantity})</span>
          ) : (
            <span className="stock-out">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pt-20">
      {/* Hero Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Welcome back, <span className="text-orange-500">{user?.name}!</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                {isAdmin 
                  ? "Manage your sweet shop with ease. Monitor inventory, track sales, and keep your customers happy."
                  : "Discover delicious sweets and treats. Your favorite confectionery store awaits!"
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAdmin ? (
                  <Link to="/admin" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center justify-center">
                    <Settings size={20} className="mr-2" />
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link to="/shopping" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center justify-center">
                    <ShoppingCart size={20} className="mr-2" />
                    Start Shopping
                  </Link>
                )}
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center relative">
              <div className="relative">
                <div className="bg-white rounded-full p-8 shadow-2xl">
                  <Candy size={120} className="text-orange-500" />
                </div>
                <div className="absolute -top-4 -right-4 text-red-500 animate-pulse">
                  <Heart size={24} />
                </div>
                <div className="absolute -bottom-4 -left-4 text-purple-500 animate-bounce">
                  <Gift size={28} />
                </div>
                <div className="absolute top-8 -left-8 text-yellow-500 animate-spin">
                  <Star size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {isAdmin ? "Shop Overview" : "Your Sweet Journey"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isAdmin ? (
              <>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center shadow-lg">
                  <div className="flex justify-center mb-4">
                    <Package className="h-8 w-8 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{stats.totalSweets}</h3>
                  <p className="text-orange-600 font-medium">Total Products</p>
                  <p className="text-sm text-gray-600 mt-1">Available sweet varieties</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center shadow-lg">
                  <div className="flex justify-center mb-4">
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{stats.totalUsers}</h3>
                  <p className="text-green-600 font-medium">Total Customers</p>
                  <p className="text-sm text-gray-600 mt-1">Registered users</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center shadow-lg">
                  <div className="flex justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{stats.recentPurchases}</h3>
                  <p className="text-yellow-600 font-medium">Recent Sales</p>
                  <p className="text-sm text-gray-600 mt-1">Orders this week</p>
                </div>
                <div className={`bg-gradient-to-br rounded-xl p-6 text-center shadow-lg ${stats.lowStockCount > 5 ? 'from-red-50 to-red-100' : 'from-gray-50 to-gray-100'}`}>
                  <div className="flex justify-center mb-4">
                    <Package className={`h-8 w-8 ${stats.lowStockCount > 5 ? 'text-red-500' : 'text-gray-500'}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{stats.lowStockCount}</h3>
                  <p className={`font-medium ${stats.lowStockCount > 5 ? 'text-red-600' : 'text-gray-600'}`}>Low Stock Items</p>
                  <p className="text-sm text-gray-600 mt-1">Items need restocking</p>
                </div>
              </>
            ) : (
              <>
                <StatCard
                  icon={Candy}
                  title="Available Sweets"
                  value={stats.totalSweets}
                  color="var(--primary-orange)"
                  description="Delicious varieties to choose from"
                />
                <StatCard
                  icon={ShoppingCart}
                  title="Your Orders"
                  value={stats.recentPurchases}
                  color="var(--success)"
                  description="Total purchases made"
                />
                <StatCard
                  icon={Heart}
                  title="Favorites"
                  value="8"
                  color="var(--error)"
                  description="Saved to wishlist"
                />
                <StatCard
                  icon={Star}
                  title="Points Earned"
                  value="2,340"
                  color="var(--warning)"
                  description="Loyalty reward points"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Sweets Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Sweets</h2>
            <Link to="/shopping" className="flex items-center text-orange-500 hover:text-orange-600 font-medium">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredSweets.length > 0 ? featuredSweets.map((sweet) => (
              <div key={sweet.id} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <div className="flex justify-center mb-4">
                  {sweet.image_url && sweet.image_url.startsWith('http') ? (
                    <img 
                      src={sweet.image_url} 
                      alt={sweet.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : (
                    <Candy size={40} className="text-orange-500" />
                  )}
                  <Candy size={40} className="text-orange-500" style={{display: sweet.image_url && sweet.image_url.startsWith('http') ? 'none' : 'block'}} />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{sweet.name}</h4>
                <p className="text-orange-600 font-medium mb-2">{sweet.category}</p>
                <div className="text-xl font-bold text-orange-500 mb-3">₹{sweet.price}</div>
                <div className="text-sm">
                  {(sweet.quantity || sweet.stock || 0) > 10 ? (
                    <span className="text-green-600 bg-green-100 px-2 py-1 rounded">In Stock ({sweet.quantity || sweet.stock})</span>
                  ) : (sweet.quantity || sweet.stock || 0) > 0 ? (
                    <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Low Stock ({sweet.quantity || sweet.stock})</span>
                  ) : (
                    <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Out of Stock</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center py-12">
                <Candy size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No sweets available</h3>
                <p className="text-gray-500">Admin needs to add some delicious sweets first!</p>
                {isAdmin && (
                  <Link to="/admin" className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Add Sweets
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isAdmin ? (
              <>
                <Link to="/admin" className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-orange-500 group">
                  <Settings size={32} className="text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Manage Inventory</h4>
                  <p className="text-gray-600">Add, edit, or remove sweet products</p>
                </Link>
                <Link to="/admin" className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-orange-500 group">
                  <TrendingUp size={32} className="text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">View Analytics</h4>
                  <p className="text-gray-600">Track sales and performance metrics</p>
                </Link>
                <Link to="/admin" className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-orange-500 group">
                  <Users size={32} className="text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Customer Management</h4>
                  <p className="text-gray-600">View and manage customer accounts</p>
                </Link>
              </>
            ) : (
              <>
                <Link to="/shopping" className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-orange-500 group">
                  <ShoppingCart size={32} className="text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Browse Sweets</h4>
                  <p className="text-gray-600">Explore our delicious collection</p>
                </Link>
                <Link to="/shopping" className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-orange-500 group">
                  <Heart size={32} className="text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Favorites</h4>
                  <p className="text-gray-600">View your saved sweet items</p>
                </Link>
                <Link to="/shopping" className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-orange-500 group">
                  <Gift size={32} className="text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Gift Cards</h4>
                  <p className="text-gray-600">Purchase sweet gift cards</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;