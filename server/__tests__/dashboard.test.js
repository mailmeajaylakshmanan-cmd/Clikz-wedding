const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

jest.mock('../middleware/auth', () => {
  const mockAuth = (req, res, next) => {
    req.userId = '609b55268c17b51040d5854b';
    req.studioId = '609b55268c17b51040d5854c';
    req.role = 'admin';
    next();
  };
  mockAuth.protect = mockAuth;
  return mockAuth;
});

describe('Dashboard Endpoint', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return 200 and dashboard data without crashing', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('totalInvoices');
    expect(res.body).toHaveProperty('recentPayments');
  });
});
