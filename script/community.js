const discussionsStorageKey = 'eriftverse-discussions';
const discussionsPerPage = 20;
const discussionForm = document.querySelector('#discussion-form');
const discussionList = document.querySelector('#discussion-list');
const discussionPagination = document.querySelector('#discussion-pagination');
const discussionCount = document.querySelector('#discussion-count');
const discussionMessage = document.querySelector('#discussion-message');
const currentUserKey = 'eriftverse-current-user';
const categoryInput = document.querySelector('#discussion-category');
const showcaseFields = document.querySelector('#showcase-fields');
const tradeFields = document.querySelector('#trade-fields');
const discussionImageInput = document.querySelector('#discussion-image');
const discussionImagePreviews = document.querySelector('#discussion-image-previews');
const negotiableInput = document.querySelector('#discussion-negotiable');
let selectedDiscussionImages = [];

const defaultDiscussions = [
  {
    id: 'default-care',
    author: 'Kaito_01',
    category: 'Hỏi đáp',
    title: 'Mọi người thường bảo quản Gunpla như thế nào?',
    content: 'Mình mới bắt đầu sưu tầm và muốn tìm cách hạn chế bụi, ố màu cho các kit đã build.',
  },
  {
    id: 'default-custom',
    author: 'Linh Figure',
    category: 'Khoe build',
    title: 'Chiếc custom đầu tiên của mình sau 3 tháng',
    content: 'Cuối cùng cũng hoàn thành em Zaku màu cam. Rất mong nhận được góp ý từ mọi người.',
  },
  {
    id: 'default-order',
    author: 'Hobby Scout',
    category: 'Mua bán - trao đổi',
    title: 'Tìm người cùng order set decal sắp ra mắt',
    content: 'Nếu có bạn nào cũng đang quan tâm set này thì cùng trao đổi để tối ưu phí ship nhé.',
  },
];

function readDiscussions() {
  try {
    const savedDiscussions = JSON.parse(localStorage.getItem(discussionsStorageKey) || '[]');
    return Array.isArray(savedDiscussions) ? savedDiscussions : [];
  } catch {
    return [];
  }
}

function saveDiscussions(discussions) {
  try {
    localStorage.setItem(discussionsStorageKey, JSON.stringify(discussions));
    return true;
  } catch {
    return false;
  }
}

function getCurrentUser() {
  return localStorage.getItem(currentUserKey) || '';
}

function getStoredDiscussionIndex(discussionId) {
  return readDiscussions().findIndex((discussion) => discussion.id === discussionId);
}

function getAllDiscussions() {
  const storedDiscussions = readDiscussions();
  return [...storedDiscussions, ...defaultDiscussions.filter((discussion) => !storedDiscussions.some((storedDiscussion) => storedDiscussion.id === discussion.id))];
}

function updateCategoryFields() {
  const isShowcase = categoryInput.value === 'Khoe build';
  const isTrade = categoryInput.value === 'Mua bán - trao đổi';
  showcaseFields.hidden = !isShowcase;
  tradeFields.hidden = !isTrade;
  document.querySelector('#discussion-link').required = isShowcase;
  discussionImageInput.required = isTrade;
  document.querySelector('#discussion-price').required = isTrade && !negotiableInput.checked;
}

categoryInput.addEventListener('change', updateCategoryFields);
negotiableInput.addEventListener('change', updateCategoryFields);
updateCategoryFields();

discussionImageInput.addEventListener('change', async () => {
  const files = Array.from(discussionImageInput.files || []);
  const totalSize = files.reduce((size, file) => size + file.size, 0);
  if (!files.length) return;
  if (files.length > 6 || totalSize > 5 * 1024 * 1024 || files.some((file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1.5 * 1024 * 1024)) {
    discussionImageInput.value = '';
    selectedDiscussionImages = [];
    discussionImagePreviews.replaceChildren();
    discussionMessage.textContent = 'Chọn tối đa 6 ảnh PNG, JPG hoặc WEBP; mỗi ảnh tối đa 1.5MB và tổng tối đa 5MB.';
    return;
  }
  selectedDiscussionImages = await Promise.all(files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  })));
  discussionImagePreviews.replaceChildren(...selectedDiscussionImages.map((image, index) => {
    const preview = document.createElement('img');
    preview.className = 'discussion-image-preview';
    preview.src = image;
    preview.alt = `Xem trước ảnh sản phẩm ${index + 1}`;
    return preview;
  }));
});

function createReplyForm(discussion) {
  const form = document.createElement('form');
  const row = document.createElement('div');
  const author = document.createElement('input');
  const content = document.createElement('textarea');
  const submit = document.createElement('button');
  const message = document.createElement('p');

  form.className = 'reply-form';
  row.className = 'reply-form-row';
  author.type = 'text';
  author.maxLength = 35;
  author.placeholder = 'Tên hiển thị';
  author.required = true;
  author.value = getCurrentUser();
  content.rows = 2;
  content.maxLength = 300;
  content.placeholder = 'Viết câu trả lời...';
  content.required = true;
  submit.type = 'submit';
  submit.className = 'reply-submit';
  submit.textContent = 'Trả lời ↗';
  message.className = 'reply-message';
  message.setAttribute('role', 'status');

  row.append(author, content, submit);
  form.append(row, message);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const discussions = readDiscussions();
    const discussionIndex = getStoredDiscussionIndex(discussion.id);
    const selectedDiscussion = discussionIndex >= 0 ? discussions[discussionIndex] : { ...discussion, replies: [] };
    const replies = selectedDiscussion.replies || [];
    replies.push({
      id: Date.now(),
      author: author.value.trim(),
      content: content.value.trim(),
      ownerUsername: getCurrentUser(),
    });
    selectedDiscussion.replies = replies;
    if (discussionIndex >= 0) {
      discussions[discussionIndex] = selectedDiscussion;
    } else {
      discussions.push(selectedDiscussion);
    }
    if (!saveDiscussions(discussions)) {
      message.textContent = 'Không thể lưu câu trả lời. Bộ nhớ trình duyệt đã đầy.';
      return;
    }
    message.textContent = 'Đã thêm câu trả lời.';
    content.value = '';
    renderDiscussions(getCurrentPage());
  });
  return form;
}

function createReplies(discussion) {
  const repliesSection = document.createElement('div');
  const replies = discussion.replies || [];
  const heading = document.createElement('strong');
  heading.className = 'replies-heading';
  heading.textContent = `${replies.length} câu trả lời`;
  repliesSection.className = 'discussion-replies';
  repliesSection.append(heading);

  replies.forEach((reply) => {
    const replyItem = document.createElement('div');
    const replyMeta = document.createElement('strong');
    const replyBody = document.createElement('p');
    replyItem.className = 'reply-item';
    replyMeta.textContent = reply.author || 'Thành viên ERIFTverse';
    replyBody.textContent = reply.content;
    replyItem.append(replyMeta, replyBody);
    repliesSection.append(replyItem);
  });
  repliesSection.append(createReplyForm(discussion));
  return repliesSection;
}

function createDiscussionCard(discussion, index) {
  const card = document.createElement('article');
  const avatar = document.createElement('div');
  const content = document.createElement('div');
  const topLine = document.createElement('div');
  const category = document.createElement('span');
  const code = document.createElement('small');
  const title = document.createElement('h3');
  const body = document.createElement('p');
  const meta = document.createElement('small');
  const arrow = document.createElement('span');
  const actions = document.createElement('div');

  card.className = 'discussion-card';
  avatar.className = 'discussion-avatar';
  avatar.textContent = (discussion.author || 'E').charAt(0).toUpperCase();
  content.className = 'discussion-content';
  topLine.className = 'discussion-topline';
  category.className = 'discussion-category';
  category.textContent = discussion.category || 'Khác';
  code.textContent = `THREAD / ${String(index + 1).padStart(3, '0')}`;
  title.textContent = discussion.title || 'Chủ đề chưa đặt tên';
  body.textContent = discussion.content || 'Chưa có nội dung.';
  meta.textContent = `Bởi ${discussion.author || 'Thành viên ERIFTverse'} · Thảo luận cộng đồng`;
  arrow.className = 'discussion-arrow';
  arrow.textContent = '↗';
  actions.className = 'discussion-actions';
  content.append(topLine);

  const currentUser = getCurrentUser();
  const isDiscussionOwner = currentUser && (discussion.ownerUsername === currentUser || (!discussion.ownerUsername && discussion.author === currentUser));
  if (isDiscussionOwner) {
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'discussion-remove';
    removeButton.textContent = 'Gỡ bài';
    removeButton.setAttribute('aria-label', `Gỡ bài ${discussion.title || ''}`);
    removeButton.addEventListener('click', () => {
      if (!window.confirm('Bạn có chắc muốn gỡ bài đăng này không?')) return;
      const discussions = readDiscussions().filter((savedDiscussion) => savedDiscussion.id !== discussion.id);
      if (!saveDiscussions(discussions)) return;
      renderDiscussions(getCurrentPage());
    });
    actions.append(removeButton);
  }

  topLine.append(category, code);
  content.append(title, body, meta);

  if (discussion.category === 'Khoe build' && discussion.link) {
    const productLink = document.createElement('a');
    productLink.className = 'discussion-product-link';
    productLink.href = discussion.link;
    productLink.target = '_blank';
    productLink.rel = 'noopener noreferrer';
    productLink.textContent = 'Mở bài sản phẩm ↗';
    content.append(productLink);
  }

  if (discussion.category === 'Mua bán - trao đổi') {
    const images = discussion.images || (discussion.image ? [discussion.image] : []);
    if (images.length) {
      const productImages = document.createElement('div');
      productImages.className = 'discussion-product-images';
      images.forEach((image, imageIndex) => {
        const productImage = document.createElement('img');
        productImage.className = 'discussion-product-image';
        productImage.src = image;
        productImage.alt = `Ảnh sản phẩm ${imageIndex + 1} trong bài ${discussion.title}`;
        productImages.append(productImage);
      });
      content.append(productImages);
    }
    const price = document.createElement('strong');
    price.className = 'discussion-price';
    price.textContent = discussion.negotiable ? 'Giá: Thương lượng' : `Giá: ${discussion.price || 'Liên hệ người đăng'}`;
    content.append(price);
  }

  content.append(createReplies(discussion));
  actions.append(arrow);
  card.append(avatar, content, actions);
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
  renderDiscussions(page);
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
  discussionPagination.replaceChildren();
  discussionPagination.append(createPageButton('←', page - 1, { disabled: page === 1 }));
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    discussionPagination.append(createPageButton(String(pageNumber).padStart(2, '0'), pageNumber, { active: pageNumber === page }));
  }
  discussionPagination.append(createPageButton('→', page + 1, { disabled: page === totalPages }));
}

function renderDiscussions(requestedPage) {
  const discussions = getAllDiscussions();
  const totalPages = Math.max(1, Math.ceil(discussions.length / discussionsPerPage));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (page - 1) * discussionsPerPage;
  const pageDiscussions = discussions.slice(startIndex, startIndex + discussionsPerPage);

  discussionList.replaceChildren(...pageDiscussions.map((discussion, index) => createDiscussionCard(discussion, startIndex + index)));
  discussionCount.textContent = `${discussions.length} CHỦ ĐỀ · TRANG ${page}/${totalPages}`;
  renderPagination(page, totalPages);
}

discussionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const discussion = {
    id: Date.now(),
    author: document.querySelector('#discussion-author').value.trim(),
    category: document.querySelector('#discussion-category').value,
    title: document.querySelector('#discussion-title').value.trim(),
    content: document.querySelector('#discussion-content').value.trim(),
    ownerUsername: getCurrentUser(),
    replies: [],
  };
  if (discussion.category === 'Khoe build') {
    const link = document.querySelector('#discussion-link').value.trim();
    try {
      const linkUrl = new URL(link);
      if (!['http:', 'https:'].includes(linkUrl.protocol)) throw new Error('Invalid link');
      discussion.link = link;
    } catch {
      discussionMessage.textContent = 'Link phải bắt đầu bằng http:// hoặc https://.';
      return;
    }
  }
  if (discussion.category === 'Mua bán - trao đổi') {
    discussion.images = selectedDiscussionImages;
    discussion.price = document.querySelector('#discussion-price').value.trim();
    discussion.negotiable = document.querySelector('#discussion-negotiable').checked;
    if (!discussion.negotiable && !discussion.price) {
      discussionMessage.textContent = 'Vui lòng nhập giá hoặc chọn giá cả thương lượng.';
      return;
    }
  }
  const discussions = readDiscussions();
  discussions.unshift(discussion);
  if (!saveDiscussions(discussions)) {
    discussionMessage.textContent = 'Không thể đăng bài. Bộ nhớ trình duyệt đã đầy.';
    return;
  }
  discussionMessage.textContent = 'Đã đăng chủ đề thành công!';
  discussionForm.reset();
  selectedDiscussionImages = [];
  discussionImagePreviews.replaceChildren();
  updateCategoryFields();
  renderDiscussions(1);
});

document.querySelector('#year').textContent = new Date().getFullYear();
window.addEventListener('popstate', () => renderDiscussions(getCurrentPage()));
renderDiscussions(getCurrentPage());
