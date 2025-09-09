// Test script for Doubt Posting App API
// Run with: node test-api.js

const BASE_URL = 'https://gtqgwoxnpqeugarsruxk.supabase.co/functions/v1/my-function';

async function testEndpoint(method, endpoint, body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`${method} ${endpoint}:`, response.status, data);
    return { status: response.status, data };
  } catch (error) {
    console.error(`${method} ${endpoint}: Error -`, error.message);
    return { status: 0, data: null };
  }
}

async function runTests() {
  console.log('Testing Doubt Posting App API...\n');

  // Test root endpoint
  await testEndpoint('GET', '/my-function/');

  // Test signup (replace with actual credentials)
  const signupResult = await testEndpoint('POST', '/make-server-0a52de3b/signup', {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  });

  if (signupResult.status === 200) {
    console.log('\nSignup successful!');

    // Test signin
    const signinResult = await testEndpoint('POST', '/make-server-0a52de3b/signin', {
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (signinResult.status === 200 && signinResult.data?.access_token) {
      const token = signinResult.data.access_token;
      console.log('\nSignin successful! Testing authenticated endpoints...\n');

      // Test posting a question
      await testEndpoint('POST', '/make-server-0a52de3b/questions', {
        title: 'Test Question',
        content: 'This is a test question content',
        tags: ['test', 'api'],
        subject: 'General',
        answerLimit: 3
      }, token);

      // Test getting questions
      await testEndpoint('GET', '/make-server-0a52de3b/questions', null, token);

      // Test creating a group
      await testEndpoint('POST', '/make-server-0a52de3b/groups', {
        name: 'Test Study Group',
        description: 'A group for testing',
        subject: 'Testing'
      }, token);

      // Test getting groups
      await testEndpoint('GET', '/make-server-0a52de3b/groups', null, token);

      // Test community messages
      await testEndpoint('GET', '/make-server-0a52de3b/community/US', null, token);

      await testEndpoint('POST', '/make-server-0a52de3b/community/US', {
        content: 'Test community message'
      }, token);
    }
  }

  console.log('\nAPI testing completed!');
}

// Run the tests
runTests().catch(console.error);
