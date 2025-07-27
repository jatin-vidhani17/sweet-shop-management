# Sweet Shop Management System - Database Setup Guide

## Prerequisites
- Supabase account with your project created
- Project URL: `https://ubvavqknzaamaxdwfdbw.supabase.co`
- Supabase API Key (anon/public key)
- Service Role Key for admin operations

## Database Setup Instructions

### Step 1: Run Database Schema
1. Go to your Supabase Dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the entire content from `database/schema.sql`
4. Click "Run" to execute the SQL commands

This will create:
- Users table with UUID primary keys
- Sweets table with image support and ingredients
- Necessary indexes for performance
- Row Level Security (RLS) policies
- Database functions and triggers

### Step 2: Configure Storage for Images
1. In Supabase Dashboard, go to "Storage"
2. Create a new bucket named "sweet-images"
3. Set bucket to "Public" for easy image access
4. Configure CORS settings if needed

### Step 3: Verify Environment Variables
Ensure these variables are set in your `.env` file:

```
SUPABASE_URL=https://ubvavqknzaamaxdwfdbw.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_here
```

### Step 4: Test Database Connection
Run the tests to verify everything is working:

```bash
npm test
```

## API Endpoints with Image Support

### Sweet Creation (POST /api/sweets)
```json
{
  "name": "Chocolate Cake",
  "category": "Cakes",
  "price": 25.99,
  "quantity": 10,
  "description": "Rich chocolate cake with ganache",
  "image_url": "https://ubvavqknzaamaxdwfdbw.supabase.co/storage/v1/object/public/sweet-images/chocolate-cake.jpg",
  "ingredients": ["chocolate", "flour", "sugar", "eggs"],
  "is_active": true
}
```

### Sweet Update (PUT /api/sweets/[id])
```json
{
  "image_url": "https://ubvavqknzaamaxdwfdbw.supabase.co/storage/v1/object/public/sweet-images/updated-cake.jpg",
  "ingredients": ["dark chocolate", "flour", "sugar", "eggs", "butter"]
}
```

## Image Upload Workflow

### Frontend Image Upload Process:
1. User selects image file
2. Upload to Supabase Storage bucket
3. Get public URL from upload response
4. Include URL in sweet creation/update request

### Example Image Upload Code:
```javascript
// Upload image to Supabase Storage
const uploadImage = async (file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${fileName}`

  const { data, error } = await supabase.storage
    .from('sweet-images')
    .upload(filePath, file)

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('sweet-images')
    .getPublicUrl(filePath)

  return publicUrl
}
```

## Testing with Image Support

The API now supports:
- Image URL validation
- Ingredients array handling
- Active/inactive sweet status
- Full CRUD operations with images

All endpoints maintain backward compatibility while adding new image features.

## Next Steps

After database setup:
1. Run tests to verify functionality: `npm test`
2. Test image upload functionality
3. Deploy to Vercel
4. Begin frontend development

## TDD Development Process

With the database properly set up, you can now demonstrate:
1. ✅ All tests passing
2. ✅ Complete API functionality
3. ✅ Image storage integration
4. ✅ Authentication & authorization
5. ✅ Inventory management
6. ✅ Search functionality

The system is now ready for frontend development!
