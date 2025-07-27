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
      const response = await axios.get('/sweets');
      const sweets = response.data.sweets || [];
      
      // Calculate stats
      const lowStockCount = sweets.filter(sweet => sweet.quantity < 10).length;
      
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
        <div className="sweet-price">${sweet.price}</div>
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Welcome back, <span className="orange-text">{user?.name}!</span>
              </h1>
              <p className="hero-subtitle">
                {isAdmin 
                  ? "Manage your sweet shop with ease. Monitor inventory, track sales, and keep your customers happy."
                  : "Discover delicious sweets and treats. Your favorite confectionery store awaits!"
                }
              </p>
              <div className="hero-actions">
                {isAdmin ? (
                  <Link to="/admin" className="btn btn-primary">
                    <Settings size={20} />
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link to="/shopping" className="btn btn-primary">
                    <ShoppingCart size={20} />
                    Start Shopping
                  </Link>
                )}
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-candy">
                <Candy size={120} color="var(--primary-orange)" />
              </div>
              <div className="floating-icons">
                <Heart size={24} className="float-1" />
                <Gift size={28} className="float-2" />
                <Star size={20} className="float-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <h2 className="section-title">
            {isAdmin ? "Shop Overview" : "Your Sweet Journey"}
          </h2>
          <div className="stats-grid">
            {isAdmin ? (
              <>
                <StatCard
                  icon={Package}
                  title="Total Products"
                  value={stats.totalSweets}
                  color="var(--primary-orange)"
                  description="Available sweet varieties"
                />
                <StatCard
                  icon={Users}
                  title="Total Customers"
                  value={stats.totalUsers}
                  color="var(--success)"
                  description="Registered users"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Recent Sales"
                  value={stats.recentPurchases}
                  color="var(--warning)"
                  description="Orders this week"
                />
                <StatCard
                  icon={Package}
                  title="Low Stock Items"
                  value={stats.lowStockCount}
                  color={stats.lowStockCount > 5 ? "var(--error)" : "var(--gray)"}
                  description="Items need restocking"
                />
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
