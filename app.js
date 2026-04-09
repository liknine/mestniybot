// ==================== INITIALIZATION ====================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// ==================== CONFIG ====================
const ADMIN_USERNAME = 'liknine';
const SUPPORT_USERNAME = 'liknine';

// ==================== STATE ====================
const state = {
    products: [],
    cart: [],
    favorites: [],
    currency: 'BYN',
    currentCategory: 'all',
    currentSize: 'all',
    searchQuery: '',
    selectedProduct: null,
    selectedSize: null,
    quantity: 1,
    deliveryType: 'pickup',
    mailService: 'europochta',
    user: {
        id: null,
        firstName: 'Пользователь',
        lastName: '',
        username: '',
        photoUrl: null
    },
    exchangeRates: { BYN: 1, RUB: 28.5, EUR: 0.29, USD: 0.31 }
};

const SIZES_BY_CATEGORY = {
    shoes: ['36','36.5','37','37.5','38','38.5','39','39.5','40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45','45.5','46','46.5'],
    clothing: ['XS','S','M','L','XL','XXL','XXXL'],
    onesize: ['ONE SIZE']
};

const CATEGORY_SIZE_TYPE = {
    1: 'shoes', 2: 'clothing', 3: 'clothing',
    4: 'onesize', 5: 'clothing', 6: 'onesize'
};

// ==================== LOAD PRODUCTS ====================
async function loadProducts() {
    console.log('📦 Загружаем товары...');
    try {
        const response = await fetch('products.json?v=' + Date.now());
        if (response.ok) {
            state.products = await response.json();
            console.log('✅ Загружено товаров:', state.products.length);
            return true;
        }
        return false;
    } catch (e) {
        console.log('❌ Ошибка:', e.message);
        return false;
    }
}

// ==================== DOM ELEMENTS ====================
const elements = {
    productsGrid: document.getElementById('productsGrid'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    categoryDropdown: document.getElementById('categoryDropdown'),
    categoryBtn: document.getElementById('categoryBtn'),
    categoryText: document.getElementById('categoryText'),
    categoryMenu: document.getElementById('categoryMenu'),
    sizeDropdown: document.getElementById('sizeDropdown'),
    sizeBtn: document.getElementById('sizeBtn'),
    sizeText: document.getElementById('sizeText'),
    sizeMenu: document.getElementById('sizeMenu'),
    currencyBtn: document.getElementById('currencyBtn'),
    currencyModal: document.getElementById('currencyModal'),
    productModal: document.getElementById('productModal'),
    modalBack: document.getElementById('modalBack'),
    modalFavorite: document.getElementById('modalFavorite'),
    galleryTrack: document.getElementById('galleryTrack'),
    galleryDots: document.getElementById('galleryDots'),
    productTitle: document.getElementById('productTitle'),
    productPriceMain: document.getElementById('productPriceMain'),
    productStock: document.getElementById('productStock'),
    sizesGrid: document.getElementById('sizesGrid'),
    qtyMinus: document.getElementById('qtyMinus'),
    qtyPlus: document.getElementById('qtyPlus'),
    qtyValue: document.getElementById('qtyValue'),
    productDescription: document.getElementById('productDescription'),
    addToCartBtn: document.getElementById('addToCartBtn'),
    btnPrice: document.getElementById('btnPrice'),
    cartModal: document.getElementById('cartModal'),
    cartBack: document.getElementById('cartBack'),
    cartItems: document.getElementById('cartItems'),
    cartEmpty: document.getElementById('cartEmpty'),
    cartFooter: document.getElementById('cartFooter'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    clearCartBtn: document.getElementById('clearCartBtn'),
    cartBadge: document.getElementById('cartBadge'),
    checkoutModal: document.getElementById('checkoutModal'),
    checkoutBack: document.getElementById('checkoutBack'),
    checkoutForm: document.getElementById('checkoutForm'),
    mailOptions: document.getElementById('mailOptions'),
    europochtaFields: document.getElementById('europochtaFields'),
    belpochtaFields: document.getElementById('belpochtaFields'),
    cdekFields: document.getElementById('cdekFields'),
    checkoutTotal: document.getElementById('checkoutTotal'),
    submitOrder: document.getElementById('submitOrder'),
    favoritesModal: document.getElementById('favoritesModal'),
    favoritesBack: document.getElementById('favoritesBack'),
    favoritesGrid: document.getElementById('favoritesGrid'),
    favoritesEmpty: document.getElementById('favoritesEmpty'),
    favoritesHeaderBtn: document.getElementById('favoritesHeaderBtn'),
    profileModal: document.getElementById('profileModal'),
    profileBack: document.getElementById('profileBack'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileCartCount: document.getElementById('profileCartCount'),
    profileFavCount: document.getElementById('profileFavCount'),
    supportBtn: document.getElementById('supportBtn'),
    navHome: document.getElementById('navHome'),
    navFavorites: document.getElementById('navFavorites'),
    navCart: document.getElementById('navCart'),
    navProfile: document.getElementById('navProfile'),
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toastText')
};

// ==================== UTILITIES ====================
function formatPrice(priceByn, currency = state.currency, product = null) {
    const symbols = { BYN: 'BYN', RUB: '₽', EUR: '€', USD: '$' };
    
    // Если у товара есть свои цены — используем их
    if (product && product.prices && product.prices[currency]) {
        const price = product.prices[currency];
        if (currency === 'USD' || currency === 'EUR') return `${symbols[currency]}${price.toFixed(2)}`;
        return `${price.toFixed(2)} ${symbols[currency]}`;
    }
    
    // Иначе конвертируем из BYN
    const rate = state.exchangeRates[currency] || 1;
    const converted = priceByn * rate;
    if (currency === 'USD' || currency === 'EUR') return `${symbols[currency]}${converted.toFixed(2)}`;
    return `${converted.toFixed(2)} ${symbols[currency]}`;
}

function getItemPrice(product, quantity = 1) {
    if (product && product.prices && product.prices[state.currency]) {
        return product.prices[state.currency] * quantity;
    }
    return product.price_byn * quantity * (state.exchangeRates[state.currency] || 1);
}

function formatItemPrice(totalInCurrency) {
    const symbols = { BYN: 'BYN', RUB: '₽', EUR: '€', USD: '$' };
    const currency = state.currency;
    if (currency === 'USD' || currency === 'EUR') return `${symbols[currency]}${totalInCurrency.toFixed(2)}`;
    return `${totalInCurrency.toFixed(2)} ${symbols[currency]}`;
}

function showToast(message) {
    elements.toastText.textContent = message;
    elements.toast.classList.add('show');
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    setTimeout(() => elements.toast.classList.remove('show'), 2000);
}

function hapticFeedback(type = 'light') {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(type);
}

// ==================== USER ====================
function loadUserData() {
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        state.user = {
            id: user.id,
            firstName: user.first_name || 'Пользователь',
            lastName: user.last_name || '',
            username: user.username || '',
            photoUrl: user.photo_url || null
        };
    }
    updateProfileUI();
}

function updateProfileUI() {
    const fullName = state.user.lastName ? `${state.user.firstName} ${state.user.lastName}` : state.user.firstName;
    elements.profileName.textContent = fullName;
    elements.profileUsername.textContent = state.user.username ? `@${state.user.username}` : 'Telegram User';
    if (state.user.photoUrl) elements.profileAvatar.innerHTML = `<img src="${state.user.photoUrl}" alt="Avatar">`;
    updateProfileStats();
}

function updateProfileStats() {
    elements.profileCartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.profileFavCount.textContent = state.favorites.length;
}

// ==================== SIZE FILTER ====================
function updateSizeFilter() {
    const categoryId = state.currentCategory === 'all' ? null : parseInt(state.currentCategory);
    let sizes = categoryId ? (SIZES_BY_CATEGORY[CATEGORY_SIZE_TYPE[categoryId]] || []) : [...SIZES_BY_CATEGORY.shoes, ...SIZES_BY_CATEGORY.clothing, ...SIZES_BY_CATEGORY.onesize];
    
    let menuHtml = `<button class="filter-option active" data-size="all">Все размеры</button>`;
    
    if (categoryId === 1) {
        for (let i = 0; i < sizes.length; i += 2) {
            menuHtml += `<div class="filter-option-row">`;
            menuHtml += `<button class="filter-option-size" data-size="${sizes[i]}">${sizes[i]}</button>`;
            if (sizes[i + 1]) menuHtml += `<button class="filter-option-size" data-size="${sizes[i + 1]}">${sizes[i + 1]}</button>`;
            menuHtml += `</div>`;
        }
    } else {
        sizes.forEach(size => { menuHtml += `<button class="filter-option" data-size="${size}">${size}</button>`; });
    }
    
    elements.sizeMenu.innerHTML = menuHtml;
    state.currentSize = 'all';
    elements.sizeText.textContent = 'Все размеры';
    
    elements.sizeMenu.querySelectorAll('.filter-option, .filter-option-size').forEach(option => {
        option.addEventListener('click', () => {
            elements.sizeMenu.querySelectorAll('.filter-option, .filter-option-size').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            state.currentSize = option.dataset.size;
            elements.sizeText.textContent = option.dataset.size === 'all' ? 'Все размеры' : option.dataset.size;
            elements.sizeDropdown.classList.remove('open');
            filterProducts();
            hapticFeedback();
        });
    });
}

// ==================== RENDER ====================
function renderProducts(products) {
    elements.loading.classList.add('hidden');
    
    if (products.length === 0) {
        elements.productsGrid.innerHTML = '';
        elements.emptyState.style.display = 'block';
        lucide.createIcons();
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.productsGrid.innerHTML = products.map(product => {
        const isFavorite = state.favorites.includes(product.id);
        const stockStatus = getStockStatus(product.stock);
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.images[0]}" alt="${product.name}" class="product-image" loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2240%22>📷</text></svg>'">
                    <button class="product-favorite ${isFavorite ? 'active' : ''}" data-id="${product.id}">
                        <i data-lucide="heart"></i>
                    </button>
                    ${product.images.length > 1 ? `<div class="image-indicators">${product.images.map((_, i) => `<div class="image-indicator ${i === 0 ? 'active' : ''}"></div>`).join('')}</div>` : ''}
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formatPrice(product.price_byn, state.currency, product)}</p>
                    <span class="product-status ${stockStatus.class}">${stockStatus.text}</span>
                </div>
            </div>`;
    }).join('');
    
    lucide.createIcons();
    attachProductListeners();
}

function getStockStatus(stock) {
    if (stock === 0) return { text: 'Нет в наличии', class: 'out-of-stock' };
    if (stock <= 5) return { text: `Осталось ${stock} шт`, class: 'low-stock' };
    return { text: 'В наличии', class: 'in-stock' };
}

function renderCart() {
    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = '';
        elements.cartEmpty.style.display = 'flex';
        elements.cartFooter.style.display = 'none';
        lucide.createIcons();
        return;
    }
    
    elements.cartEmpty.style.display = 'none';
    elements.cartFooter.style.display = 'block';
    
    let total = 0;
    elements.cartItems.innerHTML = state.cart.map(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) return '';
        const itemTotal = getItemPrice(product, item.quantity);
        total += itemTotal;
        return `
            <div class="cart-item" data-id="${item.productId}" data-size="${item.size}">
                <img src="${product.images[0]}" alt="${product.name}" class="cart-item-image"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2240%22>📷</text></svg>'">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${product.name}</h4>
                    <p class="cart-item-size">Размер: ${item.size}</p>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">${formatItemPrice(itemTotal)}</span>
                        <div class="cart-item-actions">
                            <div class="cart-item-qty">
                                <button class="cart-qty-minus"><i data-lucide="minus"></i></button>
                                <span>${item.quantity}</span>
                                <button class="cart-qty-plus"><i data-lucide="plus"></i></button>
                            </div>
                            <button class="cart-item-delete"><i data-lucide="trash-2"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
    
    elements.cartSubtotal.textContent = formatItemPrice(total);
    elements.cartTotal.textContent = formatItemPrice(total);
    elements.checkoutTotal.textContent = formatItemPrice(total);
    lucide.createIcons();
    attachCartListeners();
    updateCartBadge();
}

function renderFavorites() {
    const favoriteProducts = state.products.filter(p => state.favorites.includes(p.id));
    if (favoriteProducts.length === 0) {
        elements.favoritesGrid.innerHTML = '';
        elements.favoritesEmpty.style.display = 'flex';
        lucide.createIcons();
        return;
    }
    elements.favoritesEmpty.style.display = 'none';
    elements.favoritesGrid.innerHTML = favoriteProducts.map(product => {
        const stockStatus = getStockStatus(product.stock);
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.images[0]}" alt="${product.name}" class="product-image" loading="lazy">
                    <button class="product-favorite active" data-id="${product.id}"><i data-lucide="heart"></i></button>
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formatPrice(product.price_byn, state.currency, product)}</p>
                    <span class="product-status ${stockStatus.class}">${stockStatus.text}</span>
                </div>
            </div>`;
    }).join('');
    lucide.createIcons();
    attachProductListeners();
}

function updateCartBadge() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartBadge.textContent = count;
    elements.cartBadge.dataset.count = count;
    updateProfileStats();
}

// ==================== MODALS ====================
function openProductModal(product) {
    state.selectedProduct = product;
    state.selectedSize = null;
    state.quantity = 1;
    
    elements.galleryTrack.innerHTML = product.images.map(img =>
        `<img src="${img}" alt="${product.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2260%22>📷</text></svg>'">`
    ).join('');
    elements.galleryDots.innerHTML = product.images.map((_, i) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}"></div>`).join('');
    
    elements.productTitle.textContent = product.name;
    elements.productPriceMain.textContent = formatPrice(product.price_byn, state.currency, product);
    
    const stockStatus = getStockStatus(product.stock);
    elements.productStock.textContent = stockStatus.text;
    elements.productStock.className = `product-stock ${stockStatus.class}`;
    
    elements.sizesGrid.innerHTML = product.sizes.map(size =>
        `<button class="size-chip" data-size="${size}" ${product.stock === 0 ? 'disabled' : ''}>${size}</button>`
    ).join('');
    
    elements.qtyValue.textContent = state.quantity;
    elements.productDescription.textContent = product.description;
    elements.modalFavorite.classList.toggle('active', state.favorites.includes(product.id));
    updateAddToCartBtn();
    elements.productModal.classList.add('active');
    lucide.createIcons();
    attachProductModalListeners();
}

function closeProductModal() {
    elements.productModal.classList.remove('active');
    state.selectedProduct = null;
    state.selectedSize = null;
    state.quantity = 1;
}

function updateAddToCartBtn() {
    if (!state.selectedProduct) return;
    elements.addToCartBtn.disabled = !state.selectedSize || state.selectedProduct.stock === 0;
    const total = getItemPrice(state.selectedProduct, state.quantity);
    elements.btnPrice.textContent = formatItemPrice(total);
}

function openCartModal() { renderCart(); elements.cartModal.classList.add('active'); }
function openFavoritesModal() { renderFavorites(); elements.favoritesModal.classList.add('active'); }
function openProfileModal() { updateProfileUI(); elements.profileModal.classList.add('active'); lucide.createIcons(); }
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

function openCheckoutModal() {
    elements.cartModal.classList.remove('active');
    elements.checkoutModal.classList.add('active');
    resetCheckoutForm();
}

function resetCheckoutForm() {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.delivery === 'pickup'));
    state.deliveryType = 'pickup';
    state.mailService = 'europochta';
    elements.mailOptions.classList.remove('active');
    elements.europochtaFields.classList.remove('active');
    elements.belpochtaFields.classList.remove('active');
    elements.cdekFields.classList.remove('active');
    const euroRadio = document.querySelector('input[name="mailService"][value="europochta"]');
    if (euroRadio) euroRadio.checked = true;
}

function updateDeliveryFields() {
    elements.europochtaFields.classList.remove('active');
    elements.belpochtaFields.classList.remove('active');
    elements.cdekFields.classList.remove('active');
    
    if (state.deliveryType === 'mail') {
        elements.mailOptions.classList.add('active');
        if (state.mailService === 'europochta') elements.europochtaFields.classList.add('active');
        else if (state.mailService === 'belpochta') elements.belpochtaFields.classList.add('active');
        else if (state.mailService === 'cdek') elements.cdekFields.classList.add('active');
    } else {
        elements.mailOptions.classList.remove('active');
    }
}

// ==================== LISTENERS ====================
function attachProductListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.product-favorite')) return;
            const product = state.products.find(p => p.id === parseInt(card.dataset.id));
            if (product) { hapticFeedback(); openProductModal(product); }
        });
    });
    document.querySelectorAll('.product-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(parseInt(btn.dataset.id));
            btn.classList.toggle('active');
            hapticFeedback('medium');
        });
    });
}

function attachProductModalListeners() {
    elements.galleryTrack.addEventListener('scroll', () => {
        const index = Math.round(elements.galleryTrack.scrollLeft / elements.galleryTrack.offsetWidth);
        document.querySelectorAll('.gallery-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
    });
    elements.sizesGrid.querySelectorAll('.size-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            elements.sizesGrid.querySelectorAll('.size-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.selectedSize = chip.dataset.size;
            hapticFeedback();
            updateAddToCartBtn();
        });
    });
}

function attachCartListeners() {
    document.querySelectorAll('.cart-qty-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.cart-item');
            updateCartItemQty(parseInt(item.dataset.id), item.dataset.size, -1);
        });
    });
    document.querySelectorAll('.cart-qty-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.cart-item');
            updateCartItemQty(parseInt(item.dataset.id), item.dataset.size, 1);
        });
    });
    document.querySelectorAll('.cart-item-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.cart-item');
            removeFromCart(parseInt(item.dataset.id), item.dataset.size);
        });
    });
}

// ==================== CART ====================
function addToCart() {
    if (!state.selectedProduct || !state.selectedSize) return;
    const existingItem = state.cart.find(item => item.productId === state.selectedProduct.id && item.size === state.selectedSize);
    if (existingItem) existingItem.quantity += state.quantity;
    else state.cart.push({ productId: state.selectedProduct.id, size: state.selectedSize, quantity: state.quantity });
    saveCart(); updateCartBadge(); showToast('Добавлено в корзину'); closeProductModal();
}

function updateCartItemQty(productId, size, delta) {
    const item = state.cart.find(i => i.productId === productId && i.size === size);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(productId, size);
    else { saveCart(); renderCart(); }
    hapticFeedback();
}

function removeFromCart(productId, size) {
    state.cart = state.cart.filter(i => !(i.productId === productId && i.size === size));
    saveCart(); renderCart(); hapticFeedback('medium');
}

function clearCart() { state.cart = []; saveCart(); renderCart(); hapticFeedback('medium'); }
function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); updateCartBadge(); }
function loadCart() { const saved = localStorage.getItem('cart'); if (saved) { state.cart = JSON.parse(saved); updateCartBadge(); } }

// ==================== FAVORITES ====================
function toggleFavorite(productId) {
    const index = state.favorites.indexOf(productId);
    if (index === -1) state.favorites.push(productId);
    else state.favorites.splice(index, 1);
    saveFavorites(); updateProfileStats();
}

function saveFavorites() { localStorage.setItem('favorites', JSON.stringify(state.favorites)); }
function loadFavorites() { const saved = localStorage.getItem('favorites'); if (saved) state.favorites = JSON.parse(saved); }

// ==================== FILTER ====================
function filterProducts() {
    let filtered = state.products;
    if (state.currentCategory !== 'all') filtered = filtered.filter(p => p.category_id === parseInt(state.currentCategory));
    if (state.currentSize !== 'all') filtered = filtered.filter(p => p.sizes.includes(state.currentSize));
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    renderProducts(filtered);
}

// ==================== CHECKOUT ====================
function submitOrder() {
    const lastName = document.getElementById('customerLastName').value.trim();
    const firstName = document.getElementById('customerFirstName').value.trim();
    const middleName = document.getElementById('customerMiddleName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    
    if (!lastName || !firstName || !phone) { showToast('Заполните обязательные поля'); return; }
    
    // Delivery validation
    if (state.deliveryType === 'mail') {
        if (state.mailService === 'europochta') {
            if (!document.getElementById('europochtaBranch').value.trim()) { showToast('Укажите номер отделения'); return; }
        } else if (state.mailService === 'belpochta') {
            if (!document.getElementById('belpochtaIndex').value.trim() || !document.getElementById('belpochtaCity').value.trim() || !document.getElementById('belpochtaAddress').value.trim()) { showToast('Заполните адрес доставки'); return; }
        } else if (state.mailService === 'cdek') {
            if (!document.getElementById('cdekCountry').value.trim() || !document.getElementById('cdekCity').value.trim() || !document.getElementById('cdekPvz').value.trim()) { showToast('Заполните данные для CDEK'); return; }
        }
    }
    
    // Build order text
    let orderText = `🛒 НОВЫЙ ЗАКАЗ\n\n`;
    orderText += `👤 Клиент:\n${lastName} ${firstName}${middleName ? ' ' + middleName : ''}\n📞 ${phone}\n\n`;
    orderText += `💱 Валюта: ${state.currency}\n\n`;
    orderText += `📦 Товары:\n`;
    
    let total = 0;
    state.cart.forEach((item, index) => {
        const product = state.products.find(p => p.id === item.productId);
        if (product) {
            const itemTotal = getItemPrice(product, item.quantity);
            total += itemTotal;
            orderText += `\n${index + 1}. ${product.name}\n`;
            orderText += `   Размер: ${item.size}\n`;
            orderText += `   Кол-во: ${item.quantity}\n`;
            orderText += `   Цена: ${formatItemPrice(itemTotal)}\n`;
            orderText += `   Фото: ${product.images[0]}\n`;
        }
    });
    
    orderText += `\n💰 Итого: ${formatItemPrice(total)}\n\n`;
    orderText += `🚚 Доставка: `;
    
    if (state.deliveryType === 'pickup') {
        orderText += `Самовывоз\n`;
    } else {
        if (state.mailService === 'europochta') {
            orderText += `Европочта\n📍 Отделение: ${document.getElementById('europochtaBranch').value.trim()}\n`;
        } else if (state.mailService === 'belpochta') {
            orderText += `Белпочта\n`;
            orderText += `📮 Индекс: ${document.getElementById('belpochtaIndex').value.trim()}\n`;
            orderText += `🏙 Город: ${document.getElementById('belpochtaCity').value.trim()}\n`;
            orderText += `📍 Адрес: ${document.getElementById('belpochtaAddress').value.trim()}\n`;
        } else if (state.mailService === 'cdek') {
            orderText += `CDEK\n`;
            orderText += `🌍 Страна: ${document.getElementById('cdekCountry').value.trim()}\n`;
            orderText += `🏙 Город: ${document.getElementById('cdekCity').value.trim()}\n`;
            orderText += `📦 ПВЗ: ${document.getElementById('cdekPvz').value.trim()}\n`;
        }
    }
    
    const comment = document.getElementById('comment').value.trim();
    if (comment) orderText += `\n💬 Комментарий: ${comment}`;
    
    // Clear & close
    state.cart = [];
    saveCart();
    elements.checkoutModal.classList.remove('active');
    if (elements.checkoutForm) elements.checkoutForm.reset();
    resetCheckoutForm();
    hapticFeedback('heavy');
    
    // Open admin chat
    const adminUrl = `https://t.me/${ADMIN_USERNAME}?text=${encodeURIComponent(orderText)}`;
    if (tg) tg.openTelegramLink(adminUrl);
    else window.open(adminUrl, '_blank');
}

function openSupport() {
    const url = `https://t.me/${SUPPORT_USERNAME}`;
    if (tg) tg.openTelegramLink(url);
    else window.open(url, '_blank');
}

// ==================== INIT LISTENERS ====================
function initEventListeners() {
    // Filters
    elements.categoryBtn.addEventListener('click', () => { elements.categoryDropdown.classList.toggle('open'); elements.sizeDropdown.classList.remove('open'); hapticFeedback(); });
    elements.categoryMenu.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
            elements.categoryMenu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            state.currentCategory = option.dataset.category;
            elements.categoryText.textContent = option.textContent;
            elements.categoryDropdown.classList.remove('open');
            updateSizeFilter();
            filterProducts();
            hapticFeedback();
        });
    });
    
    elements.sizeBtn.addEventListener('click', () => { elements.sizeDropdown.classList.toggle('open'); elements.categoryDropdown.classList.remove('open'); hapticFeedback(); });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown')) { elements.categoryDropdown.classList.remove('open'); elements.sizeDropdown.classList.remove('open'); }
        if (!e.target.closest('#currencyBtn') && !e.target.closest('#currencyModal')) elements.currencyModal.classList.remove('active');
    });
    
    // Search
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { state.searchQuery = e.target.value.trim(); filterProducts(); }, 300); });
    
    // Currency
    elements.currencyBtn.addEventListener('click', () => { elements.currencyModal.classList.toggle('active'); hapticFeedback(); });
    document.querySelectorAll('.dropdown-item[data-currency]').forEach(item => {
        item.addEventListener('click', () => {
            state.currency = item.dataset.currency;
            document.querySelectorAll('.dropdown-item[data-currency]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            elements.currencyBtn.querySelector('.currency-text').textContent = item.dataset.currency;
            elements.currencyModal.classList.remove('active');
            filterProducts();
            renderCart();
            if (state.selectedProduct) {
                elements.productPriceMain.textContent = formatPrice(state.selectedProduct.price_byn, state.currency, state.selectedProduct);
                updateAddToCartBtn();
            }
            hapticFeedback();
        });
    });
    
    // Product modal
    elements.modalBack.addEventListener('click', closeProductModal);
    elements.productModal.querySelector('.modal-overlay').addEventListener('click', closeProductModal);
    elements.modalFavorite.addEventListener('click', () => { if (!state.selectedProduct) return; toggleFavorite(state.selectedProduct.id); elements.modalFavorite.classList.toggle('active'); hapticFeedback('medium'); });
    elements.qtyMinus.addEventListener('click', () => { if (state.quantity > 1) { state.quantity--; elements.qtyValue.textContent = state.quantity; updateAddToCartBtn(); hapticFeedback(); } });
    elements.qtyPlus.addEventListener('click', () => { if (state.quantity < 10) { state.quantity++; elements.qtyValue.textContent = state.quantity; updateAddToCartBtn(); hapticFeedback(); } });
    elements.addToCartBtn.addEventListener('click', addToCart);
    
    // Cart
    elements.navCart.addEventListener('click', () => { openCartModal(); setActiveNav('cart'); });
    elements.cartBack.addEventListener('click', () => elements.cartModal.classList.remove('active'));
    elements.cartModal.querySelector('.modal-overlay').addEventListener('click', () => elements.cartModal.classList.remove('active'));
    elements.clearCartBtn.addEventListener('click', clearCart);
    elements.checkoutBtn.addEventListener('click', openCheckoutModal);
    
    // Checkout
    elements.checkoutBack.addEventListener('click', () => { elements.checkoutModal.classList.remove('active'); openCartModal(); });
    elements.checkoutModal.querySelector('.modal-overlay').addEventListener('click', () => elements.checkoutModal.classList.remove('active'));
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.deliveryType = btn.dataset.delivery;
            updateDeliveryFields();
            hapticFeedback();
        });
    });
    document.querySelectorAll('input[name="mailService"]').forEach(radio => {
        radio.addEventListener('change', (e) => { state.mailService = e.target.value; updateDeliveryFields(); hapticFeedback(); });
    });
    elements.submitOrder.addEventListener('click', (e) => { e.preventDefault(); submitOrder(); });
    
    // Favorites
    elements.navFavorites.addEventListener('click', () => { openFavoritesModal(); setActiveNav('favorites'); });
    elements.favoritesHeaderBtn.addEventListener('click', openFavoritesModal);
    elements.favoritesBack.addEventListener('click', () => elements.favoritesModal.classList.remove('active'));
    elements.favoritesModal.querySelector('.modal-overlay').addEventListener('click', () => elements.favoritesModal.classList.remove('active'));
    
    // Profile
    elements.navProfile.addEventListener('click', () => { openProfileModal(); setActiveNav('profile'); });
    elements.profileBack.addEventListener('click', () => elements.profileModal.classList.remove('active'));
    elements.profileModal.querySelector('.modal-overlay').addEventListener('click', () => elements.profileModal.classList.remove('active'));
    elements.supportBtn.addEventListener('click', () => { openSupport(); hapticFeedback(); });
    
    // Navigation
    elements.navHome.addEventListener('click', () => { closeAllModals(); setActiveNav('home'); hapticFeedback(); });
}

function setActiveNav(page) { document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page)); }

// ==================== INIT ====================
async function init() {
    console.log('🚀 Запуск...');
    elements.loading.classList.remove('hidden');
    elements.productsGrid.innerHTML = '';
    
    loadUserData();
    const loaded = await loadProducts();
    
    if (!loaded || state.products.length === 0) {
        elements.loading.classList.add('hidden');
        elements.emptyState.style.display = 'block';
        elements.emptyState.innerHTML = '<i data-lucide="package"></i><p>Товаров пока нет</p><span>Скоро здесь появятся новинки!</span>';
        lucide.createIcons();
        loadCart();
        loadFavorites();
        initEventListeners();
        return;
    }
    
    loadCart();
    loadFavorites();
    updateSizeFilter();
    renderProducts(state.products);
    updateCartBadge();
    initEventListeners();
    lucide.createIcons();
    console.log('✅ Готово!');
}

document.addEventListener('DOMContentLoaded', init);
