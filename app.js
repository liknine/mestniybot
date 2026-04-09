// ==================== INITIALIZATION ====================
const tg = window.Telegram?.WebApp;

// Initialize Telegram WebApp
if (tg) {
    tg.ready();
    tg.expand();
}

// ==================== CONFIG ====================
const ADMIN_USERNAME = 'liknine'; // Юзернейм админа для заказов
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
    exchangeRates: {
        BYN: 1,
        RUB: 28.5,
        USD: 0.31
    }
};

// Размеры по категориям
// Размеры по категориям
const SIZES_BY_CATEGORY = {
    shoes: [
        '36', '36.5', 
        '37', '37.5', 
        '38', '38.5', 
        '39', '39.5', 
        '40', '40.5', 
        '41', '41.5', 
        '42', '42.5', 
        '43', '43.5', 
        '44', '44.5', 
        '45', '45.5', 
        '46', '46.5'
    ],
    clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    onesize: ['ONE SIZE']
};

// Категории с типами размеров
const CATEGORY_SIZE_TYPE = {
    1: 'shoes',      // Обувь
    2: 'clothing',   // Верхняя одежда
    3: 'clothing',   // Штаны
    4: 'onesize',    // Аксессуары
    5: 'clothing',   // Шорты
    6: 'onesize'     // Головные уборы
};

// ==================== TEST DATA ====================
const testProducts = [
    {
        id: 1,
        category_id: 1,
        name: "Nike Air Max 270",
        description: "Классические кроссовки Nike с технологией Air. Отличная амортизация, стильный дизайн и комфорт на весь день.",
        price_byn: 450.00,
        sizes: ["38", "39", "40", "41", "42", "43", "44"],
        stock: 15,
        images: [
            "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/skwgyqrbfzhu6ez4n45d/air-max-270-shoes-V4DfZQ.png",
            "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/qzqgvvfhcgsro9xtpw37/air-max-270-shoes-V4DfZQ.png",
            "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/ifd7zcxgwmjhgvmtxhqv/air-max-270-shoes-V4DfZQ.png"
        ]
    },
    {
        id: 2,
        category_id: 2,
        name: "Зимняя куртка Puma",
        description: "Тёплая зимняя куртка с капюшоном. Водонепроницаемая ткань, утеплитель 300г.",
        price_byn: 680.00,
        sizes: ["S", "M", "L", "XL", "XXL"],
        stock: 3,
        images: ["https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa/global/586752/01/fnd/EEA/w/1000/h/1000/fmt/png"]
    },
    {
        id: 3,
        category_id: 3,
        name: "Джинсы Levi's 501",
        description: "Легендарные прямые джинсы Levi's 501. 100% хлопок, классический крой.",
        price_byn: 320.00,
        sizes: ["S", "M", "L", "XL"],
        stock: 20,
        images: ["https://lsco.scene7.com/is/image/lsco/005010101-front-pdp?fmt=jpeg&qlt=70"]
    },
    {
        id: 4,
        category_id: 4,
        name: "Рюкзак Adidas Classic",
        description: "Вместительный городской рюкзак с отделением для ноутбука.",
        price_byn: 180.00,
        sizes: ["ONE SIZE"],
        stock: 25,
        images: [
            "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/add1f9c0f83e4e2c8f5aaf0800a23b9b_9366/Classic_Badge_of_Sport_Backpack_Black_HG0349_01_standard.jpg",
            "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/45688e3f8a534f88a67faf0800a254c8_9366/Classic_Badge_of_Sport_Backpack_Black_HG0349_02_standard.jpg"
        ]
    },
    {
        id: 5,
        category_id: 5,
        name: "Шорты Nike Sportswear",
        description: "Легкие спортивные шорты из дышащей ткани.",
        price_byn: 120.00,
        sizes: ["S", "M", "L", "XL"],
        stock: 30,
        images: ["https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/c1f14b06-e034-428f-bbdc-cdc1d678bb4c/sportswear-sport-essentials-woven-lined-flow-shorts-0B3QZR.png"]
    },
    {
        id: 6,
        category_id: 6,
        name: "Кепка New Era",
        description: "Оригинальная бейсболка New Era с прямым козырьком.",
        price_byn: 95.00,
        sizes: ["ONE SIZE"],
        stock: 0,
        images: ["https://www.neweracap.eu/globalassets/products/b9266_282/12380782/new-era-league-essential-9fifty-snapback-12380782-1.jpg"]
    }
];

// ==================== DOM ELEMENTS ====================
const elements = {
    // Main
    productsGrid: document.getElementById('productsGrid'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    
    // Filters
    categoryDropdown: document.getElementById('categoryDropdown'),
    categoryBtn: document.getElementById('categoryBtn'),
    categoryText: document.getElementById('categoryText'),
    categoryMenu: document.getElementById('categoryMenu'),
    sizeDropdown: document.getElementById('sizeDropdown'),
    sizeBtn: document.getElementById('sizeBtn'),
    sizeText: document.getElementById('sizeText'),
    sizeMenu: document.getElementById('sizeMenu'),
    
    // Currency
    currencyBtn: document.getElementById('currencyBtn'),
    currencyModal: document.getElementById('currencyModal'),
    
    // Product Modal
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
    
    // Cart
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
    
    // Checkout
    checkoutModal: document.getElementById('checkoutModal'),
    checkoutBack: document.getElementById('checkoutBack'),
    checkoutForm: document.getElementById('checkoutForm'),
    mailOptions: document.getElementById('mailOptions'),
    europochtaFields: document.getElementById('europochtaFields'),
    belpochtaFields: document.getElementById('belpochtaFields'),
    checkoutTotal: document.getElementById('checkoutTotal'),
    submitOrder: document.getElementById('submitOrder'),
    
    // Favorites
    favoritesModal: document.getElementById('favoritesModal'),
    favoritesBack: document.getElementById('favoritesBack'),
    favoritesGrid: document.getElementById('favoritesGrid'),
    favoritesEmpty: document.getElementById('favoritesEmpty'),
    favoritesHeaderBtn: document.getElementById('favoritesHeaderBtn'),
    
    // Profile
    profileModal: document.getElementById('profileModal'),
    profileBack: document.getElementById('profileBack'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileCartCount: document.getElementById('profileCartCount'),
    profileFavCount: document.getElementById('profileFavCount'),
    supportBtn: document.getElementById('supportBtn'),
    
    // Navigation
    navHome: document.getElementById('navHome'),
    navFavorites: document.getElementById('navFavorites'),
    navCart: document.getElementById('navCart'),
    navProfile: document.getElementById('navProfile'),
    
    // Other
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toastText')
};

// ==================== UTILITIES ====================
function formatPrice(priceByn, currency = state.currency) {
    const rate = state.exchangeRates[currency];
    const converted = priceByn * rate;
    
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    
    if (currency === 'USD') {
        return `${symbols[currency]}${converted.toFixed(2)}`;
    }
    return `${converted.toFixed(2)} ${symbols[currency]}`;
}

function showToast(message) {
    elements.toastText.textContent = message;
    elements.toast.classList.add('show');
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2000);
}

function hapticFeedback(type = 'light') {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(type);
    }
}

// ==================== USER DATA ====================
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
    const fullName = state.user.lastName 
        ? `${state.user.firstName} ${state.user.lastName}`
        : state.user.firstName;
    elements.profileName.textContent = fullName;
    
    elements.profileUsername.textContent = state.user.username 
        ? `@${state.user.username}` 
        : 'Telegram User';
    
    if (state.user.photoUrl) {
        elements.profileAvatar.innerHTML = `<img src="${state.user.photoUrl}" alt="Avatar">`;
    }
    
    updateProfileStats();
}

function updateProfileStats() {
    const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const favCount = state.favorites.length;
    
    elements.profileCartCount.textContent = cartCount;
    elements.profileFavCount.textContent = favCount;
}

// ==================== SIZE FILTER ====================
// ==================== SIZE FILTER ====================
function updateSizeFilter() {
    const categoryId = state.currentCategory === 'all' ? null : parseInt(state.currentCategory);
    let sizes = [];
    
    if (categoryId) {
        const sizeType = CATEGORY_SIZE_TYPE[categoryId];
        sizes = SIZES_BY_CATEGORY[sizeType] || [];
    } else {
        // Все размеры
        sizes = [...new Set([
            ...SIZES_BY_CATEGORY.shoes,
            ...SIZES_BY_CATEGORY.clothing,
            ...SIZES_BY_CATEGORY.onesize
        ])];
    }
    
    // Обновляем меню размеров
    let menuHtml = `<button class="filter-option active" data-size="all">Все размеры</button>`;
    
    // Группируем размеры попарно для обуви
    if (categoryId === 1) { // Обувь
        for (let i = 0; i < sizes.length; i += 2) {
            const size1 = sizes[i];
            const size2 = sizes[i + 1];
            menuHtml += `<div class="filter-option-row">`;
            menuHtml += `<button class="filter-option-size" data-size="${size1}">${size1}</button>`;
            if (size2) {
                menuHtml += `<button class="filter-option-size" data-size="${size2}">${size2}</button>`;
            }
            menuHtml += `</div>`;
        }
    } else {
        sizes.forEach(size => {
            menuHtml += `<button class="filter-option" data-size="${size}">${size}</button>`;
        });
    }
    
    elements.sizeMenu.innerHTML = menuHtml;
    
    // Сбрасываем выбранный размер
    state.currentSize = 'all';
    elements.sizeText.textContent = 'Все размеры';
    
    // Привязываем события
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

// ==================== RENDER FUNCTIONS ====================
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
                    <img src="${product.images[0]}" alt="${product.name}" class="product-image" loading="lazy">
                    <button class="product-favorite ${isFavorite ? 'active' : ''}" data-id="${product.id}">
                        <i data-lucide="heart"></i>
                    </button>
                    ${product.images.length > 1 ? `
                        <div class="image-indicators">
                            ${product.images.map((_, i) => `<div class="image-indicator ${i === 0 ? 'active' : ''}"></div>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formatPrice(product.price_byn)}</p>
                    <span class="product-status ${stockStatus.class}">${stockStatus.text}</span>
                </div>
            </div>
        `;
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
        
        const itemTotal = product.price_byn * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item" data-id="${item.productId}" data-size="${item.size}">
                <img src="${product.images[0]}" alt="${product.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${product.name}</h4>
                    <p class="cart-item-size">Размер: ${item.size}</p>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">${formatPrice(itemTotal)}</span>
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
            </div>
        `;
    }).join('');
    
    elements.cartSubtotal.textContent = formatPrice(total);
    elements.cartTotal.textContent = formatPrice(total);
    elements.checkoutTotal.textContent = formatPrice(total);
    
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
                    <button class="product-favorite active" data-id="${product.id}">
                        <i data-lucide="heart"></i>
                    </button>
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formatPrice(product.price_byn)}</p>
                    <span class="product-status ${stockStatus.class}">${stockStatus.text}</span>
                </div>
            </div>
        `;
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

// ==================== MODAL FUNCTIONS ====================
function openProductModal(product) {
    state.selectedProduct = product;
    state.selectedSize = null;
    state.quantity = 1;
    
    // Gallery
    elements.galleryTrack.innerHTML = product.images.map(img => 
        `<img src="${img}" alt="${product.name}">`
    ).join('');
    
    elements.galleryDots.innerHTML = product.images.map((_, i) => 
        `<div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
    ).join('');
    
    // Info - только выбранная валюта
    elements.productTitle.textContent = product.name;
    elements.productPriceMain.textContent = formatPrice(product.price_byn);
    
    const stockStatus = getStockStatus(product.stock);
    elements.productStock.textContent = stockStatus.text;
    elements.productStock.className = `product-stock ${stockStatus.class}`;
    
    // Sizes
    elements.sizesGrid.innerHTML = product.sizes.map(size => 
        `<button class="size-chip" data-size="${size}" ${product.stock === 0 ? 'disabled' : ''}>${size}</button>`
    ).join('');
    
    // Quantity
    elements.qtyValue.textContent = state.quantity;
    
    // Description
    elements.productDescription.textContent = product.description;
    
    // Favorite button
    elements.modalFavorite.classList.toggle('active', state.favorites.includes(product.id));
    
    // Button
    updateAddToCartBtn();
    
    // Show modal
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
    const product = state.selectedProduct;
    if (!product) return;
    
    const disabled = !state.selectedSize || product.stock === 0;
    elements.addToCartBtn.disabled = disabled;
    
    const total = product.price_byn * state.quantity;
    elements.btnPrice.textContent = formatPrice(total);
}

function openCartModal() {
    renderCart();
    elements.cartModal.classList.add('active');
}

function openCheckoutModal() {
    elements.cartModal.classList.remove('active');
    elements.checkoutModal.classList.add('active');
    resetCheckoutForm();
}

function resetCheckoutForm() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.delivery === 'pickup');
    });
    state.deliveryType = 'pickup';
    state.mailService = 'europochta';
    
    elements.mailOptions.classList.remove('active');
    elements.europochtaFields.classList.remove('active');
    elements.belpochtaFields.classList.remove('active');
    
    document.querySelector('input[name="mailService"][value="europochta"]').checked = true;
}

function updateDeliveryFields() {
    elements.europochtaFields.classList.remove('active');
    elements.belpochtaFields.classList.remove('active');
    
    if (state.deliveryType === 'mail') {
        elements.mailOptions.classList.add('active');
        
        if (state.mailService === 'europochta') {
            elements.europochtaFields.classList.add('active');
        } else if (state.mailService === 'belpochta') {
            elements.belpochtaFields.classList.add('active');
        }
    } else {
        elements.mailOptions.classList.remove('active');
    }
}

function openFavoritesModal() {
    renderFavorites();
    elements.favoritesModal.classList.add('active');
}

function openProfileModal() {
    updateProfileUI();
    elements.profileModal.classList.add('active');
    lucide.createIcons();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// ==================== EVENT LISTENERS ====================
function attachProductListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.product-favorite')) return;
            
            const id = parseInt(card.dataset.id);
            const product = state.products.find(p => p.id === id);
            if (product) {
                hapticFeedback();
                openProductModal(product);
            }
        });
    });
    
    document.querySelectorAll('.product-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleFavorite(id);
            btn.classList.toggle('active');
            hapticFeedback('medium');
        });
    });
}

function attachProductModalListeners() {
    elements.galleryTrack.addEventListener('scroll', () => {
        const scrollLeft = elements.galleryTrack.scrollLeft;
        const width = elements.galleryTrack.offsetWidth;
        const index = Math.round(scrollLeft / width);
        
        document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
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

// ==================== CART FUNCTIONS ====================
function addToCart() {
    if (!state.selectedProduct || !state.selectedSize) return;
    
    const existingItem = state.cart.find(
        item => item.productId === state.selectedProduct.id && item.size === state.selectedSize
    );
    
    if (existingItem) {
        existingItem.quantity += state.quantity;
    } else {
        state.cart.push({
            productId: state.selectedProduct.id,
            size: state.selectedSize,
            quantity: state.quantity
        });
    }
    
    saveCart();
    updateCartBadge();
    showToast('Добавлено в корзину');
    closeProductModal();
}

function updateCartItemQty(productId, size, delta) {
    const item = state.cart.find(i => i.productId === productId && i.size === size);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        removeFromCart(productId, size);
    } else {
        saveCart();
        renderCart();
    }
    
    hapticFeedback();
}

function removeFromCart(productId, size) {
    state.cart = state.cart.filter(i => !(i.productId === productId && i.size === size));
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
        updateCartBadge();
    }
}

// ==================== FAVORITES FUNCTIONS ====================
function toggleFavorite(productId) {
    const index = state.favorites.indexOf(productId);
    if (index === -1) {
        state.favorites.push(productId);
    } else {
        state.favorites.splice(index, 1);
    }
    saveFavorites();
    updateProfileStats();
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
}

function loadFavorites() {
    const saved = localStorage.getItem('favorites');
    if (saved) {
        state.favorites = JSON.parse(saved);
    }
}

// ==================== FILTER FUNCTIONS ====================
function filterProducts() {
    let filtered = state.products;
    
    // Category filter
    if (state.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id === parseInt(state.currentCategory));
    }
    
    // Size filter
    if (state.currentSize !== 'all') {
        filtered = filtered.filter(p => p.sizes.includes(state.currentSize));
    }
    
    // Search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
    }
    
    renderProducts(filtered);
}

// ==================== CHECKOUT ====================
// ==================== CHECKOUT ====================
function submitOrder() {
    console.log('🔵 submitOrder() вызван');
    
    const lastName = document.getElementById('customerLastName').value.trim();
    const firstName = document.getElementById('customerFirstName').value.trim();
    const middleName = document.getElementById('customerMiddleName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    
    console.log('📝 Данные формы:', { lastName, firstName, phone });
    
    // Validation
    if (!lastName || !firstName || !phone) {
        console.log('❌ Валидация не пройдена');
        showToast('Заполните обязательные поля');
        return;
    }
    
    // Additional validation for delivery
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
        }
    }
    
    console.log('✅ Валидация пройдена');
    
    // Build order data
    const orderData = {
        items: state.cart.map(item => {
            const product = state.products.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                name: product?.name,
                size: item.size,
                quantity: item.quantity,
                price: product?.price_byn,
                image: product?.images[0]
            };
        }),
        total: state.cart.reduce((sum, item) => {
            const product = state.products.find(p => p.id === item.productId);
            return sum + (product?.price_byn || 0) * item.quantity;
        }, 0),
        currency: state.currency,
        deliveryType: state.deliveryType,
        customer: {
            lastName: lastName,
            firstName: firstName,
            middleName: middleName || null,
            phone: phone
        }
    };
    
    // Add delivery info
    if (state.deliveryType === 'mail') {
        orderData.mailService = state.mailService;
        
        if (state.mailService === 'europochta') {
            orderData.delivery = {
                branch: document.getElementById('europochtaBranch').value.trim()
            };
        } else if (state.mailService === 'belpochta') {
            orderData.delivery = {
                index: document.getElementById('belpochtaIndex').value.trim(),
                city: document.getElementById('belpochtaCity').value.trim(),
                address: document.getElementById('belpochtaAddress').value.trim()
            };
        }
    }
    
    orderData.comment = document.getElementById('comment').value.trim() || null;
    
    console.log('📦 Order data:', orderData);
    console.log('🔹 tg object:', tg);
    console.log('🔹 tg.sendData:', tg?.sendData);
    
    // Показываем alert для отладки
    alert('Проверка:\n\ntg = ' + (tg ? 'есть' : 'нет') + '\nsendData = ' + (tg?.sendData ? 'есть' : 'нет'));
    
    // Send to Telegram bot
    if (tg && tg.sendData) {
        console.log('✅ Отправляем через sendData...');
        
        // Clear cart
        state.cart = [];
        saveCart();
        
        // Close modal
        elements.checkoutModal.classList.remove('active');
        
        // Reset form
        if (elements.checkoutForm) {
            elements.checkoutForm.reset();
        }
        resetCheckoutForm();
        
        hapticFeedback('heavy');
        
        try {
            // Send data
            const dataString = JSON.stringify(orderData);
            console.log('📤 Отправляем данные:', dataString.substring(0, 100) + '...');
            tg.sendData(dataString);
            console.log('✅ sendData вызван');
        } catch (e) {
            console.error('❌ Ошибка sendData:', e);
            alert('Ошибка: ' + e.message);
        }
        
    } else {
        console.log('⚠️ Telegram WebApp недоступен');
        alert('Telegram WebApp недоступен!\n\nОткройте приложение через кнопку в боте.');
    }
}
// ==================== SUPPORT ====================
function openSupport() {
    const supportUrl = `https://t.me/${SUPPORT_USERNAME}`;
    
    if (tg) {
        tg.openTelegramLink(supportUrl);
    } else {
        window.open(supportUrl, '_blank');
    }
}

// ==================== INIT EVENT LISTENERS ====================
function initEventListeners() {
    // Category dropdown
    elements.categoryBtn.addEventListener('click', () => {
        elements.categoryDropdown.classList.toggle('open');
        elements.sizeDropdown.classList.remove('open');
        hapticFeedback();
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
    
    // Size dropdown
    elements.sizeBtn.addEventListener('click', () => {
        elements.sizeDropdown.classList.toggle('open');
        elements.categoryDropdown.classList.remove('open');
        hapticFeedback();
    });
    
    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown')) {
            elements.categoryDropdown.classList.remove('open');
            elements.sizeDropdown.classList.remove('open');
        }
        if (!e.target.closest('#currencyBtn') && !e.target.closest('#currencyModal')) {
            elements.currencyModal.classList.remove('active');
        }
    });
    
    // Search
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchQuery = e.target.value.trim();
            filterProducts();
        }, 300);
    });
    
    // Currency
    elements.currencyBtn.addEventListener('click', () => {
        elements.currencyModal.classList.toggle('active');
        hapticFeedback();
    });
    
    document.querySelectorAll('.dropdown-item[data-currency]').forEach(item => {
        item.addEventListener('click', () => {
            const currency = item.dataset.currency;
            state.currency = currency;
            
            document.querySelectorAll('.dropdown-item[data-currency]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            elements.currencyBtn.querySelector('.currency-text').textContent = currency;
            elements.currencyModal.classList.remove('active');
            
            filterProducts();
            renderCart();
            if (state.selectedProduct) {
                elements.productPriceMain.textContent = formatPrice(state.selectedProduct.price_byn);
                updateAddToCartBtn();
            }
            hapticFeedback();
        });
    });
    
    // Product modal
    elements.modalBack.addEventListener('click', closeProductModal);
    elements.productModal.querySelector('.modal-overlay').addEventListener('click', closeProductModal);
    
    elements.modalFavorite.addEventListener('click', () => {
        if (!state.selectedProduct) return;
        toggleFavorite(state.selectedProduct.id);
        elements.modalFavorite.classList.toggle('active');
        hapticFeedback('medium');
    });
    
    elements.qtyMinus.addEventListener('click', () => {
        if (state.quantity > 1) {
            state.quantity--;
            elements.qtyValue.textContent = state.quantity;
            updateAddToCartBtn();
            hapticFeedback();
        }
    });
    
    elements.qtyPlus.addEventListener('click', () => {
        if (state.quantity < 10) {
            state.quantity++;
            elements.qtyValue.textContent = state.quantity;
            updateAddToCartBtn();
            hapticFeedback();
        }
    });
    
    elements.addToCartBtn.addEventListener('click', addToCart);
    
    // Cart
    elements.navCart.addEventListener('click', () => {
        openCartModal();
        setActiveNav('cart');
    });
    elements.cartBack.addEventListener('click', () => elements.cartModal.classList.remove('active'));
    elements.cartModal.querySelector('.modal-overlay').addEventListener('click', () => elements.cartModal.classList.remove('active'));
    elements.clearCartBtn.addEventListener('click', clearCart);
    elements.checkoutBtn.addEventListener('click', openCheckoutModal);
    
    // Checkout
    elements.checkoutBack.addEventListener('click', () => {
        elements.checkoutModal.classList.remove('active');
        openCartModal();
    });
    elements.checkoutModal.querySelector('.modal-overlay').addEventListener('click', () => elements.checkoutModal.classList.remove('active'));
    
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
    
    // Mail service selection
    document.querySelectorAll('input[name="mailService"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.mailService = e.target.value;
            updateDeliveryFields();
            hapticFeedback();
        });
    });
    
    // Submit order button
    elements.submitOrder.addEventListener('click', (e) => {
        e.preventDefault();
        submitOrder();
    });
    
    // Favorites
    elements.navFavorites.addEventListener('click', () => {
        openFavoritesModal();
        setActiveNav('favorites');
    });
    elements.favoritesHeaderBtn.addEventListener('click', openFavoritesModal);
    elements.favoritesBack.addEventListener('click', () => elements.favoritesModal.classList.remove('active'));
    elements.favoritesModal.querySelector('.modal-overlay').addEventListener('click', () => elements.favoritesModal.classList.remove('active'));
    
    // Profile
    elements.navProfile.addEventListener('click', () => {
        openProfileModal();
        setActiveNav('profile');
    });
    elements.profileBack.addEventListener('click', () => elements.profileModal.classList.remove('active'));
    elements.profileModal.querySelector('.modal-overlay').addEventListener('click', () => elements.profileModal.classList.remove('active'));
    
    // Support button
    elements.supportBtn.addEventListener('click', () => {
        openSupport();
        hapticFeedback();
    });
    
    // Navigation
    elements.navHome.addEventListener('click', () => {
        closeAllModals();
        setActiveNav('home');
        hapticFeedback();
    });
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
}

// ==================== INITIALIZATION ====================
async function init() {
    // Load user data from Telegram
    loadUserData();
    
    // Load products
    state.products = testProducts;
    
    // Load local data
    loadCart();
    loadFavorites();
    
    // Init size filter
    updateSizeFilter();
    
    // Render
    renderProducts(state.products);
    updateCartBadge();
    
    // Init listeners
    initEventListeners();
    
    // Init Lucide icons
    lucide.createIcons();
    
    console.log('✅ App initialized');
}

// Start
document.addEventListener('DOMContentLoaded', init);
