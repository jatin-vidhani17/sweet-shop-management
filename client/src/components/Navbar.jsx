import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Candy
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shopping', label: 'Shopping', icon: ShoppingCart },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: Settings }] : [])
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <Candy className="brand-icon" />
          <span className="brand-text">Sweet Shop</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button className="mobile-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          box-shadow: 0 2px 10px rgba(255, 107, 53, 0.1);
          z-index: 1000;
          border-bottom: 3px solid var(--primary-orange);
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--primary-orange);
          font-weight: 700;
          font-size: 1.5rem;
        }

        .brand-icon {
          color: var(--primary-orange);
        }

        .brand-text {
          background: var(--orange-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          text-decoration: none;
          color: var(--dark-gray);
          border-radius: var(--border-radius);
          transition: var(--transition);
          font-weight: 500;
        }

        .nav-link:hover {
          background: var(--orange-light);
          color: var(--orange-text);
        }

        .nav-link.active {
          background: var(--primary-orange);
          color: white;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--orange-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .user-name {
          font-weight: 600;
          color: var(--black);
          font-size: 0.9rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--gray);
          text-transform: capitalize;
        }

        .logout-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          color: var(--gray);
          cursor: pointer;
          border-radius: var(--border-radius);
          transition: var(--transition);
        }

        .logout-btn:hover {
          background: #ffebee;
          color: var(--error);
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--primary-orange);
          cursor: pointer;
          padding: 0.5rem;
        }

        .mobile-nav {
          display: none;
          flex-direction: column;
          background: white;
          border-top: 1px solid #e0e0e0;
          padding: 1rem;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          text-decoration: none;
          color: var(--dark-gray);
          border-radius: var(--border-radius);
          transition: var(--transition);
          font-weight: 500;
        }

        .mobile-nav-link:hover,
        .mobile-nav-link.active {
          background: var(--orange-light);
          color: var(--orange-text);
        }

        .mobile-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: none;
          border: none;
          color: var(--error);
          cursor: pointer;
          border-radius: var(--border-radius);
          transition: var(--transition);
          font-weight: 500;
          margin-top: 0.5rem;
          border-top: 1px solid #e0e0e0;
          width: 100%;
          text-align: left;
        }

        .mobile-logout-btn:hover {
          background: #ffebee;
        }

        @media (max-width: 768px) {
          .desktop-nav,
          .user-details {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .mobile-nav {
            display: flex;
          }

          .navbar-container {
            padding: 0 0.5rem;
          }

          .user-info {
            gap: 0.5rem;
          }

          .user-avatar {
            width: 35px;
            height: 35px;
            font-size: 1rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
