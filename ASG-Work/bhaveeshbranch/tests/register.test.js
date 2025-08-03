const request = require('supertest');
const app = require('../app');  // Adjust path if needed

describe('Register API', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/register').send({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'newpass123'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  it('should fail for missing fields', async () => {
    const res = await request(app).post('/register').send({});
    expect(res.statusCode).toBe(400);
  });
});
