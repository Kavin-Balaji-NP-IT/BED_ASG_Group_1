// -------------------- ADMIN LOGIN --------------------
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  const messageDiv = document.getElementById('message');

  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = adminLoginForm.username.value.trim();
    const password = adminLoginForm.password.value.trim();

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
        // Decode the JWT token using jwt-decode
        const decoded = jwt_decode(data.token);

        // Check if user role is admin
        if (decoded.role !== 'admin') {
          messageDiv.textContent = 'You are not authorized as admin.';
          messageDiv.className = 'error';
          return;
        }

        // Save token to localStorage
        localStorage.setItem('token', data.token);

        messageDiv.textContent = 'Admin login successful!';
        messageDiv.className = 'success';

        // Redirect to admin page after 1 second
        setTimeout(() => window.location.href = 'admin-change-password.html', 1000);
      } else {
        messageDiv.textContent = data.message || 'Login failed.';
        messageDiv.className = 'error';
      }
    } catch (error) {
      console.error('Login fetch error:', error);
      messageDiv.textContent = 'An error occurred. Please try again later.';
      messageDiv.className = 'error';
    }
  });
}


// -------------------- ADMIN CHANGE PASSWORD --------------------
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  const messageDiv = document.getElementById('message');

  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = changePasswordForm.username.value.trim();
    const newPassword = changePasswordForm.newPassword.value.trim();
    const token = localStorage.getItem('token');

    messageDiv.textContent = '';
    messageDiv.className = '';

    try {
      const response = await fetch('/users/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        messageDiv.textContent = data.message || 'Password changed successfully.';
        messageDiv.className = 'success';
      } else {
        messageDiv.textContent = data.message || data.errors?.join(', ') || 'Failed to change password.';
        messageDiv.className = 'error';
      }
    } catch {
      messageDiv.textContent = 'Error occurred. Please try again.';
      messageDiv.className = 'error';
    }
  });
}


// -------------------- ADMIN DELETE USER --------------------
const deleteUserForm = document.getElementById('deleteUserForm');
if (deleteUserForm) {
  // Use the existing message div
  const deleteMessageDiv = document.getElementById('message');

  deleteUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = deleteUserForm.username.value.trim();
    const token = localStorage.getItem('token');

    deleteMessageDiv.textContent = '';
    deleteMessageDiv.className = '';

    try {
      const response = await fetch(`/users/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        deleteMessageDiv.textContent = data.message || 'User deleted successfully.';
        deleteMessageDiv.className = 'success';
      } else {
        deleteMessageDiv.textContent = data.message || 'Failed to delete user.';
        deleteMessageDiv.className = 'error';
      }
    } catch {
      deleteMessageDiv.textContent = 'Error occurred while deleting user.';
      deleteMessageDiv.className = 'error';
    }
  });
}

// -------------------- SHARED ADMIN ACTIONS --------------------
function logout() {
  localStorage.removeItem('token');
  alert('Logged out successfully.');
  window.location.href = 'login.html';
}

function goHome() {
  window.location.href = 'mainmenu.html';
}

window.logout = logout;
window.goHome = goHome;
