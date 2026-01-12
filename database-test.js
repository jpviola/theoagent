// Test Database Connection and Authentication
// Run this in your browser console on localhost:3000 after database setup

console.log('🔧 Testing TheoAgent Database Connection...');

// Test 1: Check Supabase connection
async function testSupabaseConnection() {
  try {
    // This should be available in your app context
    const response = await fetch('/api/test-db', {
      method: 'GET',
    });
    
    if (response.ok) {
      console.log('✅ Supabase connection: SUCCESS');
      const data = await response.json();
      console.log('Database info:', data);
    } else {
      console.log('❌ Supabase connection: FAILED');
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.log('❌ Supabase connection: ERROR');
    console.error(error);
  }
}

// Test 2: Check if user can be created
async function testUserCreation() {
  console.log('📝 Manual test: Try signing up with a test email');
  console.log('1. Go to your app homepage');
  console.log('2. Click Sign Up');
  console.log('3. Use a test email like: test@example.com');
  console.log('4. Check if user appears in Supabase Dashboard > Authentication > Users');
  console.log('5. Check if profile is created in Table Editor > profiles');
}

// Run tests
testUserCreation();
console.log('🔍 After database setup, test authentication by creating a user account.');