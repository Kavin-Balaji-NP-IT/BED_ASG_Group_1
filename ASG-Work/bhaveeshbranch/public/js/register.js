const form = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = form.username.value.trim();
  const password = form.password.value.trim();
  const role = form.role.value.trim() || 'user';

  messageDiv.textContent = '';
  messageDiv.className = '';

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = 'Registration successful! You can now login.';
      messageDiv.className = 'success';
      form.reset();
    } else {
      if (data.errors) {
        messageDiv.textContent = data.errors.join(', ');
      } else if (data.message) {
        messageDiv.textContent = data.message;
      } else {
        messageDiv.textContent = 'Registration failed';
      }
      messageDiv.className = 'error';
    }
  } catch {
    messageDiv.textContent = 'An error occurred. Please try again later.';
    messageDiv.className = 'error';
  }
});
