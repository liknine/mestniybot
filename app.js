// ==================== INITIALIZATION ====================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// ==================== CONFIG ====================
const SUPPORT_USERNAME = 'liknine';

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

const SIZES_BY_TYPE = {
    shoes: ['36','36.5','37','37.5','38','38.5','39','39.5','40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45','45.5','46','46.5'],
    clothing: ['XS','S','M','L','XL','XXL','XXXL'],
    onesize: ['ONE SIZE']
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
    selectedSizes: [],
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
    if (state.currency === 'USD') return `$${totalInCurrency.toFixed(2)}`;
    return `${totalInCurrency.toFixed(2)} ${symbols[state.currency]}`;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (toast && toastText) {
        toastText.textContent = message;
        toast.classList.add('show');
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
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
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (profileName) profileName.textContent = fullName;
    if (profileUsername) profileUsername.textContent = state.user.username ? `@${state.user.username}` : 'Telegram User';
    if (profileAvatar && state.user.photoUrl) {
        profileAvatar.innerHTML = `<img src="${state.user.photoUrl}" alt="Avatar">`;
    }
    updateProfileStats();
}

function updateProfileStats() {
    const cartCount = document.getElementById('profileCartCount');
    const favCount = document.getElementById('profileFavCount');
    if (cartCount) cartCount.textContent = state.cart.reduce((sum, item) => sum + item.sizes.length, 0);
    if (favCount) favCount.textContent = state.favorites.length;
}

// ==================== FILTERS ====================
function filterProducts() {
    let filtered = [...state.products];
    
    if (state.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id === parseInt(state.currentCategory));
    }
    
    if (state.currentBrand !== 'all') {
        filtered = filtered.filter(p => p.brand === state.currentBrand);
    }
    
    if (state.currentSize !== 'all') {
        filtered = filtered.filter(p => p.sizes && p.sizes.includes(state.currentSize));
    }
    
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
    const sizeDropdown = document.getElementById('sizeDropdown');
    if (!sizeDropdown) return;
    
    const categoryId = state.currentCategory === 'all' ? null : parseInt(state.currentCategory);
    let sizes = [];
    
    if (categoryId && CATEGORIES[categoryId]) {
        sizes = SIZES_BY_TYPE[CATEGORIES[categoryId].sizeType] || [];
    } else {
        sizes = [...SIZES_BY_TYPE.clothing];
    }
    
    let html = `<div class="filter-dropdown-item active" data-value="all">Все размеры</div>`;
    
    // For shoes - grid layout
    if (categoryId === 1) {
        html += `<div class="filter-size-grid">`;
        SIZES_BY_TYPE.shoes.forEach(size => {
            html += `<div class="filter-size-item" data-value="${size}">${size}</div>`;
        });
        html += `</div>`;
    } else {
        sizes.forEach(size => {
            html += `<div class="filter-dropdown-item" data-value="${size}">${size}</div>`;
        });
    }
    
    sizeDropdown.innerHTML = html;
    state.currentSize = 'all';
    
    const sizeChip = document.getElementById('sizeChip');
    if (sizeChip) {
        sizeChip.querySelector('span').textContent = 'Размер';
        sizeChip.classList.remove('has-value');
    }
    
    // Attach listeners
    sizeDropdown.querySelectorAll('.filter-dropdown-item, .filter-size-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            sizeDropdown.querySelectorAll('.filter-dropdown-item, .filter-size-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            state.currentSize = item.dataset.value;
            
            if (sizeChip) {
                sizeChip.querySelector('span').textContent = item.dataset.value === 'all' ? 'Размер' : item.dataset.value;
                sizeChip.classList.toggle('has-value', item.dataset.value !== 'all');
                sizeChip.classList.remove('active');
            }
            sizeDropdown.classList.remove('show');
            filterProducts();
            hapticFeedback();
        });
    });
}

// ==================== RENDER ====================
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    
    if (loading) loading.classList.add('hidden');
    
    if (products.length === 0) {
        if (grid) grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        lucide.createIcons();
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    if (grid) {
        grid.innerHTML = products.map(product => {
            const isFavorite = state.favorites.includes(product.id);
            const stockStatus = getStockStatus(product.stock);
            return `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-image-container">
                        <img src="${product.images?.[0] || ''}" alt="${product.name}" class="product-image" loading="lazy"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2240%22>📷</text></svg>'">
                        <button class="product-favorite ${isFavorite ? 'active' : ''}" data-id="${product.id}">
                            <i data-lucide="heart"></i>
                        </button>
                    </div>
                    <div class="product-details">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${formatPrice(product.price_byn, state.currency, product)}</p>
                        <span class="product-status ${stockStatus.class}">${stockStatus.text}</span>
                    </div>
                </div>`;
        }).join('');
    }
    
    lucide.createIcons();
    attachProductListeners();
}

function getStockStatus(stock) {
    if (stock === 0) return { text: 'Нет в наличии', class: 'out-of-stock' };
    if (stock <= 5) return { text: `Осталось ${stock} шт`, class: 'low-stock' };
    return { text: 'В наличии', class: 'in-stock' };
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (state.cart.length === 0) {
        if (cartItems) cartItems.innerHTML = '';
        if (cartEmpty) cartEmpty.style.display = 'flex';
        if (cartFooter) cartFooter.style.display = 'none';
        lucide.createIcons();
        return;
    }
    
    if (cartEmpty) cartEmpty.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';
    
    let total = 0;
    if (cartItems) {
        cartItems.innerHTML = state.cart.map(item => {
            const product = state.products.find(p => p.id === item.productId);
            if (!product) return '';
            const itemTotal = getItemPrice(product, item.sizes.length);
            total += itemTotal;
            return `
                <div class="cart-item" data-id="${item.productId}">
                    <img src="${product.images?.[0] || ''}" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4 class="cart-item-name">${product.name}</h4>
                        <p class="cart-item-sizes">Размеры: ${item.sizes.join(', ')}</p>
                        <div class="cart-item-bottom">
                            <span class="cart-item-price">${formatItemPrice(itemTotal)}</span>
                            <button class="cart-item-delete" data-id="${item.productId}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }
    
    if (cartSubtotal) cartSubtotal.textContent = formatItemPrice(total);
    if (cartTotal) cartTotal.textContent = formatItemPrice(total);
    if (checkoutTotal) checkoutTotal.textContent = formatItemPrice(total);
    
    lucide.createIcons();
    attachCartListeners();
    updateCartBadge();
}

function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');
    
    const favoriteProducts = state.products.filter(p => state.favorites.includes(p.id));
    
    if (favoriteProducts.length === 0) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        lucide.createIcons();
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    if (grid) {
        grid.innerHTML = favoriteProducts.map(product => {
            const stockStatus = getStockStatus(product.stock);
            return `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-image-container">
                        <img src="${product.images?.[0] || ''}" alt="${product.name}" class="product-image" loading="lazy">
                        <button class="product-favorite active" data-id="${product.id}">
                            <i data-lucide="heart"></i>
                        </button>
                    </div>
                    <div class="product-details">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${formatPrice(product.price_byn, state.currency, product)}</p>
                        <span class="product-status ${stockStatus.class}">${stockStatus.text}</span>
                    </div>
                </div>`;
        }).join('');
    }
    
    lucide.createIcons();
    attachProductListeners();
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = state.cart.reduce((sum, item) => sum + item.sizes.length, 0);
    if (badge) {
        badge.textContent = count;
        badge.dataset.count = count;
    }
    updateProfileStats();
}

// ==================== MODALS ====================
function openProductModal(product) {
    state.selectedProduct = product;
    state.selectedSizes = [];
    
    const modal = document.getElementById('productModal');
    const galleryTrack = document.getElementById('galleryTrack');
    const galleryDots = document.getElementById('galleryDots');
    const title = document.getElementById('productTitle');
    const brand = document.getElementById('productBrand');
    const price = document.getElementById('productPriceMain');
    const stock = document.getElementById('productStock');
    const sizesGrid = document.getElementById('sizesGrid');
    const description = document.getElementById('productDescription');
    const modalFavorite = document.getElementById('modalFavorite');
    
    if (galleryTrack) {
        galleryTrack.innerHTML = (product.images || []).map(img =>
            `<img src="${img}" alt="${product.name}">`
        ).join('');
    }
    
    if (galleryDots) {
        galleryDots.innerHTML = (product.images || []).map((_, i) => 
            `<div class="gallery-dot ${i === 0 ? 'active' : ''}"></div>`
        ).join('');
    }
    
    if (title) title.textContent = product.name;
    if (brand) brand.textContent = getBrandName(product.brand);
    if (price) price.textContent = formatPrice(product.price_byn, state.currency, product);
    
    const stockStatus = getStockStatus(product.stock);
    if (stock) {
        stock.textContent = stockStatus.text;
        stock.className = `product-stock ${stockStatus.class}`;
    }
    
    if (sizesGrid) {
        sizesGrid.innerHTML = (product.sizes || []).map(size =>
            `<button class="size-chip" data-size="${size}" ${product.stock === 0 ? 'disabled' : ''}>${size}</button>`
        ).join('');
        
        sizesGrid.querySelectorAll('.size-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const size = chip.dataset.size;
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
    
    if (description) description.textContent = product.description || '';
    if (modalFavorite) modalFavorite.classList.toggle('active', state.favorites.includes(product.id));
    
    updateAddToCartBtn();
    if (modal) modal.classList.add('active');
    lucide.createIcons();
    
    // Gallery scroll listener
    if (galleryTrack) {
        galleryTrack.addEventListener('scroll', () => {
            const index = Math.round(galleryTrack.scrollLeft / galleryTrack.offsetWidth);
            document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        });
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    state.selectedProduct = null;
    state.selectedSizes = [];
}

function updateAddToCartBtn() {
    const btn = document.getElementById('addToCartBtn');
    const btnPrice = document.getElementById('btnPrice');
    
    if (!state.selectedProduct || !btn) return;
    
    const hasSelection = state.selectedSizes.length > 0;
    btn.disabled = !hasSelection || state.selectedProduct.stock === 0;
    
    const total = getItemPrice(state.selectedProduct, state.selectedSizes.length || 1);
    if (btnPrice) btnPrice.textContent = formatItemPrice(total);
}

function openCartModal() {
    renderCart();
    const modal = document.getElementById('cartModal');
    if (modal) modal.classList.add('active');
}

function openFavoritesModal() {
    renderFavorites();
    const modal = document.getElementById('favoritesModal');
    if (modal) modal.classList.add('active');
}

function openProfileModal() {
    updateProfileUI();
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.add('active');
    lucide.createIcons();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

function openCheckoutModal() {
    const cartModal = document.getElementById('cartModal');
    const checkoutModal = document.getElementById('checkoutModal');
    if (cartModal) cartModal.classList.remove('active');
    if (checkoutModal) checkoutModal.classList.add('active');
    resetCheckoutForm();
}

function resetCheckoutForm() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.delivery === 'pickup');
    });
    state.deliveryType = 'pickup';
    state.mailService = 'europochta';
    
    const mailOptions = document.getElementById('mailOptions');
    const euroFields = document.getElementById('europochtaFields');
    const belFields = document.getElementById('belpochtaFields');
    const cdekFields = document.getElementById('cdekFields');
    
    if (mailOptions) mailOptions.classList.remove('active');
    if (euroFields) euroFields.classList.remove('active');
    if (belFields) belFields.classList.remove('active');
    if (cdekFields) cdekFields.classList.remove('active');
    
    const euroRadio = document.querySelector('input[name="mailService"][value="europochta"]');
    if (euroRadio) euroRadio.checked = true;
}

function updateDeliveryFields() {
    const mailOptions = document.getElementById('mailOptions');
    const euroFields = document.getElementById('europochtaFields');
    const belFields = document.getElementById('belpochtaFields');
    const cdekFields = document.getElementById('cdekFields');
    
    if (euroFields) euroFields.classList.remove('active');
    if (belFields) belFields.classList.remove('active');
    if (cdekFields) cdekFields.classList.remove('active');
    
    if (state.deliveryType === 'mail') {
        if (mailOptions) mailOptions.classList.add('active');
        if (state.mailService === 'europochta' && euroFields) euroFields.classList.add('active');
        else if (state.mailService === 'belpochta' && belFields) belFields.classList.add('active');
        else if (state.mailService === 'cdek' && cdekFields) cdekFields.classList.add('active');
    } else {
        if (mailOptions) mailOptions.classList.remove('active');
    }
}

// ==================== LISTENERS ====================
function attachProductListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.product-favorite')) return;
            const product = state.products.find(p => p.id === parseInt(card.dataset.id));
            if (product) {
                hapticFeedback();
                openProductModal(product);
            }
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

function attachCartListeners() {
    document.querySelectorAll('.cart-item-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            removeFromCart(parseInt(btn.dataset.id));
        });
    });
}

// ==================== CART ====================
function addToCart() {
    if (!state.selectedProduct || state.selectedSizes.length === 0) return;
    
    const existingItem = state.cart.find(item => item.productId === state.selectedProduct.id);
    
    if (existingItem) {
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
    showToast(`Добавлено ${state.selectedSizes.length} размер(а)`);
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
        // Migration from old format
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
    
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === currency);
    });
    
    filterProducts();
    
    if (state.selectedProduct) {
        const price = document.getElementById('productPriceMain');
        if (price) price.textContent = formatPrice(state.selectedProduct.price_byn, currency, state.selectedProduct);
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
    const lastName = document.getElementById('customerLastName')?.value.trim();
    const firstName = document.getElementById('customerFirstName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    
    if (!lastName || !firstName || !phone) {
        showToast('Заполните обязательные поля');
        return;
    }
    
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
    
    const orderData = {
        items,
        total,
        currency: state.currency,
        deliveryType: state.deliveryType,
        deliveryService: state.deliveryType === 'mail' ? state.mailService : null,
        customer: {
            lastName,
            firstName,
            middleName: document.getElementById('customerMiddleName')?.value.trim() || '',
            phone
        },
        comment: document.getElementById('comment')?.value.trim() || ''
    };
    
    if (tg) {
        tg.sendData(JSON.stringify(orderData));
    } else {
        console.log('Order:', orderData);
        showToast('Заказ оформлен!');
        clearCart();
        closeAllModals();
    }
}

// ==================== DROPDOWN HANDLERS ====================
function setupDropdowns() {
    // Category dropdown
    const categoryChip = document.getElementById('categoryChip');
    const categoryDropdown = document.getElementById('categoryDropdown');
    
    if (categoryChip && categoryDropdown) {
        categoryChip.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            categoryChip.classList.toggle('active');
            categoryDropdown.classList.toggle('show');
        });
        
        categoryDropdown.querySelectorAll('.filter-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                categoryDropdown.querySelectorAll('.filter-dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.currentCategory = item.dataset.value;
                
                const text = item.dataset.value === 'all' ? 'Категория' : item.textContent.trim();
                categoryChip.querySelector('span').textContent = text;
                categoryChip.classList.toggle('has-value', item.dataset.value !== 'all');
                categoryChip.classList.remove('active');
                categoryDropdown.classList.remove('show');
                
                updateSizeFilter();
                filterProducts();
                hapticFeedback();
            });
        });
    }
    
    // Brand dropdown
    const brandChip = document.getElementById('brandChip');
    const brandDropdown = document.getElementById('brandDropdown');
    
    if (brandChip && brandDropdown) {
        brandChip.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            brandChip.classList.toggle('active');
            brandDropdown.classList.toggle('show');
        });
        
        brandDropdown.querySelectorAll('.filter-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                brandDropdown.querySelectorAll('.filter-dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.currentBrand = item.dataset.value;
                
                const text = item.dataset.value === 'all' ? 'Бренд' : item.textContent.trim();
                brandChip.querySelector('span').textContent = text;
                brandChip.classList.toggle('has-value', item.dataset.value !== 'all');
                brandChip.classList.remove('active');
                brandDropdown.classList.remove('show');
                
                filterProducts();
                hapticFeedback();
            });
        });
    }
    
    // Size dropdown
    const sizeChip = document.getElementById('sizeChip');
    const sizeDropdown = document.getElementById('sizeDropdown');
    
    if (sizeChip && sizeDropdown) {
        sizeChip.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            sizeChip.classList.toggle('active');
            sizeDropdown.classList.toggle('show');
        });
    }
    
    // Close on outside click
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    document.querySelectorAll('.filter-dropdown').forEach(dd => dd.classList.remove('show'));
}

// ==================== INIT ====================
function initListeners() {
    // Currency
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', () => setCurrency(btn.dataset.currency));
    });
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            filterProducts();
        });
    }
    
    // Setup filter dropdowns
    setupDropdowns();
    
    // Modal backs
    document.getElementById('modalBack')?.addEventListener('click', closeProductModal);
    document.getElementById('cartBack')?.addEventListener('click', () => {
        document.getElementById('cartModal')?.classList.remove('active');
    });
    document.getElementById('checkoutBack')?.addEventListener('click', () => {
        document.getElementById('checkoutModal')?.classList.remove('active');
        document.getElementById('cartModal')?.classList.add('active');
    });
    document.getElementById('favoritesBack')?.addEventListener('click', () => {
        document.getElementById('favoritesModal')?.classList.remove('active');
    });
    document.getElementById('profileBack')?.addEventListener('click', () => {
        document.getElementById('profileModal')?.classList.remove('active');
    });
    
    // Modal favorite
    document.getElementById('modalFavorite')?.addEventListener('click', () => {
        if (state.selectedProduct) {
            toggleFavorite(state.selectedProduct.id);
            document.getElementById('modalFavorite')?.classList.toggle('active');
            hapticFeedback('medium');
        }
    });
    
    // Cart actions
    document.getElementById('addToCartBtn')?.addEventListener('click', addToCart);
    document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', openCheckoutModal);
    document.getElementById('submitOrder')?.addEventListener('click', submitOrder);
    
    // Header favorites
    document.getElementById('favoritesHeaderBtn')?.addEventListener('click', openFavoritesModal);
    
    // Delivery toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.deliveryType = btn.dataset.delivery;
            updateDeliveryFields();
            hapticFeedback();
        });
    });
    
    // Mail service
    document.querySelectorAll('input[name="mailService"]').forEach(radio => {
        radio.addEventListener('change', () => {
            state.mailService = radio.value;
            updateDeliveryFields();
        });
    });
    
    // Support
    document.getElementById('supportBtn')?.addEventListener('click', () => {
        if (tg) {
            tg.openTelegramLink(`https://t.me/${SUPPORT_USERNAME}`);
        } else {
            window.open(`https://t.me/${SUPPORT_USERNAME}`, '_blank');
        }
    });
    
    // Bottom nav
    document.getElementById('navHome')?.addEventListener('click', () => {
        closeAllModals();
        setActiveNav('home');
    });
    document.getElementById('navFavorites')?.addEventListener('click', () => {
        openFavoritesModal();
        setActiveNav('favorites');
    });
    document.getElementById('navCart')?.addEventListener('click', () => {
        openCartModal();
        setActiveNav('cart');
    });
    document.getElementById('navProfile')?.addEventListener('click', () => {
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

function setActiveNav(page) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
}

async function init() {
    console.log('🚀 Запуск приложения...');
    
    loadCart();
    loadFavorites();
    loadCurrency();
    loadUserData();
    
    const success = await loadProducts();
    
    if (success) {
        updateSizeFilter();
        filterProducts();
    } else {
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');
        if (loading) loading.classList.add('hidden');
        if (emptyState) emptyState.style.display = 'block';
    }
    
    initListeners();
    lucide.createIcons();
    
    console.log('✅ Приложение готово!');
}

document.addEventListener('DOMContentLoaded', init);
