# 🍬 Sweet Shop Management - React Frontend

A modern, responsive React frontend for the Sweet Shop Management System with a beautiful orange theme.

## 🎨 Features

### Authentication
- ✅ **Login Page** - Secure user authentication
- ✅ **Registration Page** - New user account creation
- ✅ **Role-based Access** - Customer and Admin roles
- ✅ **JWT Token Management** - Automatic token handling

### Customer Features
- ✅ **Home Dashboard** - Personalized welcome and stats
- ✅ **Shopping Page** - Browse and purchase sweets
- ✅ **Search & Filter** - Find sweets by name, category, price
- ✅ **Sweet Cards** - Beautiful product displays
- ✅ **Purchase System** - Buy sweets with stock management
- ✅ **Favorites** - Save favorite sweets
- ✅ **Responsive Design** - Mobile-friendly interface

### Admin Features
- ✅ **Admin Dashboard** - Complete inventory management
- ✅ **Sweet Management** - Add, edit, delete sweets
- ✅ **Stock Management** - Track inventory levels
- ✅ **Restock System** - Easily restock low inventory
- ✅ **Analytics** - View inventory stats and metrics
- ✅ **Real-time Updates** - Live inventory tracking

### Design & UX
- ✅ **Orange Theme** - Beautiful orange color scheme
- ✅ **Modern UI** - Clean, professional design
- ✅ **Responsive Layout** - Mobile-first approach
- ✅ **Smooth Animations** - Engaging user interactions
- ✅ **Loading States** - Clear feedback for all actions
- ✅ **Error Handling** - User-friendly error messages

## 🚀 Technology Stack

- **React 19** - Latest React framework
- **Vite** - Fast build tool and dev server
- **React Router Dom** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library
- **CSS3** - Custom styling with CSS variables
- **JavaScript** - ES6+ modern JavaScript

## 📋 Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── Navbar.jsx          # Navigation component
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── Home.jsx            # Dashboard home
│   │   ├── Shopping.jsx        # Customer shopping
│   │   └── AdminDashboard.jsx  # Admin management
│   ├── App.jsx                 # Main app component
│   ├── App.css                 # Global styles
│   ├── index.css               # Base styles
│   └── main.jsx                # App entry point
├── public/
├── package.json
└── vite.config.js
```

## 🎯 API Integration

Connected to deployed backend: `https://sweet-shop-management-psi.vercel.app/api`

### Endpoints Used:
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /sweets` - Fetch all sweets
- `POST /sweets` - Add new sweet (Admin)
- `PUT /sweets/:id` - Update sweet (Admin)
- `DELETE /sweets/:id` - Delete sweet (Admin)
- `POST /sweets/:id/purchase` - Purchase sweet
- `POST /sweets/:id/restock` - Restock sweet (Admin)

## 🎨 Orange Theme

### Color Palette:
- **Primary Orange**: `#ff6b35` - Main brand color
- **Secondary Orange**: `#ff8c42` - Accent color
- **Light Orange**: `#ffa726` - Highlights
- **Dark Orange**: `#e65100` - Dark accents
- **Orange Gradient**: Linear gradient for buttons and headers
- **Orange Light**: `#fff3e0` - Background tints

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📱 Responsive Design

- **Desktop**: Full-featured layout with sidebar navigation
- **Tablet**: Optimized grid layouts and touch-friendly buttons
- **Mobile**: Collapsible navigation and single-column layouts

## 🔐 Authentication Flow

1. User visits login/register page
2. Credentials validated against backend API
3. JWT token stored in localStorage
4. Axios interceptors handle token in requests
5. Protected routes check authentication status
6. Role-based access control for admin features

## ✨ Key Features Implemented

### Customer Experience:
- 🏠 **Dashboard** - Welcome screen with stats
- 🛒 **Shopping** - Browse and purchase sweets
- 🔍 **Search** - Real-time search and filtering
- ❤️ **Favorites** - Save preferred items
- 📱 **Mobile** - Fully responsive design

### Admin Experience:
- 📊 **Analytics** - Inventory overview and metrics
- ➕ **Add Products** - Easy sweet creation
- ✏️ **Edit Products** - Update sweet details
- 🗑️ **Delete Products** - Remove items
- 📦 **Stock Management** - Track and restock inventory

## 🎉 Deployment Ready

The frontend is configured for deployment and connects seamlessly to the deployed backend API.

---

**Sweet Shop Management System** - Built with ❤️ and lots of 🍬!
