const API_BASE_URL = 'https://borabu-institution-8.onrender.com/api';

// Test the auth endpoint specifically
async function testAuthEndpoint() {
  try {
    console.log('\nTesting auth endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@borabutti.ac.ke',
        password: 'Admin123!'
      }),
    });
    
    console.log('Auth endpoint status:', response.status);
    console.log('Auth endpoint response:', await response.text());
    
  } catch (error) {
    console.log('Auth endpoint error:', error.message);
  }
}

// Run tests
testAuthEndpoint();
