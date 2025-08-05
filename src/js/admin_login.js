//const { ipcRenderer } = require('electron'); 

async function handleLogin() {
  const pin = document.getElementById('loginid').value;
  const message = document.getElementById('message');
  message.textContent = '';

  if (!pin || pin.length < 4) {
    message.textContent = 'PIN must be at least 4 digits';
    message.style.color = 'red';
    return;
  }

  try {
    const res = await fetch('http:///10.20.5.59:8080/api/pin_login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      window.location.href = 'admin_upsert.html';
    } else {
      throw data;
    }
  } catch (err) {
    message.textContent = err.detail || 'Login failed. Please try again.';
    message.style.color = 'red';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pinInput = document.getElementById('loginid');
  const loginBtn = document.querySelector('.login');

  // Add event listener for the "Enter" key on the PIN input field
  if (pinInput) {
    pinInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission behavior (if any)
        handleLogin(); 
      }
    });
  }

  // Add event listener for the click on the login button
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
});