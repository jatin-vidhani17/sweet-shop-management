import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Package, 
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Candy,
  Settings
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSweet, setSelectedSweet] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [stats, setStats] = useState({
    totalSweets: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: ''
  });

  const categories = ['Chocolate', 'Candy', 'Gummy', 'Hard Candy', 'Lollipop', 'Caramel'];

  useEffect(() => {
    fetchSweets();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [sweets]);

  const fetchSweets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/sweets');
      const sweetsData = response.data.sweets || [];
      setSweets(sweetsData);
    } catch (error) {
      console.error('Error fetching sweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalSweets = sweets.length;
    const totalValue = sweets.reduce((sum, sweet) => sum + (sweet.price * sweet.quantity), 0);
    const lowStockCount = sweets.filter(sweet => sweet.quantity > 0 && sweet.quantity < 10).length;
    const outOfStockCount = sweets.filter(sweet => sweet.quantity === 0).length;

    setStats({
      totalSweets,
      totalValue,
      lowStockCount,
      outOfStockCount
    });
  };

  const filteredSweets = sweets.filter(sweet => {
    const matchesSearch = sweet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sweet.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || sweet.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      quantity: '',
      description: ''
    });
  };

  const handleAddSweet = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(prev => ({ ...prev, add: true }));
      
      const response = await axios.post('/sweets', {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      });

      setSweets(prev => [...prev, response.data.sweet]);
      setShowAddModal(false);
      resetForm();
      alert('Sweet added successfully!');
    } catch (error) {
      console.error('Error adding sweet:', error);
      alert(error.response?.data?.message || 'Failed to add sweet');
    } finally {
      setActionLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleEditSweet = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(prev => ({ ...prev, edit: true }));
      
      const response = await axios.put(`/sweets/${selectedSweet.id}`, {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      });

      setSweets(prev => prev.map(sweet => 
        sweet.id === selectedSweet.id ? response.data.sweet : sweet
      ));
      setShowEditModal(false);
      setSelectedSweet(null);
      resetForm();
      alert('Sweet updated successfully!');
    } catch (error) {
      console.error('Error updating sweet:', error);
      alert(error.response?.data?.message || 'Failed to update sweet');
    } finally {
      setActionLoading(prev => ({ ...prev, edit: false }));
    }
  };

  const handleDeleteSweet = async (sweetId) => {
    if (!confirm('Are you sure you want to delete this sweet?')) return;

    try {
      setActionLoading(prev => ({ ...prev, [sweetId]: true }));
      
      await axios.delete(`/sweets/${sweetId}`);
      setSweets(prev => prev.filter(sweet => sweet.id !== sweetId));
      alert('Sweet deleted successfully!');
    } catch (error) {
      console.error('Error deleting sweet:', error);
      alert(error.response?.data?.message || 'Failed to delete sweet');
    } finally {
      setActionLoading(prev => ({ ...prev, [sweetId]: false }));
    }
  };

  const handleRestock = async (sweetId, additionalQuantity) => {
    try {
      setActionLoading(prev => ({ ...prev, [`restock_${sweetId}`]: true }));
      
      const response = await axios.post(`/sweets/${sweetId}/restock`, {
        quantity: parseInt(additionalQuantity)
      });

      setSweets(prev => prev.map(sweet => 
        sweet.id === sweetId ? response.data.sweet : sweet
      ));
      alert('Sweet restocked successfully!');
    } catch (error) {
      console.error('Error restocking sweet:', error);
      alert(error.response?.data?.message || 'Failed to restock sweet');
    } finally {
      setActionLoading(prev => ({ ...prev, [`restock_${sweetId}`]: false }));
    }
  };

  const openEditModal = (sweet) => {
    setSelectedSweet(sweet);
    setFormData({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price.toString(),
      quantity: sweet.quantity.toString(),
      description: sweet.description || ''
    });
    setShowEditModal(true);
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon" style={{ backgroundColor: color }}>
          <Icon size={24} color="white" />
        </div>
        <div className="stat-trend">
          {trend && <TrendingUp size={16} color={color} />}
        </div>
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
      </div>
    </div>
  );

  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{title}</h3>
            <button onClick={onClose} className="modal-close">&times;</button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.name}! Manage your sweet shop inventory.
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            Add New Sweet
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatCard
            icon={Package}
            title="Total Products"
            value={stats.totalSweets}
            color="var(--primary-orange)"
            trend={true}
          />
          <StatCard
            icon={DollarSign}
            title="Total Inventory Value"
            value={`$${stats.totalValue.toFixed(2)}`}
            color="var(--success)"
            trend={true}
          />
          <StatCard
            icon={AlertTriangle}
            title="Low Stock Items"
            value={stats.lowStockCount}
            color="var(--warning)"
          />
          <StatCard
            icon={Package}
            title="Out of Stock"
            value={stats.outOfStockCount}
            color="var(--error)"
          />
        </div>

        {/* Filters and Search */}
        <div className="controls-section">
          <div className="search-controls">
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search sweets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={fetchSweets}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Sweets Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>Sweet Inventory ({filteredSweets.length} items)</h3>
          </div>
          
          <div className="table-wrapper">
            <table className="sweets-table">
              <thead>
                <tr>
                  <th>Sweet</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSweets.map(sweet => (
                  <tr key={sweet.id}>
                    <td>
                      <div className="sweet-info">
                        <div className="sweet-icon">
                          <Candy size={20} color="var(--primary-orange)" />
                        </div>
                        <div>
                          <div className="sweet-name">{sweet.name}</div>
                          <div className="sweet-description">
                            {sweet.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{sweet.category}</span>
                    </td>
                    <td className="price">${sweet.price}</td>
                    <td>
                      <div className="stock-info">
                        <span className="stock-quantity">{sweet.quantity}</span>
                        {sweet.quantity < 10 && sweet.quantity > 0 && (
                          <button
                            className="restock-btn"
                            onClick={() => {
                              const quantity = prompt('Enter quantity to add:', '10');
                              if (quantity) handleRestock(sweet.id, quantity);
                            }}
                            disabled={actionLoading[`restock_${sweet.id}`]}
                          >
                            {actionLoading[`restock_${sweet.id}`] ? (
                              <RefreshCw size={12} className="spinning" />
                            ) : (
                              'Restock'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        sweet.quantity === 0 ? 'out-of-stock' :
                        sweet.quantity < 10 ? 'low-stock' : 'in-stock'
                      }`}>
                        {sweet.quantity === 0 ? 'Out of Stock' :
                         sweet.quantity < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit"
                          onClick={() => openEditModal(sweet)}
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteSweet(sweet.id)}
                          disabled={actionLoading[sweet.id]}
                          title="Delete"
                        >
                          {actionLoading[sweet.id] ? (
                            <RefreshCw size={16} className="spinning" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredSweets.length === 0 && (
            <div className="no-results">
              <Candy size={64} color="var(--gray)" />
              <h3>No sweets found</h3>
              <p>Try adjusting your search or add new sweets to your inventory</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal 
        show={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Sweet"
      >
        <form onSubmit={handleAddSweet} className="sweet-form">
          <div className="form-group">
            <label>Sweet Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              className="form-select"
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                className="form-input"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleFormChange}
                className="form-input"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="form-textarea"
              placeholder="Optional description..."
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setShowAddModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={actionLoading.add}
            >
              {actionLoading.add ? 'Adding...' : 'Add Sweet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        show={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Sweet"
      >
        <form onSubmit={handleEditSweet} className="sweet-form">
          <div className="form-group">
            <label>Sweet Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              className="form-select"
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                className="form-input"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleFormChange}
                className="form-input"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="form-textarea"
              placeholder="Optional description..."
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setShowEditModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={actionLoading.edit}
            >
              {actionLoading.edit ? 'Updating...' : 'Update Sweet'}
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .admin-container {
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

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          transition: var(--transition);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: var(--orange-text);
          margin-bottom: 0.25rem;
        }

        .stat-title {
          color: var(--gray);
          font-weight: 500;
        }

        .controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
        }

        .search-controls {
          display: flex;
          gap: 1rem;
          flex: 1;
        }

        .search-bar {
          position: relative;
          flex: 1;
          max-width: 400px;
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
        }

        .category-filter {
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: var(--border-radius);
          background: white;
        }

        .table-container {
          background: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .table-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .table-header h3 {
          color: var(--orange-text);
          margin: 0;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .sweets-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sweets-table th {
          background: var(--light-gray);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: var(--orange-text);
          border-bottom: 2px solid #e0e0e0;
        }

        .sweets-table td {
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: middle;
        }

        .sweet-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sweet-icon {
          width: 40px;
          height: 40px;
          background: var(--orange-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sweet-name {
          font-weight: 600;
          color: var(--black);
        }

        .sweet-description {
          font-size: 0.85rem;
          color: var(--gray);
        }

        .category-badge {
          background: var(--orange-light);
          color: var(--orange-text);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .price {
          font-weight: 600;
          color: var(--primary-orange);
          font-size: 1.1rem;
        }

        .stock-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stock-quantity {
          font-weight: 600;
        }

        .restock-btn {
          background: var(--warning);
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .restock-btn:hover {
          background: #f57c00;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .status-badge.in-stock {
          background: #e8f5e8;
          color: var(--success);
        }

        .status-badge.low-stock {
          background: #fff8e1;
          color: var(--warning);
        }

        .status-badge.out-of-stock {
          background: #ffebee;
          color: var(--error);
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.edit {
          background: var(--orange-light);
          color: var(--orange-text);
        }

        .action-btn.edit:hover {
          background: var(--primary-orange);
          color: white;
        }

        .action-btn.delete {
          background: #ffebee;
          color: var(--error);
        }

        .action-btn.delete:hover {
          background: var(--error);
          color: white;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: var(--gray);
        }

        .no-results h3 {
          color: var(--dark-gray);
          margin: 1rem 0 0.5rem;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: var(--border-radius);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h3 {
          color: var(--orange-text);
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--gray);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: var(--light-gray);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .sweet-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .page-title {
            font-size: 2rem;
          }

          .controls-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-controls {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .sweets-table {
            font-size: 0.9rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
