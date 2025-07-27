import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Candy, 
  Star, 
  Heart, 
  Gift, 
  ShoppingCart, 
  Users, 
  Trophy,
  ArrowRight,
  Sparkles,
  Loader
} from 'lucide-react';

const Landing = () => {
  const [featuredSweets, setFeaturedSweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fallback sweets data
  const fallbackSweets = [
    {
      id: 1,
      name: "Chocolate Delights",
      description: "Rich and creamy chocolate sweets",
      image_url: "🍫",
      price: 899,
      rating: 4.8,
      stock: 50
    },
    {
      id: 2,
      name: "Fruity Gummies",
      description: "Fresh fruit flavored gummy bears",
      image_url: "🍬",
      price: 649,
      rating: 4.6,
      stock: 75
    },
    {
      id: 3,
      name: "Classic Candies",
      description: "Traditional hard candies assortment",
      image_url: "🍭",
      price: 1199,
      rating: 4.9,
      stock: 30
    }
  ];

  useEffect(() => {
    fetchSweets();
  }, []);

  const fetchSweets = async () => {
    try {
      setLoading(true);
      console.log('Fetching sweets from API...');
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sweet-shop-management-psi.vercel.app';
      const sweetsUrl = `${API_BASE_URL}/api/sweets`;
      
      console.log('Fetching from URL:', sweetsUrl);
      
      const response = await axios.get(sweetsUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Sweets API response:', response.data);
      
      // Handle the new response structure from server
      let sweets = [];
      if (Array.isArray(response.data)) {
        sweets = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        sweets = response.data.data;
      }
      
      console.log('Processed sweets for landing:', sweets);
      
      if (sweets.length > 0) {
        // Take first 3 sweets for featured section
        setFeaturedSweets(sweets.slice(0, 3));
      } else {
        console.warn('No sweets found in API response, using fallback data');
        setFeaturedSweets(fallbackSweets);
      }
    } catch (error) {
      console.error('Error fetching sweets:', error);
      
      // If it's an authentication error (401) or network error, use fallback
      if (error.response?.status === 401 || error.response?.data?.error === 'Invalid token') {
        console.log('API requires authentication, using fallback data for public landing page');
        setError('Showing sample sweets - real products available after login');
      } else {
        console.warn('Network error, using fallback sweets data');
        setError('Could not connect to server, showing sample data');
      }
      
      setFeaturedSweets(fallbackSweets);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Candy className="h-8 w-8 text-orange-500" />,
      title: "Premium Quality",
      description: "Hand-selected finest ingredients for the best taste"
    },
    {
      icon: <Gift className="h-8 w-8 text-orange-500" />,
      title: "Perfect Gifts",
      description: "Beautiful packaging for special occasions"
    },
    {
      icon: <Heart className="h-8 w-8 text-orange-500" />,
      title: "Made with Love",
      description: "Crafted with care and attention to detail"
    },
    {
      icon: <Trophy className="h-8 w-8 text-orange-500" />,
      title: "Award Winning",
      description: "Recognized for excellence in confectionery"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pt-20">
      {/* Navigation */}
      <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Candy className="h-8 w-8 text-orange-500 mr-2" />
                <span className="text-xl font-bold text-gray-800">Sweet Shop</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-full shadow-lg">
                <Sparkles className="h-12 w-12 text-orange-500" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to
              <span className="text-orange-500 block">Sweet Shop Paradise</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover the finest collection of artisanal sweets, chocolates, and confectioneries. 
              Made with love, crafted with precision, and delivered with joy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Shopping <ArrowRight className="inline h-5 w-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-gray-50 text-orange-500 border-2 border-orange-500 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 text-4xl animate-bounce">🍭</div>
        <div className="absolute top-32 right-20 text-3xl animate-pulse">🍫</div>
        <div className="absolute bottom-20 left-20 text-3xl animate-bounce delay-300">🍬</div>
        <div className="absolute bottom-32 right-10 text-4xl animate-pulse delay-500">🧁</div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Sweets</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our most popular treats that have captured hearts and taste buds worldwide
            </p>
            {error && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4 max-w-2xl mx-auto">
                {error}
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2 text-gray-600">Loading delicious sweets...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredSweets.map((sweet, index) => (
                <div key={sweet.id || index} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-200 shadow-lg">
                  <div className="text-6xl mb-4">
                    {sweet.image_url && sweet.image_url.startsWith('http') ? (
                      <img 
                        src={sweet.image_url} 
                        alt={sweet.name}
                        className="w-16 h-16 mx-auto object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : (
                      <span>{sweet.image_url || '🍬'}</span>
                    )}
                    <span style={{display: 'none'}}>🍬</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{sweet.name}</h3>
                  <p className="text-gray-600 mb-4">{sweet.description}</p>
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(sweet.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({sweet.rating || 4.5})</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-500 mb-2">
                    ₹{typeof sweet.price === 'number' ? sweet.price : sweet.price}
                  </div>
                  {sweet.stock && (
                    <div className="text-sm text-gray-500 mb-4">
                      {sweet.stock > 0 ? `${sweet.stock} in stock` : 'Out of stock'}
                    </div>
                  )}
                  <Link
                    to="/register"
                    className={`px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center ${
                      sweet.stock > 0 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {sweet.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Sweet Shop?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're committed to delivering the finest sweet experience with every order
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">50K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">200+</div>
              <div className="text-gray-600">Sweet Varieties</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">15+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Satisfy Your Sweet Tooth?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of happy customers and start your sweet journey today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white hover:bg-gray-100 text-orange-500 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Create Account <Users className="inline h-5 w-5 ml-2" />
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-orange-400 text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Sign In <ArrowRight className="inline h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Candy className="h-6 w-6 text-orange-500 mr-2" />
              <span className="text-lg font-semibold">Sweet Shop</span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2025 Sweet Shop. All rights reserved.</p>
              <p className="text-sm">Made with ❤️ for sweet lovers everywhere</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
