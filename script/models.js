const modelGrid = document.querySelector('#model-grid');
const modelCount = document.querySelector('#model-count');
const emptyModels = document.querySelector('#empty-models');

const defaultModels = [
  { name: 'MGSD Gundam Barbatos', brand: 'Bandai', category: 'Gunpla', price: 'Đang cập nhật', description: 'Dòng SD cao cấp với nhiều chi tiết và khả năng tạo dáng ấn tượng.', link: 'https://bandai-hobby.net/', placeholder: 'MGSD\nBARBATOS', placeholderClass: 'placeholder-blue' },
  { name: '30MM Alto Ground Type', brand: 'Bandai', category: '30 Minutes Missions', price: 'Đang cập nhật', description: 'Model kit dễ custom, phù hợp để bắt đầu build và thử nghiệm loadout.', link: 'https://bandai-hobby.net/', placeholder: '30MM\nALTO', placeholderClass: 'placeholder-orange' },
];

async function loadModels() {
  const response = await fetch('../api/models.php', { credentials: 'same-origin' });
  const result = await response.json();
  return result.ok && Array.isArray(result.models) ? [...result.models, ...defaultModels] : defaultModels;
}

function createModelCard(model, index) {
  const card = document.createElement('article');
  const media = document.createElement('div');
  const details = document.createElement('div');
  const name = document.createElement('h3');
  const meta = document.createElement('p');
  const description = document.createElement('p');
  const code = document.createElement('small');
  const officialLabel = document.createElement('span');
  const link = document.createElement('a');
  card.className = 'catalog-card model-card';
  media.className = 'catalog-media';
  details.className = 'catalog-details';
  name.textContent = model.name || 'Model kit chưa đặt tên';
  meta.textContent = `${model.brand || 'Bandai'} · ${model.category || 'Model kit'} · ${model.price || 'Đang cập nhật'}`;
  description.textContent = model.description || 'Model kit được cộng đồng ERIFTverse quan tâm.';
  code.textContent = `KIT / ${String(index + 1).padStart(3, '0')}`;
  officialLabel.className = 'model-official-label';
  officialLabel.textContent = model.official ? 'CHÍNH HÃNG / ADMIN' : 'CURATED ITEM';
  link.className = 'catalog-arrow';
  link.textContent = '↗';
  link.href = model.link;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `Mở nguồn sản phẩm ${name.textContent}`);
  if (model.image) {
    const image = document.createElement('img');
    image.src = model.image;
    image.alt = name.textContent;
    media.append(image);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = `catalog-placeholder ${model.placeholderClass || 'placeholder-blue'}`;
    placeholder.textContent = model.placeholder || 'MODEL\nKIT';
    media.append(placeholder);
  }
  media.append(code, officialLabel);
  details.append(name, meta, description);
  card.append(media, details, link);
  return card;
}

async function renderModels() {
  const models = await loadModels();
  modelGrid.replaceChildren(...models.map((model, index) => createModelCard(model, index)));
  modelCount.textContent = `${models.length} MODEL KIT`;
  emptyModels.hidden = models.length > defaultModels.length;
}

document.querySelector('#year').textContent = new Date().getFullYear();
renderModels();
