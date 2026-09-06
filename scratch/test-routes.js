process.env.NODE_ENV = 'test';
require('dotenv').config();
const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');

// Import routes and middleware
const authRoutes = require('../routes/authRoutes');
const memoryRoutes = require('../routes/memoryRoutes');
const userRoutes = require('../routes/userRoutes');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/users', userRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'ai-personal-archive-super-secret-key-2026-development-secure-token';

async function makeRequest(server, path, options = {}) {
  const address = server.address();
  const port = address.port;
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runRouteTests() {
  console.log('🚀 Running Express Routes & Middleware Integration Tests...\n');

  const server = app.listen(0);
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // 1. Unauthenticated request to /api/auth/profile -> 401
    const res1 = await makeRequest(server, '/api/auth/profile');
    assert(res1.status === 401 && res1.body.success === false, '1. GET /api/auth/profile without token returns 401 Unauthorized');

    // 2. Unauthenticated request to /api/auth/check-user -> 401
    const res2 = await makeRequest(server, '/api/auth/check-user');
    assert(res2.status === 401 && res2.body.success === false, '2. GET /api/auth/check-user without token returns 401 Unauthorized');

    // 3. Unauthenticated request to /api/auth/check-admin -> 401
    const res3 = await makeRequest(server, '/api/auth/check-admin');
    assert(res3.status === 401 && res3.body.success === false, '3. GET /api/auth/check-admin without token returns 401 Unauthorized');

    // 4. Unauthenticated request to /api/auth/logout -> 401
    const res4 = await makeRequest(server, '/api/auth/logout', { method: 'POST' });
    assert(res4.status === 401 && res4.body.success === false, '4. POST /api/auth/logout without token returns 401 Unauthorized');

    // 5. Unauthenticated request to /api/memories -> 401
    const res5 = await makeRequest(server, '/api/memories');
    assert(res5.status === 401 && res5.body.success === false, '5. GET /api/memories without token returns 401 Unauthorized');

    // 6. Unauthenticated request to /api/users -> 401
    const res6 = await makeRequest(server, '/api/users');
    assert(res6.status === 401 && res6.body.success === false, '6. GET /api/users without token returns 401 Unauthorized');

    // Mock Database for Authenticated user tests
    const originalFindById = User.findById;
    const originalFind = User.find;

    const mockRegularUser = {
      _id: 'user_12345',
      name: 'Regular Tester',
      email: 'tester@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAdminUser = {
      _id: 'admin_99999',
      name: 'Admin Supervisor',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    User.findById = (id) => ({
      select: (fields) => {
        if (id === mockRegularUser._id) return Promise.resolve(mockRegularUser);
        if (id === mockAdminUser._id) return Promise.resolve(mockAdminUser);
        return Promise.resolve(null);
      }
    });

    User.find = () => ({
      select: () => ({
        sort: () => Promise.resolve([mockRegularUser, mockAdminUser])
      })
    });

    const userToken = jwt.sign({ id: mockRegularUser._id, role: mockRegularUser.role }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ id: mockAdminUser._id, role: mockAdminUser.role }, JWT_SECRET, { expiresIn: '1h' });

    // 7. Regular user accessing profile -> 200
    const res7 = await makeRequest(server, '/api/auth/profile', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(res7.status === 200 && res7.body.user.email === 'tester@example.com', '7. GET /api/auth/profile with user token returns 200 & profile info');

    // 8. Regular user accessing check-user -> 200
    const res8 = await makeRequest(server, '/api/auth/check-user', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(res8.status === 200 && res8.body.isAuthenticated === true, '8. GET /api/auth/check-user with user token returns 200 & isAuthenticated: true');

    // 9. Regular user accessing check-admin -> 403 Forbidden
    const res9 = await makeRequest(server, '/api/auth/check-admin', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(res9.status === 403 && res9.body.message.includes('Forbidden'), '9. GET /api/auth/check-admin with user token returns 403 Forbidden');

    // 10. Admin user accessing check-admin -> 200 Success
    const res10 = await makeRequest(server, '/api/auth/check-admin', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res10.status === 200 && res10.body.isAdmin === true, '10. GET /api/auth/check-admin with admin token returns 200 & isAdmin: true');

    // 11. Regular user accessing /api/users (Admin-only) -> 403 Forbidden
    const res11 = await makeRequest(server, '/api/users', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(res11.status === 403 && res11.body.message.includes('Forbidden'), '11. GET /api/users with standard user token returns 403 Forbidden');

    // 12. Admin user accessing /api/users (Admin-only) -> 200 Success
    const res12 = await makeRequest(server, '/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res12.status === 200 && res12.body.success === true, '12. GET /api/users with admin token returns 200 OK');

    // 13. Authenticated user accessing /api/memories -> 200
    const res13 = await makeRequest(server, '/api/memories', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(res13.status === 200 && res13.body.success === true, '13. GET /api/memories with user token returns 200 OK');

    // 14. Authenticated user accessing /api/auth/logout -> 200
    const res14 = await makeRequest(server, '/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(res14.status === 200 && res14.body.message === 'Logged out successfully', '14. POST /api/auth/logout with user token returns 200 Logged out successfully');

    // Restore DB mocks
    User.findById = originalFindById;
    User.find = originalFind;

    console.log(`\n========================================`);
    console.log(`🏁 Integration Tests: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runRouteTests();
