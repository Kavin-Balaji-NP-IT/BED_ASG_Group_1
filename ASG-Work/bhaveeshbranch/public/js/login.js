const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');


document.getElementById('adminChangePasswordBtn').addEventListener('click', () => {
  window.location.href = '/admin-login.html';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = loginForm.username.value.trim();
  const password = loginForm.password.value.trim();

  messageDiv.textContent = '';
  messageDiv.className = '';

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = 'Login successful!';
      messageDiv.className = 'success';
      localStorage.setItem('token', data.token);
      setTimeout(() => window.location.href = '/index.html', 1000);
    } else {
      messageDiv.textContent = data.message || 'Login failed.';
      messageDiv.className = 'error';
    }
  } catch {
    messageDiv.textContent = 'An error occurred. Please try again later.';
    messageDiv.className = 'error';
  }
});
