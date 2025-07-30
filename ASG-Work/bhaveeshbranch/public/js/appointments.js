// public/js/appointments.js

const token = localStorage.getItem('token');
const messageDiv = document.getElementById('message');
const appointmentForm = document.getElementById('appointmentForm');
const appointmentsList = document.getElementById('appointmentsList');

// Redirect if not logged in
if (!token) {
  alert('You must be logged in to view this page.');
  window.location.href = '/login.html';
}

// Fetch and display appointments
async function loadAppointments() {
  try {
    const res = await fetch('/appointments', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const appointments = await res.json();
    appointmentsList.innerHTML = '';

    if (appointments.length === 0) {
      appointmentsList.innerHTML = '<p>No appointments yet.</p>';
    } else {
      appointments.forEach(app => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.innerHTML = `
          <strong>Date:</strong> ${new Date(app.appointmentDate).toLocaleString()}<br>
          <strong>Description:</strong> ${app.description}<br>
          <button onclick="deleteAppointment(${app.appointmentId})">Delete</button>
        `;
        appointmentsList.appendChild(card);
      });
    }
  } catch (err) {
    messageDiv.textContent = 'Failed to load appointments.';
    messageDiv.className = 'error';
  }
}

appointmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const appointmentDate = appointmentForm.appointmentDate.value;
  const description = appointmentForm.description.value;

  try {
    const res = await fetch('/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ appointmentDate, description })
    });

    const data = await res.json();

    if (res.ok) {
      messageDiv.textContent = 'Appointment added successfully.';
      messageDiv.className = 'success';
      appointmentForm.reset();
      loadAppointments();
    } else {
      messageDiv.textContent = data.errors?.join(', ') || data.message || 'Failed to add appointment.';
      messageDiv.className = 'error';
    }
  } catch {
    messageDiv.textContent = 'Something went wrong.';
    messageDiv.className = 'error';
  }
});

async function deleteAppointment(id) {
  if (!confirm('Are you sure you want to delete this appointment?')) return;

  try {
    const res = await fetch(`/appointments/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      loadAppointments();
    } else {
      messageDiv.textContent = 'Failed to delete appointment.';
      messageDiv.className = 'error';
    }
  } catch {
    messageDiv.textContent = 'Error deleting appointment.';
    messageDiv.className = 'error';
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

// Initial load
loadAppointments();
