// ==================== TELEGRAM WEBAPP ====================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// ==================== CONFIG ====================
const SUPPORT_USERNAME = 'manager_of_mestniy';

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

// ==================== STATE ====================
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

// ==================== LOAD PRODUCTS ====================
async function loadProducts() {
    console.log('📦 Загрузка товаров...');
    try {
        const response = await fetch('products.json?v=' + Date.now());
        if (response.ok) {
            state.products = await response.json();
            preloadProductImages(state.products);
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
function money(value, currency) {
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    value = Number(value || 0);
    if (currency === 'USD') return '$' + value.toFixed(2);
    return value.toFixed(2) + ' ' + symbols[currency];
}

function basePrice(product, currency) {
    if (product && product.prices && product.prices[currency] !== undefined) return Number(product.prices[currency]);
    return Number(product.price_byn || 0) * (state.exchangeRates[currency] || 1);
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

function getProductTypeLabel(product) {
    return getProductType(product) === 'order' ? 'На заказ' : 'Наличие';
}

function getItemPrice(product, qty) {
    qty = qty || 1;
    return basePrice(product, state.currency) * qty;
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


function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
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
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type || 'light');
}

function getBrandName(key) {
    const aliases = { stone: 'Stone Island', cp: 'C.P. Company', raf: 'Raf Simons', bape: 'A Bathing Ape', a: 'A Bathing Ape', weekend: 'WEEKEND OFFENDER', off: 'Off-White', new: 'New Balance', armani: 'Armani Exchange' };
    return BRANDS[key] || aliases[key] || key || '';
}


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
    const name = state.user.lastName
        ? state.user.firstName + ' ' + state.user.lastName
        : state.user.firstName;

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
            filterProducts();
            haptic('medium');
        });
    });
}

// ==================== SIZE FILTER CHIPS ====================
function renderSizeFilters() {
    const wrapper = document.getElementById('sizesFilterScroll');
    if (!wrapper) return;

    let sizes = [];

    if (state.currentCategory === 'all') {
        sizes = ['Все', ...SIZES.clothing];
    } else {
        const catId = parseInt(state.currentCategory);
        const cat = CATEGORIES[catId];
        if (cat) {
            sizes = ['Все', ...SIZES[cat.sizeType]];
        }
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

// ==================== FILTERS ====================
function filterProducts() {
    let filtered = state.products.slice();

    filtered = filtered.filter(function(p) { return getProductType(p) === state.currentSection; });

    if (state.currentCategory !== 'all') {
        filtered = filtered.filter(function(p) { return p.category_id === parseInt(state.currentCategory); });
    }

    if (state.currentBrand !== 'all') {
        filtered = filtered.filter(function(p) { return brandMatches(p.brand, state.currentBrand); });
    }

    if (state.currentSize !== 'all') {
        filtered = filtered.filter(function(p) { return productHasSize(p, state.currentSize); });
    }

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(function(p) {
            return p.name.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q)) ||
                (p.brand && getBrandName(p.brand).toLowerCase().includes(q));
        });
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
        grid.innerHTML = products.map(function(p) {
            const isFav = state.favorites.includes(p.id);
            const status = getStockStatus(p.stock, p);
            const img = p.images && p.images[0] ? p.images[0] : '';

            return '<div class="product-card" data-id="' + p.id + '">' +
                '<div class="product-image-container">' +
                    imageTag(img, p.name, 'product-image') +
                    (hasDiscount(p, state.currency) ? '<div class="discount-badge">SALE</div>' : '') +
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
    // Клики по карточкам обрабатываются единым делегированным обработчиком.
}


let productCardDelegationReady = false;
let lastProductCardTap = 0;

function setupProductCardDelegation() {
    if (productCardDelegationReady) return;
    productCardDelegationReady = true;

    function handleProductCardAction(e) {
        const favoriteBtn = e.target.closest('.product-favorite');
        if (favoriteBtn) {
            e.preventDefault();
            e.stopPropagation();

            const id = parseInt(favoriteBtn.dataset.id);
            if (!isNaN(id)) {
                toggleFavorite(id);
                favoriteBtn.classList.toggle('active');
                haptic('medium');
            }
            return;
        }

        const card = e.target.closest('.product-card');
        if (!card) return;

        if (e.type === 'click' && Date.now() - lastProductCardTap < 350) return;
        lastProductCardTap = Date.now();

        if (e.cancelable) e.preventDefault();

        const productId = parseInt(card.dataset.id);
        const product = state.products.find(function(p) { return p.id === productId; });
        if (!product) return;

        haptic();
        openProductModal(product);
    }

    document.addEventListener('click', handleProductCardAction);
    document.addEventListener('touchend', handleProductCardAction, { passive: false });
}

// ==================== RELATED PRODUCTS ====================
function renderRelatedProducts(product) {
    const section = document.getElementById('relatedSection');
    const grid = document.getElementById('relatedGrid');

    if (!section || !grid) return;

    // Сначала ищем товары того же размера
    let related = state.products.filter(function(p) {
        if (p.id === product.id) return false;
        if (!p.sizes || !product.sizes) return false;
        return p.sizes.some(function(s) { return product.sizes.includes(s); });
    });

    // Если нет — берём той же категории
    if (related.length === 0) {
        related = state.products.filter(function(p) {
            if (p.id === product.id) return false;
            return p.category_id === product.category_id;
        });
    }

    // Максимум 4 товара
    related = related.slice(0, 4);

    // Если совсем пусто — скрываем
    if (related.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    grid.innerHTML = related.map(function(p) {
        const isFav = state.favorites.includes(p.id);
        const status = getStockStatus(p.stock, p);
        const img = p.images && p.images[0] ? p.images[0] : '';

        return '<div class="product-card related-card" data-id="' + p.id + '">' +
            '<div class="product-image-container">' +
                imageTag(img, p.name, 'product-image') +
                (hasDiscount(p, state.currency) ? '<div class="discount-badge">SALE</div>' : '') +
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

    // Listeners для related карточек
    grid.querySelectorAll('.related-card').forEach(function(card) {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            if (e.target.closest('.product-favorite')) return;
            const p = state.products.find(function(x) { return x.id === parseInt(card.dataset.id); });
            if (p) {
                haptic();
                // Скролл вверх и открываем новый товар
                const scrollContent = document.querySelector('.product-scroll-content');
                if (scrollContent) scrollContent.scrollTop = 0;
                openProductModal(p);
            }
        });
    });

    grid.querySelectorAll('.product-favorite').forEach(function(btn) {
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
        items.innerHTML = state.cart.map(function(item) {
            const p = state.products.find(function(x) { return x.id === item.productId; });
            if (!p) return '';

            const itemSum = getItemPrice(p, item.sizes.length);
            sum += itemSum;
            const img = p.images && p.images[0] ? p.images[0] : '';

            return '<div class="cart-item" data-id="' + item.productId + '">' +
                imageTag(img, p.name, 'cart-item-image') +
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
    document.querySelectorAll('.cart-item-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeFromCart(parseInt(this.dataset.id));
        });
    });
}

function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');

    const favProducts = state.products.filter(function(p) { return state.favorites.includes(p.id); });

    if (!favProducts.length) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        lucide.createIcons();
        return;
    }

    if (empty) empty.style.display = 'none';

    if (grid) {
        grid.innerHTML = favProducts.map(function(p) {
            const status = getStockStatus(p.stock, p);
            const img = p.images && p.images[0] ? p.images[0] : '';

            return '<div class="product-card" data-id="' + p.id + '">' +
                '<div class="product-image-container">' +
                    imageTag(img, p.name, 'product-image') +
                    (hasDiscount(p, state.currency) ? '<div class="discount-badge">SALE</div>' : '') +
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

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = state.cart.reduce(function(s, i) { return s + i.sizes.length; }, 0);
    if (badge) {
        badge.textContent = count;
        badge.dataset.count = count;
    }
    updateProfileStats();
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
        track.innerHTML = product.images.map(function(img) {
            return imageTag(img, product.name, 'gallery-image');
        }).join('');

        const gallery = document.querySelector('.gallery');
        if (gallery) {
            const old = gallery.querySelector('.modal-discount');
            if (old) old.remove();
            if (hasDiscount(product, state.currency)) gallery.insertAdjacentHTML('beforeend', '<div class="discount-badge modal-discount">SALE</div>');
        }

        track.onscroll = function() {
            const index = Math.round(this.scrollLeft / this.offsetWidth);
            document.querySelectorAll('.gallery-dot').forEach(function(dot, i) {
                dot.classList.toggle('active', i === index);
            });
        };
    }

    if (dots && product.images) {
        dots.innerHTML = product.images.map(function(_, i) {
            return '<div class="gallery-dot ' + (i === 0 ? 'active' : '') + '"></div>';
        }).join('');
    }

    if (title) title.textContent = product.name;
    if (brand) brand.textContent = getBrandName(product.brand);
    if (price) price.innerHTML = formatPrice(product.price_byn, state.currency, product);

    const stockStatus = getStockStatus(product.stock, product);
    if (stock) {
        stock.textContent = stockStatus.text;
        stock.className = 'product-stock ' + stockStatus.class;
    }

    // Sizes
    if (grid && product.sizes) {
        grid.innerHTML = product.sizes.map(function(size) {
            return '<button class="size-chip" data-size="' + size + '" ' +
                (product.stock === 0 ? 'disabled' : '') + '>' + size + '</button>';
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
    }


        let warning = document.getElementById('sizeWarning');
        if (!warning && grid.parentNode) {
            warning = document.createElement('div');
            warning.id = 'sizeWarning';
            warning.className = 'size-warning';
            warning.textContent = '* выберите размер';
            grid.parentNode.insertBefore(warning, grid);
        }
        if (warning) warning.classList.remove('active', 'blink');

        if (product.sizes.length === 1 && product.stock !== 0) {
            state.selectedSizes = [product.sizes[0]];
            const onlyChip = grid.querySelector('.size-chip');
            if (onlyChip) onlyChip.classList.add('selected');
        }

    if (desc) desc.textContent = [product.description || '', getMeasureText(product)].filter(Boolean).join('\n\n');
    if (fav) fav.classList.toggle('active', state.favorites.includes(product.id));

    // Scroll to top
    const scrollContent = document.querySelector('.product-scroll-content');
    if (scrollContent) scrollContent.scrollTop = 0;

    updateAddToCartBtn();

    // Рендерим "Смотрите также"
    renderRelatedProducts(product);

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
    btn.disabled = state.selectedProduct.stock === 0;
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
    document.querySelectorAll('.modal').forEach(function(m) { m.classList.remove('active'); });
}

function resetCheckoutForm() {
    document.querySelectorAll('.toggle-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.delivery === 'pickup');
    });
    state.deliveryType = 'pickup';
    state.mailService = 'europochta';

    var mail = document.getElementById('mailOptions');
    var euro = document.getElementById('europochtaFields');
    var bel = document.getElementById('belpochtaFields');
    var cdek = document.getElementById('cdekFields');

    if (mail) mail.classList.remove('active');
    if (euro) euro.classList.remove('active');
    if (bel) bel.classList.remove('active');
    if (cdek) cdek.classList.remove('active');

    var euroRadio = document.querySelector('input[name="mailService"][value="europochta"]');
    if (euroRadio) euroRadio.checked = true;
}

function updateDeliveryFields() {
    var mail = document.getElementById('mailOptions');
    var euro = document.getElementById('europochtaFields');
    var bel = document.getElementById('belpochtaFields');
    var cdek = document.getElementById('cdekFields');

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


function openManagerWithText(text) {
    const encodedText = encodeURIComponent(text);
    const tgLink = 'https://t.me/' + SUPPORT_USERNAME + '?text=' + encodedText;
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openTelegramLink(tgLink);
    } else {
        window.open(tgLink, '_blank');
    }
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
        const product = state.products.find(function(p) { return p.id === cartItem.productId; });
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

// ==================== CART ACTIONS ====================
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
    openManagerForProduct(state.selectedProduct, state.selectedSizes.slice());
    closeProductModal();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(function(i) { return i.productId !== productId; });
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
                if (item.size && !item.sizes) {
                    return { productId: item.productId, sizes: [item.size] };
                }
                return item;
            });
            updateCartBadge();
        }
    } catch (e) {
        console.log('Cart error:', e);
    }
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
        console.log('Favorites error:', e);
    }
}

// ==================== CURRENCY ====================
function setCurrency(currency) {
    state.currency = currency;
    localStorage.setItem('currency', currency);

    document.querySelectorAll('.currency-btn-small').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.currency === currency);
    });

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
        document.querySelectorAll('.currency-btn-small').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.currency === saved);
        });
    }
}

// ==================== ORDER ====================
function submitOrder() {
    const lastName = document.getElementById('customerLastName').value.trim();
    const firstName = document.getElementById('customerFirstName').value.trim();
    const middleName = document.getElementById('customerMiddleName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const comment = document.getElementById('comment').value.trim();

    if (!lastName || !firstName || !phone) {
        showToast('Заполните обязательные поля');
        return;
    }

    if (state.deliveryType === 'mail') {
        if (state.mailService === 'europochta') {
            if (!document.getElementById('europochtaBranch').value.trim()) {
                showToast('Укажите номер отделения');
                return;
            }
        } else if (state.mailService === 'belpochta') {
            const idx = document.getElementById('belpochtaIndex').value.trim();
            const city = document.getElementById('belpochtaCity').value.trim();
            const addr = document.getElementById('belpochtaAddress').value.trim();
            if (!idx || !city || !addr) {
                showToast('Заполните адрес доставки');
                return;
            }
        } else if (state.mailService === 'cdek') {
            const country = document.getElementById('cdekCountry').value.trim();
            const city = document.getElementById('cdekCity').value.trim();
            const pvz = document.getElementById('cdekPvz').value.trim();
            if (!country || !city || !pvz) {
                showToast('Заполните данные CDEK');
                return;
            }
        }
    }

    let total = 0;
    let itemsText = '';
    let itemsImages = [];

    for (var i = 0; i < state.cart.length; i++) {
        const cartItem = state.cart[i];
        const product = state.products.find(function(p) { return p.id === cartItem.productId; });
        if (product) {
            const price = getItemPrice(product, cartItem.sizes.length);
            total += price;
            itemsText += '\n📦 ' + product.name;
            itemsText += '\n   Размеры: ' + cartItem.sizes.join(', ');
            itemsText += '\n   Цена: ' + formatTotal(price);
            if (product.images && product.images[0]) {
                itemsImages.push(product.images[0]);
            }
        }
    }

    let orderText = '🛒 НОВЫЙ ЗАКАЗ\n';
    orderText += '━━━━━━━━━━━━━━━\n';
    orderText += '\n👤 Клиент: ' + lastName + ' ' + firstName;
    if (middleName) orderText += ' ' + middleName;
    orderText += '\n📞 Телефон: ' + phone;
    orderText += '\n\n🚚 Доставка: ';

    if (state.deliveryType === 'pickup') {
        orderText += 'Самовывоз';
    } else {
        if (state.mailService === 'europochta') {
            orderText += 'Европочта, отделение ' + document.getElementById('europochtaBranch').value.trim();
        } else if (state.mailService === 'belpochta') {
            orderText += 'Белпочта\n';
            orderText += '   Индекс: ' + document.getElementById('belpochtaIndex').value.trim() + '\n';
            orderText += '   Город: ' + document.getElementById('belpochtaCity').value.trim() + '\n';
            orderText += '   Адрес: ' + document.getElementById('belpochtaAddress').value.trim();
        } else if (state.mailService === 'cdek') {
            orderText += 'CDEK\n';
            orderText += '   Страна: ' + document.getElementById('cdekCountry').value.trim() + '\n';
            orderText += '   Город: ' + document.getElementById('cdekCity').value.trim() + '\n';
            orderText += '   ПВЗ: ' + document.getElementById('cdekPvz').value.trim();
        }
    }

    orderText += '\n\n📋 ТОВАРЫ:';
    orderText += itemsText;
    orderText += '\n\n━━━━━━━━━━━━━━━';
    orderText += '\n💰 ИТОГО: ' + formatTotal(total);

    if (comment) {
        orderText += '\n\n💬 Комментарий: ' + comment;
    }

    if (itemsImages.length > 0) {
        orderText += '\n\n🖼 Фото товаров:';
        for (var j = 0; j < itemsImages.length; j++) {
            orderText += '\n' + itemsImages[j];
        }
    }

    const encodedText = encodeURIComponent(orderText);
    const tgLink = 'https://t.me/' + SUPPORT_USERNAME + '?text=' + encodedText;

    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openTelegramLink(tgLink);
    } else {
        window.open(tgLink, '_blank');
    }

    clearCart();
    closeAllModals();
    showToast('Переход к оформлению...');
}

// ==================== DROPDOWNS ====================
function setupDropdowns() {
    // Category
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

    // Brand
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

    // Close on outside click
    document.addEventListener('click', function() {
        closeAllDropdowns();
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(function(d) { d.classList.remove('open'); });
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
}

// ==================== INIT ====================
function initListeners() {
    // Currency
    document.querySelectorAll('.currency-btn-small').forEach(function(btn) {
        btn.addEventListener('click', function() { setCurrency(this.dataset.currency); });
    });

    // Search
    var search = document.getElementById('searchInput');
    if (search) {
        search.addEventListener('input', function() {
            state.searchQuery = this.value;
            filterProducts();
        });
    }

    setupDropdowns();
    setupProductCardDelegation();

    // Modal backs
    var modalBack = document.getElementById('modalBack');
    var cartBack = document.getElementById('cartBack');
    var checkoutBack = document.getElementById('checkoutBack');
    var favBack = document.getElementById('favoritesBack');
    var profileBack = document.getElementById('profileBack');

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
    var modalFav = document.getElementById('modalFavorite');
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
    var addToCartBtn = document.getElementById('addToCartBtn');
    var clearCartBtn = document.getElementById('clearCartBtn');
    var checkoutBtn = document.getElementById('checkoutBtn');
    var submitOrderBtn = document.getElementById('submitOrder');

    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openManagerForCart);
    if (submitOrderBtn) submitOrderBtn.addEventListener('click', submitOrder);

    // Header favorites
    var favHeaderBtn = document.getElementById('favoritesHeaderBtn');
    if (favHeaderBtn) favHeaderBtn.addEventListener('click', openFavoritesModal);

    // Delivery toggle
    document.querySelectorAll('.toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.toggle-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            state.deliveryType = this.dataset.delivery;
            updateDeliveryFields();
            haptic();
        });
    });

    // Mail service
    document.querySelectorAll('input[name="mailService"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            state.mailService = this.value;
            updateDeliveryFields();
        });
    });

    // Support
    var supportBtn = document.getElementById('supportBtn');
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
    var navHome = document.getElementById('navHome');
    var navFav = document.getElementById('navFavorites');
    var navCart = document.getElementById('navCart');
    var navProfile = document.getElementById('navProfile');

    if (navHome) navHome.addEventListener('click', function() { closeAllModals(); setActiveNav('home'); });
    if (navFav) navFav.addEventListener('click', function() { openFavoritesModal(); setActiveNav('favorites'); });
    if (navCart) navCart.addEventListener('click', function() { openCartModal(); setActiveNav('cart'); });
    if (navProfile) navProfile.addEventListener('click', function() { openProfileModal(); setActiveNav('profile'); });

    // Modal overlays
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

    const success = await loadProducts();

    if (success) {
        renderSizeFilters();
        filterProducts();
    } else {
        var loading = document.getElementById('loading');
        var empty = document.getElementById('emptyState');
        if (loading) loading.classList.add('hidden');
        if (empty) empty.style.display = 'block';
    }

    initListeners();
    lucide.createIcons();

    console.log('✅ Готово!');
}

document.addEventListener('DOMContentLoaded', init);