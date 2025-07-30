const form = document.getElementById('updateForm');
const message = document.getElementById('message');
const token = localStorage.getItem('token');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const appointmentId = form.appointmentId.value;
  const date = form.date.value;
  const description = form.description.value;

  try {
    const res = await fetch(`/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentDate: date, description })

    });

    const data = await res.json();
    if (res.ok) {
      message.textContent = 'Appointment updated successfully.';
      message.style.color = 'green';
    } else {
      message.textContent = data.message || 'Failed to update appointment.';
      message.style.color = 'red';
    }
  } catch (err) {
    message.textContent = 'An error occurred.';
    message.style.color = 'red';
  }
});
