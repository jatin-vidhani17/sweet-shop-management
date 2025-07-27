// Development mock data for when server is unavailable
export const mockUsers = {
  'admin@test.com': {
    id: 1,
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    password: 'test123' // In real app, this would be hashed
  },
  'customer@test.com': {
    id: 2,
    email: 'customer@test.com', 
    name: 'Customer User',
    role: 'customer',
    password: 'test123'
  }
};

export const mockAuth = {
  async login(email, password) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    const user = mockUsers[email];
    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        token: 'mock-jwt-token',
        user: userWithoutPassword
      };
    } else {
      throw new Error('Invalid email or password');
    }
  },

  async register(userData) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    // Check if user already exists
    if (mockUsers[userData.email]) {
      throw new Error('User already exists');
    }
    
    const newUser = {
      id: Date.now(),
      ...userData,
      role: 'customer' // Always customer for registration
    };
    
    delete newUser.password; // Don't return password
    
    return {
      success: true,
      token: 'mock-jwt-token',
      user: newUser
    };
  }
};

export const isDevelopmentMode = import.meta.env.DEV;
export const shouldUseMockData = isDevelopmentMode && window.location.search.includes('mock=true');
