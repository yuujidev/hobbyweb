async function getCurrentUser() {
  const response = await fetch('../api/auth.php?action=me', { credentials: 'same-origin' });
  const result = await response.json();
  return result.user || null;
}

async function requestAuth(action, body) {
  const response = await fetch(`../api/auth.php?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  return response.json();
}

function fillProfile(user) {
  document.querySelector('#profile-username').textContent = user.username;
  document.querySelector('#profile-email').textContent = user.email;
  document.querySelector('#profile-phone').textContent = user.phone || 'Không có';
  document.querySelector('#profile-username-input').value = user.username;
  document.querySelector('#profile-phone-input').value = user.phone || '';
}

document.querySelector('#year').textContent = new Date().getFullYear();

(async () => {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const profileView = document.querySelector('#profile-view');
  const editButton = document.querySelector('#edit-profile-button');
  const profileForm = document.querySelector('#profile-form');
  const profileOtpForm = document.querySelector('#profile-otp-form');
  const profileMessage = document.querySelector('#profile-message');
  if (profileView && editButton && profileForm && profileOtpForm) {
    fillProfile(user);
    editButton.addEventListener('click', () => {
    profileView.hidden = true;
    editButton.hidden = true;
    profileForm.hidden = false;
    profileMessage.textContent = '';
    });

    profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await requestAuth('update-profile', {
      username: document.querySelector('#profile-username-input').value.trim(),
      phone: document.querySelector('#profile-phone-input').value.trim(),
    });
    profileMessage.textContent = result.message;
    if (result.requires_otp) {
      profileForm.hidden = true;
      profileOtpForm.hidden = false;
      document.querySelector('#profile-otp-description').textContent = result.message;
    } else if (result.ok) {
      fillProfile(result.user);
      profileForm.hidden = true;
      profileView.hidden = false;
      editButton.hidden = false;
    }
    });

    profileOtpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await requestAuth('verify-profile', { otp: document.querySelector('#profile-otp-code').value.trim() });
    document.querySelector('#profile-otp-message').textContent = result.message;
    if (result.ok) {
      fillProfile(result.user);
      profileOtpForm.hidden = true;
      profileView.hidden = false;
      editButton.hidden = false;
      profileOtpForm.reset();
    }
    });
  }

  const deleteButton = document.querySelector('#delete-account-button');
  const deleteOtpForm = document.querySelector('#delete-otp-form');
  if (deleteButton && deleteOtpForm) {
    deleteButton.addEventListener('click', async () => {
      if (!window.confirm('Bạn chắc chắn muốn xóa tài khoản? Tác vụ này không thể hoàn tác.')) return;
      const result = await requestAuth('request-delete', {});
      document.querySelector('#delete-otp-description').textContent = result.message;
      if (result.ok) {
        deleteButton.hidden = true;
        deleteOtpForm.hidden = false;
      }
    });

    deleteOtpForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const result = await requestAuth('verify-delete', {
        otp: document.querySelector('#delete-otp-code').value.trim(),
      });
      document.querySelector('#delete-otp-message').textContent = result.message;
      if (result.ok) window.location.href = result.redirect;
    });
  }

  document.querySelector('#security-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#security-message');
    const result = await requestAuth('change-password', {
      old_password: document.querySelector('#old-password').value,
      new_password: document.querySelector('#new-password').value,
      confirm_password: document.querySelector('#confirm-password').value,
    });
    message.textContent = result.message;
    if (result.ok) event.target.reset();
  });
})();
