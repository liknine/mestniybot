// ==================== TELEGRAM WEBAPP ====================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

window.addEventListener('error', function(event) {
    console.log('MESTNIY JS ERROR:', event.message, event.filename, event.lineno);
    showAppError('Ошибка загрузки каталога: ' + String(event.message || 'неизвестная ошибка'));
});

// ==================== CONFIG ====================
const BUILD_VERSION = 'sizes_on_photo_1';
const SUPPORT_USERNAME = 'manager_of_mestniy';
const BOT_USERNAME = 'testmestniybot';
const ADMIN_IDS = [1639462053, 8465820993];
const MAX_GALLERY_IMAGES = 5;
const SUPPORT_TEXT = 'Добрый! У меня возник вопрос по каталогу';
const PREORDER_TEXT = 'Привет! Хочу заказать у вас такую позицию под заказ! Какие условия?\n\nВот моя позиция:\nФотография:\nРазмер:';
const ORDER_EXTRA_DESCRIPTION = 'Данная вещь, покупается лично под вас! Доставку стараемся делать максимально быстрой для вас! Все подробности вам расскажет наш менеджер!';

console.log('MESTNIY build:', BUILD_VERSION);

const BRANDS = {
    a_bathing_ape: 'A Bathing Ape',
    aape: 'Aape',
    acne_studios: 'Acne Studios',
    acronym: 'Acronym',
    adidas: 'Adidas',
    alpha_industries: 'Alpha Industries',
    alyx: 'ALYX',
    amiri: 'Amiri',
    aquascutum: 'Aquascutum',
    arcteryx: 'Arcteryx',
    armani_exchange: 'Armani Exchange',
    asics: 'ASICS',
    balenciaga: 'Balenciaga',
    barbour: 'Barbour',
    berghaus: 'Berghaus',
    bershka: 'Bershka',
    billabong: 'Billabong',
    burberry: 'Burberry',
    calvin_klein: 'Calvin Klein',
    carhartt: 'Carhartt',
    champion: 'Champion',
    columbia: 'Columbia',
    comme_des_fuckdown: 'Comme des Fuckdown',
    comme_des_garcons: 'Comme des Garçons',
    cp_company: 'C.P. Company',
    diesel: 'Diesel',
    dobermans: 'Dobermans Aggressive',
    doctor_martens: 'Doctor Martens',
    eastpak: 'Eastpak',
    ellesse: 'Ellesse',
    fila: 'Fila',
    fred_perry: 'Fred Perry',
    fucking_awesome: 'Fucking Awesome',
    gap: 'Gap',
    ggl: 'GGL',
    gosha: 'Гоша Рубчинский',
    gucci: 'Gucci',
    guess: 'Guess',
    haglofs: 'Haglofs',
    hardcore: 'Hardcore',
    hermes: 'Hermes',
    jordan: 'Jordan',
    lacoste: 'Lacoste',
    levis: "Levi's",
    lonsdale: 'Lonsdale',
    louis_vuitton: 'Louis Vuitton',
    lyle_scott: 'Lyle & Scott',
    maison_margiela: 'Maison Margiela',
    mastrum: 'Ma.Strum',
    mcm: 'MCM',
    merrell: 'Merrell',
    moncler: 'Moncler',
    mowalola: 'Mowalola',
    napapijri: 'NAPAPIJRI',
    new_balance: 'New Balance',
    nike: 'Nike',
    no_name: 'No Name',
    north_face: 'The North Face',
    number_nine: 'Number Nine',
    off_white: 'Off-White',
    palace: 'Palace',
    peaceful_hooligan: 'Peaceful Hooligan',
    pitbull: 'Pitbull Germany',
    polar: 'Polar',
    polo_ralph_lauren: 'Polo Ralph Lauren',
    prada: 'Prada',
    puma: 'Puma',
    raf_simons: 'Raf Simons',
    reebok: 'Reebok',
    rick_owens: "Rick Owen's",
    sergio_tacchini: 'Sergio Tacchini',
    stone_island: 'Stone Island',
    stussy: 'Stussy',
    supreme: 'Supreme',
    thor_steinar: 'Thor Steinar',
    timberland: 'Timberland',
    tommy_hilfiger: 'Tommy Hilfiger',
    trapstar: 'Trapstar',
    true_religion: 'True Religion',
    tupac: 'Tupac',
    vetements: 'Vetements',
    vivienne_westwood: 'Vivienne Westwood',
    weekend_offender: 'WEEKEND OFFENDER',
    yeezy: 'Yeezy',
    zara: 'Zara'
};

const BRAND_ALIASES = {
    stone: 'Stone Island',
    cp: 'C.P. Company',
    raf: 'Raf Simons',
    bape: 'A Bathing Ape',
    a: 'A Bathing Ape',
    weekend: 'WEEKEND OFFENDER',
    off: 'Off-White',
    new: 'New Balance',
    armani: 'Armani Exchange',
    guess: 'Guess'
};

const DISPLAY_CATEGORIES = [
    { id: 'outerwear', name: 'Верхняя одежда', modalName: 'Верхняя одежда', legacy: [2, 3], sizeType: 'clothing' },
    { id: 'sweaters', name: 'Кофты / Свитера', modalName: 'Кофты / Свитера 🥼', legacy: [6], sizeType: 'clothing' },
    { id: 'tshirts', name: 'Футболки / Поло', modalName: 'Футболки / Поло 👕', legacy: [5], sizeType: 'clothing' },
    { id: 'shirts', name: 'Рубашки', modalName: 'Рубашки', legacy: [4], sizeType: 'clothing' },
    { id: 'shorts', name: 'Шорты', modalName: 'Шорты 🩳', legacy: [8], sizeType: 'clothing' },
    { id: 'pants', name: 'Штаны', modalName: 'Штаны 👖', legacy: [7], sizeType: 'clothing' },
    { id: 'shoes', name: 'Обувь', modalName: 'Обувь 👟', legacy: [1], sizeType: 'shoes' },
    { id: 'accessories', name: 'Аксессуары', modalName: 'Аксессуары 🧢', legacy: [9, 10], sizeType: 'onesize' }
];

const LEGACY_CATEGORY_TO_DISPLAY = DISPLAY_CATEGORIES.reduce(function(map, category) {
    category.legacy.forEach(function(id) {
        map[id] = category.id;
    });
    return map;
}, {});

const SIZES = {
    clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
    onesize: ['UNI', 'OS', 'ONE SIZE']
};

const state = {
    products: [],
    cart: [],
    favorites: [],
    currency: 'BYN',
    activePage: 'home',
    homeSearch: '',
    homeSize: 'all',
    homeCategory: 'all',
    catalogScreen: 'start',
    catalogReturnScreen: 'start',
    catalogCategory: null,
    catalogBrand: null,
    catalogSearch: '',
    selectedProduct: null,
    selectedSizes: [],
    user: { id: null, firstName: 'Пользователь', lastName: '', username: '', photoUrl: null },
    updatesLoaded: false,
    updates: [],
    exchangeRates: { BYN: 1, RUB: 28.5, USD: 0.31 }
};

function byId(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try {
            window.lucide.createIcons();
        } catch (e) {
            console.log('Lucide icons error:', e);
        }
    }
}

function haptic(type) {
    if (tg && tg.HapticFeedback) {
        try {
            tg.HapticFeedback.impactOccurred(type || 'light');
        } catch (e) {}
    }
}

function showAppError(message) {
    const loading = byId('loading');
    const appError = byId('appError');
    if (loading) loading.hidden = true;
    if (appError) {
        appError.hidden = false;
        appError.textContent = message;
    }
}

function showToast(message) {
    const toast = byId('toast');
    const text = byId('toastText');
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 1800);
    if (tg && tg.HapticFeedback) {
        try {
            tg.HapticFeedback.notificationOccurred('success');
        } catch (e) {}
    }
}

async function loadProducts() {
    console.log('Загрузка products.json...');
    const loading = byId('loading');
    try {
        const response = await fetch('products.json?v=' + Date.now());
        if (!response.ok) throw new Error('products.json: HTTP ' + response.status);
        const data = await response.json();
        state.products = Array.isArray(data) ? data : [];
        preloadProductImages(state.products);
        console.log('Товаров загружено:', state.products.length);
        return true;
    } catch (e) {
        console.log('Ошибка загрузки products.json:', e);
        showAppError('Не удалось загрузить товары. Попробуйте открыть каталог ещё раз.');
        return false;
    } finally {
        if (loading) loading.hidden = true;
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

function retryImage(img) {
    const retries = Number(img.dataset.retries || 0);
    if (retries >= 3) {
        img.classList.add('image-failed');
        return;
    }
    img.dataset.retries = String(retries + 1);
    const cleanSrc = img.src.split('?retry=')[0];
    setTimeout(function() {
        img.src = cleanSrc + '?retry=' + Date.now();
    }, 450 + retries * 700);
}

window.retryImage = retryImage;

function imageTag(src, alt, className) {
    if (!src) {
        return '<div class="image-placeholder ' + (className || '') + '">MESTNIY</div>';
    }
    return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" class="' + (className || 'product-image') + '" loading="eager" decoding="async" onerror="retryImage(this)">';
}

function extraPhotosSlide(url) {
    return '<div class="extra-photos-slide">' +
        '<button class="extra-photos-button" data-url="' + escapeHtml(url) + '" type="button">Доп фото</button>' +
    '</div>';
}

function normalizeSize(size) {
    return String(size || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function isOneSize(size) {
    return ['ONE SIZE', 'OS', 'UNI', 'UNISIZE', 'ONE'].includes(normalizeSize(size));
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
    return getProductSizes(product).some(function(size) {
        return sizeMatches(size, selectedSize);
    });
}

function getProductSizes(product) {
    return Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
}

function getRawProductType(product) {
    const candidates = [
        product?.product_type,
        product?.section,
        product?.prices?.product_type,
        product?.prices?.section
    ];
    return String(candidates.find(Boolean) || 'stock').trim().toLowerCase();
}

function getProductType(product) {
    return getRawProductType(product) === 'order' ? 'order' : 'stock';
}

function isOrderProduct(product) {
    return getProductType(product) === 'order';
}

function getProductCondition(product) {
    return String(product?.condition || product?.prices?.condition || '').trim();
}

function getExtraPhotosUrl(product) {
    return String(product?.extra_photos_url || product?.prices?.extra_photos_url || '').trim();
}

function getProductGalleryImages(product) {
    const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
    return images.slice(0, MAX_GALLERY_IMAGES);
}

function isAdminUser() {
    return ADMIN_IDS.includes(Number(state.user.id));
}

function getCategoryKey(product) {
    return LEGACY_CATEGORY_TO_DISPLAY[Number(product?.category_id)] || 'accessories';
}

function getCategoryById(categoryId) {
    return DISPLAY_CATEGORIES.find(function(category) {
        return category.id === categoryId;
    }) || null;
}

function getCategoryName(product) {
    const category = getCategoryById(getCategoryKey(product));
    return category ? category.name : 'Категория';
}

function getBrandName(key) {
    const value = cleanBrandValue(key);
    if (!value) return 'Бренд';
    const lookup = value.toLowerCase();
    return BRANDS[value] || BRANDS[lookup] || BRAND_ALIASES[lookup] || value;
}

function cleanBrandValue(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function getBrandFilterKey(brand) {
    const value = cleanBrandValue(brand);
    return value ? getBrandName(value).toLowerCase().replace(/\s+/g, ' ') : '';
}

function brandMatches(productBrand, selectedBrand) {
    if (!selectedBrand || selectedBrand === 'all') return true;
    return getBrandFilterKey(productBrand) === getBrandFilterKey(selectedBrand);
}

function money(value, currency) {
    const symbols = { BYN: 'BYN', RUB: '₽', USD: '$' };
    const amount = Number(value || 0);
    if (currency === 'USD') return '$' + amount.toFixed(2);
    return amount.toFixed(2) + ' ' + symbols[currency];
}

function convertFromByn(value, currency) {
    return Number(value || 0) * (state.exchangeRates[currency] || 1);
}

function basePrice(product, currency) {
    const currentCurrency = currency || state.currency;
    if (product?.prices && product.prices[currentCurrency] !== undefined) {
        return Number(product.prices[currentCurrency]);
    }
    return convertFromByn(product?.price_byn || 0, currentCurrency);
}

function normalizePriceValue(value, currency) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'object') {
        if (value[currency] !== undefined) return Number(value[currency]);
        if (value.BYN !== undefined) return convertFromByn(value.BYN, currency);
        return null;
    }
    return currency === 'BYN' ? Number(value) : convertFromByn(value, currency);
}

function oldPrice(product, currency) {
    if (!product) return null;
    const currentCurrency = currency || state.currency;
    const candidates = [
        product.old_prices,
        product.old_price,
        product.prices?.old_prices,
        product.prices?.old_price
    ];
    for (const candidate of candidates) {
        const value = normalizePriceValue(candidate, currentCurrency);
        if (value !== null && value > basePrice(product, currentCurrency)) return value;
    }
    return null;
}

function hasDiscount(product, currency) {
    return oldPrice(product, currency || state.currency) !== null;
}

function formatPrice(priceByn, currency, product) {
    const currentCurrency = currency || state.currency;
    const safeProduct = product || { price_byn: priceByn };
    const current = basePrice(safeProduct, currentCurrency);
    const old = oldPrice(safeProduct, currentCurrency);
    if (old !== null) {
        return '<span class="old-price">' + money(old, currentCurrency) + '</span><span class="price-arrow">→</span><span class="new-price">' + money(current, currentCurrency) + '</span>';
    }
    return money(current, currentCurrency);
}

function getItemPrice(product, quantity) {
    return basePrice(product, state.currency) * (quantity || 1);
}

function formatTotal(value) {
    return money(value, state.currency);
}

function getStockStatus(product) {
    if (isOrderProduct(product)) return { text: 'Позиция под заказ!', className: 'order-stock' };
    const stock = Number(product?.stock || 0);
    if (stock === 0) return { text: 'Нет в наличии', className: 'out-of-stock' };
    if (stock <= 5) return { text: 'Осталось ' + stock + ' шт', className: 'low-stock' };
    return { text: 'В наличии', className: 'in-stock' };
}

function productCard(product) {
    const isFav = state.favorites.includes(Number(product.id));
    const status = getStockStatus(product);
    const order = isOrderProduct(product);
    const image = product.images && product.images[0] ? product.images[0] : '';
    const sizes = getProductSizes(product);
    const sizeBadge = sizes.length ? '<div class="product-size-badge">' + escapeHtml(sizes.join(', ')) + '</div>' : '';
    return '' +
        '<article class="product-card" data-id="' + escapeHtml(product.id) + '" role="button" tabindex="0">' +
            '<div class="product-image-wrap">' +
                imageTag(image, product.name, 'product-image') +
                (hasDiscount(product, state.currency) ? '<div class="discount-badge">SALE</div>' : '') +
                sizeBadge +
                '<button class="product-favorite ' + (isFav ? 'active' : '') + '" data-id="' + escapeHtml(product.id) + '" type="button" aria-label="Избранное"><i data-lucide="heart"></i></button>' +
            '</div>' +
            '<div class="product-card-body">' +
                '<h3>' + escapeHtml(product.name) + '</h3>' +
                '<div class="product-card-brand">' + escapeHtml(getBrandName(product.brand)) + '</div>' +
                '<div class="product-card-price">' + formatPrice(product.price_byn, state.currency, product) + '</div>' +
                '<div class="product-status ' + status.className + '">' + status.text + '</div>' +
            '</div>' +
        '</article>';
}

function renderProductsInto(container, products, emptyElement) {
    if (!container) return;
    container.innerHTML = products.map(productCard).join('');
    if (emptyElement) emptyElement.hidden = products.length > 0;
    refreshIcons();
}

function getStockProducts() {
    return state.products.filter(function(product) {
        return getProductType(product) === 'stock';
    });
}

function getOrderProducts() {
    return state.products.filter(function(product) {
        return getProductType(product) === 'order';
    });
}

function filterHomeProducts() {
    let products = getStockProducts();
    if (state.homeCategory !== 'all') {
        products = products.filter(function(product) {
            return getCategoryKey(product) === state.homeCategory;
        });
    }
    if (state.homeSize !== 'all') {
        products = products.filter(function(product) {
            return productHasSize(product, state.homeSize);
        });
    }
    if (state.homeSearch.trim()) {
        const query = state.homeSearch.trim().toLowerCase();
        products = products.filter(function(product) {
            return String(product.name || '').toLowerCase().includes(query) ||
                String(product.description || '').toLowerCase().includes(query) ||
                getBrandName(product.brand).toLowerCase().includes(query);
        });
    }
    return products;
}

function renderHome() {
    const search = byId('homeSearchInput');
    const sizeLabel = byId('homeSizeLabel');
    const typeLabel = byId('homeTypeLabel');
    if (search && search.value !== state.homeSearch) search.value = state.homeSearch;
    if (sizeLabel) sizeLabel.textContent = state.homeSize === 'all' ? 'Все' : state.homeSize;
    const category = getCategoryById(state.homeCategory);
    if (typeLabel) typeLabel.textContent = category ? category.name : 'Все';
    renderProductsInto(byId('homeProductsGrid'), filterHomeProducts(), byId('homeEmpty'));
}

function getHomeSizeOptions() {
    const category = getCategoryById(state.homeCategory);
    const sizeType = category ? category.sizeType : 'clothing';
    const sizes = SIZES[sizeType] || SIZES.clothing;
    return [{ value: 'all', label: 'Все размеры' }].concat(sizes.map(function(size) {
        return { value: size, label: size };
    }));
}

function openChoiceModal(title, options, selectedValue, onSelect) {
    const modal = byId('choiceModal');
    const modalTitle = byId('choiceTitle');
    const grid = byId('choiceGrid');
    if (!modal || !modalTitle || !grid) return;
    modalTitle.textContent = title;
    grid.innerHTML = options.map(function(option) {
        const active = String(option.value) === String(selectedValue) ? 'active' : '';
        return '<button class="choice-item ' + active + '" data-value="' + escapeHtml(option.value) + '" type="button">' +
            '<span>' + escapeHtml(option.label) + '</span>' +
        '</button>';
    }).join('');
    grid.querySelectorAll('.choice-item').forEach(function(button) {
        button.addEventListener('click', function() {
            const option = options.find(function(item) {
                return String(item.value) === String(button.dataset.value);
            });
            if (option) onSelect(option.value);
            closeChoiceModal();
            haptic();
        });
    });
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    refreshIcons();
}

function closeChoiceModal() {
    const modal = byId('choiceModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

function openHomeSizeModal() {
    openChoiceModal('Выбрать размер', getHomeSizeOptions(), state.homeSize, function(value) {
        state.homeSize = value;
        renderHome();
    });
}

function openHomeTypeModal() {
    const options = [{ value: 'all', label: 'Все типы' }].concat(DISPLAY_CATEGORIES.map(function(category) {
        return { value: category.id, label: category.modalName };
    }));
    openChoiceModal('Выбрать тип товара', options, state.homeCategory, function(value) {
        state.homeCategory = value;
        state.homeSize = 'all';
        renderHome();
    });
}

function showCatalogScreen(screen) {
    state.catalogScreen = screen;
    if (screen !== 'products') state.catalogSearch = '';
    ['catalogStartScreen', 'catalogCategoriesScreen', 'catalogBrandsScreen', 'catalogProductsScreen'].forEach(function(id) {
        const el = byId(id);
        if (el) el.hidden = true;
    });
    const active = byId(
        screen === 'categories' ? 'catalogCategoriesScreen' :
        screen === 'brands' ? 'catalogBrandsScreen' :
        screen === 'products' ? 'catalogProductsScreen' :
        'catalogStartScreen'
    );
    if (active) active.hidden = false;
    renderCatalog();
}

function renderCatalog() {
    if (state.catalogScreen === 'categories') renderCatalogCategories();
    if (state.catalogScreen === 'brands') renderCatalogBrands();
    if (state.catalogScreen === 'products') renderCatalogProducts();
    refreshIcons();
}

function lastProduct(products) {
    return products.length ? products[products.length - 1] : null;
}

function renderCatalogCategories() {
    const orderProducts = getOrderProducts();
    const allProducts = state.products;
    const cards = DISPLAY_CATEGORIES.map(function(category) {
        const categoryOrderProducts = orderProducts.filter(function(product) {
            return getCategoryKey(product) === category.id;
        });
        if (categoryOrderProducts.length < 1) return null;
        const fallbackProducts = allProducts.filter(function(product) {
            return getCategoryKey(product) === category.id;
        });
        const photoProduct = lastProduct(categoryOrderProducts) || lastProduct(fallbackProducts);
        return {
            id: category.id,
            title: category.name,
            count: categoryOrderProducts.length,
            image: photoProduct?.images?.[0] || ''
        };
    }).filter(Boolean);
    const grid = byId('catalogCategoriesGrid');
    if (!grid) return;
    grid.innerHTML = cards.map(function(card) {
        return '<button class="browse-card" data-category="' + escapeHtml(card.id) + '" type="button">' +
            '<div class="browse-image">' + imageTag(card.image, card.title, 'browse-img') + '</div>' +
            '<div class="browse-count">' + card.count + '</div>' +
            '<div class="browse-title">' + escapeHtml(card.title) + '</div>' +
        '</button>';
    }).join('');
    grid.querySelectorAll('.browse-card').forEach(function(card) {
        card.addEventListener('click', function() {
            state.catalogCategory = card.dataset.category;
            state.catalogBrand = null;
            state.catalogSearch = '';
            state.catalogReturnScreen = 'categories';
            showCatalogScreen('products');
            haptic();
        });
    });
}

function renderCatalogBrands() {
    const orderProducts = getOrderProducts();
    const groups = new Map();
    orderProducts.forEach(function(product) {
        const brand = cleanBrandValue(product.brand);
        const key = getBrandFilterKey(brand);
        if (!brand || !key) return;
        if (!groups.has(key)) {
            groups.set(key, {
                title: getBrandName(brand),
                products: []
            });
        }
        groups.get(key).products.push(product);
    });
    const cards = Array.from(groups.values()).map(function(group) {
        const products = group.products;
        const product = lastProduct(products);
        return {
            id: group.title,
            title: group.title,
            count: products.length,
            image: product?.images?.[0] || ''
        };
    }).sort(function(a, b) {
        return a.title.localeCompare(b.title, 'ru');
    });
    const grid = byId('catalogBrandsGrid');
    const empty = byId('catalogBrandsEmpty');
    if (!grid) return;
    grid.innerHTML = cards.map(function(card) {
        return '<button class="browse-card" data-brand="' + escapeHtml(card.id) + '" type="button">' +
            '<div class="browse-image">' + imageTag(card.image, card.title, 'browse-img') + '</div>' +
            '<div class="browse-count">' + card.count + '</div>' +
            '<div class="browse-title">' + escapeHtml(card.title) + '</div>' +
        '</button>';
    }).join('');
    if (empty) empty.hidden = cards.length > 0;
    grid.querySelectorAll('.browse-card').forEach(function(card) {
        card.addEventListener('click', function() {
            state.catalogBrand = card.dataset.brand;
            state.catalogCategory = null;
            state.catalogReturnScreen = 'brands';
            showCatalogScreen('products');
            haptic();
        });
    });
}

function renderCatalogProducts() {
    let products = getOrderProducts();
    let crumb = 'Товары под заказ';
    if (state.catalogCategory) {
        const category = getCategoryById(state.catalogCategory);
        products = products.filter(function(product) {
            return getCategoryKey(product) === state.catalogCategory;
        });
        crumb += ' / ' + (category ? category.name : 'Тип товара');
    }
    if (state.catalogBrand) {
        products = products.filter(function(product) {
            return brandMatches(product.brand, state.catalogBrand);
        });
        crumb += ' / ' + getBrandName(state.catalogBrand);
    }
    const searchInput = byId('catalogProductsSearch');
    if (searchInput && searchInput.value !== state.catalogSearch) searchInput.value = state.catalogSearch;
    if (state.catalogSearch.trim()) {
        const query = state.catalogSearch.trim().toLowerCase();
        products = products.filter(function(product) {
            return String(product.name || '').toLowerCase().includes(query) ||
                String(product.description || '').toLowerCase().includes(query) ||
                getBrandName(product.brand).toLowerCase().includes(query);
        });
    }
    const breadcrumb = byId('catalogBreadcrumb');
    if (breadcrumb) breadcrumb.textContent = crumb;
    renderProductsInto(byId('catalogProductsGrid'), products, byId('catalogProductsEmpty'));
}

function renderCart() {
    const items = byId('cartItems');
    const empty = byId('cartEmpty');
    const footer = byId('cartFooter');
    const subtotal = byId('cartSubtotal');
    const total = byId('cartTotal');
    let sum = 0;
    if (!items) return;
    if (!state.cart.length) {
        items.innerHTML = '';
        if (empty) empty.hidden = false;
        if (footer) footer.hidden = true;
        updateCartBadge();
        refreshIcons();
        return;
    }
    if (empty) empty.hidden = true;
    if (footer) footer.hidden = false;
    items.innerHTML = state.cart.map(function(item) {
        const product = state.products.find(function(candidate) {
            return Number(candidate.id) === Number(item.productId);
        });
        if (!product) return '';
        const quantity = item.sizes.length || 1;
        const itemSum = getItemPrice(product, quantity);
        sum += itemSum;
        const image = product.images?.[0] || '';
        return '<div class="cart-item" data-id="' + escapeHtml(item.productId) + '">' +
            imageTag(image, product.name, 'cart-item-image') +
            '<div class="cart-item-info">' +
                '<h3>' + escapeHtml(product.name) + '</h3>' +
                '<p>Размеры: ' + escapeHtml(item.sizes.join(', ')) + '</p>' +
                '<div class="cart-item-bottom">' +
                    '<strong>' + formatTotal(itemSum) + '</strong>' +
                    '<button class="cart-item-delete" data-id="' + escapeHtml(item.productId) + '" type="button" aria-label="Удалить из корзины"><i data-lucide="trash-2"></i></button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
    if (subtotal) subtotal.textContent = formatTotal(sum);
    if (total) total.textContent = formatTotal(sum);
    updateCartBadge();
    refreshIcons();
}

function renderFavorites() {
    const products = state.products.filter(function(product) {
        return state.favorites.includes(Number(product.id));
    });
    renderProductsInto(byId('favoritesGrid'), products, byId('favoritesEmpty'));
}

function updateProfileUI() {
    const name = state.user.lastName ? state.user.firstName + ' ' + state.user.lastName : state.user.firstName;
    const profileName = byId('profileName');
    const profileUsername = byId('profileUsername');
    const profileAvatar = byId('profileAvatar');
    if (profileName) profileName.textContent = name || 'Пользователь';
    if (profileUsername) profileUsername.textContent = state.user.username ? '@' + state.user.username : 'Telegram User';
    if (profileAvatar) {
        profileAvatar.innerHTML = state.user.photoUrl
            ? '<img src="' + escapeHtml(state.user.photoUrl) + '" alt="Avatar">'
            : '<i data-lucide="user"></i>';
    }
    refreshIcons();
}

function loadUserData() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
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

async function loadUpdates() {
    if (state.updatesLoaded) return state.updates;
    state.updatesLoaded = true;
    try {
        const response = await fetch('updates.json?v=' + Date.now());
        if (!response.ok) throw new Error('updates.json: HTTP ' + response.status);
        const data = await response.json();
        state.updates = Array.isArray(data) ? data : (Array.isArray(data?.updates) ? data.updates : []);
    } catch (e) {
        console.log('updates.json empty or unavailable:', e.message);
        state.updates = [];
    }
    return state.updates;
}

async function showInfoScreen(screen) {
    ['infoMainScreen', 'updatesScreen', 'socialScreen'].forEach(function(id) {
        const el = byId(id);
        if (el) el.hidden = true;
    });
    if (screen === 'updates') {
        const updatesScreen = byId('updatesScreen');
        if (updatesScreen) updatesScreen.hidden = false;
        await renderUpdates();
    } else if (screen === 'social') {
        const socialScreen = byId('socialScreen');
        if (socialScreen) socialScreen.hidden = false;
    } else {
        const mainScreen = byId('infoMainScreen');
        if (mainScreen) mainScreen.hidden = false;
        updateProfileUI();
    }
    refreshIcons();
}

async function renderUpdates() {
    const list = byId('updatesList');
    const empty = byId('updatesEmpty');
    const updates = await loadUpdates();
    if (!list) return;
    if (!updates.length) {
        list.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = updates.map(function(update, index) {
        return '<button class="update-card" data-index="' + index + '" type="button">' +
            imageTag(update.image || '', update.title || 'Обновление', 'update-image') +
            '<span>' + escapeHtml(update.title || 'Обновление') + '</span>' +
        '</button>';
    }).join('');
}

function setActivePage(page) {
    state.activePage = page;
    document.querySelectorAll('.page').forEach(function(pageEl) {
        pageEl.classList.toggle('page-active', pageEl.dataset.page === page);
    });
    document.querySelectorAll('.nav-btn').forEach(function(button) {
        button.classList.toggle('active', button.dataset.page === page);
    });
    closeSidePanel();
    closeChoiceModal();
    if (page === 'home') renderHome();
    if (page === 'catalog') renderCatalog();
    if (page === 'cart') renderCart();
    if (page === 'favorites') renderFavorites();
    if (page === 'info') showInfoScreen('main');
    refreshIcons();
}

function rerenderCurrentPage() {
    if (state.activePage === 'home') renderHome();
    if (state.activePage === 'catalog') renderCatalog();
    if (state.activePage === 'cart') renderCart();
    if (state.activePage === 'favorites') renderFavorites();
}

function openProductById(productId) {
    const product = state.products.find(function(candidate) {
        return Number(candidate.id) === Number(productId);
    });
    if (!product) return;
    openProductModal(product);
}

function openProductModal(product) {
    state.selectedProduct = product;
    state.selectedSizes = [];
    const modal = byId('productModal');
    const track = byId('galleryTrack');
    const dots = byId('galleryDots');
    const title = byId('productTitle');
    const brand = byId('productBrand');
    const price = byId('productPriceMain');
    const stock = byId('productStock');
    const orderBadge = byId('productOrderBadge');
    const availableSizes = byId('availableSizes');
    const condition = byId('productCondition');
    const sizesGrid = byId('sizesGrid');
    const description = byId('productDescription');
    const favorite = byId('modalFavorite');
    const warning = byId('sizeWarning');
    const deleteButton = byId('adminDeleteProductBtn');
    const isOrder = isOrderProduct(product);
    const sizes = getProductSizes(product);
    const conditionText = getProductCondition(product);
    const extraPhotosUrl = getExtraPhotosUrl(product);

    if (track) {
        const images = getProductGalleryImages(product);
        const galleryImages = images.length ? images : [''];
        const slides = galleryImages.map(function(src) {
            return imageTag(src, product.name, 'gallery-image');
        });
        if (extraPhotosUrl) slides.push(extraPhotosSlide(extraPhotosUrl));
        track.innerHTML = slides.join('');
        track.scrollLeft = 0;
        track.onscroll = function() {
            const index = Math.round(track.scrollLeft / Math.max(track.offsetWidth, 1));
            document.querySelectorAll('.gallery-dot').forEach(function(dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === index);
            });
        };
    }
    if (dots) {
        const imagesCount = Math.max(getProductGalleryImages(product).length || 1, 1);
        const count = imagesCount + (extraPhotosUrl ? 1 : 0);
        dots.innerHTML = Array.from({ length: count }).map(function(_, index) {
            return '<div class="gallery-dot ' + (index === 0 ? 'active' : '') + '"></div>';
        }).join('');
    }
    if (title) title.textContent = product.name || '';
    if (brand) brand.textContent = getBrandName(product.brand);
    if (price) price.innerHTML = formatPrice(product.price_byn, state.currency, product);
    if (stock) {
        const status = getStockStatus(product);
        stock.hidden = isOrder;
        stock.textContent = status.text;
        stock.className = 'product-stock ' + status.className;
    }
    if (orderBadge) orderBadge.hidden = !isOrder;
    if (availableSizes) {
        availableSizes.hidden = true;
        availableSizes.textContent = '';
    }
    if (condition) {
        condition.hidden = isOrder || !conditionText;
        condition.textContent = conditionText ? 'Состояние: ' + conditionText : '';
    }
    if (sizesGrid) {
        const modalSizes = sizes.length ? sizes : ['ONE SIZE'];
        sizesGrid.innerHTML = modalSizes.map(function(size) {
            const disabled = !isOrder && Number(product.stock || 0) === 0;
            return '<button class="size-chip" data-size="' + escapeHtml(size) + '" type="button" ' + (disabled ? 'disabled' : '') + '>' + escapeHtml(size) + '</button>';
        }).join('');
        sizesGrid.querySelectorAll('.size-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                const size = chip.dataset.size;
                const index = state.selectedSizes.indexOf(size);
                if (index === -1) {
                    state.selectedSizes.push(size);
                    chip.classList.add('selected');
                } else {
                    state.selectedSizes.splice(index, 1);
                    chip.classList.remove('selected');
                }
                if (warning) warning.classList.remove('active', 'blink');
                updateAddToCartButton();
                haptic();
            });
        });
        if (modalSizes.length === 1 && (isOrder || Number(product.stock || 0) !== 0)) {
            state.selectedSizes = [modalSizes[0]];
            const onlyChip = sizesGrid.querySelector('.size-chip');
            if (onlyChip) onlyChip.classList.add('selected');
        }
    }
    if (warning) warning.classList.remove('active', 'blink');
    if (description) {
        const parts = [product.description || ''];
        if (isOrder) parts.push(ORDER_EXTRA_DESCRIPTION);
        description.textContent = parts.filter(Boolean).join('\n\n');
    }
    if (favorite) favorite.classList.toggle('active', state.favorites.includes(Number(product.id)));
    if (deleteButton) {
        deleteButton.hidden = !isAdminUser();
        deleteButton.dataset.productId = String(product.id);
        deleteButton.textContent = '🗑 Удалить товар #' + product.id;
    }
    renderRelatedProducts(product);
    updateAddToCartButton();
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
    const scroll = document.querySelector('.product-scroll');
    if (scroll) scroll.scrollTop = 0;
    refreshIcons();
}

function closeProductModal() {
    const modal = byId('productModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
    state.selectedProduct = null;
    state.selectedSizes = [];
}

function updateAddToCartButton() {
    const button = byId('addToCartBtn');
    const price = byId('btnPrice');
    if (!button || !state.selectedProduct) return;
    const disabled = !isOrderProduct(state.selectedProduct) && Number(state.selectedProduct.stock || 0) === 0;
    button.disabled = disabled;
    if (price) {
        price.textContent = formatTotal(getItemPrice(state.selectedProduct, Math.max(state.selectedSizes.length, 1)));
    }
}

function renderRelatedProducts(product) {
    const section = byId('relatedSection');
    const grid = byId('relatedGrid');
    if (!section || !grid) return;
    let related = state.products.filter(function(candidate) {
        return Number(candidate.id) !== Number(product.id) &&
            getProductType(candidate) === getProductType(product) &&
            getCategoryKey(candidate) === getCategoryKey(product);
    });
    related = related.slice(0, 4);
    section.hidden = related.length === 0;
    grid.innerHTML = related.map(productCard).join('');
}

function addToCart() {
    const product = state.selectedProduct;
    if (!product) return;
    const sizes = getProductSizes(product);
    if (!sizes.length && !state.selectedSizes.length) state.selectedSizes = ['ONE SIZE'];
    if (sizes.length === 1 && !state.selectedSizes.length) state.selectedSizes = [sizes[0]];
    if (!state.selectedSizes.length) {
        const warning = byId('sizeWarning');
        if (warning) {
            warning.classList.add('active', 'blink');
            setTimeout(function() {
                warning.classList.remove('blink');
            }, 1400);
        }
        showToast('Выберите размер');
        return;
    }
    const productId = Number(product.id);
    let item = state.cart.find(function(cartItem) {
        return Number(cartItem.productId) === productId;
    });
    if (!item) {
        item = { productId: productId, sizes: [] };
        state.cart.push(item);
    }
    state.selectedSizes.forEach(function(size) {
        if (!item.sizes.includes(size)) item.sizes.push(size);
    });
    saveCart();
    closeProductModal();
    rerenderCurrentPage();
    showToast('Добавлено в корзину');
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(function(item) {
        return Number(item.productId) !== Number(productId);
    });
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
        if (!saved) return;
        state.cart = JSON.parse(saved).map(function(item) {
            if (item.size && !item.sizes) return { productId: item.productId, sizes: [item.size] };
            return { productId: item.productId, sizes: Array.isArray(item.sizes) ? item.sizes : [] };
        });
    } catch (e) {
        console.log('Cart load error:', e);
        state.cart = [];
    }
    updateCartBadge();
}

function updateCartBadge() {
    const badge = byId('cartBadge');
    const count = state.cart.reduce(function(sum, item) {
        return sum + (item.sizes?.length || 0);
    }, 0);
    if (badge) {
        badge.textContent = count;
        badge.dataset.count = String(count);
    }
}

function toggleFavorite(productId) {
    const id = Number(productId);
    const index = state.favorites.indexOf(id);
    if (index === -1) state.favorites.push(id);
    else state.favorites.splice(index, 1);
    saveFavorites();
    rerenderCurrentPage();
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
}

function loadFavorites() {
    try {
        const saved = localStorage.getItem('favorites');
        state.favorites = saved ? JSON.parse(saved).map(Number) : [];
    } catch (e) {
        console.log('Favorites load error:', e);
        state.favorites = [];
    }
}

function setCurrency(currency) {
    if (!['BYN', 'RUB', 'USD'].includes(currency)) return;
    state.currency = currency;
    localStorage.setItem('currency', currency);
    document.querySelectorAll('.currency-option').forEach(function(button) {
        button.classList.toggle('active', button.dataset.currency === currency);
    });
    if (state.selectedProduct) {
        const price = byId('productPriceMain');
        if (price) price.innerHTML = formatPrice(state.selectedProduct.price_byn, currency, state.selectedProduct);
        updateAddToCartButton();
    }
    rerenderCurrentPage();
    haptic();
}

function loadCurrency() {
    const saved = localStorage.getItem('currency');
    if (saved && ['BYN', 'RUB', 'USD'].includes(saved)) state.currency = saved;
    document.querySelectorAll('.currency-option').forEach(function(button) {
        button.classList.toggle('active', button.dataset.currency === state.currency);
    });
}

function openManagerWithText(text) {
    const link = 'https://t.me/' + SUPPORT_USERNAME + '?text=' + encodeURIComponent(text);
    if (tg && typeof tg.openTelegramLink === 'function') tg.openTelegramLink(link);
    else window.open(link, '_blank');
}

function openExternalLink(link) {
    if (!link) return;
    if (tg && typeof tg.openLink === 'function') tg.openLink(link);
    else window.open(link, '_blank');
}

function isTelegramLink(link) {
    return /^https?:\/\/t\.me\//i.test(String(link || '').trim());
}

function openTelegramOrExternal(link) {
    const cleanLink = String(link || '').trim();
    if (!cleanLink) return;
    if (tg && typeof tg.openTelegramLink === 'function' && isTelegramLink(cleanLink)) {
        tg.openTelegramLink(cleanLink.replace(/^http:\/\//i, 'https://'));
    } else {
        window.open(cleanLink, '_blank');
    }
}

function openDeleteCommand(productId) {
    const command = '/delete ' + productId;
    const link = 'https://t.me/' + BOT_USERNAME + '?text=' + encodeURIComponent(command);
    if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(link);
    } else {
        window.open(link, '_blank');
    }
}

function openManagerForCart() {
    if (!state.cart.length) {
        showToast('Корзина пуста');
        return;
    }
    let total = 0;
    let text = 'Привет! Хочу оформить заказ, вот эти позиции меня заинтересовали!🛒\n';
    state.cart.forEach(function(cartItem) {
        const product = state.products.find(function(candidate) {
            return Number(candidate.id) === Number(cartItem.productId);
        });
        if (!product) return;
        const itemTotal = getItemPrice(product, cartItem.sizes.length || 1);
        total += itemTotal;
        text += '\n📦 ' + product.name;
        text += '\n🏷 Бренд: ' + getBrandName(product.brand);
        text += '\n📏 Размеры: ' + cartItem.sizes.join(', ');
        text += '\n💰 Цена: ' + formatTotal(itemTotal);
        if (isOrderProduct(product)) text += '\nПозиция под заказ';
        if (product.images && product.images[0]) text += '\nФото: ' + product.images[0];
        text += '\n';
    });
    text += '\nИтого: ' + formatTotal(total);
    openManagerWithText(text);
}

function openSidePanel() {
    const panel = byId('sidePanel');
    if (!panel) return;
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');
}

function closeSidePanel() {
    const panel = byId('sidePanel');
    if (!panel) return;
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
}

function initListeners() {
    document.querySelectorAll('.nav-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            setActivePage(button.dataset.page);
        });
    });

    document.querySelectorAll('.currency-option').forEach(function(button) {
        button.addEventListener('click', function() {
            setCurrency(button.dataset.currency);
        });
    });

    const search = byId('homeSearchInput');
    if (search) {
        search.addEventListener('input', function() {
            state.homeSearch = search.value;
            renderHome();
        });
    }


    const catalogProductsSearch = byId('catalogProductsSearch');
    if (catalogProductsSearch) {
        catalogProductsSearch.addEventListener('input', function() {
            state.catalogSearch = catalogProductsSearch.value;
            renderCatalogProducts();
        });
    }

    byId('homeSizeButton')?.addEventListener('click', openHomeSizeModal);
    byId('homeTypeButton')?.addEventListener('click', openHomeTypeModal);
    byId('menuButton')?.addEventListener('click', openSidePanel);
    byId('sideOverlay')?.addEventListener('click', closeSidePanel);
    byId('sideClose')?.addEventListener('click', closeSidePanel);
    byId('sideSupport')?.addEventListener('click', function() {
        openManagerWithText(SUPPORT_TEXT);
    });

    byId('choiceOverlay')?.addEventListener('click', closeChoiceModal);
    byId('choiceClose')?.addEventListener('click', closeChoiceModal);

    byId('catalogTypeButton')?.addEventListener('click', function() {
        showCatalogScreen('categories');
    });
    byId('preorderButton')?.addEventListener('click', function() {
        openManagerWithText(PREORDER_TEXT);
    });
    byId('categoriesBack')?.addEventListener('click', function() {
        showCatalogScreen('start');
    });
    byId('brandsBack')?.addEventListener('click', function() {
        showCatalogScreen('start');
    });
    byId('catalogProductsBack')?.addEventListener('click', function() {
        state.catalogCategory = null;
        state.catalogBrand = null;
        state.catalogSearch = '';
        showCatalogScreen(state.catalogReturnScreen || 'start');
    });
    byId('catalogManagerButton')?.addEventListener('click', function() {
        openManagerWithText(PREORDER_TEXT);
    });

    byId('clearCartBtn')?.addEventListener('click', clearCart);
    byId('checkoutBtn')?.addEventListener('click', openManagerForCart);
    byId('modalBack')?.addEventListener('click', closeProductModal);
    byId('addToCartBtn')?.addEventListener('click', addToCart);
    byId('adminDeleteProductBtn')?.addEventListener('click', function() {
        if (!isAdminUser() || !state.selectedProduct) return;
        openDeleteCommand(state.selectedProduct.id);
    });
    byId('modalFavorite')?.addEventListener('click', function() {
        if (!state.selectedProduct) return;
        toggleFavorite(state.selectedProduct.id);
        this.classList.toggle('active', state.favorites.includes(Number(state.selectedProduct.id)));
        haptic('medium');
    });

    byId('supportBtn')?.addEventListener('click', function() {
        openManagerWithText(SUPPORT_TEXT);
    });
    byId('updatesBtn')?.addEventListener('click', function() {
        showInfoScreen('updates');
    });
    byId('socialBtn')?.addEventListener('click', function() {
        showInfoScreen('social');
    });
    byId('updatesBack')?.addEventListener('click', function() {
        showInfoScreen('main');
    });
    byId('socialBack')?.addEventListener('click', function() {
        showInfoScreen('main');
    });

    document.addEventListener('click', function(event) {
        const extraPhotos = event.target.closest('.extra-photos-button');
        if (extraPhotos) {
            event.preventDefault();
            event.stopPropagation();
            openTelegramOrExternal(extraPhotos.dataset.url);
            return;
        }

        const favorite = event.target.closest('.product-favorite');
        if (favorite) {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(favorite.dataset.id);
            favorite.classList.toggle('active', state.favorites.includes(Number(favorite.dataset.id)));
            haptic('medium');
            return;
        }

        const productCardEl = event.target.closest('.product-card');
        if (productCardEl) {
            openProductById(productCardEl.dataset.id);
            haptic();
            return;
        }

        const cartDelete = event.target.closest('.cart-item-delete');
        if (cartDelete) {
            removeFromCart(cartDelete.dataset.id);
            return;
        }

        const updateCard = event.target.closest('.update-card');
        if (updateCard) {
            const update = state.updates[Number(updateCard.dataset.index)];
            const postUrl = String(update?.post_url || '').trim();
            if (isTelegramLink(postUrl)) openTelegramOrExternal(postUrl);
            return;
        }

        const socialCard = event.target.closest('.social-card');
        if (socialCard) {
            openExternalLink(socialCard.dataset.link);
        }
    });
}

async function init() {
    console.log('Запуск MESTNIY WebApp...');
    loadCart();
    loadFavorites();
    loadUserData();
    initListeners();
    loadCurrency();
    const success = await loadProducts();
    if (success) {
        renderHome();
        renderCatalog();
        renderCart();
        updateCartBadge();
    }
    refreshIcons();
    console.log('MESTNIY WebApp готов');
}

document.addEventListener('DOMContentLoaded', init);
