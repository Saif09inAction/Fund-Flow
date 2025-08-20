function logout() {
  localStorage.removeItem('fundflow_current_user');
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('fundflow_current_user') || '{}');
  document.getElementById('name').value = user.name || '';
  document.getElementById('email').value = user.email || '';

  document.getElementById('profile-form').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    if (!name || !email) return;
    // Update user in localStorage
    let users = JSON.parse(localStorage.getItem('fundflow_users') || '{}');
    if (user.email && users[user.email]) {
      delete users[user.email];
    }
    users[email] = { name, email, password: user.password };
    localStorage.setItem('fundflow_users', JSON.stringify(users));
    localStorage.setItem('fundflow_current_user', JSON.stringify({ name, email, password: user.password }));
    document.getElementById('profile-success').style.display = 'block';
    setTimeout(() => {
      document.getElementById('profile-success').style.display = 'none';
    }, 2000);
  };
}); 