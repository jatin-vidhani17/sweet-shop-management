import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Heart,
  Star,
  Candy,
  SortDesc,
  Grid,
  List,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const Shopping = () => {
  const { user } = useAuth();
  const [sweets, setSweets] = useState([]);
  const [filteredSweets, setFilteredSweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState({});

  const categories = ['Chocolate', 'Candy', 'Gummy', 'Hard Candy', 'Lollipop', 'Caramel'];

  useEffect(() => {
    fetchSweets();
  }, []);

  useEffect(() => {
    filterAndSortSweets();
  }, [sweets, searchQuery, selectedCategory, priceRange, sortBy]);

  const fetchSweets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://sweet-shop-management-psi.vercel.app/api/sweets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      // Handle the new response structure from server
      const sweetsData = Array.isArray(response.data) ? response.data : 
                        (response.data?.data && Array.isArray(response.data.data)) ? response.data.data : [];
      setSweets(sweetsData);
      console.log('Fetched sweets for shopping:', sweetsData);
    } catch (error) {
      console.error('Error fetching sweets:', error);
      // Set empty array as fallback
      setSweets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSweets = () => {
    let filtered = [...sweets];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(sweet =>
        sweet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sweet.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(sweet => sweet.category === selectedCategory);
    }

    // Price range filter
    if (priceRange.min !== '') {
      filtered = filtered.filter(sweet => sweet.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(sweet => sweet.price <= parseFloat(priceRange.max));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredSweets(filtered);
  };

  const handlePurchase = async (sweetId, quantity = 1) => {
    try {
      setPurchaseLoading(prev => ({ ...prev, [sweetId]: true }));
      
      await axios.post(`/sweets/${sweetId}/purchase`, {
        quantity,
        customerId: user.id
      });

      // Update the sweet quantity locally
      setSweets(prev => prev.map(sweet => 
        sweet.id === sweetId 
          ? { ...sweet, quantity: sweet.quantity - quantity }
          : sweet
      ));

      // Add to cart simulation
      setCart(prev => {
        const existingItem = prev.find(item => item.id === sweetId);
        if (existingItem) {
          return prev.map(item =>
            item.id === sweetId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const sweet = sweets.find(s => s.id === sweetId);
          return [...prev, { ...sweet, quantity }];
        }
      });

      alert('Sweet purchased successfully!');
    } catch (error) {
      console.error('Error purchasing sweet:', error);
      alert(error.response?.data?.message || 'Failed to purchase sweet');
    } finally {
      setPurchaseLoading(prev => ({ ...prev, [sweetId]: false }));
    }
  };

  const toggleFavorite = (sweetId) => {
    setFavorites(prev => {
      if (prev.includes(sweetId)) {
        return prev.filter(id => id !== sweetId);
      } else {
        return [...prev, sweetId];
      }
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
  };

  const SweetCard = ({ sweet, isListView = false }) => (
    <div className={`sweet-card ${isListView ? 'list-view' : ''}`}>
      <div className="sweet-image">
        <Candy size={isListView ? 30 : 60} color="var(--primary-orange)" />
        <button 
          className={`favorite-btn ${favorites.includes(sweet.id) ? 'active' : ''}`}
          onClick={() => toggleFavorite(sweet.id)}
        >
          <Heart size={16} fill={favorites.includes(sweet.id) ? 'currentColor' : 'none'} />
        </button>
      </div>
      
      <div className="sweet-content">
        <div className="sweet-header">
          <h3 className="sweet-name">{sweet.name}</h3>
          <div className="sweet-rating">
            <Star size={14} fill="currentColor" />
            <span>4.5</span>
          </div>
        </div>
        
        <p className="sweet-category">{sweet.category}</p>
        <p className="sweet-description">{sweet.description || 'Delicious sweet treat'}</p>
        
        <div className="sweet-footer">
          <div className="sweet-price">${sweet.price}</div>
          <div className="sweet-stock">
            {sweet.quantity > 10 ? (
              <span className="stock-good">In Stock</span>
            ) : sweet.quantity > 0 ? (
              <span className="stock-low">Only {sweet.quantity} left!</span>
            ) : (
              <span className="stock-out">Out of Stock</span>
            )}
          </div>
        </div>
        
        <div className="sweet-actions">
          <button
            className="btn btn-primary btn-small"
            onClick={() => handlePurchase(sweet.id)}
            disabled={sweet.quantity === 0 || purchaseLoading[sweet.id]}
          >
            {purchaseLoading[sweet.id] ? (
              <RefreshCw size={16} className="spinning" />
            ) : (
              <ShoppingCart size={16} />
            )}
            {purchaseLoading[sweet.id] ? 'Buying...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sweet treats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sweet Shopping</h1>
          <p className="text-xl text-gray-600">
            Discover our delicious collection of sweets and treats
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search for sweets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="toolbar">
            <button 
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
            
            <div className="view-controls">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="price-input"
                />
              </div>
            </div>
            
            <button onClick={clearFilters} className="btn btn-secondary btn-small">
              Clear Filters
            </button>
          </div>
        )}

        {/* Results Info */}
        <div className="results-info">
          <span>{filteredSweets.length} sweets found</span>
          {cart.length > 0 && (
            <span className="cart-info">
              <ShoppingCart size={16} />
              {cart.reduce((total, item) => total + item.quantity, 0)} items in cart
            </span>
          )}
        </div>

        {/* Sweet Grid/List */}
        <div className={`sweets-container ${viewMode}`}>
          {filteredSweets.length > 0 ? (
            filteredSweets.map(sweet => (
              <SweetCard 
                key={sweet.id} 
                sweet={sweet} 
                isListView={viewMode === 'list'} 
              />
            ))
          ) : (
            <div className="no-results">
              <Candy size={64} color="var(--gray)" />
              <h3>No sweets found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="btn btn-primary">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .shopping-container {
          min-height: calc(100vh - 70px);
          padding: 2rem 0;
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

        .shopping-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .page-title {
          font-size: 3rem;
          font-weight: 800;
          color: var(--orange-text);
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          font-size: 1.25rem;
          color: var(--gray);
        }

        .search-section {
          margin-bottom: 2rem;
        }

        .search-bar {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-bar svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray);
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 3rem;
          border: 2px solid #e0e0e0;
          border-radius: var(--border-radius);
          font-size: 1rem;
          transition: var(--transition);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }

        .toolbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 8px 16px;
          border: 1px solid var(--primary-orange);
          background: white;
          color: var(--primary-orange);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
        }

        .filter-toggle:hover {
          background: var(--primary-orange);
          color: white;
        }

        .view-controls {
          display: flex;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius);
          overflow: hidden;
        }

        .view-btn {
          padding: 8px 12px;
          border: none;
          background: white;
          color: var(--gray);
          cursor: pointer;
          transition: var(--transition);
        }

        .view-btn.active {
          background: var(--primary-orange);
          color: white;
        }

        .sort-select {
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius);
          background: white;
          cursor: pointer;
        }

        .filters-panel {
          background: white;
          padding: 1.5rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          margin-bottom: 2rem;
          display: flex;
          gap: 2rem;
          align-items: end;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 600;
          color: var(--orange-text);
          font-size: 0.9rem;
        }

        .filter-select,
        .price-input {
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius);
          background: white;
        }

        .price-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .price-input {
          width: 80px;
        }

        .results-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          font-weight: 500;
        }

        .cart-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-orange);
        }

        .sweets-container.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }

        .sweets-container.list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .sweet-card {
          background: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          transition: var(--transition);
          overflow: hidden;
        }

        .sweet-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
        }

        .sweet-card.list-view {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .sweet-image {
          height: 150px;
          background: var(--orange-light);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .sweet-card.list-view .sweet-image {
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .favorite-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border: none;
          background: white;
          border-radius: 50%;
          color: var(--gray);
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .favorite-btn:hover,
        .favorite-btn.active {
          color: var(--error);
          background: #ffebee;
        }

        .sweet-content {
          padding: 1.5rem;
          flex: 1;
        }

        .sweet-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.5rem;
        }

        .sweet-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--orange-text);
          margin: 0;
        }

        .sweet-rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--warning);
          font-size: 0.9rem;
        }

        .sweet-category {
          color: var(--gray);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .sweet-description {
          color: var(--dark-gray);
          font-size: 0.9rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .sweet-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .sweet-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-orange);
        }

        .sweet-stock {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .stock-good { color: var(--success); }
        .stock-low { color: var(--warning); }
        .stock-out { color: var(--error); }

        .sweet-actions {
          display: flex;
          gap: 0.5rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: var(--gray);
        }

        .no-results h3 {
          margin: 1rem 0 0.5rem;
          color: var(--dark-gray);
        }

        .no-results p {
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 2rem;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }

          .filters-panel {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .results-info {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
          }

          .sweets-container.grid {
            grid-template-columns: 1fr;
          }

          .sweet-card.list-view {
            flex-direction: column;
          }

          .sweet-card.list-view .sweet-image {
            width: 100%;
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default Shopping;
