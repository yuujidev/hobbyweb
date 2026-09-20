const productsStorageKey = 'eriftverse-products';
const productsPerPage = 20;
const catalogGrid = document.querySelector('#catalog-grid');
const pagination = document.querySelector('#pagination');
const catalogCount = document.querySelector('#catalog-count');

const defaultProducts = [
  {
    name: 'Gundam RX-78',
    category: 'Gunpla',
    price: 'Chưa cập nhật giá',
    description: 'Biểu tượng kinh điển cho mọi bộ sưu tập Gunpla.',
    placeholder: 'RX\n78',
    placeholderClass: 'placeholder-blue',
  },
  {
    name: 'Zaku II Custom',
    category: 'Custom build',
    price: 'Chưa cập nhật giá',
    description: 'Custom build nổi bật với sắc cam chiến đấu.',
    placeholder: 'MS\n06',
    placeholderClass: 'placeholder-orange',
  },
];

function readStoredProducts() {
  try {
    const storedProducts = JSON.parse(localStorage.getItem(productsStorageKey) || '[]');
    return Array.isArray(storedProducts) ? storedProducts : [];
  } catch {
    return [];
  }
}

function createProductCard(product, index) {
  const card = document.createElement('article');
  const media = document.createElement('div');
  const details = document.createElement('div');
  const name = document.createElement('h3');
  const meta = document.createElement('p');
  const description = document.createElement('p');
  const code = document.createElement('small');
  const link = document.createElement(product.link ? 'a' : 'span');

  card.className = 'catalog-card';
  media.className = 'catalog-media';
  details.className = 'catalog-details';
  name.textContent = product.name || 'Sản phẩm chưa đặt tên';
  meta.textContent = `${product.category || 'Khác'} · ${product.price || 'Chưa cập nhật giá'}`;
  description.textContent = product.description || 'Một sản phẩm độc đáo vừa được thêm vào bộ sưu tập.';
  code.textContent = `ITEM / ${String(index + 1).padStart(3, '0')}`;
  link.className = 'catalog-arrow';
  link.textContent = '↗';

  if (product.image) {
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = name.textContent;
    media.append(image);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = `catalog-placeholder ${product.placeholderClass || 'placeholder-blue'}`;
    placeholder.textContent = product.placeholder || 'ITEM';
    media.append(placeholder);
  }

  if (product.link) {
    link.href = product.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Mở link của ${name.textContent}`);
  } else {
    link.setAttribute('aria-label', 'Sản phẩm chưa có link');
  }

  media.append(code);
  details.append(name, meta, description);
  card.append(media, details, link);
  return card;
}

function getCurrentPage() {
  const requestedPage = Number(new URLSearchParams(window.location.search).get('page'));
  return Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
}

function setPage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  window.history.pushState({}, '', url);
  renderCatalog(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createPageButton(label, page, options = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `page-button${options.active ? ' active' : ''}`;
  button.textContent = label;
  button.disabled = options.disabled || false;
  if (options.active) button.setAttribute('aria-current', 'page');
  button.addEventListener('click', () => setPage(page));
  return button;
}

function renderPagination(page, totalPages) {
  pagination.replaceChildren();
  pagination.append(createPageButton('←', page - 1, { disabled: page === 1 }));

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    pagination.append(createPageButton(String(pageNumber).padStart(2, '0'), pageNumber, { active: pageNumber === page }));
  }

  pagination.append(createPageButton('→', page + 1, { disabled: page === totalPages }));
}

function renderCatalog(requestedPage) {
  const products = [...readStoredProducts(), ...defaultProducts];
  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (page - 1) * productsPerPage;
  const pageProducts = products.slice(startIndex, startIndex + productsPerPage);

  catalogGrid.replaceChildren(...pageProducts.map((product, index) => createProductCard(product, startIndex + index)));
  catalogCount.textContent = `${products.length} BÀI · TRANG ${page}/${totalPages}`;
  renderPagination(page, totalPages);
}

document.querySelector('#year').textContent = new Date().getFullYear();
window.addEventListener('popstate', () => renderCatalog(getCurrentPage()));
renderCatalog(getCurrentPage());
