const panels = document.querySelectorAll('.auth-panel');
const loginMessage = document.querySelector('#login-message');
const registerMessage = document.querySelector('#register-message');
const otpMessage = document.querySelector('#otp-message');

function showPanel(panelId) {
  panels.forEach((panel) => { panel.hidden = panel.id !== panelId; });
  [loginMessage, registerMessage, otpMessage].forEach((message) => { message.textContent = ''; });
}

async function request(action, payload) {
  const response = await fetch(`../api/auth.php?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  return response.json();
}

document.querySelectorAll('[data-show]').forEach((button) => {
  button.addEventListener('click', () => showPanel(button.dataset.show));
});

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await request('login', {
    identifier: document.querySelector('#login-username').value.trim(),
    password: document.querySelector('#login-password').value,
  });
  if (!result.ok) {
    loginMessage.textContent = result.message;
    return;
  }
  window.location.href = result.redirect;
});

document.querySelector('#register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await request('register', {
    username: document.querySelector('#register-username').value.trim(),
    email: document.querySelector('#register-email').value.trim(),
    phone: document.querySelector('#register-phone').value.trim(),
    password: document.querySelector('#register-password').value,
    confirm_password: document.querySelector('#register-confirm').value,
  });
  if (!result.ok) {
    registerMessage.textContent = result.message;
    return;
  }
  document.querySelector('#otp-description').textContent = result.message;
  const otpDemo = document.querySelector('#otp-demo');
  otpDemo.hidden = !result.dev_otp;
  otpDemo.textContent = result.dev_otp ? `OTP local: ${result.dev_otp}` : '';
  showPanel('otp-panel');
});

document.querySelector('#otp-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await request('verify', { otp: document.querySelector('#otp-code').value.trim() });
  if (!result.ok) {
    otpMessage.textContent = result.message;
    return;
  }
  showPanel('login-panel');
  loginMessage.textContent = result.message;
});

document.querySelector('#year').textContent = new Date().getFullYear();
