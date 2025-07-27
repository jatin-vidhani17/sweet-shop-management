require('dotenv').config();
const { createSupabaseClient } = require('../supabase/client');

async function initializeDatabase() {
  const supabase = createSupabaseClient();
  
  console.log('🔧 Initializing Sweet Shop Database...');
  
  try {
    // Test connection by checking if users table exists
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:');
      console.error('Error:', error.message);
      console.log('\n📋 Setup Instructions:');
      console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/projects');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the content from database/schema.sql');
      console.log('4. Click "Run" to execute the schema');
      console.log('5. Verify that users and sweets tables are created');
      return false;
    }
    
    console.log('✅ Database connection successful!');
    
    // Check if we can create a test user (admin setup)
    console.log('🔑 Testing user creation...');
    
    // Try to create a test admin user
    const testUser = {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'test123',
      role: 'admin'
    };
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([testUser], { onConflict: 'email' })
      .select();
    
    if (userError) {
      console.error('❌ User creation test failed:', userError.message);
      return false;
    }
    
    console.log('✅ User operations working!');
    
    // Test sweets table
    console.log('🍰 Testing sweets operations...');
    
    const testSweet = {
      name: 'Test Sweet',
      category: 'Test Category',
      price: 10.99,
      quantity: 5,
      description: 'Test sweet for database verification',
      image_url: null,
      ingredients: ['test ingredient'],
      is_active: true
    };
    
    const { data: sweetData, error: sweetError } = await supabase
      .from('sweets')
      .upsert([testSweet], { onConflict: 'name' })
      .select();
    
    if (sweetError) {
      console.error('❌ Sweet operations test failed:', sweetError.message);
      return false;
    }
    
    console.log('✅ Sweet operations working!');
    
    console.log('\n🎉 Database initialization complete!');
    console.log('📊 Summary:');
    console.log('   ✅ Database connection: Working');
    console.log('   ✅ Users table: Operational');
    console.log('   ✅ Sweets table: Operational');
    console.log('   ✅ Image support: Ready');
    console.log('   ✅ Test data: Created');
    
    console.log('\n🚀 Ready to run tests: npm test');
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n🔧 Please check:');
    console.log('1. SUPABASE_URL in your .env file');
    console.log('2. SUPABASE_ANON_KEY in your .env file');
    console.log('3. Database schema has been applied');
    console.log('4. Supabase project is active');
    return false;
  }
}

// Run initialization if this script is called directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
