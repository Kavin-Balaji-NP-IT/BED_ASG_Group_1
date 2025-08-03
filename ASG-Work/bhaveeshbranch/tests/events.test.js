const request = require('supertest');
const app = require('../app');  // Adjust path if needed

describe('Events API', () => {
  it('should create a new event', async () => {
    const res = await request(app).post('/events').send({
      name: 'Health Talk',
      date: '2025-08-15',
      description: 'Talk on healthy habits'
    });
    expect(res.statusCode).toBe(201);
  });

  it('should get all events', async () => {
    const res = await request(app).get('/events');
    expect(res.statusCode).toBe(200);
  });

  it('should update an event', async () => {
    const res = await request(app).put('/events/1').send({
      name: 'Updated Event'
    });
    expect(res.statusCode).toBe(200);
  });

  it('should delete an event', async () => {
    const res = await request(app).delete('/events/1');
    expect(res.statusCode).toBe(200);
  });
});
