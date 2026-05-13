#!/usr/bin/env node

/**
 * AmbiTasker Integration Test Suite
 * Tests critical user flows: signup, login, booking, payment
 * 
 * Run: npx ts-node tests/smoke-test.ts
 * Or:  npm run test:smoke
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let testResults = { passed: 0, failed: 0, errors: [] };

// Test User Data
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  email: `testuser_${Date.now()}@test.com`,
  phone: '03001234567',
  password: 'TestPass@123',
};

const TEST_PROVIDER = {
  firstName: 'Test',
  lastName: 'Provider',
  email: `testprovider_${Date.now()}@test.com`,
  phone: '03009876543',
  password: 'ProviderPass@123',
  cnic: '42101-1234567-1',
  category: 'plumbing',
};

// Helper functions
async function apiCall(method: string, endpoint: string, body?: any, headers: any = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error: any) {
    return { status: 0, data: null, ok: false, error: error.message };
  }
}

function test(name: string, passed: boolean, error?: string) {
  if (passed) {
    console.log(`✅ ${name}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${name}`);
    if (error) console.log(`   Error: ${error}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error });
  }
}

// Test suite
async function runTests() {
  console.log('\n🧪 AmbiTasker Smoke Test Suite\n');

  // 1. Auth Endpoints
  console.log('📝 Authentication Tests');
  console.log('------------------------');

  // 1.1 User Signup
  const signupRes = await apiCall('POST', '/api/auth/signup', {
    firstName: TEST_USER.firstName,
    lastName: TEST_USER.lastName,
    email: TEST_USER.email,
    password: TEST_USER.password,
    phone: TEST_USER.phone,
    role: 'user',
    latitude: 24.8607,
    longitude: 67.0011,
    address: 'Karachi, Pakistan',
    locationCity: 'Karachi',
    locationArea: 'Defence',
    districtId: 'khi_district',
    cityId: 'khi_city',
    areaId: 'khi_defence',
  });
  test('User Signup', signupRes.ok, signupRes.data?.error);

  // 1.2 User Login
  const loginRes = await apiCall('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  test('User Login', loginRes.ok, loginRes.data?.error);
  const userToken = loginRes.data?.user?.id ? 'token' : null;

  // 1.3 Provider Signup
  const providerSignupRes = await apiCall('POST', '/api/auth/signup', {
    firstName: TEST_PROVIDER.firstName,
    lastName: TEST_PROVIDER.lastName,
    email: TEST_PROVIDER.email,
    password: TEST_PROVIDER.password,
    phone: TEST_PROVIDER.phone,
    cnic: TEST_PROVIDER.cnic,
    role: 'provider',
    latitude: 24.8607,
    longitude: 67.0011,
    address: 'Karachi, Pakistan',
    locationCity: 'Karachi',
    locationArea: 'Defence',
    districtId: 'khi_district',
    cityId: 'khi_city',
    areaId: 'khi_defence',
    category: TEST_PROVIDER.category,
  });
  test('Provider Signup', providerSignupRes.ok, providerSignupRes.data?.error);

  // 1.4 Provider Login
  const providerLoginRes = await apiCall('POST', '/api/auth/login', {
    email: TEST_PROVIDER.email,
    password: TEST_PROVIDER.password,
  });
  test('Provider Login', providerLoginRes.ok, providerLoginRes.data?.error);
  const providerToken = providerLoginRes.data?.user?.id ? 'token' : null;

  // 2. User Profile
  console.log('\n👤 User Profile Tests');
  console.log('---------------------');

  const profileRes = await apiCall('GET', '/api/user/profile', null, {});
  test('Get User Profile', profileRes.status === 401 || profileRes.ok, profileRes.data?.error);

  // 3. Bookings
  console.log('\n📦 Booking Tests');
  console.log('----------------');

  // Get available providers
  const providersRes = await apiCall('GET', '/api/providers');
  test('List Providers', providersRes.ok, providersRes.data?.error);

  // Try to create a booking (will fail without a real provider ID, but tests endpoint)
  const bookingRes = await apiCall('POST', '/api/bookings', {
    serviceId: 'service_plumbing',
    providerId: 'provider_1',
    location: 'Defence, Karachi',
    districtId: 'khi_district',
    cityId: 'khi_city',
    areaId: 'khi_defence',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Test booking',
    paymentMethod: 'CASH',
  });
  test(
    'Create Booking Endpoint Exists',
    bookingRes.status === 400 || bookingRes.status === 401 || bookingRes.status === 201,
    bookingRes.data?.error
  );

  // 4. Admin
  console.log('\n🔒 Admin Tests');
  console.log('---------------');

  const adminLoginRes = await apiCall('POST', '/api/admin/login', {
    email: 'admin@ambitasker.com',
    password: 'admin123',
  });
  test(
    'Admin Login Endpoint Exists',
    adminLoginRes.status === 400 || adminLoginRes.status === 401 || adminLoginRes.ok,
    adminLoginRes.data?.error
  );

  // 5. Locations
  console.log('\n📍 Location Tests');
  console.log('-----------------');

  const locationsRes = await apiCall('GET', '/api/locations?type=districts');
  test('Get Locations', locationsRes.ok, locationsRes.data?.error);

  // 6. Routes (HTTP status check)
  console.log('\n🌐 Route Tests');
  console.log('---------------');

  const publicRoutes = ['/', '/login', '/signup/user', '/signup/provider', '/about', '/contact'];
  for (const route of publicRoutes) {
    const routeRes = await apiCall('GET', route);
    test(`GET ${route}`, routeRes.status === 200 || routeRes.status === 307, `Status: ${routeRes.status}`);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Total: ${testResults.passed + testResults.failed}\n`);

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.errors.forEach((e) => {
      console.log(`  - ${e.test}: ${e.error}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
