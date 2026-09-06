require('dotenv').config();
const jwt = require('jsonwebtoken');
const { protect, authorize, admin, user } = require('../middleware/authMiddleware');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Helper to mock Express req, res, next
function createMockReqRes(headers = {}, reqOverrides = {}) {
  const req = {
    headers,
    ...reqOverrides
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  let nextCalled = false;
  let nextError = null;
  const next = (err) => {
    nextCalled = true;
    nextError = err;
  };

  return { req, res, next, getNextCalled: () => nextCalled, getNextError: () => nextError };
}

async function runTests() {
  console.log('🧪 Starting Middleware Development (Week 2 Task 5) Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // 1. Missing Authorization Header
  {
    const { req, res, next, getNextCalled } = createMockReqRes({});
    await protect(req, res, next);
    assert(
      res.statusCode === 401 && res.body?.success === false && !getNextCalled(),
      '1. protect() rejects request with missing Authorization header (401)'
    );
  }

  // 2. Authorization Header without Bearer
  {
    const { req, res, next, getNextCalled } = createMockReqRes({ authorization: 'Basic 12345' });
    await protect(req, res, next);
    assert(
      res.statusCode === 401 && res.body?.message.includes('token missing') && !getNextCalled(),
      '2. protect() rejects non-Bearer authorization header (401)'
    );
  }

  // 3. Authorization Header with empty Bearer
  {
    const { req, res, next, getNextCalled } = createMockReqRes({ authorization: 'Bearer ' });
    await protect(req, res, next);
    assert(
      res.statusCode === 401 && res.body?.message.includes('token missing') && !getNextCalled(),
      '3. protect() rejects empty Bearer token (401)'
    );
  }

  // 4. Invalid / Malformed Token
  {
    const { req, res, next, getNextCalled } = createMockReqRes({ authorization: 'Bearer invalid.token.value' });
    await protect(req, res, next);
    assert(
      res.statusCode === 401 && res.body?.message.includes('invalid token') && !getNextCalled(),
      '4. protect() rejects malformed / invalid JWT token (401)'
    );
  }

  // 5. Expired Token
  {
    const expiredToken = jwt.sign({ id: 'dummy_id' }, JWT_SECRET, { expiresIn: '-1s' });
    const { req, res, next, getNextCalled } = createMockReqRes({ authorization: `Bearer ${expiredToken}` });
    await protect(req, res, next);
    assert(
      res.statusCode === 401 && res.body?.message.includes('expired') && !getNextCalled(),
      '5. protect() rejects expired JWT token (401)'
    );
  }

  // 6. Token signed with different secret
  {
    const wrongSecretToken = jwt.sign({ id: 'dummy_id' }, 'wrong-secret-key');
    const { req, res, next, getNextCalled } = createMockReqRes({ authorization: `Bearer ${wrongSecretToken}` });
    await protect(req, res, next);
    assert(
      res.statusCode === 401 && res.body?.message.includes('invalid token') && !getNextCalled(),
      '6. protect() rejects token with invalid secret signature (401)'
    );
  }

  // 7. Role Authorization: authorize without req.user
  {
    const { req, res, next, getNextCalled } = createMockReqRes({});
    authorize('admin')(req, res, next);
    assert(
      res.statusCode === 401 && !getNextCalled(),
      '7. authorize() rejects when req.user is not set (401)'
    );
  }

  // 8. Role Authorization: User accessing Admin-only route
  {
    const { req, res, next, getNextCalled } = createMockReqRes({}, { user: { _id: '123', role: 'user', name: 'Standard User' } });
    admin(req, res, next);
    assert(
      res.statusCode === 403 && res.body?.message.includes('Forbidden') && !getNextCalled(),
      '8. admin middleware rejects standard user with role "user" (403 Forbidden)'
    );
  }

  // 9. Role Authorization: Admin accessing Admin route
  {
    const { req, res, next, getNextCalled } = createMockReqRes({}, { user: { _id: '456', role: 'admin', name: 'Admin User' } });
    admin(req, res, next);
    assert(
      getNextCalled() && res.statusCode === 200,
      '9. admin middleware allows user with role "admin" (next() called)'
    );
  }

  // 10. Role Authorization: User role authorized for multi-role endpoint
  {
    const { req, res, next, getNextCalled } = createMockReqRes({}, { user: { _id: '789', role: 'user', name: 'Standard User' } });
    user(req, res, next);
    assert(
      getNextCalled() && res.statusCode === 200,
      '10. user middleware allows user with role "user" (next() called)'
    );
  }

  // 11. Case-insensitive 'bearer <token>' support with User mock
  {
    // Temporarily stub User.findById
    const originalFindById = User.findById;
    User.findById = (id) => ({
      select: (fields) => Promise.resolve({
        _id: id,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user'
      })
    });

    const validToken = jwt.sign({ id: 'mock-user-123', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const { req, res, next, getNextCalled } = createMockReqRes({ authorization: `bearer ${validToken}` });
    await protect(req, res, next);

    assert(
      getNextCalled() && req.user && req.user._id === 'mock-user-123' && req.user.role === 'user' && !req.user.password,
      '11. protect() accepts lowercase "bearer <token>", attaches req.user without password and calls next()'
    );

    // Restore findById
    User.findById = originalFindById;
  }

  // 12. User not found in DB even if token is valid
  {
    const originalFindById = User.findById;
    User.findById = (id) => ({
      select: (fields) => Promise.resolve(null)
    });

    const validToken = jwt.sign({ id: 'deleted-user-id', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const { req, res, next, getNextCalled } = createMockReqRes({ authorization: `Bearer ${validToken}` });
    await protect(req, res, next);

    assert(
      res.statusCode === 401 && res.body?.message.includes('user not found') && !getNextCalled(),
      '12. protect() rejects valid token if user was deleted from database (401)'
    );

    // Restore findById
    User.findById = originalFindById;
  }

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

