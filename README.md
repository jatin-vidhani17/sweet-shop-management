# 🍬 Sweet Shop Management System

A serverless sweet shop management system built with Node.js, Supabase, and Vercel, featuring JWT authentication and comprehensive inventory management.

## 🚀 Features

- **User Authentication**: JWT-based authentication with user registration and login
- **Role-based Access Control**: Customer and Admin roles with different permissions
- **Sweet Inventory Management**: CRUD operations for sweets with categories, pricing, and stock management
- **Search Functionality**: Search sweets by name, category, and price range
- **Purchase System**: Customers can purchase sweets with automatic stock deduction
- **Restock Management**: Admins can restock sweet inventory
- **Serverless Architecture**: Deployed on Vercel with Supabase backend

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js (Serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Deployment**: Vercel
- **Testing**: Jest, Supertest
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

- Node.js (v16 or higher)
- Supabase account and project
- Vercel account (for deployment)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jatin-vidhani17/sweet-shop-management.git
cd sweet-shop-management/server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the server directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
```

### 4. Database Setup

Create the following tables in your Supabase database:

#### Users Table
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Sweets Table
```sql
CREATE TABLE public.sweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Run Tests

```bash
npm test
```

### 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "customer"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Sweet Management Endpoints (Protected)

All endpoints require: `Authorization: Bearer your_jwt_token`

#### Get All Sweets
- **GET** `/api/sweets`

#### Create Sweet (Admin Only)
- **POST** `/api/sweets`

#### Get/Update/Delete Sweet by ID
- **GET/PUT/DELETE** `/api/sweets/{id}`

#### Search Sweets
- **GET** `/api/sweets/search?name=chocolate&category=candy&minPrice=5&maxPrice=10`

#### Purchase Sweet
- **POST** `/api/sweets/{id}/purchase`

#### Restock Sweet (Admin Only)
- **POST** `/api/sweets/{id}/restock`

## 🧪 Testing

```bash
npm test  # Run all tests
```

Comprehensive test coverage for authentication, CRUD operations, and business logic.

## 🚀 Deployment

Configured for Vercel serverless deployment with automatic CI/CD from GitHub.

## 🗂️ Project Structure

