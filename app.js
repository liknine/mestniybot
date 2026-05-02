// ==================== TELEGRAM WEBAPP ====================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// ==================== CONFIG ====================
const SUPPORT_USERNAME = 'manager_of_mestniy';
console.log('MESTNIY build: fix_order_note_no_stock_14');

const BRANDS = {
    'a_bathing_ape': 'A Bathing Ape',
    'aape': 'Aape',
    'acne_studios': 'Acne Studios',
    'acronym': 'Acronym',
    'adidas': 'Adidas',
    'alpha_industries': 'Alpha Industries',
    'alyx': 'ALYX',
    'amiri': 'Amiri',
    'aquascutum': 'Aquascutum',
    'arcteryx': 'Arcteryx',
    'armani_exchange': 'Armani Exchange',
    'asics': 'ASICS',
    'balenciaga': 'Balenciaga',
    'barbour': 'Barbour',
    'berghaus': 'Berghaus',
    'bershka': 'Bershka',
    'billabong': 'Billabong',
    'burberry': 'Burberry',
    'calvin_klein': 'Calvin Klein',
    'carhartt': 'Carhartt',
    'champion': 'Champion',
    'columbia': 'Columbia',
    'comme_des_fuckdown': 'Comme des Fuckdown',
    'comme_des_garcons': 'Comme des Garçons',
    'cp_company': 'C.P. Company',
    'diesel': 'Diesel',
    'dobermans': 'Dobermans Aggressive',
    'doctor_martens': 'Doctor Martens',
    'eastpak': 'Eastpak',
    'ellesse': 'Ellesse',
    'fila': 'Fila',
    'fred_perry': 'Fred Perry',
    'fucking_awesome': 'Fucking Awesome',
    'gap': 'Gap',
    'ggl': 'GGL',
    'gosha': 'Гоша Рубчинский',
    'gucci': 'Gucci',
    'guess': 'Guess',
    'haglofs': 'Haglofs',
    'hardcore': 'Hardcore',
    'hermes': 'Hermes',
    'jordan': 'Jordan',
    'lacoste': 'Lacoste',
    'levis': "Levi's",
    'lonsdale': 'Lonsdale',
    'louis_vuitton': 'Louis Vuitton',
    'lyle_scott': 'Lyle & Scott',
    'maison_margiela': 'Maison Margiela',
    'mastrum': 'Ma.Strum',
    'mcm': 'MCM',
    'merrell': 'Merrell',
    'moncler': 'Moncler',
    'mowalola': 'Mowalola',
    'napapijri': 'NAPAPIJRI',
    'new_balance': 'New Balance',
    'nike': 'Nike',
    'no_name': 'No Name',
    'north_face': 'The North Face',
    'number_nine': 'Number Nine',
    'off_white': 'Off-White',
    'palace': 'Palace',
    'peaceful_hooligan': 'Peaceful Hooligan',
    'pitbull': 'Pitbull Germany',
    'polar': 'Polar',
    'polo_ralph_lauren': 'Polo Ralph Lauren',
    'prada': 'Prada',
    'puma': 'Puma',
    'raf_simons': 'Raf Simons',
    'reebok': 'Reebok',
    'rick_owens': "Rick Owen's",
    'sergio_tacchini': 'Sergio Tacchini',
    'stone_island': 'Stone Island',
    'stussy': 'Stussy',
    'supreme': 'Supreme',
    'thor_steinar': 'Thor Steinar',
    'timberland': 'Timberland',
    'tommy_hilfiger': 'Tommy Hilfiger',
    'trapstar': 'Trapstar',
    'true_religion': 'True Religion',
    'tupac': 'Tupac',
    'vetements': 'Vetements',
    'vivienne_westwood': 'Vivienne Westwood',
    'weekend_offender': 'WEEKEND OFFENDER',
    'yeezy': 'Yeezy',
    'zara': 'Zara'
};

const BRAND_ALIASES = {
    'stone_island': ['stone'],
    'cp_company': ['cp'],
    'raf_simons': ['raf'],
    'a_bathing_ape': ['bape', 'a'],
    'weekend_offender': ['weekend'],
    'off_white': ['off'],
    'new_balance': ['new'],
    'armani_exchange': ['armani'],
    'guess': ['guess']
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
    onesize: ['ONE SIZE','OS','UNI']
};

const state = {
    products: [],
    cart: [],
    favorites: [],
    currency: 'BYN',
    currentSection: 'stock',
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

async function loadProducts() {
    console.log('📦 Загрузка товаров...');
    try {
        const response = await fetch('products.json?v=' + Date.now());
        if (!response.ok) throw new Error('products.json status ' + response.status);
        state.products = await response.json();
        preloadProductImages(state.products);
        console.log('✅ Загружено:', state.products.length);
        return true;
    } catch (e) {
        console.log('❌ Ошибка загрузки products.json:', e.message);
        return false;
    }
}

function money(value, currency) {
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    value = Number(value || 0);
    if (currency === 'USD') return '$' + value.toFixed(2);
    return value.toFixed(2) + ' ' + symbols[currency];
}

function basePrice(product, currency) {
    if (product && product.prices && product.prices[currency] !== undefined) return Number(product.prices[currency]);
    return Number((product && product.price_byn) || 0) * (state.exchangeRates[currency] || 1);
}

function oldPrice(product, currency) {
    if (!product) return null;
    const oldPrices = product.old_prices || product.old_price || (product.prices && (product.prices.old_prices || product.prices.old_price));
    if (oldPrices && oldPrices[currency] !== undefined && Number(oldPrices[currency]) > basePrice(product, currency)) {
        return Number(oldPrices[currency]);
    }
    return null;
}

function hasDiscount(product, currency) {
    return oldPrice(product, currency || state.currency) !== null;
}

function formatPrice(priceByn, currency, product) {
    currency = currency || state.currency;
    product = product || { price_byn: priceByn };
    const current = basePrice(product, currency);
    const old = oldPrice(product, currency);
    if (old !== null) {
        return '<span class="old-price">' + money(old, currency) + '</span> <span class="price-arrow">→</span><br><span class="new-price">' + money(current, currency) + '</span>';
    }
    return money(current, currency);
}

function getProductType(product) {
    return (product && (product.product_type || product.section || (product.prices && product.prices.product_type))) || 'stock';
}

function getItemPrice(product, qty) {
    qty = qty || 1;
    return basePrice(product, state.currency) * qty;
}

function formatTotal(total) {
    return money(total, state.currency);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    if (toast && text) {
        text.textContent = msg;
        toast.classList.add('show');
        setTimeout(function() { toast.classList.remove('show'); }, 2000);
    } else {
        console.log('TOAST:', msg);
    }
}

function imageTag(src, alt, cls) {
    src = src || '';
    alt = alt || '';
    cls = cls || 'product-image';
    return '<img src="' + src + '" alt="' + escapeHtml(alt) + '" class="' + cls + '" loading="eager" decoding="async" onerror="retryImage(this)">';
}

function retryImage(img) {
    const retries = Number(img.dataset.retries || 0);
    if (retries >= 3) return;
    img.dataset.retries = String(retries + 1);
    const cleanSrc = img.src.split('?retry=')[0];
    setTimeout(function() {
        img.src = cleanSrc + '?retry=' + Date.now();
    }, 500 + retries * 700);
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) { console.log('Lucide icons error:', e); }
    }
}

function preloadProductImages(products) {
    (products || []).forEach(function(product) {
        (product.images || []).slice(0, 2).forEach(function(src) {
            if (!src) return;
            const img = new Image();
            img.src = src;
        });
    });
}

function haptic(type) {
    if (tg && tg.HapticFeedback) {
        try { tg.HapticFeedback.impactOccurred(type || 'light'); } catch (e) {}
    }
}

function getBrandName(key) {
    const aliases = { stone: 'Stone Island', cp: 'C.P. Company', raf: 'Raf Simons', bape: 'A Bathing Ape', a: 'A Bathing Ape', weekend: 'WEEKEND OFFENDER', off: 'Off-White', new: 'New Balance', armani: 'Armani Exchange' };
    return BRANDS[key] || aliases[key] || key || '';
}

function brandMatches(productBrand, selectedBrand) {
    if (selectedBrand === 'all') return true;
    const p = String(productBrand || '').toLowerCase();
    const b = String(selectedBrand || '').toLowerCase();
    if (p === b) return true;
    return (BRAND_ALIASES[b] || []).includes(p);
}

function normalizeSize(size) {
    return String(size || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function isOneSize(size) {
    return ['ONE SIZE', 'OS', 'UNI', 'UNISIZE'].includes(normalizeSize(size));
}

function sizeMatches(productSize, selectedSize) {
    const p = normalizeSize(productSize);
    const s = normalizeSize(selectedSize);
    if (!p || !s) return false;
    if (p === s) return true;
    if (isOneSize(p) && isOneSize(s)) return true;
    return p.split(/\s*[-–—/]\s*/).map(normalizeSize).includes(s);
}

function productHasSize(product, selectedSize) {
    if (selectedSize === 'all') return true;
    return product && product.sizes && product.sizes.some(function(size) {
        return sizeMatches(size, selectedSize);
    });
}

function getStockStatus(stock, product) {
    if (product && getProductType(product) === 'order') return { text: 'На заказ', class: 'order-stock' };
    if (Number(stock) === 0) return { text: 'Нет в наличии', class: 'out-of-stock' };
    if (Number(stock) <= 5) return { text: 'Осталось ' + stock + ' шт', class: 'low-stock' };
    return { text: 'В наличии', class: 'in-stock' };
}

function getMeasureText(product) {
    return 'Примечание: Стоимость доставки, сроки доставки и тому подобное - обсуждается лично при оформлении заказа!';
}

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
    if (profileAvatar && state.user.photoUrl) profileAvatar.innerHTML = '<img src="' + state.user.photoUrl + '" alt="Avatar">';
    updateProfileStats();
}

function updateProfileStats() {
    const cartCount = document.getElementById('profileCartCount');
    const favCount = document.getElementById('profileFavCount');
    if (cartCount) cartCount.textContent = state.cart.reduce(function(s, i) { return s + i.sizes.length; }, 0);
    if (favCount) favCount.textContent = state.favorites.length;
}

function setupSectionTabs() {
    if (document.getElementById('sectionTabs')) return;
    const filters = document.querySelector('.filters-wrapper');
    if (!filters) return;
    const tabs = document.createElement('div');
    tabs.className = 'section-tabs';
    tabs.id = 'sectionTabs';
    tabs.innerHTML = '<button class="section-tab active" data-section="stock">Наличие</button><button class="section-tab" data-section="order">На заказ</button>';
    filters.parentNode.insertBefore(tabs, filters);
    tabs.querySelectorAll('.section-tab').forEach(function(btn) {
        btn.addEventListener('click', function() {
            tabs.querySelectorAll('.section-tab').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            state.currentSection = this.dataset.section;
            updateOrderSectionNote();
            filterProducts();
            haptic('medium');
        });
    });
}

function setupOrderSectionNote() {
    if (document.getElementById('orderSectionNote')) return;
    const filters = document.querySelector('.filters-wrapper');
    if (!filters || !filters.parentNode) return;
    const note = document.createElement('div');
    note.id = 'orderSectionNote';
    note.className = 'order-section-note';
    note.textContent = 'Также доступен заказ с сайтов: gofish, vinted, mercari';
    filters.parentNode.insertBefore(note, filters.nextSibling);
}

function updateOrderSectionNote() {
    const note = document.getElementById('orderSectionNote');
    if (!note) return;
    note.style.display = state.currentSection === 'order' ? 'block' : 'none';
}

function renderSizeFilters() {
    const wrapper = document.getElementById('sizesFilterScroll');
    if (!wrapper) return;
    let sizes = [];
    if (state.currentCategory === 'all') {
        sizes = ['Все'].concat(SIZES.clothing);
    } else {
        const catId = parseInt(state.currentCategory);
        const cat = CATEGORIES[catId];
        if (cat) sizes = ['Все'].concat(SIZES[cat.sizeType]);
    }
    wrapper.innerHTML = sizes.map(function(size, i) {
        const value = i === 0 ? 'all' : size;
        const isActive = state.currentSize === value;
        return '<button class="size-filter-chip ' + (isActive ? 'active' : '') + '" data-size="' + value + '">' + size + '</button>';
    }).join('');
    wrapper.querySelectorAll('.size-filter-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            wrapper.querySelectorAll('.size-filter-chip').forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            state.currentSize = this.dataset.size;
            filterProducts();
            haptic();
        });
    });
}

function filterProducts() {
    let filtered = state.products.slice();
    filtered = filtered.filter(function(p) { return getProductType(p) === state.currentSection; });
    if (state.currentCategory !== 'all') filtered = filtered.filter(function(p) { return Number(p.category_id) === parseInt(state.currentCategory); });
    if (state.currentBrand !== 'all') filtered = filtered.filter(function(p) { return brandMatches(p.brand, state.currentBrand); });
    if (state.currentSize !== 'all') filtered = filtered.filter(function(p) { return productHasSize(p, state.currentSize); });
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(function(p) {
            return String(p.name || '').toLowerCase().includes(q) ||
                String(p.description || '').toLowerCase().includes(q) ||
                getBrandName(p.brand).toLowerCase().includes(q);
        });
    }
    renderProducts(filtered);
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('emptyState');
    if (loading) loading.classList.add('hidden');
    if (!products.length) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        refreshIcons();
        return;
    }
    if (empty) empty.style.display = 'none';
    if (!grid) return;

    grid.innerHTML = products.map(function(p) {
        const isFav = state.favorites.includes(Number(p.id));
        const status = getStockStatus(p.stock, p);
        const img = p.images && p.images[0] ? p.images[0] : '';
        return '<div class="product-card" data-id="' + p.id + '" role="button" tabindex="0">' +
            '<div class="product-image-container">' +
                imageTag(img, p.name, 'product-image') +
                (hasDiscount(p, state.currency) ? '<div class="discount-badge">SALE</div>' : '') +
                '<button class="product-favorite ' + (isFav ? 'active' : '') + '" data-id="' + p.id + '">' +
                    '<i data-lucide="heart"></i>' +
                '</button>' +
            '</div>' +
            '<div class="product-details">' +
                '<h3 class="product-name">' + escapeHtml(p.name) + '</h3>' +
                '<p class="product-price">' + formatPrice(p.price_byn, state.currency, p) + '</p>' +
                (getProductType(p) === 'order' ? '' : '<span class="product-status ' + status.class + '">' + status.text + '</span>') +
            '</div>' +
        '</div>';
    }).join('');
    attachProductListeners();
    refreshIcons();
}

function openProductByCardId(productId) {
    productId = parseInt(productId);
    if (isNaN(productId)) return;
    const product = state.products.find(function(p) { return parseInt(p.id) === productId; });
    if (!product) return;
    haptic();
    openProductModal(product);
}
window.openProductByCardId = openProductByCardId;

function handleFavoriteClick(btn, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const id = parseInt(btn.dataset.id);
    if (isNaN(id)) return;
    toggleFavorite(id);
    btn.classList.toggle('active');
    haptic('medium');
}

function attachProductListeners() {
    document.querySelectorAll('.product-card').forEach(function(card) {
        if (card.dataset.cardClickReady === '1') return;
        card.dataset.cardClickReady = '1';
        card.addEventListener('click', function(e) {
            if (e.target.closest('.product-favorite')) return;
            openProductByCardId(card.dataset.id);
        });
    });
    document.querySelectorAll('.product-favorite').forEach(function(btn) {
        if (btn.dataset.favoriteClickReady === '1') return;
        btn.dataset.favoriteClickReady = '1';
        btn.addEventListener('click', function(e) { handleFavoriteClick(btn, e); });
    });
}

function setupProductCardDelegation() {
    if (window.__mestniyProductCardDelegationReady) return;
    window.__mestniyProductCardDelegationReady = true;
    document.addEventListener('click', function(e) {
        const fav = e.target.closest('.product-favorite');
        if (fav) {
            if (fav.dataset.favoriteClickReady !== '1') handleFavoriteClick(fav, e);
            return;
        }
        const card = e.target.closest('.product-card');
        if (!card) return;
        if (card.dataset.cardClickReady !== '1') openProductByCardId(card.dataset.id);
    }, true);
}

function renderRelatedProducts(product) {
    const section = document.getElementById('relatedSection');
    const grid = document.getElementById('relatedGrid');
    if (!section || !grid) return;
    let related = state.products.filter(function(p) {
        if (Number(p.id) === Number(product.id)) return false;
        if (!p.sizes || !product.sizes) return false;
        return p.sizes.some(function(s) { return product.sizes.some(function(ps) { return sizeMatches(s, ps); }); });
    });
    if (related.length === 0) related = state.products.filter(function(p) { return Number(p.id) !== Number(product.id) && Number(p.category_id) === Number(product.category_id); });
    related = related.slice(0, 4);
    if (related.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    grid.innerHTML = related.map(function(p) {
        const isFav = state.favorites.includes(Number(p.id));
        const status = getStockStatus(p.stock, p);
        const img = p.images && p.images[0] ? p.images[0] : '';
        return '<div class="product-card related-card" data-id="' + p.id + '" role="button" tabindex="0">' +
            '<div class="product-image-container">' +
                imageTag(img, p.name, 'product-image') +
                (hasDiscount(p, state.currency) ? '<div class="discount-badge">SALE</div>' : '') +
                '<button class="product-favorite ' + (isFav ? 'active' : '') + '" data-id="' + p.id + '">' +
                    '<i data-lucide="heart"></i>' +
                '</button>' +
            '</div>' +
            '<div class="product-details">' +
                '<h3 class="product-name">' + escapeHtml(p.name) + '</h3>' +
                '<p class="product-price">' + formatPrice(p.price_byn, state.currency, p) + '</p>' +
                (getProductType(p) === 'order' ? '' : '<span class="product-status ' + status.class + '">' + status.text + '</span>') +
            '</div>' +
        '</div>';
    }).join('');
    attachProductListeners();
    refreshIcons();
}

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
        refreshIcons();
        return;
    }
    if (empty) empty.style.display = 'none';
    if (footer) footer.style.display = 'block';
    let sum = 0;
    if (items) {
        items.innerHTML = state.cart.map(function(item) {
            const p = state.products.find(function(x) { return Number(x.id) === Number(item.productId); });
            if (!p) return '';
            const itemSum = getItemPrice(p, item.sizes.length);
            sum += itemSum;
            const img = p.images && p.images[0] ? p.images[0] : '';
            return '<div class="cart-item" data-id="' + item.productId + '">' +
                imageTag(img, p.name, 'cart-item-image') +
                '<div class="cart-item-info">' +
                    '<h4 class="cart-item-name">' + escapeHtml(p.name) + '</h4>' +
                    '<p class="cart-item-sizes">Размеры: ' + item.sizes.join(', ') + '</p>' +
                    '<div class="cart-item-bottom">' +
                        '<span class="cart-item-price">' + formatTotal(itemSum) + '</span>' +
                        '<button class="cart-item-delete" data-id="' + item.productId + '"><i data-lucide="trash-2"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
        refreshIcons();
        attachCartListeners();
    }
    if (subtotal) subtotal.textContent = formatTotal(sum);
    if (total) total.textContent = formatTotal(sum);
    if (checkout) checkout.textContent = formatTotal(sum);
    updateCartBadge();
}

function attachCartListeners() {
    document.querySelectorAll('.cart-item-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { removeFromCart(parseInt(this.dataset.id)); });
    });
}

function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');
    const favProducts = state.products.filter(function(p) { return state.favorites.includes(Number(p.id)); });
    if (!favProducts.length) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        refreshIcons();
        return;
    }
    if (empty) empty.style.display = 'none';
    if (grid) {
        grid.innerHTML = favProducts.map(function(p) {
            const status = getStockStatus(p.stock, p);
            const img = p.images && p.images[0] ? p.images[0] : '';
            return '<div class="product-card" data-id="' + p.id + '" role="button" tabindex="0">' +
                '<div class="product-image-container">' +
                    imageTag(img, p.name, 'product-image') +
                    (hasDiscount(p, state.currency) ? '<div class="discount-badge">SALE</div>' : '') +
                    '<button class="product-favorite active" data-id="' + p.id + '"><i data-lucide="heart"></i></button>' +
                '</div>' +
                '<div class="product-details">' +
                    '<h3 class="product-name">' + escapeHtml(p.name) + '</h3>' +
                    '<p class="product-price">' + formatPrice(p.price_byn, state.currency, p) + '</p>' +
                    (getProductType(p) === 'order' ? '' : '<span class="product-status ' + status.class + '">' + status.text + '</span>') +
                '</div>' +
            '</div>';
        }).join('');
        attachProductListeners();
        refreshIcons();
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = state.cart.reduce(function(s, i) { return s + i.sizes.length; }, 0);
    if (badge) {
        badge.textContent = count;
        badge.dataset.count = count;
    }
    updateProfileStats();
}

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

    if (track && product.images) {
        track.innerHTML = product.images.map(function(img) { return imageTag(img, product.name, 'gallery-image'); }).join('');
        const gallery = document.querySelector('.gallery');
        if (gallery) {
            const old = gallery.querySelector('.modal-discount');
            if (old) old.remove();
            if (hasDiscount(product, state.currency)) gallery.insertAdjacentHTML('beforeend', '<div class="discount-badge modal-discount">SALE</div>');
        }
        track.onscroll = function() {
            const index = Math.round(this.scrollLeft / this.offsetWidth);
            document.querySelectorAll('.gallery-dot').forEach(function(dot, i) { dot.classList.toggle('active', i === index); });
        };
    }
    if (dots && product.images) dots.innerHTML = product.images.map(function(_, i) { return '<div class="gallery-dot ' + (i === 0 ? 'active' : '') + '"></div>'; }).join('');
    if (title) title.textContent = product.name;
    if (brand) brand.textContent = getBrandName(product.brand);
    if (price) price.innerHTML = formatPrice(product.price_byn, state.currency, product);
    const stockStatus = getStockStatus(product.stock, product);
    if (stock) {
        if (getProductType(product) === 'order') {
            stock.textContent = '';
            stock.className = 'product-stock hidden-stock';
        } else {
            stock.textContent = stockStatus.text;
            stock.className = 'product-stock ' + stockStatus.class;
        }
    }
    if (grid && product.sizes) {
        grid.innerHTML = product.sizes.map(function(size) {
            return '<button class="size-chip" data-size="' + escapeHtml(size) + '" ' + (Number(product.stock) === 0 ? 'disabled' : '') + '>' + escapeHtml(size) + '</button>';
        }).join('');
        grid.querySelectorAll('.size-chip').forEach(function(chip) {
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
        let warning = document.getElementById('sizeWarning');
        if (!warning && grid.parentNode) {
            warning = document.createElement('div');
            warning.id = 'sizeWarning';
            warning.className = 'size-warning';
            warning.textContent = '* выберите размер';
            grid.parentNode.insertBefore(warning, grid);
        }
        if (warning) warning.classList.remove('active', 'blink');
        if (product.sizes.length === 1 && Number(product.stock) !== 0) {
            state.selectedSizes = [product.sizes[0]];
            const onlyChip = grid.querySelector('.size-chip');
            if (onlyChip) onlyChip.classList.add('selected');
        }
    }
    if (desc) desc.textContent = [product.description || '', getMeasureText(product)].filter(Boolean).join('\n\n');
    if (fav) fav.classList.toggle('active', state.favorites.includes(Number(product.id)));
    const scrollContent = document.querySelector('.product-scroll-content');
    if (scrollContent) scrollContent.scrollTop = 0;
    updateAddToCartBtn();
    if (modal) modal.classList.add('active');
    try { renderRelatedProducts(product); } catch (e) { console.log('Related render error:', e); }
    refreshIcons();
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
    btn.disabled = Number(state.selectedProduct.stock) === 0;
    const warning = document.getElementById('sizeWarning');
    if (warning) warning.classList.toggle('active', state.selectedProduct.sizes && state.selectedProduct.sizes.length > 1 && !state.selectedSizes.length);
    const total = getItemPrice(state.selectedProduct, Math.max(state.selectedSizes.length, 1));
    if (price) price.textContent = formatTotal(total);
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
    refreshIcons();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(function(m) { m.classList.remove('active'); });
}

function openManagerWithText(text) {
    const encodedText = encodeURIComponent(text);
    const tgLink = 'https://t.me/' + SUPPORT_USERNAME + '?text=' + encodedText;
    if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.openTelegramLink(tgLink);
    else window.open(tgLink, '_blank');
}

function openManagerForProduct(product, sizes) {
    sizes = sizes || [];
    let text = 'Привет! Хочу оформить заказ, вот эта позиция меня заинтересовала!🛒';
    text += '\n\n📦 ' + product.name;
    text += '\n🏷 Бренд: ' + getBrandName(product.brand);
    if (sizes.length) text += '\n📏 Размер: ' + sizes.join(', ');
    text += '\n💰 Цена: ' + money(basePrice(product, state.currency), state.currency);
    text += '\n\nФотографии товара:';
    (product.images || []).forEach(function(img) { text += '\n' + img; });
    openManagerWithText(text);
}

function openManagerForCart() {
    if (!state.cart.length) {
        showToast('Корзина пуста');
        return;
    }
    let total = 0;
    let text = 'Привет! Хочу оформить заказ, вот эти позиции меня заинтересовали!🛒\n';
    state.cart.forEach(function(cartItem) {
        const product = state.products.find(function(p) { return Number(p.id) === Number(cartItem.productId); });
        if (!product) return;
        const itemTotal = getItemPrice(product, cartItem.sizes.length);
        total += itemTotal;
        text += '\n📦 ' + product.name;
        text += '\n📏 Размеры: ' + cartItem.sizes.join(', ');
        text += '\n💰 Цена: ' + formatTotal(itemTotal);
        if (product.images && product.images[0]) text += '\nФото: ' + product.images[0];
        text += '\n';
    });
    text += '\nИтого: ' + formatTotal(total);
    openManagerWithText(text);
}

function addToCart() {
    if (!state.selectedProduct) return;

    if (state.selectedProduct.sizes && state.selectedProduct.sizes.length === 1 && !state.selectedSizes.length) {
        state.selectedSizes = [state.selectedProduct.sizes[0]];
    }

    if (!state.selectedSizes.length) {
        const warning = document.getElementById('sizeWarning');
        if (warning) {
            warning.classList.add('active', 'blink');
            setTimeout(function() { warning.classList.remove('blink'); }, 1600);
        }
        showToast('Выберите размер');
        return;
    }

    const productId = Number(state.selectedProduct.id);
    let existing = state.cart.find(function(item) {
        return Number(item.productId) === productId;
    });

    if (!existing) {
        existing = { productId: productId, sizes: [] };
        state.cart.push(existing);
    }

    state.selectedSizes.forEach(function(size) {
        existing.sizes.push(size);
    });

    saveCart();
    renderCart();
    updateProfileStats();
    showToast('Добавлено в корзину');
    haptic('medium');
    closeProductModal();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(function(i) { return Number(i.productId) !== Number(productId); });
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
            state.cart = state.cart.map(function(item) {
                if (item.size && !item.sizes) return { productId: item.productId, sizes: [item.size] };
                return item;
            });
            updateCartBadge();
        }
    } catch (e) {
        console.log('Cart error:', e);
    }
}

function toggleFavorite(productId) {
    productId = Number(productId);
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
        if (saved) state.favorites = JSON.parse(saved).map(Number);
    } catch (e) {
        console.log('Favorites error:', e);
    }
}

function setCurrency(currency) {
    state.currency = currency;
    localStorage.setItem('currency', currency);
    document.querySelectorAll('.currency-btn-small').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.currency === currency); });
    filterProducts();
    if (state.selectedProduct) {
        const price = document.getElementById('productPriceMain');
        if (price) price.innerHTML = formatPrice(state.selectedProduct.price_byn, currency, state.selectedProduct);
        updateAddToCartBtn();
    }
    renderCart();
    haptic();
}

function loadCurrency() {
    const saved = localStorage.getItem('currency');
    if (saved && ['BYN', 'RUB', 'USD'].includes(saved)) {
        state.currency = saved;
        document.querySelectorAll('.currency-btn-small').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.currency === saved); });
    }
}

function submitOrder() {
    openManagerForCart();
}

function setupDropdowns() {
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
        catMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                catMenu.querySelectorAll('.dropdown-item').forEach(function(i) { i.classList.remove('active'); });
                this.classList.add('active');
                state.currentCategory = this.dataset.id;
                if (catLabel) catLabel.textContent = this.dataset.id === 'all' ? 'Категория' : this.textContent.trim();
                catTrigger.classList.toggle('has-value', this.dataset.id !== 'all');
                catWrapper.classList.remove('open');
                state.currentSize = 'all';
                renderSizeFilters();
                filterProducts();
                haptic();
            });
        });
    }
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
        brandMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                brandMenu.querySelectorAll('.dropdown-item').forEach(function(i) { i.classList.remove('active'); });
                this.classList.add('active');
                state.currentBrand = this.dataset.id;
                if (brandLabel) brandLabel.textContent = this.dataset.id === 'all' ? 'Бренд' : this.textContent.trim();
                brandTrigger.classList.toggle('has-value', this.dataset.id !== 'all');
                brandWrapper.classList.remove('open');
                filterProducts();
                haptic();
            });
        });
    }
    document.addEventListener('click', closeAllDropdowns);
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(function(d) { d.classList.remove('open'); });
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.page === page); });
}

function initListeners() {
    document.querySelectorAll('.currency-btn-small').forEach(function(btn) { btn.addEventListener('click', function() { setCurrency(this.dataset.currency); }); });
    const search = document.getElementById('searchInput');
    if (search) search.addEventListener('input', function() { state.searchQuery = this.value; filterProducts(); });
    setupDropdowns();
    setupProductCardDelegation();

    const modalBack = document.getElementById('modalBack');
    const cartBack = document.getElementById('cartBack');
    const checkoutBack = document.getElementById('checkoutBack');
    const favBack = document.getElementById('favoritesBack');
    const profileBack = document.getElementById('profileBack');

    if (modalBack) modalBack.addEventListener('click', closeProductModal);
    if (cartBack) cartBack.addEventListener('click', function() { const modal = document.getElementById('cartModal'); if (modal) modal.classList.remove('active'); });
    if (checkoutBack) checkoutBack.addEventListener('click', function() { const checkout = document.getElementById('checkoutModal'); const cart = document.getElementById('cartModal'); if (checkout) checkout.classList.remove('active'); if (cart) cart.classList.add('active'); });
    if (favBack) favBack.addEventListener('click', function() { const modal = document.getElementById('favoritesModal'); if (modal) modal.classList.remove('active'); });
    if (profileBack) profileBack.addEventListener('click', function() { const modal = document.getElementById('profileModal'); if (modal) modal.classList.remove('active'); });

    const modalFav = document.getElementById('modalFavorite');
    if (modalFav) modalFav.addEventListener('click', function() { if (!state.selectedProduct) return; toggleFavorite(Number(state.selectedProduct.id)); this.classList.toggle('active'); haptic('medium'); });

    const addToCartBtn = document.getElementById('addToCartBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const submitOrderBtn = document.getElementById('submitOrder');
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openManagerForCart);
    if (submitOrderBtn) submitOrderBtn.addEventListener('click', submitOrder);

    const favHeaderBtn = document.getElementById('favoritesHeaderBtn');
    if (favHeaderBtn) favHeaderBtn.addEventListener('click', openFavoritesModal);

    document.querySelectorAll('.toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.toggle-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            state.deliveryType = this.dataset.delivery;
            haptic();
        });
    });

    document.querySelectorAll('input[name="mailService"]').forEach(function(radio) {
        radio.addEventListener('change', function() { state.mailService = this.value; });
    });

    const supportBtn = document.getElementById('supportBtn');
    if (supportBtn) supportBtn.addEventListener('click', function() {
        if (tg) tg.openTelegramLink('https://t.me/' + SUPPORT_USERNAME);
        else window.open('https://t.me/' + SUPPORT_USERNAME, '_blank');
    });

    const navHome = document.getElementById('navHome');
    const navFav = document.getElementById('navFavorites');
    const navCart = document.getElementById('navCart');
    const navProfile = document.getElementById('navProfile');
    if (navHome) navHome.addEventListener('click', function() { closeAllModals(); setActiveNav('home'); });
    if (navFav) navFav.addEventListener('click', function() { openFavoritesModal(); setActiveNav('favorites'); });
    if (navCart) navCart.addEventListener('click', function() { openCartModal(); setActiveNav('cart'); });
    if (navProfile) navProfile.addEventListener('click', function() { openProfileModal(); setActiveNav('profile'); });

    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
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
    setupSectionTabs();
    setupOrderSectionNote();
    updateOrderSectionNote();
    setupProductCardDelegation();
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
    refreshIcons();
    console.log('✅ Готово!');
}

document.addEventListener('DOMContentLoaded', init);

