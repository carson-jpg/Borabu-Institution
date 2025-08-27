// Simple test to check if the API endpoint is reachable
const API_BASE_URL = 'https://borabu-institution-8.onrender.com/api';

async function testAPIConnection() {
  try {
    console.log('Testing API connection to:', API_BASE_URL);
    
    // Test a simple GET request to the base API
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connection successful:', data);
      return true;
    } else {
      console.log('❌ API connection failed with status:', response.status);
      console.log('Response:', await response.text());
      return false;
    }
  } catch (error) {
    console.log('❌ API connection error:', error.message);
    return false;
  }
}

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
        email: 'test@example.com',
        password: 'testpassword'
      }),
    });
    
    console.log('Auth endpoint status:', response.status);
    console.log('Auth endpoint response:', await response.text());
    
  } catch (error) {
    console.log('Auth endpoint error:', error.message);
  }
}

// Run tests
testAPIConnection().then(success => {
  if (success) {
    testAuthEndpoint();
  }
});
