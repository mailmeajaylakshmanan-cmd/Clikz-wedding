const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');

describe('Health Check Endpoint', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return 200 and a status of ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('app', 'CLIKZ Billing');
  });
});
