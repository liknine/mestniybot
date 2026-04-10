// ==================== INITIALIZATION ====================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// ==================== CONFIG ====================
const ADMIN_USERNAME = 'liknine';
const SUPPORT_USERNAME = 'liknine';

// ==================== BRANDS ====================
const BRANDS = {
    'stone_island': 'Stone Island',
    'nike': 'Nike',
    'adidas': 'Adidas',
    'raf_simons': 'Raf Simons',
    'cp_company': 'CP Company',
    'gucci': 'Gucci',
    'balenciaga': 'Balenciaga',
    'number_nine': 'Number Nine',
    'maison_margiela': 'Maison Margiela',
    'rick_owens': 'Rick Owens',
    'bape': 'Bape',
    'gosha': 'Гоша Рубчинский'
};

// ==================== CATEGORIES ====================
const CATEGORIES = {
    1: { name: 'Обувь', icon: '👟', sizeType: 'shoes' },
    2: { name: 'Куртки / Пуховики', icon: '🧥', sizeType: 'clothing' },
    3: { name: 'Жилетки', icon: '🦺', sizeType: 'clothing' },
    4: { name: 'Рубашки', icon: '👔', sizeType: 'clothing' },
    5: { name: 'Футболки / Поло', icon: '👕', sizeType: 'clothing' },
    6: { name: 'Кофты', icon: '🧶', sizeType: 'clothing' },
    7: { name: 'Штаны', icon: '👖', sizeType: 'clothing' },
    8: { name: 'Шорты', icon: '🩳', sizeType: 'clothing' },
    9: { name: 'Головные уборы', icon: '🧢', sizeType: 'onesize' },
    10: { name: 'Аксессуары', icon: '🎒', sizeType: 'onesize' }
};

// ==================== STATE ====================
const state = {
    products: [],
    cart: [],
    favorites: [],
    currency: 'BYN',
    currentCategory: 'all',
    currentBrand: 'all',
    currentSize: 'all',
    searchQuery: '',
    selectedProduct: null,
    selectedSizes: [], // Multiple sizes selection
    deliveryType: 'pickup',
    mailService: 'europochta',
    user: {
        id: null,
        firstName: 'Пользователь',
        lastName: '',
        username: '',
        photoUrl: null
    },
    exchangeRates: { BYN: 1, RUB: 28.5, USD: 0.31 }
};

const SIZES_BY_CATEGORY = {
    shoes: ['36','36.5','37','37.5','38','38.5','39','39.5','40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45','45.5','46','46.5'],
    clothing: ['XS','S','M','L','XL','XXL','XXXL'],
    onesize: ['ONE SIZE']
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
    brandDropdown: document.getElementById('brandDropdown'),
    brandBtn: document.getElementById('brandBtn'),
    brandText: document.getElementById('brandText'),
    brandMenu: document.getElementById('brandMenu'),
    sizeDropdown: document.getElementById('sizeDropdown'),
    sizeBtn: document.getElementById('sizeBtn'),
    sizeText: document.getElementById('sizeText'),
    sizeMenu: document.getElementById('sizeMenu'),
    currencyToggle: document.getElementById('currencyToggle'),
    productModal: document.getElementById('productModal'),
    modalBack: document.getElementById('modalBack'),
    modalFavorite: document.getElementById('modalFavorite'),
    galleryTrack: document.getElementById('galleryTrack'),
    galleryDots: document.getElementById('galleryDots'),
    productTitle: document.getElementById('productTitle'),
    productBrand: document.getElementById('productBrand'),
    productPriceMain: document.getElementById('productPriceMain'),
    productStock: document.getElementById('productStock'),
    sizesGrid: document.getElementById('sizesGrid'),
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
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    
    if (product && product.prices && product.prices[currency]) {
        const price = product.prices[currency];
        if (currency === 'USD') return `$${price.toFixed(2)}`;
        return `${price.toFixed(2)} ${symbols[currency]}`;
    }
    
    const rate = state.exchangeRates[currency] || 1;
    const converted = priceByn * rate;
    if (currency === 'USD') return `$${converted.toFixed(2)}`;
    return `${converted.toFixed(2)} ${symbols[currency]}`;
}

function getItemPrice(product, quantity = 1) {
    if (product && product.prices && product.prices[state.currency]) {
        return product.prices[state.currency] * quantity;
    }
    return product.price_byn * quantity * (state.exchangeRates[state.currency] || 1);
}

function formatItemPrice(totalInCurrency) {
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    const currency = state.currency;
    if (currency === 'USD') return `$${totalInCurrency.toFixed(2)}`;
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

function getBrandName(brandKey) {
    return BRANDS[brandKey] || brandKey || '';
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
    elements.profileCartCount.textContent = state.cart.reduce((sum, item) => sum + item.sizes.length, 0);
    elements.profileFavCount.textContent = state.favorites.length;
}

// ==================== FILTERS ====================
function filterProducts() {
    let filtered = [...state.products];
    
    // Category filter
    if (state.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id === parseInt(state.currentCategory));
    }
    
    // Brand filter
    if (state.currentBrand !== 'all') {
        filtered = filtered.filter(p => p.brand === state.currentBrand);
    }
    
    // Size filter
    if (state.currentSize !== 'all') {
        filtered = filtered.filter(p => p.sizes && p.sizes.includes(state.currentSize));
    }
    
    // Search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query)) ||
            (p.brand && getBrandName(p.brand).toLowerCase().includes(query))
        );
    }
    
    renderProducts(filtered);
}

function updateSizeFilter() {
    const categoryId = state.currentCategory === 'all' ? null : parseInt(state.currentCategory);
    let sizes = [];
    
    if (categoryId && CATEGORIES[categoryId]) {
        sizes = SIZES_BY_CATEGORY[CATEGORIES[categoryId].sizeType] || [];
    } else {
        sizes = [...SIZES_BY_CATEGORY.clothing, ...SIZES_BY_CATEGORY.shoes];
    }
    
    let menuHtml = `<button class="filter-option active" data-size="all">Все размеры</button>`;
    
    // For shoes - two columns
    if (categoryId === 1) {
        for (let i = 0; i < sizes.length; i += 2) {
            menuHtml += `<div class="filter-option-row">`;
            menuHtml += `<button class="filter-option-size" data-size="${sizes[i]}">${sizes[i]}</button>`;
            if (sizes[i + 1]) menuHtml += `<button class="filter-option-size" data-size="${sizes[i + 1]}">${sizes[i + 1]}</button>`;
            menuHtml += `</div>`;
        }
    } else {
        sizes.forEach(size => { 
            menuHtml += `<button class="filter-option" data-size="${size}">${size}</button>`; 
        });
    }
    
    elements.sizeMenu.innerHTML = menuHtml;
    state.currentSize = 'all';
    elements.sizeText.textContent = 'Размер';
    
    // Attach listeners
    elements.sizeMenu.querySelectorAll('.filter-option, .filter-option-size').forEach(option => {
        option.addEventListener('click', () => {
            elements.sizeMenu.querySelectorAll('.filter-option, .filter-option-size').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            state.currentSize = option.dataset.size;
            elements.sizeText.textContent = option.dataset.size === 'all' ? 'Размер' : option.dataset.size;
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
        const itemTotal = getItemPrice(product, item.sizes.length);
        total += itemTotal;
        return `
            <div class="cart-item" data-id="${item.productId}">
                <img src="${product.images[0]}" alt="${product.name}" class="cart-item-image"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2240%22>📷</text></svg>'">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${product.name}</h4>
                    <p class="cart-item-sizes">Размеры: ${item.sizes.join(', ')}</p>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">${formatItemPrice(itemTotal)}</span>
                        <div class="cart-item-actions">
                            <button class="cart-item-delete" data-id="${item.productId}"><i data-lucide="trash-2"></i></button>
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
    const count = state.cart.reduce((sum, item) => sum + item.sizes.length, 0);
    elements.cartBadge.textContent = count;
    elements.cartBadge.dataset.count = count;
    updateProfileStats();
}

// ==================== MODALS ====================
function openProductModal(product) {
    state.selectedProduct = product;
    state.selectedSizes = [];
    
    // Gallery
    elements.galleryTrack.innerHTML = product.images.map(img =>
        `<img src="${img}" alt="${product.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2260%22>📷</text></svg>'">`
    ).join('');
    elements.galleryDots.innerHTML = product.images.map((_, i) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}"></div>`).join('');
    
    // Info
    elements.productTitle.textContent = product.name;
    elements.productBrand.textContent = getBrandName(product.brand);
    elements.productPriceMain.textContent = formatPrice(product.price_byn, state.currency, product);
    
    const stockStatus = getStockStatus(product.stock);
    elements.productStock.textContent = stockStatus.text;
    elements.productStock.className = `product-stock ${stockStatus.class}`;
    
    // Sizes - multiple selection
    elements.sizesGrid.innerHTML = product.sizes.map(size =>
        `<button class="size-chip" data-size="${size}" ${product.stock === 0 ? 'disabled' : ''}>${size}</button>`
    ).join('');
    
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
    state.selectedSizes = [];
}

function updateAddToCartBtn() {
    if (!state.selectedProduct) return;
    
    const hasSelection = state.selectedSizes.length > 0;
    elements.addToCartBtn.disabled = !hasSelection || state.selectedProduct.stock === 0;
    
    const total = getItemPrice(state.selectedProduct, state.selectedSizes.length || 1);
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
    // Gallery scroll
    elements.galleryTrack.addEventListener('scroll', () => {
        const index = Math.round(elements.galleryTrack.scrollLeft / elements.galleryTrack.offsetWidth);
        document.querySelectorAll('.gallery-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
    });
    
    // Size chips - MULTIPLE SELECTION
    elements.sizesGrid.querySelectorAll('.size-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const size = chip.dataset.size;
            
            // Toggle selection
            if (state.selectedSizes.includes(size)) {
                state.selectedSizes = state.selectedSizes.filter(s => s !== size);
                chip.classList.remove('selected');
            } else {
                state.selectedSizes.push(size);
                chip.classList.add('selected');
            }
            
            hapticFeedback();
            updateAddToCartBtn();
        });
    });
}

function attachCartListeners() {
    document.querySelectorAll('.cart-item-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            removeFromCart(productId);
        });
    });
}

// ==================== CART ====================
function addToCart() {
    if (!state.selectedProduct || state.selectedSizes.length === 0) return;
    
    const existingItem = state.cart.find(item => item.productId === state.selectedProduct.id);
    
    if (existingItem) {
        // Add new sizes to existing item
        state.selectedSizes.forEach(size => {
            if (!existingItem.sizes.includes(size)) {
                existingItem.sizes.push(size);
            }
        });
    } else {
        state.cart.push({ 
            productId: state.selectedProduct.id, 
            sizes: [...state.selectedSizes]
        });
    }
    
    saveCart(); 
    updateCartBadge(); 
    showToast(`Добавлено ${state.selectedSizes.length} размер(а) в корзину`); 
    closeProductModal();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.productId !== productId);
    saveCart(); 
    renderCart(); 
    hapticFeedback('medium');
}

function clearCart() { 
    state.cart = []; 
    saveCart(); 
    renderCart(); 
    hapticFeedback('medium'); 
}

function saveCart() { 
    localStorage.setItem('cart', JSON.stringify(state.cart)); 
    updateCartBadge(); 
}

function loadCart() { 
    const saved = localStorage.getItem('cart'); 
    if (saved) { 
        state.cart = JSON.parse(saved); 
        // Migration: convert old format to new
        state.cart = state.cart.map(item => {
            if (item.size && !item.sizes) {
                return { productId: item.productId, sizes: [item.size] };
            }
            return item;
        });
        updateCartBadge(); 
    } 
}

// ==================== FAVORITES ====================
function toggleFavorite(productId) {
    const index = state.favorites.indexOf(productId);
    if (index === -1) state.favorites.push(productId);
    else state.favorites.splice(index, 1);
    saveFavorites(); 
    updateProfileStats();
}

function saveFavorites() { 
    localStorage.setItem('favorites', JSON.stringify(state.favorites)); 
}

function loadFavorites() { 
    const saved = localStorage.getItem('favorites'); 
    if (saved) state.favorites = JSON.parse(saved); 
}

// ==================== CURRENCY ====================
function setCurrency(currency) {
    state.currency = currency;
    localStorage.setItem('currency', currency);
    
    // Update toggle buttons
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === currency);
    });
    
    // Re-render prices
    filterProducts();
    if (state.selectedProduct) {
        elements.productPriceMain.textContent = formatPrice(state.selectedProduct.price_byn, currency, state.selectedProduct);
        updateAddToCartBtn();
    }
    renderCart();
    
    hapticFeedback();
}

function loadCurrency() {
    const saved = localStorage.getItem('currency');
    if (saved && ['BYN', 'RUB', 'USD'].includes(saved)) {
        state.currency = saved;
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.currency === saved);
        });
    }
}

// ==================== ORDER ====================
function submitOrder() {
    // Validate form
    const lastName = document.getElementById('customerLastName').value.trim();
    const firstName = document.getElementById('customerFirstName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    
    if (!lastName || !firstName || !phone) {
        showToast('Заполните обязательные поля');
        return;
    }
    
    // Validate delivery fields
    if (state.deliveryType === 'mail') {
        if (state.mailService === 'europochta') {
            const branch = document.getElementById('europochtaBranch').value.trim();
            if (!branch) {
                showToast('Укажите номер отделения');
                return;
            }
        } else if (state.mailService === 'belpochta') {
            const index = document.getElementById('belpochtaIndex').value.trim();
            const city = document.getElementById('belpochtaCity').value.trim();
            const address = document.getElementById('belpochtaAddress').value.trim();
            if (!index || !city || !address) {
                showToast('Заполните адрес доставки');
                return;
            }
        } else if (state.mailService === 'cdek') {
            const country = document.getElementById('cdekCountry').value.trim();
            const city = document.getElementById('cdekCity').value.trim();
            const pvz = document.getElementById('cdekPvz').value.trim();
            if (!country || !city || !pvz) {
                showToast('Заполните данные для CDEK');
                return;
            }
        }
    }
    
    // Calculate total
    let total = 0;
    const items = state.cart.map(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product) {
            total += getItemPrice(product, item.sizes.length);
            return {
                productId: item.productId,
                name: product.name,
                sizes: item.sizes,
                price: getItemPrice(product, 1)
            };
        }
        return null;
    }).filter(Boolean);
    
    // Build order data
    const orderData = {
        items: items,
        total: total,
        currency: state.currency,
        deliveryType: state.deliveryType,
        deliveryService: state.deliveryType === 'mail' ? state.mailService : null,
        customer: {
            lastName: lastName,
            firstName: firstName,
            middleName: document.getElementById('customerMiddleName').value.trim(),
            phone: phone
        },
        comment: document.getElementById('comment').value.trim()
    };
    
    // Add delivery data
    if (state.deliveryType === 'mail') {
        if (state.mailService === 'europochta') {
            orderData.deliveryData = {
                branch: document.getElementById('europochtaBranch').value.trim()
            };
        } else if (state.mailService === 'belpochta') {
            orderData.deliveryData = {
                index: document.getElementById('belpochtaIndex').value.trim(),
                city: document.getElementById('belpochtaCity').value.trim(),
                address: document.getElementById('belpochtaAddress').value.trim()
            };
        } else if (state.mailService === 'cdek') {
            orderData.deliveryData = {
                country: document.getElementById('cdekCountry').value.trim(),
                city: document.getElementById('cdekCity').value.trim(),
                pvz: document.getElementById('cdekPvz').value.trim()
            };
        }
    }
    
    // Send to Telegram
    if (tg) {
        tg.sendData(JSON.stringify(orderData));
    } else {
        console.log('Order data:', orderData);
        showToast('Заказ оформлен!');
        clearCart();
        closeAllModals();
    }
}

// ==================== INIT LISTENERS ====================
function initListeners() {
    // Currency toggle
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setCurrency(btn.dataset.currency);
        });
    });
    
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        filterProducts();
    });
    
    // Category dropdown
    elements.categoryBtn.addEventListener('click', () => {
        closeAllDropdowns();
        elements.categoryDropdown.classList.toggle('open');
    });
    
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
    
    // Brand dropdown
    elements.brandBtn.addEventListener('click', () => {
        closeAllDropdowns();
        elements.brandDropdown.classList.toggle('open');
    });
    
    elements.brandMenu.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
            elements.brandMenu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            state.currentBrand = option.dataset.brand;
            elements.brandText.textContent = option.textContent;
            elements.brandDropdown.classList.remove('open');
            filterProducts();
            hapticFeedback();
        });
    });
    
    // Size dropdown
    elements.sizeBtn.addEventListener('click', () => {
        closeAllDropdowns();
        elements.sizeDropdown.classList.toggle('open');
    });
    
    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown')) {
            closeAllDropdowns();
        }
    });
    
    // Product modal
    elements.modalBack.addEventListener('click', closeProductModal);
    elements.modalFavorite.addEventListener('click', () => {
        if (state.selectedProduct) {
            toggleFavorite(state.selectedProduct.id);
            elements.modalFavorite.classList.toggle('active');
            hapticFeedback('medium');
        }
    });
    elements.addToCartBtn.addEventListener('click', addToCart);
    
    // Cart modal
    elements.cartBack.addEventListener('click', () => elements.cartModal.classList.remove('active'));
    elements.clearCartBtn.addEventListener('click', clearCart);
    elements.checkoutBtn.addEventListener('click', openCheckoutModal);
    
    // Checkout modal
    elements.checkoutBack.addEventListener('click', () => {
        elements.checkoutModal.classList.remove('active');
        elements.cartModal.classList.add('active');
    });
    
    // Delivery type toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.deliveryType = btn.dataset.delivery;
            updateDeliveryFields();
            hapticFeedback();
        });
    });
    
    // Mail service radio
    document.querySelectorAll('input[name="mailService"]').forEach(radio => {
        radio.addEventListener('change', () => {
            state.mailService = radio.value;
            updateDeliveryFields();
        });
    });
    
    // Submit order
    elements.submitOrder.addEventListener('click', submitOrder);
    
    // Favorites modal
    elements.favoritesBack.addEventListener('click', () => elements.favoritesModal.classList.remove('active'));
    elements.favoritesHeaderBtn.addEventListener('click', openFavoritesModal);
    
    // Profile modal
    elements.profileBack.addEventListener('click', () => elements.profileModal.classList.remove('active'));
    elements.supportBtn.addEventListener('click', () => {
        if (tg) {
            tg.openTelegramLink(`https://t.me/${SUPPORT_USERNAME}`);
        } else {
            window.open(`https://t.me/${SUPPORT_USERNAME}`, '_blank');
        }
    });
    
    // Bottom navigation
    elements.navHome.addEventListener('click', () => {
        closeAllModals();
        setActiveNav('home');
    });
    elements.navFavorites.addEventListener('click', () => {
        openFavoritesModal();
        setActiveNav('favorites');
    });
    elements.navCart.addEventListener('click', () => {
        openCartModal();
        setActiveNav('cart');
    });
    elements.navProfile.addEventListener('click', () => {
        openProfileModal();
        setActiveNav('profile');
    });
    
    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            closeAllModals();
            setActiveNav('home');
        });
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('open'));
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
}

// ==================== INIT ====================
async function init() {
    console.log('🚀 Инициализация приложения...');
    
    // Load saved data
    loadCart();
    loadFavorites();
    loadCurrency();
    loadUserData();
    
    // Load products
    const success = await loadProducts();
    
    if (success) {
        updateSizeFilter();
        filterProducts();
    } else {
        elements.loading.classList.add('hidden');
        elements.emptyState.style.display = 'block';
    }
    
    // Init listeners
    initListeners();
    
    // Init icons
    lucide.createIcons();
    
    console.log('✅ Приложение готово!');
}

// Start app
document.addEventListener('DOMContentLoaded', init);
