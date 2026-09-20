const loginPanel = document.querySelector('#admin-login-panel');
const dashboard = document.querySelector('#admin-dashboard');
const logoutButton = document.querySelector('#admin-logout');
const modelForm = document.querySelector('#model-form');
const modelMessage = document.querySelector('#model-message');
const adminItems = document.querySelector('#admin-items');

async function request(path, options = {}) {
  const response = await fetch(`../api/${path}`, { credentials: 'same-origin', ...options });
  return response.json();
}

function openDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  logoutButton.hidden = false;
  renderAdminItems();
}

async function renderAdminItems() {
  const result = await request('models.php');
  adminItems.replaceChildren();
  if (!result.ok || !result.models.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'admin-empty';
    emptyState.textContent = 'Chưa có model kit nào được admin thêm.';
    adminItems.append(emptyState);
    return;
  }
  result.models.forEach((model) => {
    const item = document.createElement('article');
    const content = document.createElement('div');
    const name = document.createElement('strong');
    const meta = document.createElement('small');
    const link = document.createElement('a');
    const remove = document.createElement('button');
    item.className = 'admin-item';
    name.textContent = model.name;
    meta.textContent = `${model.brand} · ${model.category}`;
    link.href = model.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Mở nguồn ↗';
    remove.type = 'button';
    remove.className = 'admin-remove';
    remove.textContent = 'GỠ';
    remove.addEventListener('click', async () => {
      if (!window.confirm('Gỡ model kit này khỏi trang công khai?')) return;
      await request(`models.php?id=${encodeURIComponent(model.id)}`, { method: 'DELETE' });
      renderAdminItems();
    });
    content.append(name, meta);
    item.append(content, link, remove);
    adminItems.append(item);
  });
}

async function checkAdmin() {
  const result = await request('auth.php?action=me');
  if (!result.user || result.user.role !== 'admin') {
    window.location.href = '../auth/index.html';
    return;
  }
  openDashboard();
}

logoutButton.addEventListener('click', async () => {
  await request('auth.php?action=logout', { method: 'POST' });
  window.location.href = '../auth/index.html';
});

modelForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = {
    name: document.querySelector('#model-name').value.trim(),
    brand: document.querySelector('#model-brand').value.trim(),
    category: document.querySelector('#model-category').value,
    price: document.querySelector('#model-price').value.trim(),
    link: document.querySelector('#model-link').value.trim(),
    image: document.querySelector('#model-image').value.trim(),
    description: document.querySelector('#model-description').value.trim(),
  };
  const result = await request('models.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  modelMessage.textContent = result.message || (result.ok ? 'Đã thêm model kit.' : 'Không thể thêm model kit.');
  if (result.ok) {
    modelForm.reset();
    document.querySelector('#model-brand').value = 'Bandai';
    renderAdminItems();
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
checkAdmin();
