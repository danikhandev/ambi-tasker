#!/usr/bin/env node

// AmbiTasker smoke test (plain JS for Node 18+)
// Run: node tests/smoke-test.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let testResults = { passed: 0, failed: 0, errors: [] };

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

async function apiCall(method, endpoint, body, headers = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data, ok: res.ok };
  } catch (err) {
    return { status: 0, data: null, ok: false, error: String(err) };
  }
}

function test(name, passed, error) {
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

async function runTests() {
  console.log('\n🧪 AmbiTasker Smoke Test Suite\n');

  console.log('📝 Authentication Tests');
  console.log('------------------------');

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

  const loginRes = await apiCall('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  test('User Login', loginRes.ok, loginRes.data?.error);

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

  const providerLoginRes = await apiCall('POST', '/api/auth/login', {
    email: TEST_PROVIDER.email,
    password: TEST_PROVIDER.password,
  });
  test('Provider Login', providerLoginRes.ok, providerLoginRes.data?.error);

  console.log('\n👤 User Profile Tests');
  console.log('---------------------');

  const profileRes = await apiCall('GET', '/api/user/profile');
  test('Get User Profile', profileRes.status === 401 || profileRes.ok, profileRes.data?.error);

  console.log('\n📦 Booking Tests');
  console.log('----------------');

  const providersRes = await apiCall('GET', '/api/providers');
  test('List Providers', providersRes.ok, providersRes.data?.error);

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

  console.log('\n📍 Location Tests');
  console.log('-----------------');

  const locationsRes = await apiCall('GET', '/api/locations?type=districts');
  test('Get Locations', locationsRes.ok, locationsRes.data?.error);

  console.log('\n🌐 Route Tests');
  console.log('---------------');

  const publicRoutes = ['/', '/login', '/signup/user', '/signup/provider', '/about', '/contact'];
  for (const route of publicRoutes) {
    const routeRes = await apiCall('GET', route);
    test(`GET ${route}`, routeRes.status === 200 || routeRes.status === 307, `Status: ${routeRes.status}`);
  }

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

runTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
