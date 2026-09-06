const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

async function testAuthSuite() {
  console.log('Connecting to MongoDB Atlas...');
  await connectDB();

  const testEmailUser = 'test_runner_user_' + Date.now() + '@test.com';
  const testEmailAdmin = 'test_runner_admin_' + Date.now() + '@test.com';
  const plainPassword = 'Password123!';

  console.log('\n--- 1. Testing Password Hashing & Signup ---');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  const user = await User.create({
    name: 'Normal Test User',
    email: testEmailUser,
    password: hashedPassword,
    role: 'user'
  });
  console.log('User created:', user.email, 'Role:', user.role);
  if (user.password === plainPassword) {
    throw new Error('Password was stored in plain text!');
  }
  console.log('✅ Password successfully hashed with bcrypt');

  console.log('\n--- 2. Testing Password Comparison ---');
  const isMatch = await user.comparePassword(plainPassword);
  if (!isMatch) throw new Error('Password comparison failed for correct password');
  const isMismatch = await user.comparePassword('WrongPassword');
  if (isMismatch) throw new Error('Password comparison succeeded for wrong password');
  console.log('✅ Password verification works accurately');

  console.log('\n--- 3. Testing JWT Generation & Verification ---');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.id !== user._id.toString() || decoded.role !== 'user') {
    throw new Error('JWT payload mismatch');
  }
  console.log('✅ JWT generated and decoded successfully with ID & Role');

  console.log('\n--- 4. Testing Admin User & Role Authorization ---');
  const adminHashedPassword = await bcrypt.hash(plainPassword, salt);
  const adminUser = await User.create({
    name: 'Admin Test User',
    email: testEmailAdmin,
    password: adminHashedPassword,
    role: 'admin'
  });
  const adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET);
  if (decodedAdmin.role !== 'admin') throw new Error('Admin role mismatch');
  console.log('✅ Admin user created and JWT verified');

  console.log('\n--- 5. Testing Authorization Middleware ---');
  const mockReqUser = { user: { role: 'user' } };
  const mockReqAdmin = { user: { role: 'admin' } };
  let passedAdmin = false;
  let blockedUser = false;

  const adminAuth = authorize('admin');
  adminAuth(mockReqAdmin, {}, () => { passedAdmin = true; });
  adminAuth(mockReqUser, {
    status: (code) => {
      if (code === 403) blockedUser = true;
      return { json: () => {} };
    }
  }, () => {});

  if (!passedAdmin || !blockedUser) {
    throw new Error('Authorization middleware failed role checks');
  }
  console.log('✅ Authorization middleware properly allows admin and blocks normal user');

  console.log('\n--- 6. Cleaning up test records ---');
  await User.deleteMany({ email: { $in: [testEmailUser, testEmailAdmin] } });
  console.log('✅ Cleanup completed');

  console.log('\n🎉 ALL AUTH & ROLE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testAuthSuite().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
