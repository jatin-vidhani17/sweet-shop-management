import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { Dialog } from '@headlessui/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  Package, Plus, Edit, Trash2, TrendingUp, Users, ShoppingCart,
  DollarSign, AlertTriangle, Upload, X, Save, Eye, BarChart3,
  Calendar, Filter, Search, RefreshCw, Image as ImageIcon
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';

export function AdminDashboard() {
    const { user } = useAuth();
    const [sweets, setSweets] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalCustomers: 0,
        lowStockItems: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSweet, setEditingSweet] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [activeTab, setActiveTab] = useState('inventory'); // inventory, analytics


    // Form state for add/edit
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        quantity: '',
        description: '',
        ingredients: '',
        image: null
    });

    const API_BASE_URL = 'https://sweet-shop-management-psi.vercel.app/api';

    // Colors for charts
    const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchSweets(),
                fetchAnalytics(),
                fetchSalesData()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSweets = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sweets`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched sweets:', data);
                setSweets(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch sweets:', response.status);
                setSweets([]);
            }
        } catch (error) {
            console.error('Error fetching sweets:', error);
            setSweets([]);
        }
    };

    const fetchAnalytics = async () => {
        try {
            // Mock analytics data - replace with actual API calls
            setAnalytics({
                totalRevenue: 15420.50,
                totalSales: 1250,
                totalCustomers: 320,
                lowStockItems: sweets.filter(sweet => sweet.quantity < 10).length
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const fetchSalesData = async () => {
        try {
            // Mock sales data for charts
            const weekStart = startOfWeek(new Date());
            const weekEnd = endOfWeek(new Date());
            const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

            const weeklyData = daysInWeek.map(day => ({
                date: format(day, 'MMM dd'),
                sales: Math.floor(Math.random() * 1000) + 200,
                revenue: Math.floor(Math.random() * 5000) + 1000
            }));

            setSalesData(weeklyData);
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    };

    // Image upload handler
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        multiple: false,
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sweetData = {
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity),
                description: formData.description,
                ingredients: formData.ingredients.split(',').map(i => i.trim()),
                image_url: formData.image ? URL.createObjectURL(formData.image) : null
            };

            const method = editingSweet ? 'PUT' : 'POST';
            const url = editingSweet
                ? `${API_BASE_URL}/sweets/${editingSweet.id}`
                : `${API_BASE_URL}/sweets`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sweetData)
            });

            if (response.ok) {
                fetchSweets();
                resetForm();
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error('Error saving sweet:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: '',
            price: '',
            quantity: '',
            description: '',
            ingredients: '',
            image: null
        });
        setEditingSweet(null);
    };

    const handleEdit = (sweet) => {
        setEditingSweet(sweet);
        setFormData({
            name: sweet.name,
            category: sweet.category,
            price: sweet.price.toString(),
            quantity: sweet.quantity.toString(),
            description: sweet.description || '',
            ingredients: sweet.ingredients ? sweet.ingredients.join(', ') : '',
            image: null
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this sweet?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/sweets/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchSweets();
                }
            } catch (error) {
                console.error('Error deleting sweet:', error);
            }
        }
    };

    const handleRestock = async (id, quantity) => {
        try {
            const response = await fetch(`${API_BASE_URL}/sweets/${id}/restock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: parseInt(quantity) })
            });
            if (response.ok) {
                fetchSweets();
            }
        } catch (error) {
            console.error('Error restocking sweet:', error);
        }
    };

    // Filter sweets based on search and category
    const filteredSweets = Array.isArray(sweets) ? sweets.filter(sweet => {
        const matchesSearch = sweet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sweet.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || sweet.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }) : [];

    const categories = Array.isArray(sweets) ? [...new Set(sweets.map(sweet => sweet.category).filter(Boolean))] : [];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <span className="text-gray-600">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600">Welcome back, {user?.name}</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'inventory'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <Package className="h-4 w-4 inline mr-2" />
                                Inventory
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analytics'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <BarChart3 className="h-4 w-4 inline mr-2" />
                                Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Analytics Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCart className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.totalSales.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.lowStockItems}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'analytics' ? (
                    <div className="space-y-8">
                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Daily Sales Chart */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={salesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Revenue Chart */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={salesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="revenue" fill="#f97316" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Distribution */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={categories.map((category, index) => ({
                                            name: category,
                                            value: sweets.filter(s => s.category === category).length,
                                            color: COLORS[index % COLORS.length]
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Inventory Controls */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <input
                                            type="text"
                                            placeholder="Search sweets..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                                    </div>

                                    {/* Category Filter */}
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category.charAt(0).toUpperCase() + category.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={fetchData}
                                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setIsAddModalOpen(true);
                                        } }
                                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Sweet
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredSweets.map((sweet) => (
                                <div key={sweet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Image */}
                                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                                        {sweet.image_url ? (
                                            <img
                                                src={sweet.image_url}
                                                alt={sweet.name}
                                                className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-12 w-12 text-gray-400" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 truncate">{sweet.name}</h3>
                                                <p className="text-sm text-gray-600 capitalize">{sweet.category}</p>
                                                <p className="text-lg font-bold text-orange-600">${sweet.price}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${sweet.quantity < 10
                                                    ? 'bg-red-100 text-red-800'
                                                    : sweet.quantity < 20
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'}`}>
                                                {sweet.quantity} left
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-4 flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(sweet)}
                                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const quantity = prompt('Enter restock quantity:');
                                                    if (quantity && !isNaN(quantity)) {
                                                        handleRestock(sweet.id, quantity);
                                                    }
                                                } }
                                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                <Package className="h-4 w-4 mr-1" />
                                                Restock
                                            </button>
                                            <button
                                                onClick={() => handleDelete(sweet.id)}
                                                className="flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredSweets.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No sweets found</h3>
                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Sweet Modal */}
            <Dialog open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <Dialog.Title className="text-lg font-semibold">Add New Sweet</Dialog.Title>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    <input {...getInputProps()} />
                                    {formData.image ? (
                                        <div className="space-y-2">
                                            <img
                                                src={URL.createObjectURL(formData.image)}
                                                alt="Preview"
                                                className="mx-auto h-20 w-20 object-cover rounded" />
                                            <p className="text-sm text-gray-600">{formData.image.name}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <p className="text-sm text-gray-600">
                                                {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        <option value="chocolate">Chocolate</option>
                                        <option value="candy">Candy</option>
                                        <option value="gummy">Gummy</option>
                                        <option value="dessert">Dessert</option>
                                        <option value="hard-candy">Hard Candy</option>
                                        <option value="lollipop">Lollipop</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma-separated)</label>
                                <input
                                    type="text"
                                    name="ingredients"
                                    value={formData.ingredients}
                                    onChange={handleInputChange}
                                    placeholder="sugar, chocolate, milk..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    <Save className="h-4 w-4 inline mr-2" />
                                    Add Sweet
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Edit Sweet Modal */}
            <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <Dialog.Title className="text-lg font-semibold">Edit Sweet</Dialog.Title>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Same form fields as Add Modal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    <input {...getInputProps()} />
                                    {formData.image ? (
                                        <div className="space-y-2">
                                            <img
                                                src={URL.createObjectURL(formData.image)}
                                                alt="Preview"
                                                className="mx-auto h-20 w-20 object-cover rounded" />
                                            <p className="text-sm text-gray-600">{formData.image.name}</p>
                                        </div>
                                    ) : editingSweet?.image_url ? (
                                        <div className="space-y-2">
                                            <img
                                                src={editingSweet.image_url}
                                                alt="Current"
                                                className="mx-auto h-20 w-20 object-cover rounded" />
                                            <p className="text-sm text-gray-600">Current image</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <p className="text-sm text-gray-600">
                                                {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        <option value="chocolate">Chocolate</option>
                                        <option value="candy">Candy</option>
                                        <option value="gummy">Gummy</option>
                                        <option value="dessert">Dessert</option>
                                        <option value="hard-candy">Hard Candy</option>
                                        <option value="lollipop">Lollipop</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma-separated)</label>
                                <input
                                    type="text"
                                    name="ingredients"
                                    value={formData.ingredients}
                                    onChange={handleInputChange}
                                    placeholder="sugar, chocolate, milk..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    <Save className="h-4 w-4 inline mr-2" />
                                    Update Sweet
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
}

