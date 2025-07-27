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
      const sweets = Array.isArray(response.data) ? response.data : [];
      
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pt-16">
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
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Sweets</h2>
            <Link to="/shopping" className="section-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="featured-grid">
            {featuredSweets.map((sweet) => (
              <SweetCard key={sweet.id} sweet={sweet} />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="actions-section">
        <div className="container">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            {isAdmin ? (
              <>
                <Link to="/admin" className="action-card">
                  <Settings size={32} />
                  <h4>Manage Inventory</h4>
                  <p>Add, edit, or remove sweet products</p>
                </Link>
                <Link to="/admin" className="action-card">
                  <TrendingUp size={32} />
                  <h4>View Analytics</h4>
                  <p>Track sales and performance metrics</p>
                </Link>
                <Link to="/admin" className="action-card">
                  <Users size={32} />
                  <h4>Customer Management</h4>
                  <p>View and manage customer accounts</p>
                </Link>
              </>
            ) : (
              <>
                <Link to="/shopping" className="action-card">
                  <ShoppingCart size={32} />
                  <h4>Browse Sweets</h4>
                  <p>Explore our delicious collection</p>
                </Link>
                <Link to="/shopping" className="action-card">
                  <Heart size={32} />
                  <h4>Favorites</h4>
                  <p>View your saved sweet items</p>
                </Link>
                <Link to="/shopping" className="action-card">
                  <Gift size={32} />
                  <h4>Gift Cards</h4>
                  <p>Purchase sweet gift cards</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-container {
          min-height: calc(100vh - 70px);
          animation: fadeIn 0.6s ease-out;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        /* Hero Section */
        .hero-section {
          background: var(--orange-gradient);
          color: white;
          padding: 4rem 0;
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="candy" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="4" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23candy)"/></svg>');
          opacity: 0.3;
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .hero-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .hero-candy {
          animation: float 3s ease-in-out infinite;
        }

        .floating-icons {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .float-1, .float-2, .float-3 {
          position: absolute;
          animation: float 2s ease-in-out infinite;
          color: rgba(255, 255, 255, 0.7);
        }

        .float-1 {
          top: 20%;
          left: 20%;
          animation-delay: 0.5s;
        }

        .float-2 {
          top: 60%;
          right: 20%;
          animation-delay: 1s;
        }

        .float-3 {
          bottom: 20%;
          left: 40%;
          animation-delay: 1.5s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        /* Stats Section */
        .stats-section {
          padding: 4rem 0;
          background: white;
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--orange-text);
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: var(--transition);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: var(--orange-text);
          margin-bottom: 0.25rem;
        }

        .stat-title {
          font-weight: 600;
          color: var(--black);
          margin-bottom: 0.25rem;
        }

        .stat-description {
          font-size: 0.9rem;
          color: var(--gray);
        }

        /* Featured Section */
        .featured-section {
          padding: 4rem 0;
          background: var(--light-gray);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .section-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-orange);
          text-decoration: none;
          font-weight: 600;
          transition: var(--transition);
        }

        .section-link:hover {
          color: var(--dark-orange);
        }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .featured-sweet-card {
          background: white;
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: var(--transition);
        }

        .featured-sweet-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
        }

        .sweet-image-placeholder {
          height: 150px;
          background: var(--orange-light);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sweet-info {
          padding: 1.5rem;
        }

        .sweet-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--orange-text);
          margin-bottom: 0.5rem;
        }

        .sweet-category {
          color: var(--gray);
          margin-bottom: 0.75rem;
        }

        .sweet-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-orange);
          margin-bottom: 0.5rem;
        }

        .sweet-stock {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .stock-good { color: var(--success); }
        .stock-low { color: var(--warning); }
        .stock-out { color: var(--error); }

        /* Actions Section */
        .actions-section {
          padding: 4rem 0;
          background: white;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .action-card {
          background: white;
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          text-decoration: none;
          color: inherit;
          transition: var(--transition);
          text-align: center;
          border: 2px solid transparent;
        }

        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
          border-color: var(--primary-orange);
        }

        .action-card svg {
          color: var(--primary-orange);
          margin-bottom: 1rem;
        }

        .action-card h4 {
          color: var(--orange-text);
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
        }

        .action-card p {
          color: var(--gray);
          font-size: 0.9rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 2rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1.1rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }

          .stats-grid,
          .featured-grid,
          .actions-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
