
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You are not logged in!');
    window.location.href = '/login.html';
    return;
  }

  const eventList = document.getElementById('eventList');
  const eventForm = document.getElementById('eventForm');
  const messageDiv = document.getElementById('message');
  const logoutBtn = document.getElementById('logoutBtn');

  let editingId = null;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  async function loadEvents() {
    eventList.innerHTML = '';
    try {
      const res = await fetch('/events', { headers });
      const events = await res.json();

      if (!res.ok) {
        messageDiv.textContent = events.message || 'Failed to load events.';
        messageDiv.className = 'error';
        return;
      }

      if (events.length === 0) {
        eventList.innerHTML = '<p>No events found.</p>';
        return;
      }

      // Sort events alphabetically by eventTitle
      events.sort((a, b) => a.eventTitle.localeCompare(b.eventTitle));

      events.forEach(event => {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.dataset.id = event.eventId; // store eventId on div for reference
        div.innerHTML = `
          <strong>${event.eventTitle}</strong><br>
          ${event.eventDescription}<br>
          Date: ${new Date(event.eventDate).toLocaleDateString()}<br>
          Location: ${event.eventLocation}<br>
          <button class="edit-btn" data-id="${event.eventId}">Edit</button>
          <button class="delete-btn" data-id="${event.eventId}">Delete</button>
          <hr>
        `;
        eventList.appendChild(div);
      });
    } catch (err) {
      console.error('Error loading events:', err);
      messageDiv.textContent = 'Something went wrong while loading events.';
      messageDiv.className = 'error';
    }
  }

  async function loadEventForEdit(id) {
  try {
    const res = await fetch('/events', { headers });
    const events = await res.json();
    const event = events.find(e => e.eventId === parseInt(id)); // FIXED HERE

    if (event) {
      document.getElementById('title').value = event.eventTitle;
      document.getElementById('description').value = event.eventDescription;
      document.getElementById('date').value = new Date(event.eventDate).toISOString().slice(0, 16); // Better formatting
      document.getElementById('location').value = event.eventLocation;
      editingId = parseInt(id); // FIXED HERE
      eventForm.querySelector('button[type="submit"]').textContent = 'Update Event';
    } else {
      console.error('Event not found for editing:', id);
    }
  } catch (err) {
    console.error('Error loading event for edit:', err);
  }
    }


  async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`/events/${id}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (res.ok) {
        messageDiv.textContent = 'Event deleted successfully.';
        messageDiv.className = 'success';
        loadEvents();
      } else {
        messageDiv.textContent = data.message || 'Failed to delete event.';
        messageDiv.className = 'error';
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  }

  // Event delegation for Edit and Delete buttons inside eventList
  eventList.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('edit-btn')) {
      const id = target.dataset.id;
      loadEventForEdit(id);
    } else if (target.classList.contains('delete-btn')) {
      const id = target.dataset.id;
      deleteEvent(id);
    }
  });

  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = eventForm.title.value.trim();
    const description = eventForm.description.value.trim();
    const date = eventForm.date.value;
    const location = eventForm.location.value.trim();

    if (!title || !date) {
      messageDiv.textContent = 'Title and date are required.';
      messageDiv.className = 'error';
      return;
    }

    const eventData = { eventTitle: title, eventDescription: description, eventDate: date, eventLocation: location };

    let method = 'POST';
    let url = '/events';

    if (editingId) {
      method = 'PUT';
      url = `/events/${editingId}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(eventData)
      });

      const data = await res.json();

      if (res.ok) {
        messageDiv.textContent = editingId ? 'Event updated successfully.' : 'Event added successfully.';
        messageDiv.className = 'success';
        eventForm.reset();
        editingId = null;
        eventForm.querySelector('button[type="submit"]').textContent = 'Add Event';
        loadEvents();
      } else {
        messageDiv.textContent = data.errors?.join(', ') || data.message || 'Failed to save event.';
        messageDiv.className = 'error';
      }
    } catch (err) {
      console.error('Error saving event:', err);
      messageDiv.textContent = 'Something went wrong.';
      messageDiv.className = 'error';
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  });

  loadEvents();
});
