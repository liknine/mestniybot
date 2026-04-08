// ==================== INITIALIZATION ====================
const tg = window.Telegram?.WebApp;

// Initialize Telegram WebApp
if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
}

// ==================== STATE ====================
const state = {
    products: [],
    cart: [],
    favorites: [],
    currency: 'BYN',
    currentCategory: 'all',
    searchQuery: '',
    selectedProduct: null,
    selectedSize: null,
    quantity: 1,
    exchangeRates: {
        BYN: 1,
        RUB: 26.76,
        USD: 0.3425
    }
};

// ==================== TEST DATA ====================
const testProducts = [
    {
        id: 1,
        category_id: 1,
        name: "Nike Air Max 270",
        description: "Классические кроссовки Nike с технологией Air. Отличная амортизация, стильный дизайн и комфорт на весь день. Верх из дышащего материала обеспечивает отличную вентиляцию.",
        price_byn: 450.00,
        sizes: ["38", "39", "40", "41", "42", "43", "44"],
        stock: 15,
        images: [
            "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/zwxes8uud05rkuei1mww/air-max-270-shoes.png",
            "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/mbhgt6vjlqgecylhri87/air-max-270-shoes.png"
        ]
    },
    {
        id: 2,
        category_id: 2,
        name: "Зимняя куртка Puma",
        description: "Тёплая зимняя куртка с капюшоном. Водонепроницаемая ткань, утеплитель 300г. Идеально для белорусской зимы!",
        price_byn: 680.00,
        sizes: ["S", "M", "L", "XL", "XXL"],
        stock: 3,
        images: [
            "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa/global/586752/01/fnd/EEA/w/1000/h/1000/fmt/png"
        ]
    },
    {
        id: 3,
        category_id: 3,
        name: "Джинсы Levi's 501",
        description: "Легендарные прямые джинсы Levi's 501. 100% хлопок, классический крой, который никогда не выходит из моды.",
        price_byn: 320.00,
        sizes: ["30", "32", "34", "36", "38"],
        stock: 20,
        images: [
            "https://lsco.scene7.com/is/image/lsco/005010101-front-pdp?fmt=jpeg&qlt=70"
        ]
    },
    {
        id: 4,
        category_id: 4,
        name: "Рюкзак Adidas Classic",
        description: "Вместительный городской рюкзак с отделением для ноутбука. Прочный материал, удобные лямки.",
        price_byn: 180.00,
        sizes: ["ONE SIZE"],
        stock: 25,
        images: [
            "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/add1f9c0f83e4e2c8f5aaf0800a23b9b_9366/Classic_Badge_of_Sport_Backpack_Black_HG0349_01_standard.jpg"
        ]
    },
    {
        id: 5,
        category_id: 5,
        name: "Шорты Nike Sportswear",
        description: "Легкие спортивные шорты из дышащей ткани. Идеально для тренировок и повседневной носки.",
        price_byn: 120.00,
        sizes: ["S", "M", "L", "XL"],
        stock: 30,
        images: [
            "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/c1f14b06-e034-428f-bbdc-cdc1d678bb4c/sportswear-sport-essentials-woven-lined-flow-shorts-0B3QZR.png"
        ]
    },
    {
        id: 6,
        category_id: 6,
        name: "Кепка New Era",
        description: "Оригинальная бейсболка New Era с прямым козырьком. Регулируемый размер, вышитый логотип.",
        price_byn: 95.00,
        sizes: ["ONE SIZE"],
        stock: 0,
        images: [
            "https://www.neweracap.eu/globalassets/products/b9266_282/12380782/new-era-league-essential-9fifty-snapback-12380782-1.jpg"
        ]
    }
];

// ==================== DOM ELEMENTS ====================
const elements = {
    // Main
    productsGrid: document.getElementById('productsGrid'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    categories: document.getElementById('categories'),
    
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
    productPricesAlt: document.getElementById('productPricesAlt'),
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
    addressFields: document.getElementById('addressFields'),
    checkoutTotal: document.getElementById('checkoutTotal'),
    submitOrder: document.getElementById('submitOrder'),
    
    // Favorites
    favoritesModal: document.getElementById('favoritesModal'),
    favoritesBack: document.getElementById('favoritesBack'),
    favoritesGrid: document.getElementById('favoritesGrid'),
    favoritesEmpty: document.getElementById('favoritesEmpty'),
    favoritesHeaderBtn: document.getElementById('favoritesHeaderBtn'),
    
    // Navigation
    navHome: document.getElementById('navHome'),
    navFavorites: document.getElementById('navFavorites'),
    navCart: document.getElementById('navCart'),
    
    // Other
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toastText'),
    successModal: document.getElementById('successModal'),
    successBtn: document.getElementById('successBtn')
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
    
    // Info
    elements.productTitle.textContent = product.name;
    elements.productPriceMain.textContent = formatPrice(product.price_byn);
    
    const stockStatus = getStockStatus(product.stock);
    elements.productStock.textContent = stockStatus.text;
    elements.productStock.className = `product-stock ${stockStatus.class}`;
    
    // Alternative prices
    const altCurrencies = ['BYN', 'RUB', 'USD'].filter(c => c !== state.currency);
    elements.productPricesAlt.textContent = altCurrencies.map(c => formatPrice(product.price_byn, c)).join(' • ');
    
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
    
    // Reset form
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.delivery === 'pickup');
    });
    elements.mailOptions.classList.remove('active');
    elements.addressFields.classList.remove('active');
}

function openFavoritesModal() {
    renderFavorites();
    elements.favoritesModal.classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// ==================== EVENT LISTENERS ====================
function attachProductListeners() {
    // Card click
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
    
    // Favorite button
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
    // Gallery scroll
    elements.galleryTrack.addEventListener('scroll', () => {
        const scrollLeft = elements.galleryTrack.scrollLeft;
        const width = elements.galleryTrack.offsetWidth;
        const index = Math.round(scrollLeft / width);
        
        document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    });
    
    // Size selection
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
    // Quantity buttons
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
    
    // Delete buttons
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
function submitOrder() {
    const form = elements.checkoutForm;
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    
    if (!name || !phone) {
        showToast('Заполните обязательные поля');
        return;
    }
    
    // Get delivery type
    const activeToggle = document.querySelector('.toggle-btn.active');
    const deliveryType = activeToggle?.dataset.delivery || 'pickup';
    
    // Build order data
    const orderData = {
        items: state.cart,
        total: state.cart.reduce((sum, item) => {
            const product = state.products.find(p => p.id === item.productId);
            return sum + (product?.price_byn || 0) * item.quantity;
        }, 0),
        currency: state.currency,
        deliveryType: deliveryType,
        name: name,
        phone: phone
    };
    
    if (deliveryType === 'mail') {
        const mailService = document.querySelector('input[name="mailService"]:checked')?.value;
        orderData.mailService = mailService;
        orderData.address = {
            city: document.getElementById('city').value.trim(),
            zipCode: document.getElementById('zipCode').value.trim(),
            street: document.getElementById('street').value.trim()
        };
    }
    
    orderData.comment = document.getElementById('comment').value.trim();
    
    // Send to Telegram
    if (tg) {
        tg.sendData(JSON.stringify(orderData));
    }
    
    // Show success
    elements.checkoutModal.classList.remove('active');
    elements.successModal.classList.add('active');
    
    // Clear cart
    state.cart = [];
    saveCart();
    
    hapticFeedback('heavy');
}

// ==================== INIT EVENT LISTENERS ====================
function initEventListeners() {
    // Categories
    elements.categories.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.currentCategory = chip.dataset.category;
        filterProducts();
        hapticFeedback();
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
            hapticFeedback();
        });
    });
    
    // Close currency modal on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#currencyBtn') && !e.target.closest('#currencyModal')) {
            elements.currencyModal.classList.remove('active');
        }
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
    elements.navCart.addEventListener('click', openCartModal);
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
            
            const isMail = btn.dataset.delivery === 'mail';
            elements.mailOptions.classList.toggle('active', isMail);
            elements.addressFields.classList.toggle('active', isMail);
            hapticFeedback();
        });
    });
    
    elements.submitOrder.addEventListener('click', submitOrder);
    
    // Favorites
    elements.navFavorites.addEventListener('click', openFavoritesModal);
    elements.favoritesHeaderBtn.addEventListener('click', openFavoritesModal);
    elements.favoritesBack.addEventListener('click', () => elements.favoritesModal.classList.remove('active'));
    elements.favoritesModal.querySelector('.modal-overlay').addEventListener('click', () => elements.favoritesModal.classList.remove('active'));
    
    // Navigation
    elements.navHome.addEventListener('click', () => {
        closeAllModals();
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        elements.navHome.classList.add('active');
        hapticFeedback();
    });
    
    // Success modal
    elements.successBtn.addEventListener('click', () => {
        elements.successModal.classList.remove('active');
        closeAllModals();
    });
}

// ==================== INITIALIZATION ====================
async function init() {
    // Load data
    state.products = testProducts; // Later: fetch from API
    loadCart();
    loadFavorites();
    
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