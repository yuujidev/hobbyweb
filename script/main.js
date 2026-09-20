const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const themeButton = document.querySelector('.theme-toggle');
const accountLink = document.querySelector('.account-link');

async function setupAccountMenu() {
  if (!accountLink) return;
  const response = await fetch('../api/auth.php?action=me', { credentials: 'same-origin' });
  const result = await response.json();
  const currentUser = result.user;
  if (!currentUser) return;

  accountLink.textContent = currentUser.username;
  accountLink.href = '#account-menu';
  accountLink.setAttribute('aria-expanded', 'false');
  accountLink.classList.add('account-menu-trigger');

  const menu = document.createElement('div');
  menu.className = 'account-menu';
  menu.id = 'account-menu';
  menu.hidden = true;
  menu.innerHTML = `
    <a href="../auth/security.html">Cài đặt bảo mật</a>
    <a href="../auth/profile.html">Thông tin cá nhân</a>
    <button type="button" id="logout-button">Đăng xuất</button>
  `;
  accountLink.parentElement.append(menu);

  accountLink.addEventListener('click', (event) => {
    event.preventDefault();
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    accountLink.setAttribute('aria-expanded', String(!isOpen));
  });

  menu.querySelector('#logout-button').addEventListener('click', () => {
    fetch('../api/auth.php?action=logout', { method: 'POST', credentials: 'same-origin' })
      .then(() => window.location.reload());
  });
}

setupAccountMenu();

menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

themeButton?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeButton.textContent = document.body.classList.contains('dark') ? '☾' : '☼';
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.querySelector('#year').textContent = new Date().getFullYear();

const productForm = document.querySelector('#product-form');
const imageInput = document.querySelector('#product-image');
const imagePreview = document.querySelector('#image-preview');
const uploadTitle = document.querySelector('#upload-title');
const uploadHelp = document.querySelector('#upload-help');
const productList = document.querySelector('#product-list');
const productCount = document.querySelector('#product-count');
const formMessage = document.querySelector('#form-message');
const productLinkInput = document.querySelector('#product-link');
const productsStorageKey = 'eriftverse-products';
let selectedImage = '';

imageInput?.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    formMessage.textContent = 'Vui lòng chọn đúng tệp hình ảnh.';
    imageInput.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    formMessage.textContent = 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.';
    imageInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    selectedImage = reader.result;
    imagePreview.src = selectedImage;
    imagePreview.classList.add('show');
    uploadTitle.textContent = file.name;
    uploadHelp.textContent = 'Ảnh đã sẵn sàng để đăng.';
    formMessage.textContent = '';
  });
  reader.readAsDataURL(file);
});

productForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#product-name').value.trim();
  const category = document.querySelector('#product-category').value;
  const price = document.querySelector('#product-price').value.trim() || 'Chưa cập nhật giá';
  const description = document.querySelector('#product-description').value.trim() || 'Một sản phẩm độc đáo vừa được thêm vào bộ sưu tập.';
  const productLink = productLinkInput.value.trim();

  if (!selectedImage) {
    formMessage.textContent = 'Bạn hãy chọn ảnh sản phẩm trước.';
    return;
  }

  if (productLink) {
    try {
      const linkUrl = new URL(productLink);
      if (!['http:', 'https:'].includes(linkUrl.protocol)) throw new Error('Unsupported protocol');
    } catch {
      formMessage.textContent = 'Link phải bắt đầu bằng http:// hoặc https://.';
      productLinkInput.focus();
      return;
    }
  }

  const storedProducts = JSON.parse(localStorage.getItem(productsStorageKey) || '[]');
  storedProducts.unshift({
    id: Date.now(),
    image: selectedImage,
    name,
    category,
    price,
    description,
    link: productLink,
  });
  localStorage.setItem(productsStorageKey, JSON.stringify(storedProducts));

  const product = document.createElement('article');
  const productMedia = document.createElement('div');
  const productImage = document.createElement('img');
  const productOverlay = document.createElement('div');
  const scanLine = document.createElement('span');
  const overlayCode = document.createElement('small');
  const overlayName = document.createElement('strong');
  const overlayDescription = document.createElement('p');
  const productInfo = document.createElement('div');
  const productName = document.createElement('strong');
  const productMeta = document.createElement('small');
  const productArrow = document.createElement(productLink ? 'a' : 'span');
  const removeButton = document.createElement('button');

  product.className = 'uploaded-product new-product';
  productMedia.className = 'product-media';
  productImage.className = 'product-image';
  productImage.src = selectedImage;
  productImage.alt = name;
  productOverlay.className = 'product-overlay';
  scanLine.className = 'scan-line';
  overlayCode.textContent = `USER ITEM / ${category.toUpperCase()}`;
  overlayName.textContent = name;
  overlayDescription.textContent = description;
  productOverlay.append(scanLine, overlayCode, overlayName, overlayDescription);
  productMedia.append(productImage, productOverlay);
  productName.textContent = name;
  productMeta.textContent = `${category} · ${price}`;
  productArrow.className = 'product-arrow';
  productArrow.textContent = '↗';
  if (productLink) {
    productArrow.href = productLink;
    productArrow.target = '_blank';
    productArrow.rel = 'noopener noreferrer';
    productArrow.setAttribute('aria-label', `Mở link của ${name}`);
  } else {
    productArrow.setAttribute('aria-label', 'Sản phẩm chưa có link');
  }
  removeButton.className = 'remove-product';
  removeButton.type = 'button';
  removeButton.setAttribute('aria-label', `Gỡ ${name}`);
  removeButton.textContent = 'GỠ';
  removeButton.addEventListener('click', () => {
    product.remove();
    productCount.textContent = `${productList.children.length.toString().padStart(2, '0')} ITEMS`;
  });
  productInfo.append(productName, productMeta);
  product.append(productMedia, productInfo, productArrow, removeButton);
  productList.prepend(product);
  productCount.textContent = `${productList.children.length.toString().padStart(2, '0')} ITEMS`;
  formMessage.textContent = 'Đăng sản phẩm thành công!';
  productForm.reset();
  imagePreview.classList.remove('show');
  uploadTitle.textContent = 'Chọn ảnh sản phẩm';
  uploadHelp.textContent = 'PNG, JPG hoặc WEBP · tối đa 5MB';
  selectedImage = '';
});


