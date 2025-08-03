const request = require('supertest');
const app = require('../app');  // Adjust path if needed


describe('Login API', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app).post('/login').send({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail with invalid credentials', async () => {
    const res = await request(app).post('/login').send({
      email: 'wrong@example.com',
      password: 'wrongpass'
    });
    expect(res.statusCode).toBe(401);
  });
});
