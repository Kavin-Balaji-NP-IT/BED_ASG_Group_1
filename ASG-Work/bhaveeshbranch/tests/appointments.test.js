const request = require('supertest');
const app = require('../app');  // Adjust path if needed

describe('Appointments API', () => {
  it('should create an appointment', async () => {
    const res = await request(app).post('/appointments').send({
      title: 'Doctor Visit',
      date: '2025-08-10',
      time: '10:00',
    });
    expect(res.statusCode).toBe(201);
  });

  it('should get all appointments', async () => {
    const res = await request(app).get('/appointments');
    expect(res.statusCode).toBe(200);
  });

  it('should update an appointment', async () => {
    const res = await request(app).put('/appointments/1').send({
      title: 'Updated Appointment'
    });
    expect(res.statusCode).toBe(200);
  });

  it('should delete an appointment', async () => {
    const res = await request(app).delete('/appointments/1');
    expect(res.statusCode).toBe(200);
  });
});
