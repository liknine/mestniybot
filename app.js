// ==================== TELEGRAM WEBAPP ====================
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

const SIZES = {
    shoes: ['37','37.5','38','38.5','39','39.5','40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45','45.5','46','46.5'],
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
    console.log('📦 Загрузка товаров...');
    try {
        const response = await fetch('products.json?v=' + Date.now());
        if (response.ok) {
            state.products = await response.json();
            console.log('✅ Загружено:', state.products.length);
            return true;
        }
        return false;
    } catch (e) {
        console.log('❌ Ошибка:', e.message);
        return false;
    }
}

// ==================== UTILITIES ====================
function formatPrice(priceByn, currency, product) {
    currency = currency || state.currency;
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    
    if (product && product.prices && product.prices[currency]) {
        const price = product.prices[currency];
        if (currency === 'USD') return '$' + price.toFixed(2);
        return price.toFixed(2) + ' ' + symbols[currency];
    }
    
    const rate = state.exchangeRates[currency] || 1;
    const converted = priceByn * rate;
    if (currency === 'USD') return '$' + converted.toFixed(2);
    return converted.toFixed(2) + ' ' + symbols[currency];
}

function getItemPrice(product, qty) {
    qty = qty || 1;
    if (product && product.prices && product.prices[state.currency]) {
        return product.prices[state.currency] * qty;
    }
    return product.price_byn * qty * (state.exchangeRates[state.currency] || 1);
}

function formatTotal(total) {
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    if (state.currency === 'USD') return '$' + total.toFixed(2);
    return total.toFixed(2) + ' ' + symbols[state.currency];
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    if (toast && text) {
        text.textContent = msg;
        toast.classList.add('show');
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

function haptic(type) {
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type || 'light');
}

function getBrandName(key) {
    return BRANDS[key] || key || '';
}

function getStockStatus(stock) {
    if (stock === 0) return { text: 'Нет в наличии', class: 'out-of-stock' };
    if (stock <= 5) return { text: 'Осталось ' + stock + ' шт', class: 'low-stock' };
    return { text: 'В наличии', class: 'in-stock' };
}

// ==================== USER ====================
function loadUserData() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const u = tg.initDataUnsafe.user;
        state.user = {
            id: u.id,
            firstName: u.first_name || 'Пользователь',
            lastName: u.last_name || '',
            username: u.username || '',
            photoUrl: u.photo_url || null
        };
    }
    updateProfileUI();
}

function updateProfileUI() {
    const name = state.user.lastName ? state.user.firstName + ' ' + state.user.lastName : state.user.firstName;
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (profileName) profileName.textContent = name;
    if (profileUsername) profileUsername.textContent = state.user.username ? '@' + state.user.username : 'Telegram User';
    if (profileAvatar && state.user.photoUrl) {
        profileAvatar.innerHTML = '<img src="' + state.user.photoUrl + '" alt="Avatar">';
    }
    updateProfileStats();
}

function updateProfileStats() {
    const cartCount = document.getElementById('profileCartCount');
    const favCount = document.getElementById('profileFavCount');
    if (cartCount) cartCount.textContent = state.cart.reduce((s, i) => s + i.sizes.length, 0);
    if (favCount) favCount.textContent = state.favorites.length;
}

// ==================== SIZE FILTER CHIPS ====================
function renderSizeFilters() {
    const wrapper = document.getElementById('sizesFilterScroll');
    if (!wrapper) return;
    
    let sizes = [];
    
    if (state.currentCategory === 'all') {
        // Показываем размеры одежды по умолчанию
        sizes = ['Все', ...SIZES.clothing];
    } else {
        const catId = parseInt(state.currentCategory);
        const cat = CATEGORIES[catId];
        if (cat) {
            sizes = ['Все', ...SIZES[cat.sizeType]];
        }
    }
    
    wrapper.innerHTML = sizes.map((size, i) => {
        const value = i === 0 ? 'all' : size;
        const isActive = state.currentSize === value;
        return '<button class="size-filter-chip ' + (isActive ? 'active' : '') + '" data-size="' + value + '">' + size + '</button>';
    }).join('');
    
    // Attach listeners
    wrapper.querySelectorAll('.size-filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            wrapper.querySelectorAll('.size-filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            state.currentSize = this.dataset.size;
            filterProducts();
            haptic();
        });
    });
}

// ==================== FILTERS ====================
function filterProducts() {
    let filtered = state.products.slice();
    
    // Category
    if (state.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id === parseInt(state.currentCategory));
    }
    
    // Brand
    if (state.currentBrand !== 'all') {
        filtered = filtered.filter(p => p.brand === state.currentBrand);
    }
    
    // Size
    if (state.currentSize !== 'all') {
        filtered = filtered.filter(p => p.sizes && p.sizes.includes(state.currentSize));
    }
    
    // Search
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.brand && getBrandName(p.brand).toLowerCase().includes(q))
        );
    }
    
    renderProducts(filtered);
}

// ==================== RENDER PRODUCTS ====================
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('emptyState');
    
    if (loading) loading.classList.add('hidden');
    
    if (!products.length) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        lucide.createIcons();
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    if (grid) {
        grid.innerHTML = products.map(p => {
            const isFav = state.favorites.includes(p.id);
            const status = getStockStatus(p.stock);
            const img = p.images && p.images[0] ? p.images[0] : '';
            
            return '<div class="product-card" data-id="' + p.id + '">' +
                '<div class="product-image-container">' +
                    '<img src="' + img + '" alt="' + p.name + '" class="product-image" loading="lazy" onerror="this.style.display=\'none\'">' +
                    '<button class="product-favorite ' + (isFav ? 'active' : '') + '" data-id="' + p.id + '">' +
                        '<i data-lucide="heart"></i>' +
                    '</button>' +
                '</div>' +
                '<div class="product-details">' +
                    '<h3 class="product-name">' + p.name + '</h3>' +
                    '<p class="product-price">' + formatPrice(p.price_byn, state.currency, p) + '</p>' +
                    '<span class="product-status ' + status.class + '">' + status.text + '</span>' +
                '</div>' +
            '</div>';
        }).join('');
        
        lucide.createIcons();
        attachProductListeners();
    }
}

function attachProductListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.product-favorite')) return;
            const product = state.products.find(p => p.id === parseInt(this.dataset.id));
            if (product) {
                haptic();
                openProductModal(product);
            }
        });
    });
    
    document.querySelectorAll('.product-favorite').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFavorite(parseInt(this.dataset.id));
            this.classList.toggle('active');
            haptic('medium');
        });
    });
}

// ==================== CART ====================
function renderCart() {
    const items = document.getElementById('cartItems');
    const empty = document.getElementById('cartEmpty');
    const footer = document.getElementById('cartFooter');
    const subtotal = document.getElementById('cartSubtotal');
    const total = document.getElementById('cartTotal');
    const checkout = document.getElementById('checkoutTotal');
    
    if (!state.cart.length) {
        if (items) items.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        if (footer) footer.style.display = 'none';
        lucide.createIcons();
        return;
    }
    
    if (empty) empty.style.display = 'none';
    if (footer) footer.style.display = 'block';
    
    let sum = 0;
    
    if (items) {
        items.innerHTML = state.cart.map(item => {
            const p = state.products.find(x => x.id === item.productId);
            if (!p) return '';
            
            const itemSum = getItemPrice(p, item.sizes.length);
            sum += itemSum;
            const img = p.images && p.images[0] ? p.images[0] : '';
            
            return '<div class="cart-item" data-id="' + item.productId + '">' +
                '<img src="' + img + '" alt="' + p.name + '" class="cart-item-image">' +
                '<div class="cart-item-info">' +
                    '<h4 class="cart-item-name">' + p.name + '</h4>' +
                    '<p class="cart-item-sizes">Размеры: ' + item.sizes.join(', ') + '</p>' +
                    '<div class="cart-item-bottom">' +
                        '<span class="cart-item-price">' + formatTotal(itemSum) + '</span>' +
                        '<button class="cart-item-delete" data-id="' + item.productId + '">' +
                            '<i data-lucide="trash-2"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
        
        lucide.createIcons();
        attachCartListeners();
    }
    
    if (subtotal) subtotal.textContent = formatTotal(sum);
    if (total) total.textContent = formatTotal(sum);
    if (checkout) checkout.textContent = formatTotal(sum);
    
    updateCartBadge();
}

function attachCartListeners() {
    document.querySelectorAll('.cart-item-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            removeFromCart(parseInt(this.dataset.id));
        });
    });
}

function addToCart() {
    if (!state.selectedProduct || !state.selectedSizes.length) return;
    
    const existing = state.cart.find(i => i.productId === state.selectedProduct.id);
    
    if (existing) {
        state.selectedSizes.forEach(s => {
            if (!existing.sizes.includes(s)) existing.sizes.push(s);
        });
    } else {
        state.cart.push({
            productId: state.selectedProduct.id,
            sizes: state.selectedSizes.slice()
        });
    }
    
    saveCart();
    updateCartBadge();
    showToast('Добавлено: ' + state.selectedSizes.length + ' размер(а)');
    closeProductModal();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.productId !== productId);
    saveCart();
    renderCart();
    haptic('medium');
}

function clearCart() {
    state.cart = [];
    saveCart();
    renderCart();
    haptic('medium');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartBadge();
}

function loadCart() {
    try {
        const saved = localStorage.getItem('cart');
        if (saved) {
            state.cart = JSON.parse(saved);
            // Migrate old format
            state.cart = state.cart.map(item => {
                if (item.size && !item.sizes) {
                    return { productId: item.productId, sizes: [item.size] };
                }
                return item;
            });
            updateCartBadge();
        }
    } catch (e) {
        console.log('Cart load error:', e);
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = state.cart.reduce((s, i) => s + i.sizes.length, 0);
    if (badge) {
        badge.textContent = count;
        badge.dataset.count = count;
    }
    updateProfileStats();
}

// ==================== FAVORITES ====================
function toggleFavorite(productId) {
    const idx = state.favorites.indexOf(productId);
    if (idx === -1) state.favorites.push(productId);
    else state.favorites.splice(idx, 1);
    saveFavorites();
    updateProfileStats();
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
}

function loadFavorites() {
    try {
        const saved = localStorage.getItem('favorites');
        if (saved) state.favorites = JSON.parse(saved);
    } catch (e) {
        console.log('Favorites load error:', e);
    }
}

function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');
    
    const favProducts = state.products.filter(p => state.favorites.includes(p.id));
    
    if (!favProducts.length) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        lucide.createIcons();
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    if (grid) {
        grid.innerHTML = favProducts.map(p => {
            const status = getStockStatus(p.stock);
            const img = p.images && p.images[0] ? p.images[0] : '';
            
            return '<div class="product-card" data-id="' + p.id + '">' +
                '<div class="product-image-container">' +
                    '<img src="' + img + '" alt="' + p.name + '" class="product-image" loading="lazy">' +
                    '<button class="product-favorite active" data-id="' + p.id + '">' +
                        '<i data-lucide="heart"></i>' +
                    '</button>' +
                '</div>' +
                '<div class="product-details">' +
                    '<h3 class="product-name">' + p.name + '</h3>' +
                    '<p class="product-price">' + formatPrice(p.price_byn, state.currency, p) + '</p>' +
                    '<span class="product-status ' + status.class + '">' + status.text + '</span>' +
                '</div>' +
            '</div>';
        }).join('');
        
        lucide.createIcons();
        attachProductListeners();
    }
}

// ==================== CURRENCY ====================
function setCurrency(currency) {
    state.currency = currency;
    localStorage.setItem('currency', currency);
    
    document.querySelectorAll('.currency-btn-small').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === currency);
    });
    
    filterProducts();
    
    if (state.selectedProduct) {
        const price = document.getElementById('productPriceMain');
        if (price) price.textContent = formatPrice(state.selectedProduct.price_byn, currency, state.selectedProduct);
        updateAddToCartBtn();
    }
    
    renderCart();
    haptic();
}

function loadCurrency() {
    const saved = localStorage.getItem('currency');
    if (saved && ['BYN', 'RUB', 'USD'].includes(saved)) {
        state.currency = saved;
        document.querySelectorAll('.currency-btn-small').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.currency === saved);
        });
    }
}

// ==================== PRODUCT MODAL ====================
function openProductModal(product) {
    state.selectedProduct = product;
    state.selectedSizes = [];
    
    const modal = document.getElementById('productModal');
    const track = document.getElementById('galleryTrack');
    const dots = document.getElementById('galleryDots');
    const title = document.getElementById('productTitle');
    const brand = document.getElementById('productBrand');
    const price = document.getElementById('productPriceMain');
    const stock = document.getElementById('productStock');
    const grid = document.getElementById('sizesGrid');
    const desc = document.getElementById('productDescription');
    const fav = document.getElementById('modalFavorite');
    
    // Gallery
    if (track && product.images) {
        track.innerHTML = product.images.map(img => '<img src="' + img + '" alt="' + product.name + '">').join('');
        
        track.addEventListener('scroll', function() {
            const index = Math.round(this.scrollLeft / this.offsetWidth);
            document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        });
    }
    
    if (dots && product.images) {
        dots.innerHTML = product.images.map((_, i) => '<div class="gallery-dot ' + (i === 0 ? 'active' : '') + '"></div>').join('');
    }
    
    if (title) title.textContent = product.name;
    if (brand) brand.textContent = getBrandName(product.brand);
    if (price) price.textContent = formatPrice(product.price_byn, state.currency, product);
    
    const stockStatus = getStockStatus(product.stock);
    if (stock) {
        stock.textContent = stockStatus.text;
        stock.className = 'product-stock ' + stockStatus.class;
    }
    
    // Sizes
    if (grid && product.sizes) {
        grid.innerHTML = product.sizes.map(size => 
            '<button class="size-chip" data-size="' + size + '" ' + (product.stock === 0 ? 'disabled' : '') + '>' + size + '</button>'
        ).join('');
        
        grid.querySelectorAll('.size-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                const size = this.dataset.size;
                const idx = state.selectedSizes.indexOf(size);
                
                if (idx === -1) {
                    state.selectedSizes.push(size);
                    this.classList.add('selected');
                } else {
                    state.selectedSizes.splice(idx, 1);
                    this.classList.remove('selected');
                }
                
                haptic();
                updateAddToCartBtn();
            });
        });
    }
    
    if (desc) desc.textContent = product.description || '';
    if (fav) fav.classList.toggle('active', state.favorites.includes(product.id));
    
    updateAddToCartBtn();
    if (modal) modal.classList.add('active');
    lucide.createIcons();
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    state.selectedProduct = null;
    state.selectedSizes = [];
}

function updateAddToCartBtn() {
    const btn = document.getElementById('addToCartBtn');
    const price = document.getElementById('btnPrice');
    
    if (!state.selectedProduct || !btn) return;
    
    btn.disabled = !state.selectedSizes.length || state.selectedProduct.stock === 0;
    
    const total = getItemPrice(state.selectedProduct, Math.max(state.selectedSizes.length, 1));
    if (price) price.textContent = formatTotal(total);
}

// ==================== OTHER MODALS ====================
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

function openCheckoutModal() {
    const cart = document.getElementById('cartModal');
    const checkout = document.getElementById('checkoutModal');
    if (cart) cart.classList.remove('active');
    if (checkout) checkout.classList.add('active');
    resetCheckoutForm();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

function resetCheckoutForm() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.delivery === 'pickup');
    });
    state.deliveryType = 'pickup';
    state.mailService = 'europochta';
    
    const mail = document.getElementById('mailOptions');
    const euro = document.getElementById('europochtaFields');
    const bel = document.getElementById('belpochtaFields');
    const cdek = document.getElementById('cdekFields');
    
    if (mail) mail.classList.remove('active');
    if (euro) euro.classList.remove('active');
    if (bel) bel.classList.remove('active');
    if (cdek) cdek.classList.remove('active');
    
    const euroRadio = document.querySelector('input[name="mailService"][value="europochta"]');
    if (euroRadio) euroRadio.checked = true;
}

function updateDeliveryFields() {
    const mail = document.getElementById('mailOptions');
    const euro = document.getElementById('europochtaFields');
    const bel = document.getElementById('belpochtaFields');
    const cdek = document.getElementById('cdekFields');
    
    if (euro) euro.classList.remove('active');
    if (bel) bel.classList.remove('active');
    if (cdek) cdek.classList.remove('active');
    
    if (state.deliveryType === 'mail') {
        if (mail) mail.classList.add('active');
        if (state.mailService === 'europochta' && euro) euro.classList.add('active');
        else if (state.mailService === 'belpochta' && bel) bel.classList.add('active');
        else if (state.mailService === 'cdek' && cdek) cdek.classList.add('active');
    } else {
        if (mail) mail.classList.remove('active');
    }
}

// ==================== ORDER ====================
function submitOrder() {
    const lastName = document.getElementById('customerLastName');
    const firstName = document.getElementById('customerFirstName');
    const phone = document.getElementById('customerPhone');
    
    if (!lastName || !firstName || !phone) return;
    if (!lastName.value.trim() || !firstName.value.trim() || !phone.value.trim()) {
        showToast('Заполните обязательные поля');
        return;
    }
    
    let total = 0;
    const items = state.cart.map(item => {
        const p = state.products.find(x => x.id === item.productId);
        if (!p) return null;
        total += getItemPrice(p, item.sizes.length);
        return {
            productId: item.productId,
            name: p.name,
            sizes: item.sizes,
            price: getItemPrice(p, 1)
        };
    }).filter(Boolean);
    
    const middleName = document.getElementById('customerMiddleName');
    const comment = document.getElementById('comment');
    
    const order = {
        items: items,
        total: total,
        currency: state.currency,
        deliveryType: state.deliveryType,
        deliveryService: state.deliveryType === 'mail' ? state.mailService : null,
        customer: {
            lastName: lastName.value.trim(),
            firstName: firstName.value.trim(),
            middleName: middleName ? middleName.value.trim() : '',
            phone: phone.value.trim()
        },
        comment: comment ? comment.value.trim() : ''
    };
    
    if (tg) {
        tg.sendData(JSON.stringify(order));
    } else {
        console.log('Order:', order);
        showToast('Заказ оформлен!');
        clearCart();
        closeAllModals();
    }
}

// ==================== DROPDOWNS ====================
function setupDropdowns() {
    // Category dropdown
    const catWrapper = document.getElementById('categoryDropdownWrapper');
    const catTrigger = document.getElementById('categoryTrigger');
    const catMenu = document.getElementById('categoryMenu');
    const catLabel = document.getElementById('categoryLabel');
    
    if (catTrigger && catWrapper && catMenu) {
        catTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAllDropdowns();
            catWrapper.classList.toggle('open');
        });
        
        catMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                catMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                state.currentCategory = this.dataset.id;
                
                if (catLabel) {
                    catLabel.textContent = this.dataset.id === 'all' ? 'Категория' : this.textContent.trim();
                }
                
                catTrigger.classList.toggle('has-value', this.dataset.id !== 'all');
                catWrapper.classList.remove('open');
                
                // Update size filters based on category
                renderSizeFilters();
                state.currentSize = 'all';
                filterProducts();
                haptic();
            });
        });
    }
    
    // Brand dropdown
    const brandWrapper = document.getElementById('brandDropdownWrapper');
    const brandTrigger = document.getElementById('brandTrigger');
    const brandMenu = document.getElementById('brandMenu');
    const brandLabel = document.getElementById('brandLabel');
    
    if (brandTrigger && brandWrapper && brandMenu) {
        brandTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAllDropdowns();
            brandWrapper.classList.toggle('open');
        });
        
        brandMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                brandMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                state.currentBrand = this.dataset.id;
                
                if (brandLabel) {
                    brandLabel.textContent = this.dataset.id === 'all' ? 'Бренд' : this.textContent.trim();
                }
                
                brandTrigger.classList.toggle('has-value', this.dataset.id !== 'all');
                brandWrapper.classList.remove('open');
                
                filterProducts();
                haptic();
            });
        });
    }
    
    // Close on outside click
    document.addEventListener('click', function() {
        closeAllDropdowns();
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
}

// ==================== NAV ====================
function setActiveNav(page) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
}

// ==================== INIT ====================
function initListeners() {
    // Currency
    document.querySelectorAll('.currency-btn-small').forEach(btn => {
        btn.addEventListener('click', function() {
            setCurrency(this.dataset.currency);
        });
    });
    
    // Search
    const search = document.getElementById('searchInput');
    if (search) {
        search.addEventListener('input', function() {
            state.searchQuery = this.value;
            filterProducts();
        });
    }
    
    // Dropdowns
    setupDropdowns();
    
    // Modal backs
    const modalBack = document.getElementById('modalBack');
    const cartBack = document.getElementById('cartBack');
    const checkoutBack = document.getElementById('checkoutBack');
    const favBack = document.getElementById('favoritesBack');
    const profileBack = document.getElementById('profileBack');
    
    if (modalBack) modalBack.addEventListener('click', closeProductModal);
    if (cartBack) cartBack.addEventListener('click', function() {
        document.getElementById('cartModal').classList.remove('active');
    });
    if (checkoutBack) checkoutBack.addEventListener('click', function() {
        document.getElementById('checkoutModal').classList.remove('active');
        document.getElementById('cartModal').classList.add('active');
    });
    if (favBack) favBack.addEventListener('click', function() {
        document.getElementById('favoritesModal').classList.remove('active');
    });
    if (profileBack) profileBack.addEventListener('click', function() {
        document.getElementById('profileModal').classList.remove('active');
    });
    
    // Modal favorite
    const modalFav = document.getElementById('modalFavorite');
    if (modalFav) {
        modalFav.addEventListener('click', function() {
            if (state.selectedProduct) {
                toggleFavorite(state.selectedProduct.id);
                this.classList.toggle('active');
                haptic('medium');
            }
        });
    }
    
    // Cart actions
    const addToCartBtn = document.getElementById('addToCartBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const submitOrderBtn = document.getElementById('submitOrder');
    
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
    if (submitOrderBtn) submitOrderBtn.addEventListener('click', submitOrder);
    
    // Header favorites
    const favHeaderBtn = document.getElementById('favoritesHeaderBtn');
    if (favHeaderBtn) favHeaderBtn.addEventListener('click', openFavoritesModal);
    
    // Delivery toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.deliveryType = this.dataset.delivery;
            updateDeliveryFields();
            haptic();
        });
    });
    
    // Mail service
    document.querySelectorAll('input[name="mailService"]').forEach(radio => {
        radio.addEventListener('change', function() {
            state.mailService = this.value;
            updateDeliveryFields();
        });
    });
    
    // Support
    const supportBtn = document.getElementById('supportBtn');
    if (supportBtn) {
        supportBtn.addEventListener('click', function() {
            if (tg) {
                tg.openTelegramLink('https://t.me/' + SUPPORT_USERNAME);
            } else {
                window.open('https://t.me/' + SUPPORT_USERNAME, '_blank');
            }
        });
    }
    
    // Bottom nav
    const navHome = document.getElementById('navHome');
    const navFav = document.getElementById('navFavorites');
    const navCart = document.getElementById('navCart');
    const navProfile = document.getElementById('navProfile');
    
    if (navHome) navHome.addEventListener('click', function() {
        closeAllModals();
        setActiveNav('home');
    });
    if (navFav) navFav.addEventListener('click', function() {
        openFavoritesModal();
        setActiveNav('favorites');
    });
    if (navCart) navCart.addEventListener('click', function() {
        openCartModal();
        setActiveNav('cart');
    });
    if (navProfile) navProfile.addEventListener('click', function() {
        openProfileModal();
        setActiveNav('profile');
    });
    
    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            closeAllModals();
            setActiveNav('home');
        });
    });
}

async function init() {
    console.log('🚀 Запуск...');
    
    loadCart();
    loadFavorites();
    loadCurrency();
    loadUserData();
    
    const success = await loadProducts();
    
    if (success) {
        renderSizeFilters();
        filterProducts();
    } else {
        const loading = document.getElementById('loading');
        const empty = document.getElementById('emptyState');
        if (loading) loading.classList.add('hidden');
        if (empty) empty.style.display = 'block';
    }
    
    initListeners();
    lucide.createIcons();
    
    console.log('✅ Готово!');
}

// Start
document.addEventListener('DOMContentLoaded', init);
