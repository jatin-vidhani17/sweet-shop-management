#!/bin/bash

# Deployment Test Script for Sweet Shop Management API
# Run this after deploying to Vercel to test all endpoints

# Set your Vercel URL here (replace after deployment)
API_BASE_URL="https://your-sweet-shop.vercel.app/api"

echo "🧪 Testing Sweet Shop Management API Deployment"
echo "================================================"

# Test 1: Health check (register endpoint)
echo "✅ Test 1: API Health Check"
curl -X OPTIONS "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n✅ Test 2: User Registration"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@deploy.com", 
    "password": "test123",
    "confirmPassword": "test123",
    "role": "customer"
  }')

echo "Registration Response: $REGISTER_RESPONSE"

# Extract token from response (if successful)
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  echo "✅ Registration successful, token received"
  
  echo -e "\n\n✅ Test 3: Authentication Test (List Sweets)"
  curl -s -X GET "$API_BASE_URL/sweets" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
    
  echo -e "\n\n✅ Test 4: Search Functionality"
  curl -s -X GET "$API_BASE_URL/sweets/search?name=test" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
else
  echo "❌ Registration failed, skipping authenticated tests"
fi

echo -e "\n\n✅ Test 5: Login Endpoint"
curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@deploy.com",
    "password": "test123"
  }'

echo -e "\n\n🎉 Deployment tests completed!"
echo "================================================"
echo "Update API_BASE_URL in this script with your actual Vercel URL"
