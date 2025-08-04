document.getElementById('medicalBtn').addEventListener('click', () => {
  window.location.href = '/appoitments.html'; // adjust filename as needed
});

document.getElementById('eventBtn').addEventListener('click', () => {
  window.location.href = '/eventCalendar.html';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token'); // Clear the JWT
  window.location.href = '/login.html';
});
