
let PRODUCTS=[];
const ORDERS=[];
let NEWS=[];
const BONUS_RULES=[
  {max:150,rate:1},
  {max:300,rate:2},
  {max:900,rate:3},
  {max:Infinity,rate:3.5}
];
const BONUS_TRANSACTIONS=[];
const state={screen:'home',previous:'catalog',favorites:new Set(),cart:[],selectedProduct:0,selectedSize:null,selectedOrder:0,selectedNews:0,orderFilter:'all',sortAsc:true,filters:{category:'all',brand:'all',size:'all',priceMin:'',priceMax:''},filterDraft:null,filterTab:'categories',menuTab:'collections',bonusTransactions:[...BONUS_TRANSACTIONS],bonusBalance:0,lastCreatedOrder:null,checkout:{delivery:'',name:'',phone:'',europostBranch:'',address:'',postalIndex:'',postOffice:'',comment:'',bonuses:0}};

const BUILD_VERSION='mestniy_frontend_v25_live_1';
const BRAND_LABELS={"a_bathing_ape":"A Bathing Ape","aape":"Aape","acne_studios":"Acne Studios","acronym":"Acronym","adidas":"Adidas","alpha_industries":"Alpha Industries","alyx":"ALYX","amiri":"Amiri","aquascutum":"Aquascutum","arcteryx":"Arcteryx","armani_exchange":"Armani Exchange","asics":"ASICS","balenciaga":"Balenciaga","barbour":"Barbour","berghaus":"Berghaus","bershka":"Bershka","billabong":"Billabong","burberry":"Burberry","calvin_klein":"Calvin Klein","carhartt":"Carhartt","champion":"Champion","columbia":"Columbia","comme_des_fuckdown":"Comme des Fuckdown","comme_des_garcons":"Comme des Garçons","cp_company":"C.P. Company","diesel":"Diesel","dobermans":"Dobermans Aggressive","doctor_martens":"Doctor Martens","eastpak":"Eastpak","ellesse":"Ellesse","fila":"Fila","fred_perry":"Fred Perry","fucking_awesome":"Fucking Awesome","gap":"Gap","ggl":"GGL","gosha":"Гоша Рубчинский","gucci":"Gucci","haglofs":"Haglofs","hardcore":"Hardcore","hermes":"Hermes","jordan":"Jordan","lacoste":"Lacoste","levis":"Levi's","lonsdale":"Lonsdale","louis_vuitton":"Louis Vuitton","lyle_scott":"Lyle & Scott","maison_margiela":"Maison Margiela","mastrum":"Ma.Strum","mcm":"MCM","merrell":"Merrell","moncler":"Moncler","mowalola":"Mowalola","napapijri":"NAPAPIJRI","new_balance":"New Balance","nike":"Nike","no_name":"No Name","north_face":"The North Face","number_nine":"Number Nine","off_white":"Off-White","palace":"Palace","peaceful_hooligan":"Peaceful Hooligan","pitbull":"Pitbull Germany","polar":"Polar","polo_ralph_lauren":"Polo Ralph Lauren","prada":"Prada","puma":"Puma","raf_simons":"Raf Simons","reebok":"Reebok","rick_owens":"Rick Owen's","sergio_tacchini":"Sergio Tacchini","stone_island":"Stone Island","stussy":"Stussy","supreme":"Supreme","thor_steinar":"Thor Steinar","timberland":"Timberland","tommy_hilfiger":"Tommy Hilfiger","trapstar":"Trapstar","true_religion":"True Religion","tupac":"Tupac","vetements":"Vetements","vivienne_westwood":"Vivienne Westwood","weekend_offender":"WEEKEND OFFENDER","yeezy":"Yeezy","zara":"Zara"};
const CATEGORY_LABELS={
  outerwear:'ВЕРХНЯЯ ОДЕЖДА',sweatshirts:'КОФТЫ / СВИТЕРА',tshirts:'ФУТБОЛКИ / ПОЛО',
  shirts:'РУБАШКИ',shorts:'ШОРТЫ',pants:'ШТАНЫ',shoes:'ОБУВЬ',accessories:'АКСЕССУАРЫ',other:'ДРУГОЕ'
};
const CATEGORY_BY_ID={1:'shoes',2:'outerwear',3:'outerwear',4:'shirts',5:'tshirts',6:'sweatshirts',7:'pants',8:'shorts',9:'accessories',10:'accessories'};
const DEFAULT_NEWS=[
  {id:'default-1',title:'Новая поставка уже в каталоге',excerpt:'Откройте каталог и посмотрите актуальные позиции MESTNIY STORE.',body:['Новые позиции уже доступны в каталоге. Выберите товар, размер и добавьте его в корзину.'],category:'НОВОЕ ПОСТУПЛЕНИЕ',date:'MESTNIY STORE',image:'assets/home-news-01.webp',action:{type:'catalog',label:'ПЕРЕЙТИ В КАТАЛОГ'}},
  {id:'default-2',title:'Смотрите новинки в каталоге',excerpt:'Актуальные бренды и размеры собраны в одном разделе.',body:['Используйте фильтры по бренду, категории, размеру и цене, чтобы быстрее найти нужную позицию.'],category:'КАТАЛОГ',date:'MESTNIY STORE',image:'assets/home-news-02.webp',action:{type:'catalog',label:'ОТКРЫТЬ КАТАЛОГ'}}
];
const PRODUCT_PLACEHOLDER='assets/product-placeholder.svg';

function displayBrand(value){
  const clean=String(value||'').trim();
  if(!clean)return 'MESTNIY STORE';
  return BRAND_LABELS[clean]||BRAND_LABELS[clean.toLowerCase()]||clean.replace(/_/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
}
function sourcePrice(product,currency='RUB'){
  const prices=product?.prices||{};
  const direct=Number(prices[currency]);
  if(Number.isFinite(direct)&&direct>0)return direct;
  if(currency==='RUB'){
    const byn=Number(product?.price_byn||prices.BYN||0);
    if(Number.isFinite(byn)&&byn>0)return Math.round(byn*28.5);
  }
  return Number(product?.price_byn||0);
}
function sourceOldPrice(product,currency='RUB'){
  const prices=product?.prices||{};
  const candidates=[product?.old_prices?.[currency],product?.old_price?.[currency],product?.[`old_price_${currency.toLowerCase()}`],prices?.old_prices?.[currency],prices?.old_price?.[currency],prices?.[`old_price_${currency.toLowerCase()}`]];
  for(const value of candidates){const number=Number(value);if(Number.isFinite(number)&&number>0)return number}
  return null;
}
function normalizeSourceProduct(product,index){
  const price=sourcePrice(product,'RUB');
  const old=sourceOldPrice(product,'RUB');
  const image=(Array.isArray(product?.images)&&product.images.find(Boolean))||PRODUCT_PLACEHOLDER;
  const rawSizeStock=product?.size_stock||product?.prices?.size_stock||{};
  const sizeStock={};
  if(rawSizeStock&&typeof rawSizeStock==='object'&&!Array.isArray(rawSizeStock)){
    Object.entries(rawSizeStock).forEach(([size,qty])=>{
      const clean=String(size||'').trim();
      if(!clean)return;
      const amount=Math.max(0,Number.parseInt(qty,10)||0);
      sizeStock[clean]=amount;
    });
  }
  let sizes=Array.isArray(product?.sizes)?product.sizes.map(value=>String(value).trim()).filter(Boolean):[];
  Object.keys(sizeStock).forEach(size=>{if(!sizes.includes(size))sizes.push(size)});
  const legacyStock=Math.max(0,Number.parseInt(product?.stock,10)||0);
  const hasPerSizeStock=Object.keys(sizeStock).length>0;
  if(!hasPerSizeStock&&sizes.length){
    sizes.forEach((size,idx)=>{sizeStock[size]=legacyStock>0?(idx===0?legacyStock:1):0});
  }
  const stock=hasPerSizeStock?Object.values(sizeStock).reduce((sum,qty)=>sum+qty,0):legacyStock;
  const unavailableSizes=sizes.filter(size=>(sizeStock[size]??(stock>0?1:0))<=0);
  return {
    id:String(product?.id??index+1),
    code:String(product?.name||`ТОВАР ${index+1}`).trim(),
    brand:displayBrand(product?.brand),
    desc:String(product?.description||'').trim(),
    name:String(product?.name||'Товар').trim(),
    price:old&&old>price?old:price,
    discountPrice:old&&old>price?price:undefined,
    sizes,
    sizeStock,
    unavailableSizes,
    image,
    images:Array.isArray(product?.images)?product.images.filter(Boolean):[],
    category:CATEGORY_BY_ID[Number(product?.category_id)]||'other',
    stock,
    condition:String(product?.condition||product?.prices?.condition||'').trim(),
    extraPhotosUrl:String(product?.extra_photos_url||product?.prices?.extra_photos_url||'').trim(),
    raw:product
  };
}
function formatNewsDate(value){
  if(!value)return 'MESTNIY STORE';
  const date=new Date(value);if(Number.isNaN(date.getTime()))return String(value);
  return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'long',year:'numeric'}).format(date);
}
function normalizeSourceNews(item,index){
  const title=String(item?.title||'Обновление MESTNIY STORE').trim();
  const url=String(item?.post_url||'').trim();
  return {id:String(item?.id??index+1),title,excerpt:'Откройте публикацию, чтобы узнать подробности.',body:[title,'Все подробности опубликованы в Telegram-канале магазина.'],category:'НОВОСТИ МАГАЗИНА',date:formatNewsDate(item?.created_at),image:String(item?.image||'assets/home-news-01.webp'),action:url?{type:'external',url,label:'ОТКРЫТЬ TELEGRAM'}:{type:'catalog',label:'ПЕРЕЙТИ В КАТАЛОГ'}};
}
async function fetchJson(path){
  const response=await fetch(`${path}?v=${Date.now()}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}
async function loadStoreData(){
  const results=await Promise.allSettled([fetchJson('products.json'),fetchJson('updates.json')]);
  if(results[0].status==='fulfilled'){PRODUCTS=(Array.isArray(results[0].value)?results[0].value:[]).map(normalizeSourceProduct)}
  else{state.dataError='catalog-error';console.error(results[0].reason)}
  if(results[1].status==='fulfilled'){NEWS=(Array.isArray(results[1].value)?results[1].value:[]).map(normalizeSourceNews)}
  else{console.error(results[1].reason)}
  if(!NEWS.length)NEWS=[...DEFAULT_NEWS];
}
function productById(id){return PRODUCTS.find(product=>String(product.id)===String(id))||null}
function productIndexById(id){return PRODUCTS.findIndex(product=>String(product.id)===String(id))}
function productForOrderItem(item){return productById(item?.productId)||PRODUCTS[item?.product]||item?.snapshot||null}
function orderItemSnapshot(product){return product?{id:product.id,code:product.code,brand:product.brand,image:product.image,price:productPrice(product),oldPrice:Number(product.price)||productPrice(product)}:null}

const STORAGE_KEYS={cart:'mestniy_cart_v24',favorites:'mestniy_favorites_v24',orders:'mestniy_orders_local_v24',bonuses:'mestniy_bonus_local_v24',profile:'mestniy_profile_v24'};
function safeParse(value,fallback){try{return JSON.parse(value)}catch(_e){return fallback}}
function storageRead(key,fallback){try{return safeParse(localStorage.getItem(key),fallback)}catch(_e){return fallback}}
function loadPersistedState(){
  const cart=storageRead(STORAGE_KEYS.cart,[]);
  state.cart=Array.isArray(cart)?cart.filter(item=>productById(item.id)&&item.size&&Number(item.qty)>0).map(item=>({id:String(item.id),size:String(item.size),qty:Math.max(1,Number(item.qty)||1)})):[];
  const favorites=storageRead(STORAGE_KEYS.favorites,[]);
  state.favorites=new Set((Array.isArray(favorites)?favorites:[]).map(String).filter(id=>productById(id)));
  const orders=storageRead(STORAGE_KEYS.orders,[]);if(Array.isArray(orders))ORDERS.splice(0,ORDERS.length,...orders);
  const bonus=storageRead(STORAGE_KEYS.bonuses,[]);if(Array.isArray(bonus))state.bonusTransactions=bonus;
}
function persistState(){
  try{
    localStorage.setItem(STORAGE_KEYS.cart,JSON.stringify(state.cart));
    localStorage.setItem(STORAGE_KEYS.favorites,JSON.stringify([...state.favorites]));
    localStorage.setItem(STORAGE_KEYS.orders,JSON.stringify(ORDERS));
    localStorage.setItem(STORAGE_KEYS.bonuses,JSON.stringify(state.bonusTransactions));
  }catch(error){console.warn('Storage unavailable',error)}
}
function parseInitDataUser(initData){try{const raw=new URLSearchParams(initData||'').get('user');return raw?JSON.parse(decodeURIComponent(raw)):null}catch(_e){return null}}
function readProfileFromUrl(){const params=new URLSearchParams(location.search);return {id:params.get('fr_uid'),username:params.get('fr_username'),first_name:params.get('fr_name'),photo_url:params.get('fr_photo')}}
function mergeProfile(...sources){
  const valid=sources.filter(Boolean);const pick=(...keys)=>{for(const source of valid)for(const key of keys)if(source?.[key])return source[key];return ''};
  return {id:pick('id','telegram_id'),username:pick('username'),firstName:pick('first_name','firstName','name'),lastName:pick('last_name','lastName'),photoUrl:pick('photo_url','photoUrl')};
}
function applyTelegramProfile(){
  const tg=window.Telegram?.WebApp;try{tg?.ready?.();tg?.expand?.()}catch(_e){}
  const cached=storageRead(STORAGE_KEYS.profile,null);
  const profile=mergeProfile(tg?.initDataUnsafe?.user,parseInitDataUser(tg?.initData),readProfileFromUrl(),cached);
  if(profile.id||profile.username||profile.firstName||profile.photoUrl){try{localStorage.setItem(STORAGE_KEYS.profile,JSON.stringify(profile))}catch(_e){}}
  const username=document.getElementById('profileUsername');if(username)username.textContent=profile.username?`@${profile.username}`:(profile.firstName||'ПОЛЬЗОВАТЕЛЬ');
  const avatar=document.getElementById('profileAvatar');if(avatar&&profile.photoUrl){avatar.onload=()=>avatar.classList.add('is-loaded');avatar.onerror=()=>{avatar.src='assets/profile-fallback.webp'};avatar.src=profile.photoUrl}
}
function renderHomeNews(){
  const box=document.getElementById('homeNews');if(!box)return;
  const items=NEWS.slice(0,2);
  if(!items.length){
    box.innerHTML=`<button class="home-news-empty" data-go="catalog"><span>НОВОСТИ СКОРО ПОЯВЯТСЯ</span><b>ОТКРЫТЬ КАТАЛОГ →</b></button>`;
    return;
  }
  const feature=items[0];
  const teaser=items[1];
  box.innerHTML=`
    <button class="news-card home-news-feature" data-news="0">
      <span class="home-news-feature-media"><img src="${escapeHtml(feature.image)}" alt="${escapeHtml(feature.title)}"></span>
      <span class="home-news-feature-copy">
        <small>${escapeHtml(feature.category||'НОВОСТИ')}</small>
        <strong>${escapeHtml(feature.title)}</strong>
        <i aria-hidden="true">→</i>
      </span>
    </button>
    ${teaser?`<button class="news-card home-news-teaser" data-news="1">
      <span class="home-news-teaser-media"><img src="${escapeHtml(teaser.image)}" alt="${escapeHtml(teaser.title)}"></span>
      <span class="home-news-teaser-copy"><small>${escapeHtml(teaser.category||'НОВОСТИ')}</small><strong>${escapeHtml(teaser.title)}</strong></span>
      <i aria-hidden="true">→</i>
    </button>`:''}`;
}
function buildOrderPayload(){
  const c=state.checkout;
  const bonuses=Math.max(0,Math.min(Number(c.bonuses)||0,state.bonusBalance,cartSubtotal()));
  return {
    items:state.cart.map(item=>{const p=productById(item.id);return {id:p?.id,productId:p?.id,name:p?.code||p?.name||'Товар',brand:p?.brand||'',sizes:[item.size],size:item.size,qty:item.qty,quantity:item.qty,price:p?productPrice(p):0,image:p?.image||''}}),
    total:Math.max(0,cartSubtotal()-bonuses),currency:'RUB',deliveryType:c.delivery,deliveryService:c.delivery==='europost'?'Европочта':c.delivery==='belpost'?'Белпочта':null,
    deliveryData:c.delivery==='europost'?{branch:c.europostBranch}:c.delivery==='belpost'?{address:c.address,postalIndex:c.postalIndex,postOffice:c.postOffice}:null,
    customer:{firstName:c.name,lastName:'',phone:c.phone},comment:c.comment,bonuses
  };
}
function sendOrderToBot(payload){
  try{const tg=window.Telegram?.WebApp;if(tg?.sendData){tg.sendData(JSON.stringify(payload));return true}}catch(error){console.error('Telegram sendData failed',error)}
  return false;
}

const DEMO_STATE=new URLSearchParams(location.search).get('demo')||'';

if(DEMO_STATE==='empty-cart')state.cart=[];
if(DEMO_STATE==='empty-favorites')state.favorites.clear();
if(DEMO_STATE==='empty-orders')ORDERS.splice(0);
if(DEMO_STATE==='empty-news')NEWS.splice(0);
if(DEMO_STATE==='empty-bonuses')state.bonusTransactions=[];
state.dataError=DEMO_STATE;

const screens=[...document.querySelectorAll('.screen')];
const nav=document.getElementById('bottomNav');
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
let toastTimer=null;
function showToast(message){
  const toast=document.getElementById('toast');if(!toast)return;
  toast.textContent=message;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),1800);
}
function pulseNav(screen){
  const item=document.querySelector(`.nav-item[data-screen="${screen}"]`);if(!item)return;
  item.classList.remove('bump');void item.offsetWidth;item.classList.add('bump');
  setTimeout(()=>item.classList.remove('bump'),420);
}
function hasDiscount(p){const base=Number(p?.price)||0,discount=Number(p?.discountPrice)||0;return discount>0&&discount<base}
function productPrice(p){return hasDiscount(p)?Number(p.discountPrice):Number(p.price)||0}
function productDiscount(p,qty=1){return hasDiscount(p)?(Number(p.price)-productPrice(p))*qty:0}
function discountPercent(p){return hasDiscount(p)?Math.round((1-productPrice(p)/Number(p.price))*100):0}
function priceMarkup(p,qty=1,extraClass=''){const current=productPrice(p)*qty;return `<span class="price-stack ${extraClass}"><span class="price-current">${money(current)}</span>${hasDiscount(p)?`<span class="price-old">${money(Number(p.price)*qty)}</span>`:''}</span>`}
function cartOriginalSubtotal(){return state.cart.reduce((sum,item)=>{const p=productById(item.id);return sum+(p?(Number(p.price)||0)*item.qty:0)},0)}
function cartDiscountTotal(){return state.cart.reduce((sum,item)=>{const p=productById(item.id);return sum+(p?productDiscount(p,item.qty):0)},0)}
function showScreen(name, push=true){
  if(push && state.screen!==name) state.previous=state.screen;
  state.screen=name;
  screens.forEach(s=>s.classList.toggle('active',s.id===name));
  nav.hidden=name==='home';
  const profileScreens=['profile','bonuses','orders','orderDetail'];
  const cartScreens=['cart','checkout','orderSuccess'];
  const catalogScreens=['catalog','product','news','newsDetail'];
  const activeNav=profileScreens.includes(name)?'profile':cartScreens.includes(name)?'cart':catalogScreens.includes(name)?'catalog':name;
  const navItems=[...document.querySelectorAll('.nav-item')];
  navItems.forEach(b=>b.classList.toggle('active',b.dataset.screen===activeNav));
  const activeIndex=Math.max(0,navItems.findIndex(b=>b.dataset.screen===activeNav));
  nav.style.setProperty('--nav-left',`${activeIndex*25+6.25}%`);
  window.scrollTo({top:0,behavior:'auto'});
  if(name==='home') renderHomeNews();
  if(name==='catalog') renderCatalog();
  if(name==='favorites') renderFavorites();
  if(name==='cart') renderCart();
  if(name==='checkout') renderCheckout();
  if(name==='orderSuccess') renderOrderSuccess();
  if(name==='profile') renderProfileSummary();
  if(name==='bonuses') renderBonuses();
  if(name==='orders') renderOrders();
  if(name==='orderDetail') renderOrderDetail();
  if(name==='news') renderNews();
  if(name==='newsDetail') renderNewsDetail();
}

function renderNews(){
  const box=document.getElementById('newsList');if(!box)return;
  const count=document.getElementById('newsCount');if(count)count.textContent=`${NEWS.length} ${NEWS.length===1?'НОВОСТЬ':NEWS.length>=2&&NEWS.length<=4?'НОВОСТИ':'НОВОСТЕЙ'}`;
  if(state.dataError==='news-error'){
    box.innerHTML=emptyStateMarkup({type:'error',title:'НЕ УДАЛОСЬ ЗАГРУЗИТЬ',text:'Проверьте подключение и попробуйте обновить новости.',action:'ПОВТОРИТЬ',actionAttr:'data-retry="news"',className:'compact'});return;
  }
  if(!NEWS.length){
    box.innerHTML=emptyStateMarkup({type:'news',title:'НОВОСТЕЙ ПОКА НЕТ',text:'Здесь появятся новые поступления, скидки и обновления магазина.',action:'ПЕРЕЙТИ В КАТАЛОГ',go:'catalog',className:'compact'});return;
  }
  box.innerHTML=NEWS.map((item,index)=>`<button class="news-list-card" data-news-id="${index}"><div class="news-list-media"><img src="${item.image}" alt="${item.title}"></div><div class="news-list-copy"><div class="news-list-meta"><span>${item.category}</span><span>${item.date}</span></div><h3>${item.title}</h3><p>${item.excerpt}</p><span class="news-list-link">ОТКРЫТЬ НОВОСТЬ <b>→</b></span></div></button>`).join('');
}
function renderNewsDetail(){
  const item=NEWS[state.selectedNews]||NEWS[0];
  const box=document.getElementById('newsDetailBody');if(!box)return;
  if(!item){box.innerHTML=emptyStateMarkup({type:'news',title:'НОВОСТЬ НЕДОСТУПНА',text:'Материал был скрыт или ещё не опубликован.',action:'ВСЕ НОВОСТИ',actionAttr:'data-news-back',className:'compact'});return;}
  box.innerHTML=`<div class="news-detail-image"><img src="${item.image}" alt="${item.title}"></div><div class="news-detail-body"><div class="news-detail-meta"><span>${item.category}</span><span>${item.date}</span></div><h1 class="news-detail-title">${item.title}</h1><div class="news-detail-text">${item.body.map(p=>`<p>${p}</p>`).join('')}</div><div class="news-detail-actions"><button class="black-btn" data-news-action>${item.action.label}</button><button class="outline-btn" data-news-back>\u0412\u0421\u0415 \u041d\u041e\u0412\u041e\u0421\u0422\u0418</button></div></div>`;
}
function openNews(index){state.selectedNews=Math.max(0,Math.min(NEWS.length-1,Number(index)||0));showScreen('newsDetail')}
function runNewsAction(){
  const item=NEWS[state.selectedNews]||NEWS[0];if(!item||!item.action)return;
  if(item.action.type==='catalog'){showScreen('catalog');return}
  if(item.action.type==='product'){openProduct(Number(item.action.product)||0);return}
  if(item.action.type==='external'){
    const url=item.action.url;
    if(window.Telegram?.WebApp?.openTelegramLink&&/^https:\/\/t\.me\//.test(url)){window.Telegram.WebApp.openTelegramLink(url)}
    else window.open(url,'_blank','noopener');
  }
}

function iconHeart(on=false){return `<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>`}
function emptyIcon(type='box'){
  const icons={
    cart:'<path d="M5 8h14l1 13H4L5 8Zm4 0V6a3 3 0 0 1 6 0v2"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    orders:'<path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10"/>',
    bonus:'<path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7Z"/><path d="M9 7v12M15 7v12"/>',
    news:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
    error:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
    box:'<path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[type]||icons.box}</svg>`;
}
function emptyStateMarkup({type='box',title='ПОКА ПУСТО',text='',action='',go='',actionAttr='',secondary='',secondaryGo='',className=''}){
  const primary=action?`<button class="black-btn" ${go?`data-go="${go}"`:actionAttr}>${action}</button>`:'';
  const second=secondary?`<button class="outline-btn" ${secondaryGo?`data-go="${secondaryGo}"`:''}>${secondary}</button>`:'';
  return `<section class="empty-state ${className}"><span class="empty-state-icon">${emptyIcon(type)}</span><h2>${title}</h2>${text?`<p>${text}</p>`:''}${primary||second?`<div class="empty-state-actions">${primary}${second}</div>`:''}</section>`;
}
function availableSizes(p){const blocked=new Set(p?.unavailableSizes||[]);return (p?.sizes||[]).filter(size=>!blocked.has(size))}
function productSoldOut(p){return availableSizes(p).length===0}
function productCard(p,index,mode='catalog'){
  const favorite=state.favorites.has(String(p.id)),soldOut=productSoldOut(p);
  const action=soldOut?'НЕТ В НАЛИЧИИ':mode==='favorites'?'УБРАТЬ ИЗ ИЗБРАННОГО':'ДОБАВИТЬ В КОРЗИНУ';
  return `<article class="product-card" data-card="${index}"><div class="product-image"><img src="${p.image}" alt="${p.name}">${hasDiscount(p)?`<span class="discount-mark">−${discountPercent(p)}%</span>`:''}<button class="favorite-dot ${favorite?'on':''}" data-fav="${escapeHtml(p.id)}" aria-label="Избранное">${iconHeart(favorite)}</button></div><div class="product-meta"><p class="product-code">${p.code}</p><p class="product-desc">${p.brand}</p>${priceMarkup(p)}<button class="product-action" data-action="${mode==='favorites'?'unfav':'add'}" data-id="${index}" ${soldOut?'disabled':''}>${action}</button></div></article>`
}
function defaultFilters(){return {category:'all',brand:'all',size:'all',priceMin:'',priceMax:''}}
function productCategory(p){
  if(p?.category)return p.category;
  const text=`${p?.desc||''} ${p?.name||''}`.toLowerCase();
  if(/шорт|short/.test(text))return 'shorts';
  if(/свитшот|sweatshirt|crewneck/.test(text))return 'sweatshirts';
  return 'other';
}
function matchesPriceRange(p,filters=state.filters){
  const price=productPrice(p);
  const minRaw=String(filters?.priceMin??'').trim();
  const maxRaw=String(filters?.priceMax??'').trim();
  const min=minRaw===''?null:Number(minRaw);
  const max=maxRaw===''?null:Number(maxRaw);
  if(min!==null&&Number.isFinite(min)&&price<min)return false;
  if(max!==null&&Number.isFinite(max)&&price>max)return false;
  return true;
}
function activeFilterCount(filters=state.filters){
  let count=['category','brand','size'].reduce((sum,key)=>sum+(filters[key]&&filters[key]!=='all'?1:0),0);
  if(String(filters?.priceMin??'').trim()||String(filters?.priceMax??'').trim())count++;
  return count;
}
function normalizePriceRange(filters){
  const next={...filters};
  const min=String(next.priceMin??'').replace(/\D/g,'');
  const max=String(next.priceMax??'').replace(/\D/g,'');
  next.priceMin=min;
  next.priceMax=max;
  if(min&&max&&Number(min)>Number(max)){
    next.priceMin=max;
    next.priceMax=min;
  }
  return next;
}
function updateFilterButton(){
  const button=document.getElementById('filterBtn');if(!button)return;
  const count=activeFilterCount();
  button.innerHTML=count?`ФИЛЬТРЫ <span>(${count})</span>`:'ФИЛЬТРЫ&nbsp;&nbsp;+';
}
function updateSortButton(){
  const button=document.getElementById('sortBtn');if(!button)return;
  button.innerHTML=`ЦЕНА <span>${state.sortAsc?'↑':'↓'}</span>`;
  button.setAttribute('aria-label',state.sortAsc?'Сначала дешевле':'Сначала дороже');
}
function filterChoice({label,value,key}){
  const selected=(state.filterDraft||state.filters)[key]===value;
  return `<button class="filter-choice ${selected?'active':''}" data-filter-key="${key}" data-filter-value="${value}"><span>${label}</span><span class="filter-check">✓</span></button>`;
}
function filterChip({label,value,key}){
  const selected=(state.filterDraft||state.filters)[key]===value;
  return `<button class="filter-chip ${selected?'active':''}" data-filter-key="${key}" data-filter-value="${value}">${label}</button>`;
}
function renderFilterDrawer(){
  const body=document.getElementById('drawerBody');if(!body)return;
  if(!state.filterDraft)state.filterDraft={...state.filters};
  const brands=[...new Set(PRODUCTS.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
  const sizeOrder=['XXS','XS','S','M','L','XL','XXL','XXXL'];
  const sizes=[...new Set(PRODUCTS.flatMap(p=>availableSizes(p)))].sort((a,b)=>{const ai=sizeOrder.indexOf(String(a).toUpperCase()),bi=sizeOrder.indexOf(String(b).toUpperCase());return (ai<0?999:ai)-(bi<0?999:bi)||String(a).localeCompare(String(b),'ru')});
  const categoryOptions=[['ВСЕ ТОВАРЫ','all'],...Object.entries(CATEGORY_LABELS).filter(([value])=>PRODUCTS.some(product=>productCategory(product)===value)).map(([value,label])=>[label,value]),['ТОВАРЫ СО СКИДКОЙ','sale']];
  const categories=`<div class="filter-section"><p class="filter-section-title">Категория</p>${categoryOptions.map(([label,value])=>filterChoice({label,value,key:'category'})).join('')}</div>
  <div class="filter-section"><p class="filter-section-title">Размер</p><div class="filter-chips">${filterChip({label:'ВСЕ',value:'all',key:'size'})}${sizes.map(size=>filterChip({label:size,value:size,key:'size'})).join('')}</div></div>
  <div class="filter-section"><p class="filter-section-title">Цена</p><div class="price-range"><label class="price-range-field"><span>ОТ</span><div><input type="text" inputmode="numeric" autocomplete="off" placeholder="0" value="${state.filterDraft.priceMin||''}" data-price-filter="priceMin"><b>₽</b></div></label><label class="price-range-field"><span>ДО</span><div><input type="text" inputmode="numeric" autocomplete="off" placeholder="БЕЗ ОГРАНИЧЕНИЯ" value="${state.filterDraft.priceMax||''}" data-price-filter="priceMax"><b>₽</b></div></label></div></div>`;
  const brandPanel=`<div class="filter-section"><p class="filter-section-title">Бренд</p>${filterChoice({label:'ВСЕ БРЕНДЫ',value:'all',key:'brand'})}${brands.map(brand=>filterChoice({label:brand,value:brand,key:'brand'})).join('')}</div>`;
  const draftCount=activeFilterCount(state.filterDraft);
  body.innerHTML=`<div class="drawer-tabs"><button class="drawer-tab ${state.filterTab==='categories'?'active':''}" data-filter-tab="categories">КАТЕГОРИИ</button><button class="drawer-tab ${state.filterTab==='brands'?'active':''}" data-filter-tab="brands">БРЕНДЫ</button></div><div class="filter-panel">${state.filterTab==='brands'?brandPanel:categories}</div><div class="filter-summary" data-filter-summary>${draftCount?`ВЫБРАНО ФИЛЬТРОВ: ${draftCount}`:'ФИЛЬТРЫ НЕ ВЫБРАНЫ'}</div><div class="drawer-footer"><div class="filter-footer-actions"><button class="filter-reset-btn" data-filter-reset>СБРОСИТЬ</button><button class="black-btn" data-apply-filter>ПОКАЗАТЬ</button></div></div>`;
}
function renderCatalog(){
  const input=document.getElementById('searchInput');
  const q=(input?.value||'').trim().toLowerCase();
  const grid=document.getElementById('catalogGrid');if(!grid)return;
  updateFilterButton();
  if(state.dataError==='catalog-error'){
    grid.innerHTML=emptyStateMarkup({type:'error',title:'КАТАЛОГ НЕ ЗАГРУЗИЛСЯ',text:'Попробуйте загрузить товары ещё раз.',action:'ПОВТОРИТЬ',actionAttr:'data-retry="catalog"'});return;
  }
  let list=PRODUCTS.map((p,i)=>({p,i}))
    .filter(x=>!productSoldOut(x.p))
    .filter(({p})=>state.filters.category==='all'||(state.filters.category==='sale'?hasDiscount(p):productCategory(p)===state.filters.category))
    .filter(({p})=>state.filters.brand==='all'||p.brand===state.filters.brand)
    .filter(({p})=>state.filters.size==='all'||availableSizes(p).includes(state.filters.size))
    .filter(({p})=>matchesPriceRange(p,state.filters))
    .filter(({p})=>!q||`${p.code} ${p.brand} ${p.desc} ${p.name}`.toLowerCase().includes(q));
  list.sort((a,b)=>state.sortAsc?productPrice(a.p)-productPrice(b.p):productPrice(b.p)-productPrice(a.p));
  updateSortButton();
  if(list.length){grid.innerHTML=list.map(x=>productCard(x.p,x.i)).join('');return}
  if(q){grid.innerHTML=emptyStateMarkup({type:'search',title:'НИЧЕГО НЕ НАЙДЕНО',text:`По запросу «${escapeHtml(input.value.trim())}» товаров нет. Попробуйте изменить запрос.`,action:'СБРОСИТЬ ПОИСК',actionAttr:'data-reset-search'});return}
  grid.innerHTML=emptyStateMarkup({type:'box',title:'В ЭТОМ РАЗДЕЛЕ ПУСТО',text:'По выбранным фильтрам пока нет доступных товаров.',action:'СБРОСИТЬ ФИЛЬТРЫ',actionAttr:'data-reset-filter'});
}
function renderFavorites(){
  const list=[...state.favorites].map(id=>({p:productById(id),i:productIndexById(id)})).filter(item=>item.p&&item.i>=0);
  const grid=document.getElementById('favoritesGrid');if(!grid)return;
  grid.innerHTML=list.length?list.map(({p,i})=>productCard(p,i,'favorites')).join(''):emptyStateMarkup({type:'heart',title:'ИЗБРАННОЕ ПУСТО',text:'Сохраняйте понравившиеся товары, чтобы быстро вернуться к ним позже.',action:'ПЕРЕЙТИ В КАТАЛОГ',go:'catalog'});
  document.querySelectorAll('[data-fav-tab-count]').forEach(el=>el.textContent=String(list.length).padStart(2,'0'));
  updateCounts();
}
function renderCart(){
  state.cart=state.cart.filter(item=>productById(item.id));
  const box=document.getElementById('cartList');
  if(!state.cart.length){box.innerHTML=emptyStateMarkup({type:'cart',title:'КОРЗИНА ПУСТА',text:'Добавьте товар и выберите размер — он появится здесь.',action:'ПЕРЕЙТИ В КАТАЛОГ',go:'catalog'});document.getElementById('cartSummary').innerHTML='';updateCounts();return}
  box.innerHTML=state.cart.map((item,idx)=>{const p=productById(item.id);return `<article class="cart-item"><div class="cart-image"><img src="${p.image}" alt="${p.name}">${hasDiscount(p)?`<span class="discount-mark">−${discountPercent(p)}%</span>`:''}</div><div class="cart-info"><button class="cart-remove" data-remove="${idx}">×</button><p class="product-code">${p.code}</p><p class="product-brand">${p.brand}</p><p class="product-desc" style="margin-top:16px">РАЗМЕР: ${item.size}</p><div class="qty"><button data-qty="-1" data-index="${idx}">−</button><span>${item.qty}</span><button data-qty="1" data-index="${idx}">+</button></div>${priceMarkup(p,item.qty)}</div></article>`}).join('');
  const original=cartOriginalSubtotal(),discount=cartDiscountTotal(),total=cartSubtotal();
  document.getElementById('cartSummary').innerHTML=`<div class="summary-row"><span>${discount?'СТОИМОСТЬ ТОВАРОВ':`ТОВАРЫ (${state.cart.reduce((s,x)=>s+x.qty,0)})`}</span><span>${money(discount?original:total)}</span></div>${discount?`<div class="summary-row discount"><span>СКИДКА</span><span>− ${money(discount)}</span></div>`:''}<div class="summary-row"><span>ДОСТАВКА</span><span>УТОЧНЯЕТСЯ</span></div><div class="summary-row total"><span>ИТОГО</span><span>${money(total)}</span></div><button class="black-btn" id="checkoutBtn">ОФОРМИТЬ ЗАКАЗ</button>`;
  updateCounts();
}
function cartSubtotal(){return state.cart.reduce((sum,item)=>{const p=productById(item.id);return sum+(p?productPrice(p)*item.qty:0)},0)}
function checkoutDeliveryLabel(key){return key==='pickup'?'Самовывоз':key==='europost'?'Европочта':key==='belpost'?'Белпочта':'Не выбран'}
function checkoutPlace(){
  const c=state.checkout;
  if(c.delivery==='europost')return `Отделение Европочты ${c.europostBranch}`.trim();
  if(c.delivery==='belpost')return [c.address,`Индекс ${c.postalIndex}`,`Отделение ${c.postOffice}`].filter(Boolean).join(', ');
  return 'MESTNIY STORE';
}
function pickupCartText(){
  const lines=state.cart.map(item=>{const p=productById(item.id);return `${p.brand} · ${p.code} · размер ${item.size} · ${item.qty} шт.`});
  return `Здравствуйте! Хочу оформить самовывоз из MESTNIY STORE.

${lines.join(String.fromCharCode(10))}

Итого: ${money(cartSubtotal())}`;
}
function openPickupManager(){
  const url=`https://t.me/manager_of_mestniy?text=${encodeURIComponent(pickupCartText())}`;
  try{if(window.Telegram?.WebApp?.openTelegramLink){window.Telegram.WebApp.openTelegramLink(url);return}}catch(_e){}
  window.open(url,'_blank','noopener');
}
function checkoutItemsMarkup(){
  return state.cart.map(item=>{const p=productById(item.id);return `<article class="checkout-item"><img src="${p.image}" alt="${p.brand}"><div class="checkout-item-copy"><strong>${p.brand}</strong><span>${p.code}<br>Размер: ${item.size} · ${item.qty} шт.</span></div><span class="checkout-item-price">${priceMarkup(p,item.qty,'line-price-stack')}</span></article>`}).join('');
}
function renderCheckoutSummary(){
  const box=document.getElementById('checkoutSummary');if(!box)return;
  const subtotal=cartSubtotal(),original=cartOriginalSubtotal(),discount=cartDiscountTotal();
  const applied=Math.max(0,Math.min(Number(state.checkout.bonuses)||0,state.bonusBalance,subtotal));
  state.checkout.bonuses=applied;
  box.innerHTML=`<div class="summary-row"><span>${discount?'СТОИМОСТЬ ТОВАРОВ':`ТОВАРЫ (${state.cart.reduce((s,x)=>s+x.qty,0)})`}</span><span>${money(discount?original:subtotal)}</span></div>${discount?`<div class="summary-row discount"><span>СКИДКА</span><span>− ${money(discount)}</span></div>`:''}${applied?`<div class="summary-row"><span>БОНУСЫ</span><span>− ${money(applied)}</span></div>`:''}<div class="summary-row"><span>ДОСТАВКА</span><span>ПО ТАРИФАМ СЛУЖБЫ</span></div><div class="summary-row total"><span>К ОПЛАТЕ</span><span>${money(subtotal-applied)}</span></div>`;
}
function renderCheckout(){
  if(!state.cart.length){showScreen('cart',false);return}
  const c=state.checkout;
  let recipientSection='';
  if(c.delivery==='europost'){
    recipientSection=`<section class="checkout-section"><h2 class="checkout-title">ДАННЫЕ ПОЛУЧАТЕЛЯ</h2><div class="form-grid"><div class="field"><label for="checkoutName">ФИО</label><input id="checkoutName" data-checkout-field="name" value="${escapeHtml(c.name)}" placeholder="Фамилия Имя Отчество"></div><div class="field"><label for="checkoutPhone">Номер телефона</label><input id="checkoutPhone" data-checkout-field="phone" value="${escapeHtml(c.phone)}" inputmode="tel" placeholder="+375"></div><div class="field"><label for="checkoutEuropostBranch">Отделение Европочты</label><input id="checkoutEuropostBranch" data-checkout-field="europostBranch" value="${escapeHtml(c.europostBranch)}" placeholder="Номер или адрес отделения"></div><div class="field"><label for="checkoutComment">Комментарий к заказу</label><textarea id="checkoutComment" data-checkout-field="comment" placeholder="Необязательно">${escapeHtml(c.comment)}</textarea></div></div></section>`;
  }else if(c.delivery==='belpost'){
    recipientSection=`<section class="checkout-section"><h2 class="checkout-title">ДАННЫЕ ПОЛУЧАТЕЛЯ</h2><div class="form-grid"><div class="field"><label for="checkoutName">ФИО</label><input id="checkoutName" data-checkout-field="name" value="${escapeHtml(c.name)}" placeholder="Фамилия Имя Отчество"></div><div class="field"><label for="checkoutPhone">Номер телефона</label><input id="checkoutPhone" data-checkout-field="phone" value="${escapeHtml(c.phone)}" inputmode="tel" placeholder="+375"></div><div class="field"><label for="checkoutAddress">Адрес</label><input id="checkoutAddress" data-checkout-field="address" value="${escapeHtml(c.address)}" placeholder="Город, улица, дом, квартира"></div><div class="field"><label for="checkoutPostalIndex">Почтовый индекс</label><input id="checkoutPostalIndex" data-checkout-field="postalIndex" value="${escapeHtml(c.postalIndex)}" inputmode="numeric" maxlength="6" placeholder="220000"></div><div class="field"><label for="checkoutPostOffice">Номер отделения Белпочты</label><input id="checkoutPostOffice" data-checkout-field="postOffice" value="${escapeHtml(c.postOffice)}" placeholder="Например, №25"></div><div class="field"><label for="checkoutComment">Комментарий к заказу</label><textarea id="checkoutComment" data-checkout-field="comment" placeholder="Необязательно">${escapeHtml(c.comment)}</textarea></div></div></section>`;
  }else{
    recipientSection=`<section class="checkout-section"><p class="checkout-note" style="margin:0">Выберите Европочту или Белпочту для оформления заявки. Самовывоз оформляется напрямую через менеджера.</p></section>`;
  }
  syncBonusBalance();
  const maxBonus=Math.min(state.bonusBalance,cartSubtotal());
  const bonusesApplied=Number(c.bonuses)>0;
  const bonusSection=state.bonusBalance>0
    ? `<section class="checkout-section"><h2 class="checkout-title">ИСПОЛЬЗОВАТЬ БОНУСЫ</h2><p class="checkout-note">К заказу применяются все доступные бонусы одной кнопкой. Выбрать только часть бонусов нельзя.</p><button class="bonus-toggle ${bonusesApplied?'active':''}" data-bonus-toggle>${bonusesApplied?'БОНУСЫ ПРИМЕНЕНЫ':'ИСПОЛЬЗОВАТЬ ВСЕ БОНУСЫ'}</button><div class="bonus-availability"><span>ДОСТУПНО: ${formatBonus(state.bonusBalance)}</span><span>${bonusesApplied?`БУДЕТ ИСПОЛЬЗОВАНО: ${formatBonus(maxBonus)}`:'НЕ ПРИМЕНЕНЫ'}</span></div></section>`
    : `<section class="checkout-section"><h2 class="checkout-title">ИСПОЛЬЗОВАТЬ БОНУСЫ</h2><button class="bonus-toggle" disabled>У ВАС ПОКА НЕТ БОНУСОВ</button><p class="checkout-note" style="margin:14px 0 0">Бонусы появятся после завершенных покупок или ручного начисления администратором.</p></section>`;
  document.getElementById('checkoutBody').innerHTML=`
    <section class="checkout-section"><h2 class="checkout-title">ВАШ ЗАКАЗ</h2><div class="checkout-items">${checkoutItemsMarkup()}</div></section>
    <section class="checkout-section"><h2 class="checkout-title">СПОСОБ ПОЛУЧЕНИЯ</h2><div class="delivery-grid"><button class="delivery-option" data-delivery="pickup"><span class="delivery-radio"></span><span>САМОВЫВОЗ — НАПИСАТЬ МЕНЕДЖЕРУ</span></button><button class="delivery-option ${c.delivery==='europost'?'active':''}" data-delivery="europost"><span class="delivery-radio"></span><span>ЕВРОПОЧТА</span></button><button class="delivery-option ${c.delivery==='belpost'?'active':''}" data-delivery="belpost"><span class="delivery-radio"></span><span>БЕЛПОЧТА</span></button></div></section>
    ${recipientSection}
    ${bonusSection}
    <section class="checkout-section"><h2 class="checkout-title">ИТОГО</h2><div class="checkout-summary" id="checkoutSummary"></div><button class="black-btn checkout-submit" id="confirmOrderBtn" ${c.delivery?'':'disabled'}>ПОДТВЕРДИТЬ ЗАКАЗ</button><div class="form-error" id="checkoutError"></div></section>`;
  renderCheckoutSummary();
}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function validateCheckout(){
  const c=state.checkout;
  if(!state.cart.length)return 'Корзина пуста.';
  if(!c.delivery)return 'Выберите способ получения.';
  if(c.delivery==='pickup')return '';
  if(c.name.trim().length<5)return 'Укажите ФИО получателя.';
  if(c.phone.replace(/\D/g,'').length<7)return 'Укажите корректный номер телефона.';
  if(c.delivery==='europost'&&!c.europostBranch.trim())return 'Укажите отделение Европочты.';
  if(c.delivery==='belpost'&&!c.address.trim())return 'Укажите адрес получателя.';
  if(c.delivery==='belpost'&&c.postalIndex.replace(/\D/g,'').length!==6)return 'Укажите шестизначный почтовый индекс.';
  if(c.delivery==='belpost'&&!c.postOffice.trim())return 'Укажите номер отделения Белпочты.';
  return '';
}
function createPrototypeOrder(){
  const error=validateCheckout();
  const errorBox=document.getElementById('checkoutError');
  if(error){if(errorBox){errorBox.textContent=error;errorBox.classList.add('show')}return}
  if(errorBox)errorBox.classList.remove('show');
  syncBonusBalance();
  const nextId=String(Math.max(0,...ORDERS.map(order=>Number(order.id)||0))+1).padStart(4,'0');
  const bonuses=Math.max(0,Math.min(Number(state.checkout.bonuses)||0,state.bonusBalance,cartSubtotal()));
  const orderDate=new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'long',year:'numeric'}).format(new Date());
  const newOrder={id:nextId,date:orderDate,status:'accepted',items:state.cart.map(item=>{const p=productById(item.id);return {productId:p?.id,product:productIndexById(p?.id),snapshot:orderItemSnapshot(p),size:item.size,qty:item.qty,unitPrice:p?productPrice(p):0,oldUnitPrice:p?(Number(p.price)||productPrice(p)):0}}),delivery:checkoutDeliveryLabel(state.checkout.delivery),place:checkoutPlace(),recipient:state.checkout.name.trim(),phone:state.checkout.phone.trim(),comment:state.checkout.comment.trim(),bonuses,bonusEarned:0};
  sendOrderToBot(buildOrderPayload());
  ORDERS.unshift(newOrder);
  if(bonuses>0){
    state.bonusTransactions.unshift({id:`b-${nextId}-use`,type:'spend',amount:-bonuses,date:orderDate,title:'Использовано в заказе',orderId:nextId});
  }
  syncBonusBalance();
  state.lastCreatedOrder=newOrder;
  state.selectedOrder=0;
  state.cart=[];
  state.checkout={delivery:'',name:'',phone:'',europostBranch:'',address:'',postalIndex:'',postOffice:'',comment:'',bonuses:0};
  persistState();
  renderCart();renderOrders();renderProfileSummary();renderBonuses();updateCounts();
  showScreen('orderSuccess');
}
function renderOrderSuccess(){
  const order=state.lastCreatedOrder||ORDERS[0];
  const box=document.getElementById('orderSuccessBody');if(!box||!order)return;
  const expected=calculateOrderBonus(order);
  box.innerHTML=`<div class="success-wrap"><div class="success-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></div><div class="success-kicker">ЗАЯВКА СОЗДАНА</div><h1 class="success-title">ЗАКАЗ №${order.id}<br>ПРИНЯТ</h1><p class="success-copy">Заказ уже появился в разделе «Мои покупки». Все изменения статуса будут отображаться там и приходить сообщением от бота.</p><div class="success-card"><div class="success-row"><span>СТАТУС</span><strong>${ORDER_STATUS[order.status]}</strong></div><div class="success-row"><span>ПОЛУЧЕНИЕ</span><strong>${order.delivery}</strong></div>${order.bonuses?`<div class="success-row"><span>ИСПОЛЬЗОВАНО БОНУСОВ</span><strong>${formatBonus(order.bonuses)}</strong></div>`:''}<div class="success-row"><span>К ОПЛАТЕ</span><strong>${money(orderTotal(order))}</strong></div></div><div class="bonus-order-note">После статуса «Завершен» за эту покупку будет начислено ${formatBonus(expected)}.</div><div class="success-actions"><button class="black-btn" data-success-orders>МОИ ПОКУПКИ</button><button class="outline-btn" data-go="catalog">ВЕРНУТЬСЯ В КАТАЛОГ</button></div></div>`;
}
function openProduct(index){
  state.selectedProduct=index;state.selectedSize=null;const p=PRODUCTS[index];if(!p)return;
  const blocked=new Set(p.unavailableSizes||[]),available=availableSizes(p),soldOut=!available.length;
  document.getElementById('detailImage').src=p.image;
  document.getElementById('detailTitle').textContent=p.code+'  '+p.brand;
  document.getElementById('detailDesc').textContent=soldOut?'Эта позиция временно закончилась. Товар снова станет доступен после обновления остатков.':(p.desc||'Оригинальная позиция из актуального наличия MESTNIY STORE. Выберите размер перед добавлением в корзину.');
  document.getElementById('detailPrice').innerHTML=priceMarkup(p);
  const sizeRow=document.getElementById('sizeRow');
  sizeRow.innerHTML=(p.sizes||[]).map(size=>`<button class="size-btn" data-size="${size}" ${blocked.has(size)?'disabled':''}>${size}</button>`).join('')||'<p class="stock-note">ДОСТУПНЫХ РАЗМЕРОВ НЕТ</p>';
  sizeRow.style.setProperty('--size-opacity','0');
  sizeRow.style.setProperty('--size-width','0px');
  const add=document.getElementById('detailAdd');add.disabled=soldOut;add.textContent=soldOut?'НЕТ В НАЛИЧИИ':'ДОБАВИТЬ В КОРЗИНУ';
  showScreen('product');
}
function moveSizeIndicator(button,immediate=false){
  const row=button?.closest('.size-row');if(!row)return;
  if(immediate)row.classList.add('indicator-no-motion');
  row.style.setProperty('--size-left',`${button.offsetLeft}px`);
  row.style.setProperty('--size-width',`${button.offsetWidth}px`);
  row.style.setProperty('--size-opacity','1');
  if(immediate)requestAnimationFrame(()=>requestAnimationFrame(()=>row.classList.remove('indicator-no-motion')));
}
function addToCart(index,size){const p=PRODUCTS[index];if(!p)return;const chosen=size||availableSizes(p)[0];if(!chosen)return;const existing=state.cart.find(x=>String(x.id)===String(p.id)&&x.size===chosen);if(existing)existing.qty++;else state.cart.push({id:String(p.id),size:chosen,qty:1});persistState();updateCounts();pulseNav('cart');showToast('Товар добавлен в корзину');}
function toggleFav(productId){const id=String(productId);const added=!state.favorites.has(id);added?state.favorites.add(id):state.favorites.delete(id);persistState();renderCatalog();if(state.screen==='favorites')renderFavorites();updateCounts();pulseNav('favorites');showToast(added?'Добавлено в избранное':'Удалено из избранного');}
function updateCounts(){const qty=state.cart.reduce((s,x)=>s+x.qty,0);const badge=document.getElementById('cartBadge');badge.textContent=qty;badge.classList.toggle('show',qty>0);const fav=document.getElementById('profileFavCount');if(fav)fav.textContent=state.favorites.size;const cart=document.getElementById('profileCartCount');if(cart)cart.textContent=qty;}
function formatBonus(value){return new Intl.NumberFormat('ru-RU').format(Math.max(0,Math.floor(Number(value)||0)))}
function syncBonusBalance(){state.bonusBalance=Math.max(0,state.bonusTransactions.reduce((sum,item)=>sum+Number(item.amount||0),0));return state.bonusBalance}
function bonusRateForAmount(amount){const value=Math.max(0,Number(amount)||0);return BONUS_RULES.find(rule=>value<=rule.max)?.rate||3.5}
function calculateOrderBonus(order){const base=Math.max(0,orderTotal(order));return Math.floor(base*bonusRateForAmount(base)/100)}
function bonusTransactionMeta(item){
  if(item.orderId)return `ЗАКАЗ №${item.orderId} · ${item.date}`;
  return `${item.subtitle||'ОПЕРАЦИЯ В БОНУСНОЙ СИСТЕМЕ'} · ${item.date}`;
}
function renderBonuses(){
  syncBonusBalance();
  const formatted=formatBonus(state.bonusBalance);
  const balance=document.getElementById('bonusBalanceNumber');if(balance)balance.textContent=formatted;
  const profileBalance=document.getElementById('profileBonusBalance');if(profileBalance)profileBalance.textContent=formatted;
  const status=document.getElementById('bonusStatusText');if(status)status.textContent=state.bonusBalance>0?'Бонусы можно применить при оформлении заказа одной кнопкой.':'У вас пока нет бонусов. Они появятся после завершенной покупки или ручного начисления.';
  const count=document.getElementById('bonusHistoryCount');if(count)count.textContent=`${state.bonusTransactions.length} ${state.bonusTransactions.length===1?'ОПЕРАЦИЯ':state.bonusTransactions.length>1&&state.bonusTransactions.length<5?'ОПЕРАЦИИ':'ОПЕРАЦИЙ'}`;
  const history=document.getElementById('bonusHistory');if(!history)return;
  if(!state.bonusTransactions.length){history.innerHTML=emptyStateMarkup({type:'bonus',title:'БОНУСОВ ПОКА НЕТ',text:'Здесь появятся начисления за завершённые покупки, использование и ручные начисления.',action:'ПЕРЕЙТИ В КАТАЛОГ',go:'catalog',className:'inline'});return}
  history.innerHTML=state.bonusTransactions.map(item=>{
    const positive=Number(item.amount)>=0;
    const sign=positive?'+':'−';
    const icon=positive?'↑':'↓';
    return `<article class="bonus-item ${positive?'is-positive':'is-negative'}"><span class="bonus-item-icon">${icon}</span><div><h4>${item.title}</h4><p>${bonusTransactionMeta(item)}</p></div><strong>${sign} ${formatBonus(Math.abs(item.amount))}</strong></article>`;
  }).join('');
}

const ORDER_STATUS={accepted:'Принят',shipped:'Отправлен',ready:'Готов к выдаче',completed:'Завершен',canceled:'Отменен'};
const ORDER_STEPS=[
  {key:'accepted',label:'Принят',text:'Заказ принят магазином в работу'},
  {key:'shipped',label:'Отправлен',text:'Товар передан в доставку'},
  {key:'ready',label:'Готов к выдаче',text:'Заказ ожидает получения'},
  {key:'completed',label:'Завершен',text:'Покупка успешно завершена'}
];
function orderUnitPrice(item,p){return Number.isFinite(Number(item.unitPrice))?Number(item.unitPrice):productPrice(p)}
function orderOldUnitPrice(item,p){return Number.isFinite(Number(item.oldUnitPrice))?Number(item.oldUnitPrice):Number(p.price)||orderUnitPrice(item,p)}
function orderSubtotal(order){return order.items.reduce((sum,item)=>sum+orderUnitPrice(item,productForOrderItem(item))*item.qty,0)}
function orderOriginalSubtotal(order){return order.items.reduce((sum,item)=>sum+orderOldUnitPrice(item,productForOrderItem(item))*item.qty,0)}
function orderDiscountTotal(order){return Math.max(0,orderOriginalSubtotal(order)-orderSubtotal(order))}
function orderPriceMarkup(item,p,extraClass=''){const current=orderUnitPrice(item,p)*item.qty,old=orderOldUnitPrice(item,p)*item.qty;return `<span class="price-stack ${extraClass}"><span class="price-current">${money(current)}</span>${old>current?`<span class="price-old">${money(old)}</span>`:''}</span>`}
function orderTotal(order){return orderSubtotal(order)-Number(order.bonuses||0)}
function statusClass(status){return status==='completed'?'is-completed':status==='canceled'?'is-canceled':''}
function orderItemMarkup(item,detail=false){
  const p=productForOrderItem(item);
  if(detail)return `<article class="order-detail-item"><img src="${p.image}" alt="${p.brand}"><div><h4>${p.brand}</h4><p>${p.code}</p><p>РАЗМЕР: ${item.size}&nbsp;&nbsp;/&nbsp;&nbsp;КОЛ-ВО: ${item.qty}</p>${orderPriceMarkup(item,p)}</div></article>`;
  return `<div class="order-mini-item"><img src="${p.image}" alt="${p.brand}"><div class="order-mini-copy"><strong>${p.brand}</strong><span>${p.code}<br>Размер: ${item.size} · ${item.qty} шт.</span></div><span class="order-mini-price">${orderPriceMarkup(item,p,'line-price-stack')}</span></div>`;
}
function renderOrders(){
  const list=ORDERS.map((order,index)=>({order,index})).filter(({order})=>{
    if(state.orderFilter==='active')return ['accepted','shipped','ready'].includes(order.status);
    if(state.orderFilter==='completed')return order.status==='completed';
    if(state.orderFilter==='canceled')return order.status==='canceled';
    return true;
  });
  const count=document.getElementById('ordersCount');if(count)count.textContent=ORDERS.length;
  const box=document.getElementById('ordersList');
  box.innerHTML=list.length?list.map(({order,index})=>`<button class="order-card" data-order-index="${index}"><div class="order-card-head"><div><div class="order-number">ЗАКАЗ №${order.id}</div><span class="order-date">${order.date}</span></div><span class="order-status ${statusClass(order.status)}">${ORDER_STATUS[order.status]}</span></div><div class="order-items-preview">${order.items.map(item=>orderItemMarkup(item)).join('')}</div><div class="order-card-foot"><strong>${money(orderTotal(order))}</strong><span>ПОДРОБНЕЕ</span></div></button>`).join(''):emptyStateMarkup({type:'orders',title:ORDERS.length?'В ЭТОМ РАЗДЕЛЕ ПУСТО':'ПОКУПОК ПОКА НЕТ',text:ORDERS.length?'Заказов с выбранным статусом пока нет.':'После оформления заказа он появится здесь вместе со статусом и деталями.',action:ORDERS.length?'ПОКАЗАТЬ ВСЕ':'ПЕРЕЙТИ В КАТАЛОГ',go:ORDERS.length?'':'catalog',actionAttr:ORDERS.length?'data-order-show-all':''});
}
function renderOrderDetail(){
  const order=ORDERS[state.selectedOrder]||ORDERS[0];
  if(!order){document.getElementById('orderDetailHeader').textContent='ЗАКАЗ';document.getElementById('orderDetailBody').innerHTML=emptyStateMarkup({type:'orders',title:'ЗАКАЗ НЕ НАЙДЕН',text:'Возможно, заказ был удалён или ещё не создан.',action:'МОИ ПОКУПКИ',go:'orders'});return}
  document.getElementById('orderDetailHeader').textContent=`ЗАКАЗ №${order.id}`;
  const currentIndex=ORDER_STEPS.findIndex(step=>step.key===order.status);
  const timeline=order.status==='canceled'?`<div class="order-canceled-note">Заказ отменён. Если при оформлении использовались бонусы, они возвращаются на баланс пользователя.</div>`:`<section class="order-progress"><h3 class="order-progress-title">СТАТУС ЗАКАЗА</h3>${ORDER_STEPS.map((step,index)=>`<div class="progress-step ${index<=currentIndex?'done':''}"><span class="progress-dot"></span><div class="progress-copy"><strong>${step.label}</strong><span>${step.text}</span></div></div>`).join('')}</section>`;
  const subtotal=orderSubtotal(order),originalSubtotal=orderOriginalSubtotal(order),discountTotal=orderDiscountTotal(order);
  const expectedBonus=calculateOrderBonus(order);
  const bonusRows=order.status==='completed'
    ? `${order.bonuses?`<div class="order-info-row"><span>ИСПОЛЬЗОВАНО</span><span>− ${formatBonus(order.bonuses)}</span></div>`:''}<div class="order-info-row total"><span>НАЧИСЛЕНО</span><span>+ ${formatBonus(order.bonusEarned||expectedBonus)}</span></div>`
    : order.status==='canceled'
      ? `${order.bonuses?`<div class="order-info-row"><span>ИСПОЛЬЗОВАНО</span><span>− ${formatBonus(order.bonuses)}</span></div><div class="order-info-row total"><span>ВОЗВРАЩЕНО</span><span>+ ${formatBonus(order.bonusReturned||order.bonuses)}</span></div>`:'<div class="bonus-order-note">В этом заказе бонусы не использовались.</div>'}`
      : `${order.bonuses?`<div class="order-info-row"><span>ИСПОЛЬЗОВАНО</span><span>− ${formatBonus(order.bonuses)}</span></div>`:''}<div class="order-info-row total"><span>ПОСЛЕ ЗАВЕРШЕНИЯ</span><span>+ ${formatBonus(expectedBonus)}</span></div>`;
  document.getElementById('orderDetailBody').innerHTML=`<section class="order-detail-hero"><div class="order-detail-kicker">ТЕКУЩИЙ СТАТУС</div><div class="order-detail-status">${ORDER_STATUS[order.status]}</div><div class="order-detail-meta"><span>№${order.id}</span><span>${order.date}</span></div></section>${timeline}<section class="order-detail-section"><h3 class="order-detail-title">ТОВАРЫ</h3>${order.items.map(item=>orderItemMarkup(item,true)).join('')}</section><section class="order-detail-section"><h3 class="order-detail-title">ПОЛУЧЕНИЕ</h3><div class="order-info-row"><span>СПОСОБ</span><span>${order.delivery}</span></div><div class="order-info-row"><span>МЕСТО</span><span>${order.place}</span></div></section>${order.recipient?`<section class="order-detail-section"><h3 class="order-detail-title">ПОЛУЧАТЕЛЬ</h3><div class="order-info-row"><span>ИМЯ</span><span>${escapeHtml(order.recipient)}</span></div><div class="order-info-row"><span>ТЕЛЕФОН</span><span>${escapeHtml(order.phone)}</span></div>${order.comment?`<div class="order-info-row"><span>КОММЕНТАРИЙ</span><span>${escapeHtml(order.comment)}</span></div>`:''}</section>`:''}<section class="order-detail-section"><h3 class="order-detail-title">БОНУСЫ</h3>${bonusRows}</section><section class="order-detail-section"><h3 class="order-detail-title">ИТОГО</h3><div class="order-info-row"><span>${discountTotal?'СТОИМОСТЬ ТОВАРОВ':'ТОВАРЫ'}</span><span>${money(discountTotal?originalSubtotal:subtotal)}</span></div>${discountTotal?`<div class="order-info-row"><span>СКИДКА</span><span>− ${money(discountTotal)}</span></div>`:''}${order.bonuses?`<div class="order-info-row"><span>БОНУСЫ</span><span>− ${money(order.bonuses)}</span></div>`:''}<div class="order-info-row total"><span>К ОПЛАТЕ</span><span>${money(orderTotal(order))}</span></div></section>`;
}
function renderProfileSummary(){
  updateCounts();
  const count=ORDERS.length;
  const orderCount=document.getElementById('profileOrderCount');if(orderCount)orderCount.textContent=count;
  const countLabel=document.getElementById('purchaseCountLabel');if(countLabel)countLabel.textContent=`${count} ${count===1?'ПОКУПКА':count>1&&count<5?'ПОКУПКИ':'ПОКУПОК'}`;
  const latestBox=document.getElementById('latestOrderPreview');
  if(!ORDERS.length){if(latestBox)latestBox.innerHTML='<div class="profile-empty-purchase"><strong>ПОКУПОК ПОКА НЕТ</strong><p>После первого заказа здесь появится его статус и товар.</p><button data-go="catalog">ПЕРЕЙТИ В КАТАЛОГ</button></div>';return}
  const latest=ORDERS[0],item=latest.items[0],p=productForOrderItem(item);
  if(!p){if(latestBox)latestBox.innerHTML='';return}
  if(latestBox)latestBox.innerHTML=`<button class="order-preview" data-order-index="0"><img src="${p.image}" alt="${p.brand}"><div><h4>${p.brand}</h4><p>${p.code}</p><p>Размер: ${item.size}&nbsp;&nbsp;/&nbsp;&nbsp;Кол-во: ${item.qty}</p><p class="status">● ${ORDER_STATUS[latest.status]}<br>${latest.date}</p><strong>${money(orderTotal(latest))}</strong></div></button>`;
}
function renderMenuDrawer(){
  const body=document.getElementById('drawerBody');if(!body)return;
  const brands=[...new Set(PRODUCTS.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
  const availableCategories=Object.entries(CATEGORY_LABELS).filter(([value])=>PRODUCTS.some(product=>productCategory(product)===value));
  const collections=`<div class="drawer-list"><button data-menu-category="all">НОВАЯ КОЛЛЕКЦИЯ <span>›</span></button>${availableCategories.map(([value,label])=>`<button data-menu-category="${value}">${label} <span>›</span></button>`).join('')}<button data-go="favorites">ИЗБРАННОЕ <span>›</span></button><button data-go="profile">ПРОФИЛЬ <span>›</span></button><button data-go="orders">МОИ ПОКУПКИ <span>›</span></button><button data-go="bonuses">МОИ БОНУСЫ <span>›</span></button><button data-go="news">МОИ НОВОСТИ <span>›</span></button></div>`;
  const brandList=`<div class="drawer-list">${brands.map(brand=>`<button data-menu-brand="${escapeHtml(brand)}">${escapeHtml(brand)} <span>›</span></button>`).join('')}</div>`;
  body.innerHTML=`<div class="drawer-tabs menu-tabs"><button class="drawer-tab ${state.menuTab==='collections'?'active':''}" data-menu-tab="collections">КОЛЛЕКЦИИ</button><button class="drawer-tab ${state.menuTab==='brands'?'active':''}" data-menu-tab="brands">БРЕНДЫ</button></div><div class="menu-panel">${state.menuTab==='brands'?brandList:collections}</div>`;
}
function openDrawer(type){
  const overlay=document.getElementById('drawerOverlay'),title=document.getElementById('drawerTitle');
  if(type==='filter'){title.textContent='ФИЛЬТР';state.filterDraft={...state.filters};state.filterTab='categories';renderFilterDrawer()}
  else{title.textContent='MESTNIY STORE';state.menuTab='collections';renderMenuDrawer()}
  overlay.classList.add('open');
}
function closeDrawer(){document.getElementById('drawerOverlay').classList.remove('open');state.filterDraft=null}

document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]');if(go){showScreen(go.dataset.go);closeDrawer();return}
  const menuTab=e.target.closest('[data-menu-tab]');if(menuTab){state.menuTab=menuTab.dataset.menuTab;renderMenuDrawer();return}
  const menuBrand=e.target.closest('[data-menu-brand]');if(menuBrand){state.filters={...state.filters,brand:menuBrand.dataset.menuBrand,category:'all'};closeDrawer();showScreen('catalog');showToast(`Бренд: ${menuBrand.dataset.menuBrand}`);return}
  const menuCategory=e.target.closest('[data-menu-category]');if(menuCategory){state.filters={...state.filters,category:menuCategory.dataset.menuCategory,brand:'all'};closeDrawer();showScreen('catalog');return}
  if(e.target.closest('[data-reset-search]')){const input=document.getElementById('searchInput');if(input)input.value='';document.querySelector('.search-panel')?.classList.remove('open');renderCatalog();return}
  if(e.target.closest('[data-reset-filter]')){state.filters=defaultFilters();state.filterDraft=null;renderCatalog();return}
  if(e.target.closest('[data-order-show-all]')){state.orderFilter='all';document.querySelectorAll('[data-order-filter]').forEach(button=>button.classList.toggle('active',button.dataset.orderFilter==='all'));renderOrders();return}
  const retry=e.target.closest('[data-retry]');if(retry){state.dataError='';retry.dataset.retry==='news'?renderNews():renderCatalog();return}
  const orderBack=e.target.closest('[data-order-back]');if(orderBack){showScreen('orders',false);return}
  const orderCard=e.target.closest('[data-order-index]');if(orderCard){state.selectedOrder=Number(orderCard.dataset.orderIndex);showScreen('orderDetail');return}
  const orderFilter=e.target.closest('[data-order-filter]');if(orderFilter){state.orderFilter=orderFilter.dataset.orderFilter;document.querySelectorAll('[data-order-filter]').forEach(b=>b.classList.toggle('active',b===orderFilter));renderOrders();return}
  const navBtn=e.target.closest('.nav-item');if(navBtn){showScreen(navBtn.dataset.screen);return}
  const drawer=e.target.closest('[data-drawer]');if(drawer){openDrawer(drawer.dataset.drawer);return}
  if(e.target.closest('[data-close-drawer]')||e.target.id==='drawerOverlay'){closeDrawer();return}
  const search=e.target.closest('[data-search]');if(search){document.querySelector('.search-panel')?.classList.toggle('open');document.getElementById('searchInput')?.focus();return}
  if(e.target.id==='sortBtn'||e.target.closest('#sortBtn')){state.sortAsc=!state.sortAsc;renderCatalog();showToast(state.sortAsc?'Сначала дешевле':'Сначала дороже');return}
  const fav=e.target.closest('[data-fav]');if(fav){e.stopPropagation();toggleFav(fav.dataset.fav);return}
  const act=e.target.closest('[data-action]');if(act){e.stopPropagation();if(act.disabled)return;const i=Number(act.dataset.id);if(act.dataset.action==='unfav')toggleFav(i);else addToCart(i);return}
  const card=e.target.closest('[data-card]');if(card){openProduct(Number(card.dataset.card));return}
  const order=e.target.closest('[data-product]');if(order){openProduct(Number(order.dataset.product));return}
  const size=e.target.closest('[data-size]');if(size){if(size.disabled)return;state.selectedSize=size.dataset.size;document.querySelectorAll('.size-btn').forEach(b=>b.classList.toggle('active',b===size));moveSizeIndicator(size);return}
  const back=e.target.closest('[data-back]');if(back){showScreen(state.previous||'catalog',false);return}
  const rem=e.target.closest('[data-remove]');if(rem){state.cart.splice(Number(rem.dataset.remove),1);persistState();renderCart();return}
  const qty=e.target.closest('[data-qty]');if(qty){const item=state.cart[Number(qty.dataset.index)];if(item){item.qty=Math.max(1,item.qty+Number(qty.dataset.qty));persistState();renderCart()}return}
  const filterTab=e.target.closest('[data-filter-tab]');if(filterTab){state.filterTab=filterTab.dataset.filterTab;renderFilterDrawer();return}
  const filterChoiceButton=e.target.closest('[data-filter-key]');if(filterChoiceButton){if(!state.filterDraft)state.filterDraft={...state.filters};state.filterDraft[filterChoiceButton.dataset.filterKey]=filterChoiceButton.dataset.filterValue;renderFilterDrawer();return}
  if(e.target.closest('[data-filter-reset]')){state.filterDraft=defaultFilters();renderFilterDrawer();return}
  if(e.target.closest('[data-apply-filter]')){state.filters=normalizePriceRange(state.filterDraft||state.filters);state.filterDraft=null;closeDrawer();renderCatalog();showToast('Фильтры применены');return}
  if(e.target.id==='detailAdd'){if(!state.selectedSize){alert('Сначала выберите размер');return}addToCart(state.selectedProduct,state.selectedSize);showScreen('cart');return}
  if(e.target.id==='checkoutBtn'){showScreen('checkout');return}
  if(e.target.id==='confirmOrderBtn'){createPrototypeOrder();return}
  const successOrders=e.target.closest('[data-success-orders]');if(successOrders){state.orderFilter='all';document.querySelectorAll('[data-order-filter]').forEach((b,i)=>b.classList.toggle('active',i===0));showScreen('orders');return}
  const delivery=e.target.closest('[data-delivery]');if(delivery){const type=delivery.dataset.delivery;if(type==='pickup'){openPickupManager();return}state.checkout.delivery=type;state.checkout.bonuses=0;renderCheckout();return}
  if(e.target.closest('[data-bonus-toggle]')){state.checkout.bonuses=state.checkout.bonuses?0:Math.min(state.bonusBalance,cartSubtotal());renderCheckout();return}
  const newsBack=e.target.closest('[data-news-back]');if(newsBack){showScreen('news',false);return}
  const newsAction=e.target.closest('[data-news-action]');if(newsAction){runNewsAction();return}
  const newsItem=e.target.closest('[data-news-id]');if(newsItem){openNews(newsItem.dataset.newsId);return}
  const n=e.target.closest('[data-news]');if(n){openNews(n.dataset.news);return}
});
document.addEventListener('input',e=>{
  const priceField=e.target.closest('[data-price-filter]');
  if(priceField){
    if(!state.filterDraft)state.filterDraft={...state.filters};
    const clean=priceField.value.replace(/\D/g,'').slice(0,9);
    priceField.value=clean;
    state.filterDraft[priceField.dataset.priceFilter]=clean;
    const summary=document.querySelector('[data-filter-summary]');
    if(summary){const count=activeFilterCount(state.filterDraft);summary.textContent=count?`ВЫБРАНО ФИЛЬТРОВ: ${count}`:'ФИЛЬТРЫ НЕ ВЫБРАНЫ'}
    return;
  }
  const field=e.target.closest('[data-checkout-field]');
  if(field){state.checkout[field.dataset.checkoutField]=field.value;const err=document.getElementById('checkoutError');if(err)err.classList.remove('show');return}
});
document.getElementById('searchInput').addEventListener('input',renderCatalog);

// v19 FINAL: keep responsive indicators aligned after viewport or keyboard changes.
function refreshResponsiveUi(){
  const selectedSize=document.querySelector('#sizeRow .size-btn.active');
  if(selectedSize) moveSizeIndicator(selectedSize,true);
}
let responsiveUiTimer=0;
function scheduleResponsiveUiRefresh(){
  clearTimeout(responsiveUiTimer);
  responsiveUiTimer=setTimeout(refreshResponsiveUi,80);
}
window.addEventListener('resize',scheduleResponsiveUiRefresh,{passive:true});
window.visualViewport?.addEventListener('resize',scheduleResponsiveUiRefresh,{passive:true});
document.addEventListener('focusin',event=>{
  const field=event.target.closest?.('#checkout input,#checkout textarea');
  if(!field)return;
  setTimeout(()=>field.scrollIntoView({block:'center',behavior:'smooth'}),180);
});

async function initApp(){
  const loader=document.getElementById('appLoader');
  try{
    await loadStoreData();
    loadPersistedState();
    applyTelegramProfile();
    renderHomeNews();
    updateFilterButton();syncBonusBalance();updateSortButton();renderCatalog();renderFavorites();renderCart();renderProfileSummary();renderOrders();renderBonuses();
  }catch(error){console.error('MESTNIY frontend init error',error);state.dataError='catalog-error';renderCatalog()}
  finally{loader?.classList.add('hidden');setTimeout(()=>loader?.remove(),350)}
}
initApp();
