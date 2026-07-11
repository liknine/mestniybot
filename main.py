import asyncio
import logging
import ssl
import aiohttp
from aiohttp import web
from datetime import datetime
from typing import Optional
import json
import uuid
import os
import re
from pathlib import Path



from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, BotCommand
from aiogram.filters import CommandStart, Command
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Float, JSON, DateTime, BigInteger, Text

# ==================== ФИКС SSL для Mac ====================
ssl._create_default_https_context = ssl._create_unverified_context

# ==================== КОНФИГ ====================

def load_env_file(path: Path):
    """Минимальный .env-loader без внешних зависимостей."""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)

def parse_admin_ids(value: str):
    ids = []
    for part in str(value or "").replace(";", ",").split(","):
        part = part.strip()
        if not part:
            continue
        try:
            ids.append(int(part))
        except ValueError:
            print(f"⚠️ Некорректный ADMIN_ID пропущен: {part}")
    return ids

PROJECT_DIR = Path(__file__).resolve().parent
load_env_file(PROJECT_DIR / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN не задан. Создайте .env рядом с main.py и укажите BOT_TOKEN=...")

ADMIN_IDS = parse_admin_ids(os.getenv("ADMIN_IDS", "1639462053,8465820993"))
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://liknine.github.io/mestniybot/?v=restore_1")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./shop.db")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8080"))
MAX_PRODUCT_IMAGES = int(os.getenv("MAX_PRODUCT_IMAGES", "5"))
PRODUCT_CONDITIONS = ["Новое", "Отличное", "Очень хорошее", "Хорошее"]

# Курсы валют (без EUR)
CURRENCIES = {
    "BYN": {"symbol": "Br", "rate": 1},
    "RUB": {"symbol": "₽", "rate": 28.5},
    "USD": {"symbol": "$", "rate": 0.31}
}

# Категории
CATEGORIES = {
    1: {"name": "Обувь", "icon": "👟"},
    2: {"name": "Куртки / Пуховики", "icon": "🧥"},
    3: {"name": "Жилетки", "icon": "🦺"},
    4: {"name": "Рубашки", "icon": "👔"},
    5: {"name": "Футболки / Поло", "icon": "👕"},
    6: {"name": "Кофты", "icon": "🧶"},
    7: {"name": "Штаны", "icon": "👖"},
    8: {"name": "Шорты", "icon": "🩳"},
    9: {"name": "Головные уборы", "icon": "🧢"},
    10: {"name": "Аксессуары", "icon": "🎒"}
}

# Бренды
BRANDS = {
    "a_bathing_ape": "A Bathing Ape",
    "aape": "Aape",
    "acne_studios": "Acne Studios",
    "acronym": "Acronym",
    "adidas": "Adidas",
    "alpha_industries": "Alpha Industries",
    "alyx": "ALYX",
    "amiri": "Amiri",
    "aquascutum": "Aquascutum",
    "arcteryx": "Arcteryx",
    "armani_exchange": "Armani Exchange",
    "asics": "ASICS",
    "balenciaga": "Balenciaga",
    "barbour": "Barbour",
    "berghaus": "Berghaus",
    "bershka": "Bershka",
    "billabong": "Billabong",
    "burberry": "Burberry",
    "calvin_klein": "Calvin Klein",
    "carhartt": "Carhartt",
    "champion": "Champion",
    "columbia": "Columbia",
    "comme_des_fuckdown": "Comme des Fuckdown",
    "comme_des_garcons": "Comme des Garçons",
    "cp_company": "C.P. Company",
    "diesel": "Diesel",
    "dobermans": "Dobermans Aggressive",
    "doctor_martens": "Doctor Martens",
    "eastpak": "Eastpak",
    "ellesse": "Ellesse",
    "fila": "Fila",
    "fred_perry": "Fred Perry",
    "fucking_awesome": "Fucking Awesome",
    "gap": "Gap",
    "ggl": "GGL",
    "gosha": "Гоша Рубчинский",
    "gucci": "Gucci",
    "haglofs": "Haglofs",
    "hardcore": "Hardcore",
    "hermes": "Hermes",
    "jordan": "Jordan",
    "lacoste": "Lacoste",
    "levis": "Levi's",
    "lonsdale": "Lonsdale",
    "louis_vuitton": "Louis Vuitton",
    "lyle_scott": "Lyle & Scott",
    "maison_margiela": "Maison Margiela",
    "mastrum": "Ma.Strum",
    "mcm": "MCM",
    "merrell": "Merrell",
    "moncler": "Moncler",
    "mowalola": "Mowalola",
    "napapijri": "NAPAPIJRI",
    "new_balance": "New Balance",
    "nike": "Nike",
    "no_name": "No Name",
    "north_face": "The North Face",
    "number_nine": "Number Nine",
    "off_white": "Off-White",
    "palace": "Palace",
    "peaceful_hooligan": "Peaceful Hooligan",
    "pitbull": "Pitbull Germany",
    "polar": "Polar",
    "polo_ralph_lauren": "Polo Ralph Lauren",
    "prada": "Prada",
    "puma": "Puma",
    "raf_simons": "Raf Simons",
    "reebok": "Reebok",
    "rick_owens": "Rick Owen's",
    "sergio_tacchini": "Sergio Tacchini",
    "stone_island": "Stone Island",
    "stussy": "Stussy",
    "supreme": "Supreme",
    "thor_steinar": "Thor Steinar",
    "timberland": "Timberland",
    "tommy_hilfiger": "Tommy Hilfiger",
    "trapstar": "Trapstar",
    "true_religion": "True Religion",
    "tupac": "Tupac",
    "vetements": "Vetements",
    "vivienne_westwood": "Vivienne Westwood",
    "weekend_offender": "WEEKEND OFFENDER",
    "yeezy": "Yeezy",
    "zara": "Zara"
}

# ==================== БАЗА ДАННЫХ ====================

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    icon: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(Integer)
    brand: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    price_byn: Mapped[float] = mapped_column(Float)
    prices: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    sizes: Mapped[list] = mapped_column(JSON)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    images: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger)
    items: Mapped[dict] = mapped_column(JSON)
    total: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3))
    delivery_type: Mapped[str] = mapped_column(String(50))
    delivery_service: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    delivery_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    customer: Mapped[dict] = mapped_column(JSON)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="new")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ База данных готова")

# ==================== КУРСЫ ВАЛЮТ ====================

async def get_exchange_rates():
    """Получение курсов валют (без EUR)"""
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get("https://api.nbrb.by/exrates/rates?periodicity=0", timeout=10) as response:
                data = await response.json()
                
                for item in data:
                    if item["Cur_Abbreviation"] == "USD":
                        CURRENCIES["USD"]["rate"] = 1 / item["Cur_OfficialRate"]
                    elif item["Cur_Abbreviation"] == "RUB":
                        CURRENCIES["RUB"]["rate"] = item["Cur_Scale"] / item["Cur_OfficialRate"]
                
                print(f"✅ Курсы обновлены: 1 BYN = {CURRENCIES['USD']['rate']:.4f} USD, {CURRENCIES['RUB']['rate']:.2f} RUB")
    except Exception as e:
        print(f"⚠️ Используем дефолтные курсы: {e}")

# ==================== FSM STATES ====================

class AddProduct(StatesGroup):
    product_type = State()
    brand = State()
    name = State()
    category = State()
    price_byn = State()
    sizes = State()
    description = State()
    condition = State()
    images = State()
    extra_photos_url = State()
    preview = State()
    edit_field = State()

    # Старые состояния оставлены для совместимости с активными FSM-сессиями.
    price_rub = State()
    price_usd = State()
    stock = State()

# ==================== FIX PRODUCT STATE ====================

class FixProduct(StatesGroup):
    waiting_photos = State()

class AddUpdate(StatesGroup):
    title = State()
    photo = State()
    post_url = State()


class AdminPanelFlow(StatesGroup):
    product_search = State()
    product_edit_value = State()
    discount_value = State()
    news_search = State()
    news_edit_value = State()
    news_edit_photo = State()

# ==================== ГЛОБАЛЬНЫЕ БУФЕРЫ ====================

album_buffers = {}
album_locks = {}
product_image_state_locks = {}
fix_product_buffer = {}
fix_product_locks = {}

# ==================== TELEGRAM БОТ ====================

router = Router()
bot: Bot = None

def get_main_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Открыть каталог🛒", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="Информация о доставке", callback_data="delivery_info")],
        [InlineKeyboardButton(text="Привезем вещь по вашим критериям", callback_data="custom_order_info")],
        [InlineKeyboardButton(text="Отзывы✅", callback_data="reviews_info")],
        [InlineKeyboardButton(text="Обратиться в поддержку⚙️", url="https://t.me/manager_of_mestniy")]
    ])

def get_admin_keyboard():
    """Главное меню администратора: пользовательские действия + вход в панель."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Открыть каталог🛒", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="Информация о доставке", callback_data="delivery_info")],
        [InlineKeyboardButton(text="Привезем вещь по вашим критериям", callback_data="custom_order_info")],
        [InlineKeyboardButton(text="Отзывы✅", callback_data="reviews_info")],
        [InlineKeyboardButton(text="Обратиться в поддержку⚙️", url="https://t.me/manager_of_mestniy")],
        [InlineKeyboardButton(text="🛠 Админ-панель", callback_data="panel:home")],
    ])


def get_admin_panel_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📦 Товары", callback_data="panel:products"),
            InlineKeyboardButton(text="📰 Новости", callback_data="panel:news"),
        ],
        [
            InlineKeyboardButton(text="🏷 Скидки", callback_data="panel:discounts"),
            InlineKeyboardButton(text="🛒 Заказы", callback_data="admin_orders"),
        ],
        [
            InlineKeyboardButton(text="🎁 Бонусы", callback_data="panel:bonuses"),
            InlineKeyboardButton(text="📣 Рассылка", callback_data="panel:broadcast"),
        ],
        [
            InlineKeyboardButton(text="👥 Пользователи", callback_data="panel:users"),
            InlineKeyboardButton(text="⚙️ Настройки", callback_data="panel:settings"),
        ],
        [InlineKeyboardButton(text="🛍 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="⬅️ Вернуться в главное меню", callback_data="panel:exit")],
    ])


def get_products_panel_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="➕ Добавить товар", callback_data="admin_add_product")],
        [InlineKeyboardButton(text="📋 Список товаров", callback_data="pl:0")],
        [InlineKeyboardButton(text="🔎 Найти товар", callback_data="pp:find")],
        [InlineKeyboardButton(text="✏️ Редактировать товар", callback_data="pp:edit")],
        [InlineKeyboardButton(text="🗑 Удалить товар", callback_data="pp:delete")],
        [InlineKeyboardButton(text="🏷 Скидка", callback_data="panel:discounts")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="panel:home")],
    ])


def get_news_panel_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="➕ Добавить новость", callback_data="admin_add_update")],
        [InlineKeyboardButton(text="📋 Список новостей", callback_data="nl:0")],
        [InlineKeyboardButton(text="🔎 Найти новость", callback_data="nn:find")],
        [InlineKeyboardButton(text="✏️ Редактировать новость", callback_data="nn:edit")],
        [InlineKeyboardButton(text="🗑 Удалить новость", callback_data="nn:delete")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="panel:home")],
    ])


def get_discounts_panel_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="➕ Добавить скидку", callback_data="dd:add")],
        [InlineKeyboardButton(text="📋 Список скидок", callback_data="dl:0")],
        [InlineKeyboardButton(text="🔎 Найти товар", callback_data="dd:find")],
        [InlineKeyboardButton(text="✏️ Редактировать скидку", callback_data="dd:edit")],
        [InlineKeyboardButton(text="🗑 Удалить скидку", callback_data="dd:remove")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="panel:home")],
    ])


def get_admin_cancel_keyboard(back_callback: str = "panel:home"):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отмена", callback_data=back_callback)]
    ])

def get_category_keyboard():
    buttons = []
    for cat_id, cat_data in CATEGORIES.items():
        buttons.append([InlineKeyboardButton(
            text=f"{cat_data['icon']} {cat_data['name']}",
            callback_data=f"addcat_{cat_id}"
        )])
    buttons.append([InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_brand_keyboard():
    buttons = []
    brand_items = list(BRANDS.items())
    for i in range(0, len(brand_items), 2):
        row = []
        row.append(InlineKeyboardButton(
            text=brand_items[i][1],
            callback_data=f"addbrand_{brand_items[i][0]}"
        ))
        if i + 1 < len(brand_items):
            row.append(InlineKeyboardButton(
                text=brand_items[i+1][1],
                callback_data=f"addbrand_{brand_items[i+1][0]}"
            ))
        buttons.append(row)
    buttons.append([InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def display_brand_name(brand: Optional[str]) -> str:
    value = (brand or "").strip()
    return BRANDS.get(value, value)

def get_condition_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Новое", callback_data="addcondition_0")],
        [InlineKeyboardButton(text="Отличное", callback_data="addcondition_1")],
        [InlineKeyboardButton(text="Очень хорошее", callback_data="addcondition_2")],
        [InlineKeyboardButton(text="Хорошее", callback_data="addcondition_3")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])

def get_product_type_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Наличие", callback_data="addtype_stock")],
        [InlineKeyboardButton(text="🛒 На заказ", callback_data="addtype_order")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])

@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()

    user_id = message.from_user.id
    username = message.from_user.username

    async with async_session() as session:
        result = await session.execute(select(User).where(User.telegram_id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            user = User(telegram_id=user_id, username=username)
            session.add(user)
            await session.commit()
            print(f"👤 Новый пользователь: @{username} ({user_id})")

    is_admin = user_id in ADMIN_IDS

    text = (
        "👋 Привет, <b>MESTNIY MANAGER!</b>\n\n"
        "<b>Как пользоваться ботом?</b>\n\n"
        "Нажимай открыть каталог! Там сверху выбирай нужную валюту, категорию товара, нужный размер! "
        "Когда определился с заказом, нажимай на кнопку <b>В корзину</b>! "
        "В корзину можно добавлять сразу несколько вещей! После заходи в корзину, там сверху будет кнопка "
        "<b>ОФОРМИТЬ ЗАКАЗ</b>! Нажимай на неё! После, тебя направят к менеджеру! "
        "Хороших и удачных покупок! Спасибо что выбираете нас! 🫶\n\n"
        "🛞 <b>САМОВЫВОЗ:</b>\n"
        "Мы находимся в городе Лида!\n\n"
        "📦 <b>ДОСТАВКА:</b>\n"
        "Мы отправляем через:\n"
        "Европочта / Белпочта / CDEK / Маршрутка\n\n"
        "По всем вопросам обращайтесь сюда: <b>@manager_of_mestniy</b>"
    )

    if is_admin:
        text += "\n\n🔧 <i>Режим администратора</i>"
        await message.answer(text, reply_markup=get_admin_keyboard())
    else:
        await message.answer(text, reply_markup=get_main_keyboard())



# ==================== НОВАЯ АДМИН-ПАНЕЛЬ ====================

ADMIN_PAGE_SIZE = 8


def admin_only(user_id: int) -> bool:
    return user_id in ADMIN_IDS


def compact_text(value: str, limit: int = 42) -> str:
    clean = " ".join(str(value or "").split())
    return clean if len(clean) <= limit else clean[: limit - 1] + "…"


def product_size_stock(product: Product) -> dict[str, int]:
    prices = product.prices or {}
    raw = prices.get("size_stock") or {}
    result: dict[str, int] = {}
    if isinstance(raw, dict):
        for size, qty in raw.items():
            try:
                result[str(size)] = max(0, int(qty or 0))
            except (TypeError, ValueError):
                result[str(size)] = 0
    if not result:
        sizes = product.sizes or []
        for index, size in enumerate(sizes):
            result[str(size)] = max(0, int(product.stock or 0)) if index == 0 else (1 if product.stock else 0)
    return result


def product_has_discount(product: Product) -> bool:
    prices = product.prices or {}
    try:
        old_price = float(prices.get("old_price") or 0)
        return old_price > float(product.price_byn or 0)
    except (TypeError, ValueError):
        return False


def product_normal_price(product: Product) -> float:
    prices = product.prices or {}
    if product_has_discount(product):
        return float(prices.get("old_price"))
    return float(product.price_byn or 0)


def product_admin_text(product: Product) -> str:
    brand = display_brand_name(product.brand) or "Без бренда"
    category = CATEGORIES.get(product.category_id, {})
    size_stock = product_size_stock(product)
    sizes_text = ", ".join(f"{size}: {qty}" for size, qty in size_stock.items()) or "не указаны"
    current_price = float(product.price_byn or 0)
    price_text = f"{current_price:g} BYN"
    if product_has_discount(product):
        price_text = f"<s>{product_normal_price(product):g} BYN</s> → <b>{current_price:g} BYN</b>"
    created_text = product.created_at.strftime("%d.%m.%Y %H:%M") if product.created_at else "не указана"
    return (
        f"📦 <b>Товар #{product.id}</b>\n\n"
        f"<b>{product.name}</b>\n"
        f"🏷 Бренд: {brand}\n"
        f"📁 Категория: {category.get('icon', '')} {category.get('name', 'Не указана')}\n"
        f"💰 Цена: {price_text}\n"
        f"📏 Размеры / остатки: {sizes_text}\n"
        f"📦 Всего: {sum(size_stock.values()) if size_stock else int(product.stock or 0)} шт.\n"
        f"🖼 Фото: {len(product.images or [])}\n"
        f"📅 Добавлен: {created_text}\n"
        f"📝 Описание: {compact_text(product.description or 'не указано', 180)}"
    )


def get_product_actions_keyboard(product_id: int, has_discount: bool = False):
    rows = [
        [
            InlineKeyboardButton(text="✏️ Редактировать", callback_data=f"pe:{product_id}"),
            InlineKeyboardButton(text="🏷 Скидка", callback_data=f"ds:{product_id}"),
        ]
    ]
    if has_discount:
        rows.append([InlineKeyboardButton(text="🧹 Убрать скидку", callback_data=f"dr:{product_id}")])
    rows.extend([
        [
            InlineKeyboardButton(text="🗑 Удалить", callback_data=f"pd:{product_id}"),
            InlineKeyboardButton(text="📋 К списку", callback_data="pl:0"),
        ],
        [InlineKeyboardButton(text="⬅️ Товары", callback_data="panel:products")],
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def get_product_edit_keyboard(product_id: int):
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="Название", callback_data=f"pf:{product_id}:name"),
            InlineKeyboardButton(text="Бренд", callback_data=f"pf:{product_id}:brand"),
        ],
        [
            InlineKeyboardButton(text="Категория", callback_data=f"pf:{product_id}:category"),
            InlineKeyboardButton(text="Цена", callback_data=f"pf:{product_id}:price"),
        ],
        [
            InlineKeyboardButton(text="Размеры / остатки", callback_data=f"pf:{product_id}:sizes"),
            InlineKeyboardButton(text="Описание", callback_data=f"pf:{product_id}:description"),
        ],
        [
            InlineKeyboardButton(text="Фотографии", callback_data=f"pf:{product_id}:photos"),
            InlineKeyboardButton(text="Доп. фото", callback_data=f"pf:{product_id}:extra"),
        ],
        [
            InlineKeyboardButton(text="Состояние", callback_data=f"pf:{product_id}:condition"),
            InlineKeyboardButton(text="Скидка", callback_data=f"ds:{product_id}"),
        ],
        [InlineKeyboardButton(text="⬅️ Назад к товару", callback_data=f"pv:{product_id}")],
    ])


async def send_product_admin_card(message: Message, product: Product, notice: str | None = None):
    text = product_admin_text(product)
    if notice:
        text = f"{notice}\n\n{text}"
    keyboard = get_product_actions_keyboard(product.id, product_has_discount(product))
    first_image = next((str(url).strip() for url in (product.images or []) if str(url).strip()), None)
    if first_image:
        try:
            await message.answer_photo(photo=first_image, caption=text, reply_markup=keyboard)
            return
        except Exception as exc:
            print(f"⚠️ Не удалось показать фото товара #{product.id}: {exc}")
    await message.answer(text, reply_markup=keyboard)


async def find_products(query: str, limit: int = 20) -> list[Product]:
    clean = str(query or "").strip()
    async with async_session() as session:
        if clean.isdigit():
            result = await session.execute(select(Product).where(Product.id == int(clean)))
        else:
            like = f"%{clean}%"
            result = await session.execute(
                select(Product)
                .where(or_(Product.name.ilike(like), Product.brand.ilike(like)))
                .order_by(Product.created_at.desc())
                .limit(limit)
            )
        return list(result.scalars().all())


async def send_product_search_results(message: Message, products: list[Product], action: str, title: str):
    if action in {"discount_view", "discount_edit", "discount_remove"}:
        products = [product for product in products if product_has_discount(product)]
    back_callback = "panel:products" if action in {"view", "edit", "delete"} else "panel:discounts"
    if not products:
        await message.answer(
            "Ничего не найдено. Отправьте другой ID, название или бренд.",
            reply_markup=get_admin_cancel_keyboard(back_callback),
        )
        return
    prefix = {
        "view": "pv",
        "edit": "pe",
        "delete": "pd",
        "discount_set": "ds",
        "discount_view": "dv",
        "discount_edit": "ds",
        "discount_remove": "dr",
    }.get(action, "pv")
    rows = []
    for product in products[:20]:
        brand = compact_text(display_brand_name(product.brand) or "Без бренда", 18)
        stock = sum(product_size_stock(product).values())
        price = float(product.price_byn or 0)
        if product_has_discount(product):
            price_label = f"{product_normal_price(product):g}→{price:g}"
        else:
            price_label = f"{price:g}"
        label = f"#{product.id} · {brand} · {compact_text(product.name, 20)} · {price_label} BYN · {stock} шт."
        rows.append([InlineKeyboardButton(text=label, callback_data=f"{prefix}:{product.id}")])
    rows.append([InlineKeyboardButton(text="⬅️ Назад", callback_data=back_callback)])
    await message.answer(title, reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))


@router.message(Command("admin"))
async def cmd_admin_panel(message: Message, state: FSMContext):
    if not admin_only(message.from_user.id):
        return
    await state.clear()
    await show_admin_panel(message)


async def show_admin_panel(message: Message):
    async with async_session() as session:
        products_count = len((await session.execute(select(Product))).scalars().all())
        users_count = len((await session.execute(select(User))).scalars().all())
        orders_count = len((await session.execute(select(Order))).scalars().all())
    updates_count = len(load_updates_sync())
    await message.answer(
        "🛠 <b>Админ-панель MESTNIY STORE</b>\n\n"
        f"📦 Товаров: <b>{products_count}</b>\n"
        f"📰 Новостей: <b>{updates_count}</b>\n"
        f"🛒 Заказов: <b>{orders_count}</b>\n"
        f"👥 Пользователей: <b>{users_count}</b>\n\n"
        "Выберите раздел:",
        reply_markup=get_admin_panel_keyboard(),
    )


@router.callback_query(F.data == "panel:home")
async def admin_panel_home(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await state.clear()
    await show_admin_panel(callback.message)
    await callback.answer()


@router.callback_query(F.data == "panel:exit")
async def admin_panel_exit(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await state.clear()
    await callback.message.answer("Главное меню", reply_markup=get_admin_keyboard())
    await callback.answer()


@router.callback_query(F.data == "panel:products")
async def admin_products_menu(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await state.clear()
    await callback.message.answer(
        "📦 <b>Товары</b>\n\nВыберите действие:",
        reply_markup=get_products_panel_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "panel:news")
async def admin_news_menu(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await state.clear()
    await callback.message.answer(
        "📰 <b>Новости</b>\n\nВыберите действие:",
        reply_markup=get_news_panel_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "panel:discounts")
async def admin_discounts_menu(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await state.clear()
    await callback.message.answer(
        "🏷 <b>Скидки</b>\n\nСкидка задаётся новой ценой в BYN. Старая цена сохранится и будет зачёркнута в каталоге.",
        reply_markup=get_discounts_panel_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "panel:bonuses")
async def admin_bonuses_placeholder(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await callback.message.answer("🎁 Раздел бонусов подключим на следующем этапе.", reply_markup=get_admin_panel_keyboard())
    await callback.answer()


@router.callback_query(F.data == "panel:broadcast")
async def admin_broadcast_placeholder(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await callback.message.answer("📣 Массовую рассылку подключим отдельным этапом.", reply_markup=get_admin_panel_keyboard())
    await callback.answer()


@router.callback_query(F.data == "panel:settings")
async def admin_settings_placeholder(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    await callback.message.answer(
        "⚙️ <b>Настройки</b>\n\nОсновные настройки пока берутся из файла <code>.env</code>. Управление ими через кнопки добавим после заказов и бонусов.",
        reply_markup=get_admin_panel_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "panel:users")
async def admin_users_list(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    async with async_session() as session:
        users = list((await session.execute(select(User).order_by(User.created_at.desc()).limit(20))).scalars().all())
        total = len((await session.execute(select(User))).scalars().all())
    lines = [f"👥 <b>Пользователи ({total})</b>", ""]
    for user in users:
        username = f"@{user.username}" if user.username else "без username"
        lines.append(f"• <code>{user.telegram_id}</code> · {username}")
    if total > len(users):
        lines.append(f"\nПоказаны последние {len(users)} пользователей.")
    await callback.message.answer("\n".join(lines), reply_markup=get_admin_panel_keyboard())
    await callback.answer()


@router.callback_query(F.data.startswith("pl:"))
async def admin_products_page(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    try:
        page = max(0, int(callback.data.split(":", 1)[1]))
    except ValueError:
        page = 0
    async with async_session() as session:
        products = list((await session.execute(select(Product).order_by(Product.created_at.desc()))).scalars().all())
    total_pages = max(1, (len(products) + ADMIN_PAGE_SIZE - 1) // ADMIN_PAGE_SIZE)
    page = min(page, total_pages - 1)
    chunk = products[page * ADMIN_PAGE_SIZE:(page + 1) * ADMIN_PAGE_SIZE]
    rows = []
    for p in chunk:
        brand = compact_text(display_brand_name(p.brand) or "Без бренда", 16)
        stock = sum(product_size_stock(p).values())
        price = float(p.price_byn or 0)
        price_label = f"{product_normal_price(p):g}→{price:g}" if product_has_discount(p) else f"{price:g}"
        rows.append([InlineKeyboardButton(
            text=f"#{p.id} · {brand} · {compact_text(p.name, 18)} · {price_label} BYN · {stock} шт.",
            callback_data=f"pv:{p.id}",
        )])
    nav_row = []
    if page > 0:
        nav_row.append(InlineKeyboardButton(text="←", callback_data=f"pl:{page-1}"))
    nav_row.append(InlineKeyboardButton(text=f"{page+1}/{total_pages}", callback_data="noop"))
    if page + 1 < total_pages:
        nav_row.append(InlineKeyboardButton(text="→", callback_data=f"pl:{page+1}"))
    rows.append(nav_row)
    rows.append([InlineKeyboardButton(text="⬅️ Товары", callback_data="panel:products")])
    await callback.message.answer(
        f"📋 <b>Список товаров</b>\nВсего: {len(products)}",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=rows),
    )
    await callback.answer()


@router.callback_query(F.data == "noop")
async def admin_noop(callback: CallbackQuery):
    await callback.answer()


@router.callback_query(F.data.in_({"pp:find", "pp:edit", "pp:delete", "dd:add", "dd:find", "dd:edit", "dd:remove"}))
async def admin_product_search_start(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    action_map = {
        "pp:find": ("view", "🔎 Найти товар"),
        "pp:edit": ("edit", "✏️ Редактировать товар"),
        "pp:delete": ("delete", "🗑 Удалить товар"),
        "dd:add": ("discount_set", "➕ Добавить скидку"),
        "dd:find": ("discount_view", "🔎 Найти товар со скидкой"),
        "dd:edit": ("discount_edit", "✏️ Редактировать скидку"),
        "dd:remove": ("discount_remove", "🗑 Удалить скидку"),
    }
    action, title = action_map[callback.data]
    await state.clear()
    await state.update_data(product_search_action=action)
    await state.set_state(AdminPanelFlow.product_search)
    back = "panel:products" if action in {"view", "edit", "delete"} else "panel:discounts"
    await callback.message.answer(
        f"{title}\n\nОтправьте ID, название или бренд товара:",
        reply_markup=get_admin_cancel_keyboard(back),
    )
    await callback.answer()


@router.message(AdminPanelFlow.product_search)
async def admin_product_search_message(message: Message, state: FSMContext):
    if not admin_only(message.from_user.id):
        return
    data = await state.get_data()
    action = data.get("product_search_action", "view")
    products = await find_products(message.text or "")
    title_map = {
        "view": "🔎 Результаты поиска",
        "edit": "✏️ Выберите товар для редактирования",
        "delete": "🗑 Выберите товар для удаления",
        "discount_set": "🏷 Выберите товар",
        "discount_view": "🔎 Выберите товар со скидкой",
        "discount_edit": "✏️ Выберите скидку для редактирования",
        "discount_remove": "🗑 Выберите скидку для удаления",
    }
    if products:
        await state.clear()
    await send_product_search_results(message, products, action, title_map.get(action, "Результаты"))


@router.callback_query(F.data.startswith("pv:"))
async def admin_product_view(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if not product:
        await callback.answer("Товар не найден", show_alert=True)
        return
    await send_product_admin_card(callback.message, product)
    await callback.answer()


@router.callback_query(F.data.startswith("pe:"))
async def admin_product_edit_menu(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if not product:
        await callback.answer("Товар не найден", show_alert=True)
        return
    await callback.message.answer(
        f"✏️ <b>Редактирование товара #{product_id}</b>\n\n{product.name}\n\nВыберите поле:",
        reply_markup=get_product_edit_keyboard(product_id),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("pf:"))
async def admin_product_edit_field(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    _, product_id_raw, field = callback.data.split(":", 2)
    product_id = int(product_id_raw)
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if not product:
        await callback.answer("Товар не найден", show_alert=True)
        return

    if field == "photos":
        await state.clear()
        await state.update_data(fix_product_id=product_id, fix_images=[])
        await state.set_state(FixProduct.waiting_photos)
        await callback.message.answer(
            f"📸 <b>Новые фотографии товара #{product_id}</b>\n\nОтправьте фото по одному или альбомом, затем нажмите «Готово».",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✅ Готово — сохранить", callback_data="fix_save")],
                [InlineKeyboardButton(text="❌ Отмена", callback_data="fix_cancel")],
            ]),
        )
        await callback.answer()
        return

    if field == "category":
        rows = [[InlineKeyboardButton(
            text=f"{value['icon']} {value['name']}",
            callback_data=f"pc:{product_id}:{cat_id}",
        )] for cat_id, value in CATEGORIES.items()]
        rows.append([InlineKeyboardButton(text="⬅️ Назад", callback_data=f"pe:{product_id}")])
        await callback.message.answer("Выберите новую категорию:", reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))
        await callback.answer()
        return

    if field == "section":
        await callback.message.answer(
            "Выберите раздел товара:",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✅ В наличии", callback_data=f"pt:{product_id}:stock")],
                [InlineKeyboardButton(text="🛒 На заказ", callback_data=f"pt:{product_id}:order")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data=f"pe:{product_id}")],
            ]),
        )
        await callback.answer()
        return

    if field == "condition":
        rows = [[InlineKeyboardButton(text=value, callback_data=f"pco:{product_id}:{index}")] for index, value in enumerate(PRODUCT_CONDITIONS)]
        rows.append([InlineKeyboardButton(text="Не указано", callback_data=f"pco:{product_id}:none")])
        rows.append([InlineKeyboardButton(text="⬅️ Назад", callback_data=f"pe:{product_id}")])
        await callback.message.answer("Выберите состояние товара:", reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))
        await callback.answer()
        return

    prompts = {
        "name": "Отправьте новое название товара:",
        "brand": "Отправьте новый бренд. Чтобы убрать бренд, напишите <code>нет</code>:",
        "price": "Отправьте новую обычную цену в BYN. Если у товара была скидка, она будет удалена:",
        "sizes": "Отправьте размеры и остатки. Пример: <code>S:1, M:2, L:1</code>",
        "description": "Отправьте новое описание. Чтобы очистить, напишите <code>нет</code>:",
        "extra": "Отправьте новую ссылку на дополнительные фото. Чтобы удалить, напишите <code>нет</code>:",
    }
    if field not in prompts:
        await callback.answer("Это поле пока недоступно", show_alert=True)
        return
    await state.clear()
    await state.update_data(edit_product_id=product_id, edit_product_field=field)
    await state.set_state(AdminPanelFlow.product_edit_value)
    await callback.message.answer(prompts[field], reply_markup=get_admin_cancel_keyboard(f"pe:{product_id}"))
    await callback.answer()


@router.message(AdminPanelFlow.product_edit_value)
async def admin_product_edit_value(message: Message, state: FSMContext):
    if not admin_only(message.from_user.id):
        return
    data = await state.get_data()
    product_id = int(data.get("edit_product_id"))
    field = data.get("edit_product_field")
    value = (message.text or "").strip()
    async with async_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            await message.answer("Товар не найден")
            await state.clear()
            return
        prices = dict(product.prices or {})
        try:
            if field == "name":
                if not value:
                    raise ValueError("Название не может быть пустым")
                product.name = value
            elif field == "brand":
                product.brand = None if value.casefold() in {"нет", "-", "убрать"} else value
            elif field == "price":
                price_byn = float(value.replace(",", "."))
                if price_byn <= 0:
                    raise ValueError("Цена должна быть больше нуля")
                product.price_byn = price_byn
                price_rub, price_usd = calculate_product_prices(price_byn)
                prices.update({"BYN": price_byn, "RUB": price_rub, "USD": price_usd})
                prices.pop("old_price", None)
                prices.pop("old_prices", None)
            elif field == "sizes":
                sizes, size_stock, total_stock = parse_sizes_and_stock(value)
                product.sizes = sizes
                product.stock = total_stock
                prices["size_stock"] = size_stock
            elif field == "description":
                product.description = "" if value.casefold() in {"нет", "-", "убрать"} else value
            elif field == "extra":
                if value.casefold() in {"нет", "-", "убрать"}:
                    prices.pop("extra_photos_url", None)
                else:
                    prices["extra_photos_url"] = value
            else:
                raise ValueError("Неизвестное поле")
        except ValueError as exc:
            await message.answer(f"❌ {exc}\nПопробуйте ещё раз.")
            return
        product.prices = prices
        await session.commit()
    await state.clear()
    success = await auto_push_to_github()
    notice = "✅ Изменения сохранены" + (" и отправлены в каталог." if success else ", но GitHub пока не обновился.")
    await send_product_admin_card(message, product, notice)


@router.callback_query(F.data.startswith("pc:"))
async def admin_product_edit_category(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    _, product_id_raw, category_raw = callback.data.split(":", 2)
    product_id, category_id = int(product_id_raw), int(category_raw)
    async with async_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            await callback.answer("Товар не найден", show_alert=True)
            return
        product.category_id = category_id
        await session.commit()
    success = await auto_push_to_github()
    notice = "✅ Категория обновлена" + (" и отправлена в каталог." if success else ", но GitHub пока не обновился.")
    await send_product_admin_card(callback.message, product, notice)
    await callback.answer()


@router.callback_query(F.data.startswith("pt:"))
async def admin_product_edit_section(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    _, product_id_raw, section = callback.data.split(":", 2)
    product_id = int(product_id_raw)
    if section not in {"stock", "order"}:
        await callback.answer("Некорректный раздел", show_alert=True)
        return
    async with async_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            await callback.answer("Товар не найден", show_alert=True)
            return
        prices = dict(product.prices or {})
        prices["product_type"] = section
        product.prices = prices
        await session.commit()
    success = await auto_push_to_github()
    notice = "✅ Параметр товара изменён" + (" и отправлен в каталог." if success else ", но GitHub пока не обновился.")
    await send_product_admin_card(callback.message, product, notice)
    await callback.answer()


@router.callback_query(F.data.startswith("pco:"))
async def admin_product_edit_condition(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    _, product_id_raw, condition_raw = callback.data.split(":", 2)
    product_id = int(product_id_raw)
    condition = None if condition_raw == "none" else PRODUCT_CONDITIONS[int(condition_raw)]
    async with async_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            await callback.answer("Товар не найден", show_alert=True)
            return
        prices = dict(product.prices or {})
        if condition:
            prices["condition"] = condition
        else:
            prices.pop("condition", None)
        product.prices = prices
        await session.commit()
    success = await auto_push_to_github()
    notice = "✅ Состояние обновлено" + (" и отправлено в каталог." if success else ", но GitHub пока не обновился.")
    await send_product_admin_card(callback.message, product, notice)
    await callback.answer()


@router.callback_query(F.data.startswith("pd:"))
async def admin_product_delete_confirm(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if not product:
        await callback.answer("Товар не найден", show_alert=True)
        return
    await callback.message.answer(
        f"⚠️ Удалить товар <b>#{product_id} {product.name}</b>?\n\nФотографии физически удаляться не будут.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🗑 Да, удалить", callback_data=f"pdc:{product_id}")],
            [InlineKeyboardButton(text="Отмена", callback_data=f"pv:{product_id}")],
        ]),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("pdc:"))
async def admin_product_delete_execute(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    async with async_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            await callback.answer("Товар уже удалён", show_alert=True)
            return
        name = product.name
        await session.delete(product)
        await session.commit()
    success = await auto_push_to_github()
    await callback.message.answer(
        f"✅ Товар #{product_id} {name} удалён" + (" и каталог обновлён." if success else ". GitHub пока не обновился."),
        reply_markup=get_products_panel_keyboard(),
    )
    await callback.answer()


async def set_product_discount(product_id: int, new_price: float) -> tuple[bool, str]:
    async with async_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            return False, "Товар не найден"
        normal_price = product_normal_price(product)
        if new_price <= 0:
            return False, "Цена должна быть больше нуля"
        if new_price >= normal_price:
            return False, f"Скидочная цена должна быть ниже обычной ({normal_price:g} BYN)"
        prices = dict(product.prices or {})
        prices["old_price"] = normal_price
        old_rub, old_usd = calculate_product_prices(normal_price)
        prices["old_prices"] = {"BYN": normal_price, "RUB": old_rub, "USD": old_usd}
        product.price_byn = new_price
        new_rub, new_usd = calculate_product_prices(new_price)
        prices.update({"BYN": new_price, "RUB": new_rub, "USD": new_usd})
        product.prices = prices
        await session.commit()
    return True, "Скидка сохранена"


async def remove_product_discount(product_id: int) -> tuple[bool, str]:
    async with async_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            return False, "Товар не найден"
        if not product_has_discount(product):
            return False, "У товара нет скидки"
        prices = dict(product.prices or {})
        normal_price = float(prices.get("old_price"))
        product.price_byn = normal_price
        normal_rub, normal_usd = calculate_product_prices(normal_price)
        prices.update({"BYN": normal_price, "RUB": normal_rub, "USD": normal_usd})
        prices.pop("old_price", None)
        prices.pop("old_prices", None)
        product.prices = prices
        await session.commit()
    return True, "Скидка удалена"


def get_discount_actions_keyboard(product_id: int):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✏️ Изменить скидку", callback_data=f"ds:{product_id}")],
        [InlineKeyboardButton(text="🧹 Удалить скидку", callback_data=f"dr:{product_id}")],
        [InlineKeyboardButton(text="📦 Открыть товар", callback_data=f"pv:{product_id}")],
        [InlineKeyboardButton(text="⬅️ Скидки", callback_data="panel:discounts")],
    ])


@router.callback_query(F.data.startswith("dv:"))
async def admin_discount_view(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if not product or not product_has_discount(product):
        await callback.answer("Скидка не найдена", show_alert=True)
        return
    text = (
        f"🏷 <b>Скидка товара #{product.id}</b>\n\n"
        f"<b>{product.name}</b>\n"
        f"Обычная цена: <s>{product_normal_price(product):g} BYN</s>\n"
        f"Цена со скидкой: <b>{float(product.price_byn or 0):g} BYN</b>"
    )
    first_image = next((str(url).strip() for url in (product.images or []) if str(url).strip()), None)
    if first_image:
        try:
            await callback.message.answer_photo(photo=first_image, caption=text, reply_markup=get_discount_actions_keyboard(product_id))
            await callback.answer()
            return
        except Exception as exc:
            print(f"⚠️ Не удалось показать фото скидки товара #{product_id}: {exc}")
    await callback.message.answer(text, reply_markup=get_discount_actions_keyboard(product_id))
    await callback.answer()


@router.callback_query(F.data.startswith("ds:"))
async def admin_discount_set_start(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if not product:
        await callback.answer("Товар не найден", show_alert=True)
        return
    await state.clear()
    await state.update_data(discount_product_id=product_id)
    await state.set_state(AdminPanelFlow.discount_value)
    rows = [[InlineKeyboardButton(text="❌ Отмена", callback_data="panel:discounts")]]
    if product_has_discount(product):
        rows.insert(0, [InlineKeyboardButton(text="🧹 Удалить текущую скидку", callback_data=f"dr:{product_id}")])
    await callback.message.answer(
        f"🏷 <b>Скидка для товара #{product_id}</b>\n\nОбычная цена: {product_normal_price(product):g} BYN\nТекущая цена: {float(product.price_byn or 0):g} BYN\n\nОтправьте новую скидочную цену в BYN:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=rows),
    )
    await callback.answer()


@router.message(AdminPanelFlow.discount_value)
async def admin_discount_value(message: Message, state: FSMContext):
    if not admin_only(message.from_user.id):
        return
    data = await state.get_data()
    product_id = int(data.get("discount_product_id"))
    try:
        new_price = float((message.text or "").strip().replace(",", "."))
    except ValueError:
        await message.answer("❌ Отправьте цену числом, например: <code>120</code>")
        return
    ok, result = await set_product_discount(product_id, new_price)
    if not ok:
        await message.answer(f"❌ {result}")
        return
    await state.clear()
    success = await auto_push_to_github()
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if product:
        notice = "✅ Скидка сохранена" + (" и отправлена в каталог." if success else ", но GitHub пока не обновился.")
        await send_product_admin_card(message, product, notice)
    else:
        await message.answer("✅ Скидка сохранена", reply_markup=get_discounts_panel_keyboard())


@router.callback_query(F.data.startswith("dr:"))
async def admin_discount_remove_confirm(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    await callback.message.answer(
        f"Удалить скидку у товара #{product_id}?",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Да, удалить скидку", callback_data=f"drc:{product_id}")],
            [InlineKeyboardButton(text="Отмена", callback_data=f"dv:{product_id}")],
        ]),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("drc:"))
async def admin_discount_remove_execute(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    product_id = int(callback.data.split(":", 1)[1])
    ok, result = await remove_product_discount(product_id)
    if not ok:
        await callback.answer(result, show_alert=True)
        return
    success = await auto_push_to_github()
    async with async_session() as session:
        product = await session.get(Product, product_id)
    if product:
        notice = "✅ Скидка удалена" + (" и каталог обновлён." if success else ", но GitHub пока не обновился.")
        await send_product_admin_card(callback.message, product, notice)
    else:
        await callback.message.answer("✅ Скидка удалена", reply_markup=get_discounts_panel_keyboard())
    await callback.answer()


@router.callback_query(F.data.startswith("dl:"))
async def admin_discount_list(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    try:
        page = max(0, int(callback.data.split(":", 1)[1]))
    except ValueError:
        page = 0
    async with async_session() as session:
        products = [p for p in (await session.execute(select(Product).order_by(Product.created_at.desc()))).scalars().all() if product_has_discount(p)]
    total_pages = max(1, (len(products) + ADMIN_PAGE_SIZE - 1) // ADMIN_PAGE_SIZE)
    page = min(page, total_pages - 1)
    chunk = products[page * ADMIN_PAGE_SIZE:(page + 1) * ADMIN_PAGE_SIZE]
    rows = [[InlineKeyboardButton(
        text=f"#{p.id} · {compact_text(p.name, 24)} · {product_normal_price(p):g}→{float(p.price_byn):g} BYN",
        callback_data=f"dv:{p.id}",
    )] for p in chunk]
    if not rows:
        rows.append([InlineKeyboardButton(text="Скидок пока нет", callback_data="noop")])
    nav_row = []
    if page > 0:
        nav_row.append(InlineKeyboardButton(text="←", callback_data=f"dl:{page-1}"))
    nav_row.append(InlineKeyboardButton(text=f"{page+1}/{total_pages}", callback_data="noop"))
    if page + 1 < total_pages:
        nav_row.append(InlineKeyboardButton(text="→", callback_data=f"dl:{page+1}"))
    rows.append(nav_row)
    rows.append([InlineKeyboardButton(text="⬅️ Скидки", callback_data="panel:discounts")])
    await callback.message.answer(
        f"🏷 <b>Товары со скидками ({len(products)})</b>",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=rows),
    )
    await callback.answer()


# -------------------- Новости --------------------

def news_admin_text(item: dict) -> str:
    status = "Опубликована" if news_is_active(item) else "Скрыта"
    position = item.get("position", "—")
    created = item.get("created_at") or "—"
    return (
        f"📰 <b>Новость #{item.get('id')}</b>\n\n"
        f"<b>{item.get('title', '')}</b>\n\n"
        f"Статус: <b>{status}</b>\n"
        f"Позиция: <b>{position}</b>\n"
        f"Дата: {created}\n"
        f"🔗 {item.get('post_url') or 'ссылка не указана'}\n"
        f"🖼 {item.get('image') or 'фото не указано'}"
    )


def get_news_actions_keyboard(news_id: int, item: Optional[dict] = None):
    if item is None:
        item = next((value for value in load_updates_sync() if int(value.get("id", 0)) == news_id), {})
    toggle_text = "🙈 Скрыть" if news_is_active(item or {}) else "👁 Опубликовать"
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✏️ Редактировать", callback_data=f"ne:{news_id}")],
        [
            InlineKeyboardButton(text="⬆️ Выше", callback_data=f"nm:{news_id}:up"),
            InlineKeyboardButton(text="⬇️ Ниже", callback_data=f"nm:{news_id}:down"),
        ],
        [InlineKeyboardButton(text=toggle_text, callback_data=f"nt:{news_id}")],
        [InlineKeyboardButton(text="🗑 Удалить", callback_data=f"nd:{news_id}")],
        [InlineKeyboardButton(text="📋 К списку", callback_data="nl:0")],
        [InlineKeyboardButton(text="⬅️ Новости", callback_data="panel:news")],
    ])


def find_news(query: str) -> list[dict]:
    clean = str(query or "").strip()
    updates = normalize_news_order(load_updates_sync())
    if clean.isdigit():
        return [item for item in updates if str(item.get("id")) == clean]
    lower = clean.casefold()
    return [item for item in updates if lower in str(item.get("title", "")).casefold()][:20]


async def send_news_search_results(message: Message, items: list[dict], action: str, title: str):
    if not items:
        await message.answer("Ничего не найдено. Отправьте другой ID или часть заголовка.", reply_markup=get_admin_cancel_keyboard("panel:news"))
        return
    prefix = {"view": "nv", "edit": "ne", "delete": "nd"}.get(action, "nv")
    rows = [[InlineKeyboardButton(text=f"#{item.get('id')} · {compact_text(item.get('title', ''), 32)}", callback_data=f"{prefix}:{item.get('id')}")] for item in items]
    rows.append([InlineKeyboardButton(text="⬅️ Новости", callback_data="panel:news")])
    await message.answer(title, reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))


@router.callback_query(F.data.startswith("nl:"))
async def admin_news_page(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    try:
        page = max(0, int(callback.data.split(":", 1)[1]))
    except ValueError:
        page = 0
    updates = normalize_news_order(load_updates_sync())
    total_pages = max(1, (len(updates) + ADMIN_PAGE_SIZE - 1) // ADMIN_PAGE_SIZE)
    page = min(page, total_pages - 1)
    chunk = updates[page * ADMIN_PAGE_SIZE:(page + 1) * ADMIN_PAGE_SIZE]
    rows = [[InlineKeyboardButton(
        text=f"{'🟢' if news_is_active(item) else '⚪️'} {item.get('position', '?')}. #{item.get('id')} · {compact_text(item.get('title', ''), 26)}",
        callback_data=f"nv:{item.get('id')}",
    )] for item in chunk]
    if not rows:
        rows.append([InlineKeyboardButton(text="Новостей пока нет", callback_data="noop")])
    nav_row = []
    if page > 0:
        nav_row.append(InlineKeyboardButton(text="←", callback_data=f"nl:{page-1}"))
    nav_row.append(InlineKeyboardButton(text=f"{page+1}/{total_pages}", callback_data="noop"))
    if page + 1 < total_pages:
        nav_row.append(InlineKeyboardButton(text="→", callback_data=f"nl:{page+1}"))
    rows.append(nav_row)
    rows.append([InlineKeyboardButton(text="⬅️ Новости", callback_data="panel:news")])
    await callback.message.answer(f"📰 <b>Список новостей ({len(updates)})</b>", reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))
    await callback.answer()


@router.callback_query(F.data.in_({"nn:find", "nn:edit", "nn:delete"}))
async def admin_news_search_start(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    action_map = {"nn:find": "view", "nn:edit": "edit", "nn:delete": "delete"}
    await state.clear()
    await state.update_data(news_search_action=action_map[callback.data])
    await state.set_state(AdminPanelFlow.news_search)
    await callback.message.answer("Отправьте ID новости или часть заголовка:", reply_markup=get_admin_cancel_keyboard("panel:news"))
    await callback.answer()


@router.message(AdminPanelFlow.news_search)
async def admin_news_search_message(message: Message, state: FSMContext):
    if not admin_only(message.from_user.id):
        return
    data = await state.get_data()
    action = data.get("news_search_action", "view")
    items = find_news(message.text or "")
    if items:
        await state.clear()
    await send_news_search_results(message, items, action, "📰 Результаты поиска")


@router.callback_query(F.data.startswith("nv:"))
async def admin_news_view(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    news_id = int(callback.data.split(":", 1)[1])
    item = next((value for value in normalize_news_order(load_updates_sync()) if int(value.get("id", 0)) == news_id), None)
    if not item:
        await callback.answer("Новость не найдена", show_alert=True)
        return
    await callback.message.answer(news_admin_text(item), disable_web_page_preview=True, reply_markup=get_news_actions_keyboard(news_id, item))
    await callback.answer()


@router.callback_query(F.data.startswith("nt:"))
async def admin_news_toggle_visibility(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    news_id = int(callback.data.split(":", 1)[1])
    updates = load_updates_sync()
    item = next((entry for entry in updates if int(entry.get("id", 0)) == news_id), None)
    if not item:
        await callback.answer("Новость не найдена", show_alert=True)
        return
    item["is_active"] = not news_is_active(item)
    save_updates_sync(updates)
    success = await push_updates_to_github()
    status = "опубликована" if news_is_active(item) else "скрыта"
    await callback.message.answer(
        f"✅ Новость #{news_id} {status}" + (" и список обновлён." if success else ", но GitHub пока не обновился."),
        reply_markup=get_news_actions_keyboard(news_id, item),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("nm:"))
async def admin_news_move(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    _, news_id_raw, direction = callback.data.split(":", 2)
    news_id = int(news_id_raw)
    updates = normalize_news_order(load_updates_sync())
    index = next((idx for idx, item in enumerate(updates) if int(item.get("id", 0)) == news_id), None)
    if index is None:
        await callback.answer("Новость не найдена", show_alert=True)
        return
    target = index - 1 if direction == "up" else index + 1
    if target < 0 or target >= len(updates):
        await callback.answer("Новость уже находится на крайней позиции")
        return
    updates[index], updates[target] = updates[target], updates[index]
    save_updates_sync(updates)
    success = await push_updates_to_github()
    item = next((entry for entry in normalize_news_order(updates) if int(entry.get("id", 0)) == news_id), {})
    await callback.message.answer(
        "✅ Порядок новостей изменён" + (" и опубликован." if success else ", но GitHub пока не обновился."),
        reply_markup=get_news_actions_keyboard(news_id, item),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("ne:"))
async def admin_news_edit_menu(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    news_id = int(callback.data.split(":", 1)[1])
    await callback.message.answer(
        f"✏️ <b>Редактирование новости #{news_id}</b>\n\nВыберите поле:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Заголовок / текст", callback_data=f"nf:{news_id}:title")],
            [InlineKeyboardButton(text="Фотография", callback_data=f"nf:{news_id}:photo")],
            [InlineKeyboardButton(text="Ссылка", callback_data=f"nf:{news_id}:url")],
            [InlineKeyboardButton(text="⬅️ Назад", callback_data=f"nv:{news_id}")],
        ]),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("nf:"))
async def admin_news_edit_field(callback: CallbackQuery, state: FSMContext):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    _, news_id_raw, field = callback.data.split(":", 2)
    news_id = int(news_id_raw)
    await state.clear()
    await state.update_data(edit_news_id=news_id, edit_news_field=field)
    if field == "photo":
        await state.set_state(AdminPanelFlow.news_edit_photo)
        await callback.message.answer("Отправьте новую фотографию новости:", reply_markup=get_admin_cancel_keyboard(f"ne:{news_id}"))
    else:
        await state.set_state(AdminPanelFlow.news_edit_value)
        prompt = "Отправьте новый заголовок / текст новости:" if field == "title" else "Отправьте новую ссылку. Чтобы удалить ссылку, напишите <code>нет</code>:"
        await callback.message.answer(prompt, reply_markup=get_admin_cancel_keyboard(f"ne:{news_id}"))
    await callback.answer()


@router.message(AdminPanelFlow.news_edit_value)
async def admin_news_edit_value(message: Message, state: FSMContext):
    if not admin_only(message.from_user.id):
        return
    data = await state.get_data()
    news_id = int(data.get("edit_news_id"))
    field = data.get("edit_news_field")
    value = (message.text or "").strip()
    updates = load_updates_sync()
    item = next((entry for entry in updates if int(entry.get("id", 0)) == news_id), None)
    if not item:
        await message.answer("Новость не найдена")
        await state.clear()
        return
    if field == "title":
        if not value:
            await message.answer("Заголовок не может быть пустым")
            return
        item["title"] = value
    elif field == "url":
        item["post_url"] = "" if value.casefold() in {"нет", "-", "убрать"} else value
    save_updates_sync(updates)
    await state.clear()
    success = await push_updates_to_github()
    await message.answer("✅ Новость обновлена" + (" и опубликована." if success else ", но GitHub пока не обновился."), reply_markup=get_news_actions_keyboard(news_id, item))


@router.message(AdminPanelFlow.news_edit_photo, F.photo)
async def admin_news_edit_photo(message: Message, state: FSMContext):
    if not admin_only(message.from_user.id):
        return
    data = await state.get_data()
    news_id = int(data.get("edit_news_id"))
    photo = message.photo[-1]
    file = await bot.get_file(photo.file_id)
    file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as http_session:
        async with http_session.get(file_url) as response:
            image_data = await response.read()
    image_url = await upload_update_photo_to_github(image_data, news_id)
    if not image_url:
        await message.answer("❌ Не удалось загрузить фотографию. Попробуйте ещё раз.")
        return
    updates = load_updates_sync()
    item = next((entry for entry in updates if int(entry.get("id", 0)) == news_id), None)
    if not item:
        await message.answer("Новость не найдена")
        await state.clear()
        return
    item["image"] = image_url
    save_updates_sync(updates)
    await state.clear()
    success = await push_updates_to_github()
    await message.answer("✅ Фотография обновлена" + (" и опубликована." if success else ", но GitHub пока не обновился."), reply_markup=get_news_actions_keyboard(news_id, item))


@router.message(AdminPanelFlow.news_edit_photo)
async def admin_news_edit_photo_invalid(message: Message):
    await message.answer("Отправьте именно фотографию.")


@router.callback_query(F.data.startswith("nd:"))
async def admin_news_delete_confirm(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    news_id = int(callback.data.split(":", 1)[1])
    item = next((value for value in load_updates_sync() if int(value.get("id", 0)) == news_id), None)
    if not item:
        await callback.answer("Новость не найдена", show_alert=True)
        return
    await callback.message.answer(
        f"Удалить новость <b>#{news_id} {compact_text(item.get('title', ''), 60)}</b>?",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🗑 Да, удалить", callback_data=f"ndc:{news_id}")],
            [InlineKeyboardButton(text="Отмена", callback_data=f"nv:{news_id}")],
        ]),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("ndc:"))
async def admin_news_delete_execute(callback: CallbackQuery):
    if not admin_only(callback.from_user.id):
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return
    news_id = int(callback.data.split(":", 1)[1])
    updates = load_updates_sync()
    target = next((item for item in updates if int(item.get("id", 0)) == news_id), None)
    if not target:
        await callback.answer("Новость уже удалена", show_alert=True)
        return
    updates = [item for item in updates if int(item.get("id", 0)) != news_id]
    save_updates_sync(updates)
    success = await push_updates_to_github()
    await callback.message.answer("✅ Новость удалена" + (" и список опубликован." if success else ", но GitHub пока не обновился."), reply_markup=get_news_panel_keyboard())
    await callback.answer()


        # ==================== ADMIN: ДОБАВЛЕНИЕ ТОВАРА ====================

@router.callback_query(F.data == "admin_add_product")
async def admin_add_product_btn(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    await state.clear()
    await state.update_data(product_type="stock")
    await callback.message.answer(
        "➕ <b>Новый товар</b>\n\n"
        "Шаг 1 из 8: отправьте <b>название бренда</b>.\n"
        "Если бренда нет — напишите <code>нет</code>.",
        reply_markup=get_add_product_cancel_keyboard()
    )
    await state.set_state(AddProduct.brand)
    await callback.answer()


@router.message(Command("add_product"))
async def cmd_add_product(message: Message, state: FSMContext):
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("⛔ Эта команда только для администраторов")
        return

    await state.clear()
    await state.update_data(product_type="stock")
    await message.answer(
        "➕ <b>Новый товар</b>\n\n"
        "Шаг 1 из 8: отправьте <b>название бренда</b>.\n"
        "Если бренда нет — напишите <code>нет</code>.",
        reply_markup=get_add_product_cancel_keyboard()
    )
    await state.set_state(AddProduct.brand)


def get_add_product_cancel_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отменить добавление", callback_data="admin_cancel")]
    ])


def get_description_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⏭ Пропустить описание", callback_data="add_description_skip")],
        [InlineKeyboardButton(text="❌ Отменить добавление", callback_data="admin_cancel")]
    ])


def get_product_preview_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Опубликовать товар", callback_data="publish_product")],
        [InlineKeyboardButton(text="✏️ Изменить поле", callback_data="product_edit_menu")],
        [InlineKeyboardButton(text="❌ Отменить", callback_data="admin_cancel")]
    ])


def get_product_edit_keyboard(product_type: str) -> InlineKeyboardMarkup:
    buttons = [
        [
            InlineKeyboardButton(text="Бренд", callback_data="product_edit_brand"),
            InlineKeyboardButton(text="Название", callback_data="product_edit_name"),
        ],
        [
            InlineKeyboardButton(text="Категория", callback_data="product_edit_category"),
            InlineKeyboardButton(text="Цена", callback_data="product_edit_price"),
        ],
        [
            InlineKeyboardButton(text="Размеры / количество", callback_data="product_edit_sizes"),
        ],
        [
            InlineKeyboardButton(text="Описание", callback_data="product_edit_description"),
            InlineKeyboardButton(text="Фото", callback_data="product_edit_images"),
        ],
    ]
    if product_type != "order":
        buttons.append([
            InlineKeyboardButton(text="Состояние", callback_data="product_edit_condition"),
            InlineKeyboardButton(text="Доп. фото", callback_data="product_edit_extra_photos"),
        ])
    buttons.extend([
        [InlineKeyboardButton(text="⬅️ Назад к предпросмотру", callback_data="product_preview_back")],
        [InlineKeyboardButton(text="❌ Отменить", callback_data="admin_cancel")],
    ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def calculate_product_prices(price_byn: float) -> tuple[float, float]:
    """Автоматически считает RUB и USD от цены BYN по текущему курсу."""
    price_rub = round(price_byn * float(CURRENCIES["RUB"]["rate"]))
    price_usd = round(price_byn * float(CURRENCIES["USD"]["rate"]), 2)
    return float(price_rub), float(price_usd)


def parse_sizes_and_stock(raw_value: str) -> tuple[list[str], dict[str, int], int]:
    """
    Принимает форматы:
      S:1, M:2, L:1
      41=1; 42=2
      ONE SIZE
    Если количество не указано, для размера используется 1.
    """
    tokens = [part.strip() for part in re.split(r"[,;\n]+", raw_value or "") if part.strip()]
    if not tokens:
        raise ValueError("Укажите хотя бы один размер")

    ordered_sizes: list[str] = []
    size_stock: dict[str, int] = {}

    for token in tokens:
        if ":" in token:
            size_value, qty_value = token.rsplit(":", 1)
        elif "=" in token:
            size_value, qty_value = token.rsplit("=", 1)
        else:
            size_value, qty_value = token, "1"

        size = size_value.strip().upper()
        if not size:
            raise ValueError("У одного из размеров отсутствует название")

        try:
            quantity = int(qty_value.strip())
        except ValueError as exc:
            raise ValueError(f"Количество для размера {size} должно быть целым числом") from exc

        if quantity <= 0:
            raise ValueError(f"Количество для размера {size} должно быть больше нуля")

        if size not in size_stock:
            ordered_sizes.append(size)
            size_stock[size] = 0
        size_stock[size] += quantity

    total_stock = sum(size_stock.values())
    return ordered_sizes, size_stock, total_stock


def format_size_stock(data: dict) -> str:
    sizes = data.get("sizes") or []
    size_stock = data.get("size_stock") or {}
    if not sizes:
        return "не указаны"
    return ", ".join(f"{size} — {int(size_stock.get(size, 1))} шт." for size in sizes)


async def send_product_preview(message: Message, state: FSMContext):
    data = await state.get_data()
    product_type = data.get("product_type", "stock")
    cat_data = CATEGORIES.get(data.get("category_id"), {})
    brand_name = display_brand_name(data.get("brand")) or "Без бренда"
    description = (data.get("description") or "").strip() or "Не указано"
    if len(description) > 280:
        description = description[:277].rstrip() + "..."

    caption = (
        "👀 <b>Предпросмотр товара</b>\n\n"
        f"🏷 Бренд: <b>{brand_name}</b>\n"
        f"📦 Название: <b>{data.get('name', 'Не указано')}</b>\n"
        f"📁 Категория: {cat_data.get('icon', '')} {cat_data.get('name', 'Не указана')}\n"
        f"💰 Цена: <b>{data.get('price_byn', 0):g} BYN</b>\n"
        f"📏 Размеры: {format_size_stock(data)}\n"
    )
    if product_type != "order":
        caption += f"✨ Состояние: {data.get('condition') or 'Не указано'}\n"
    caption += f"📝 Описание: {description}\n"
    caption += f"🖼 Фотографий: {len(data.get('images') or [])}"
    if product_type != "order" and data.get("extra_photos_url"):
        caption += f"\n🔗 Доп. фото: {data['extra_photos_url']}"
    caption += "\n\nПроверьте данные перед публикацией."

    images = data.get("images") or []
    try:
        if images:
            await message.answer_photo(
                photo=images[0],
                caption=caption,
                reply_markup=get_product_preview_keyboard()
            )
        else:
            await message.answer(caption, reply_markup=get_product_preview_keyboard())
    except Exception:
        await message.answer(caption, reply_markup=get_product_preview_keyboard())

    await state.set_state(AddProduct.preview)


async def return_to_preview_after_edit(message: Message, state: FSMContext) -> bool:
    data = await state.get_data()
    if not data.get("edit_return"):
        return False
    await state.update_data(edit_return=False)
    await send_product_preview(message, state)
    return True


async def ask_product_images(message: Message, state: FSMContext, step_text: str = "Шаг 8 из 8"):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Готово — предпросмотр", callback_data="save_product")],
        [InlineKeyboardButton(text="❌ Отменить добавление", callback_data="admin_cancel")]
    ])
    await message.answer(
        f"{step_text}: отправьте <b>фотографии товара</b> 📸\n\n"
        f"• Можно отправить до {MAX_PRODUCT_IMAGES} фото\n"
        f"• Можно отправлять по одной или альбомом\n"
        "• После загрузки нажмите <b>Готово — предпросмотр</b>",
        reply_markup=keyboard
    )
    await state.set_state(AddProduct.images)


@router.callback_query(F.data.startswith("addtype_"))
async def process_product_type(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    product_type = callback.data.replace("addtype_", "")
    if product_type not in {"stock", "order"}:
        await callback.answer("❌ Неверный тип товара", show_alert=True)
        return

    await state.update_data(product_type=product_type)
    await callback.message.edit_text(
        f"✅ Раздел: <b>{'Наличие' if product_type == 'stock' else 'На заказ'}</b>\n\n"
        "Шаг 2 из 9: отправьте <b>название бренда</b>.\n"
        "Если бренда нет — напишите <code>нет</code>.",
        reply_markup=get_add_product_cancel_keyboard()
    )
    await state.set_state(AddProduct.brand)
    await callback.answer()


@router.message(AddProduct.brand)
async def process_brand_text(message: Message, state: FSMContext):
    brand_text = (message.text or "").strip()
    if not brand_text:
        await message.answer("❌ Отправьте название бренда текстом или напишите <code>нет</code>.")
        return

    empty_brand_values = {"нет", "-", "без бренда"}
    brand_value = None if brand_text.casefold() in empty_brand_values else brand_text
    await state.update_data(brand=brand_value)

    if await return_to_preview_after_edit(message, state):
        return

    await message.answer(
        f"✅ Бренд: <b>{display_brand_name(brand_value) or 'Без бренда'}</b>\n\n"
        "Шаг 2 из 8: отправьте <b>название или модель товара</b>:",
        reply_markup=get_add_product_cancel_keyboard()
    )
    await state.set_state(AddProduct.name)


@router.message(AddProduct.name)
async def process_name(message: Message, state: FSMContext):
    name = (message.text or "").strip()
    if not name:
        await message.answer("❌ Название товара не может быть пустым.")
        return

    await state.update_data(name=name)
    if await return_to_preview_after_edit(message, state):
        return

    await message.answer(
        f"✅ Название: <b>{name}</b>\n\n"
        "Шаг 3 из 8: выберите <b>категорию</b>:",
        reply_markup=get_category_keyboard()
    )
    await state.set_state(AddProduct.category)


@router.callback_query(F.data.startswith("addcat_"))
async def process_category(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    try:
        category_id = int(callback.data.split("_", 1)[1])
    except ValueError:
        await callback.answer("❌ Неверная категория", show_alert=True)
        return

    cat_data = CATEGORIES.get(category_id)
    if not cat_data:
        await callback.answer("❌ Категория не найдена", show_alert=True)
        return

    await state.update_data(category_id=category_id)
    data = await state.get_data()
    if data.get("edit_return"):
        await state.update_data(edit_return=False)
        await callback.answer("✅ Категория изменена")
        await send_product_preview(callback.message, state)
        return

    await callback.message.edit_text(
        f"✅ Категория: <b>{cat_data.get('icon', '')} {cat_data.get('name', '')}</b>\n\n"
        "Шаг 4 из 8: отправьте <b>цену в BYN</b>.\n\n"
        "Пример: <code>150</code> или <code>149.90</code>",
        reply_markup=get_add_product_cancel_keyboard()
    )
    await state.set_state(AddProduct.price_byn)
    await callback.answer()


@router.message(AddProduct.price_byn)
async def process_price_byn(message: Message, state: FSMContext):
    try:
        price_byn = float((message.text or "").strip().replace(",", "."))
        if price_byn <= 0:
            raise ValueError
    except ValueError:
        await message.answer(
            "❌ Неправильный формат цены.\n\n"
            "Отправьте положительное число, например: <code>150</code> или <code>149.90</code>"
        )
        return

    price_rub, price_usd = calculate_product_prices(price_byn)
    await state.update_data(price_byn=price_byn, price_rub=price_rub, price_usd=price_usd)

    if await return_to_preview_after_edit(message, state):
        return

    data = await state.get_data()
    category_id = data.get("category_id", 1)
    if category_id == 1:
        example = "40:1, 41:2, 42:1"
    elif category_id in {9, 10}:
        example = "ONE SIZE:1"
    else:
        example = "S:1, M:2, L:1"

    await message.answer(
        f"✅ Цена: <b>{price_byn:g} BYN</b>\n\n"
        "Шаг 5 из 8: отправьте <b>размеры и количество</b>.\n\n"
        "Формат: <code>РАЗМЕР:КОЛИЧЕСТВО</code>\n"
        f"Пример: <code>{example}</code>\n\n"
        "Размеры можно разделять запятыми или отправлять каждый с новой строки.",
        reply_markup=get_add_product_cancel_keyboard()
    )
    await state.set_state(AddProduct.sizes)


@router.message(AddProduct.sizes)
async def process_sizes(message: Message, state: FSMContext):
    try:
        sizes, size_stock, total_stock = parse_sizes_and_stock(message.text or "")
    except ValueError as exc:
        await message.answer(
            f"❌ {exc}\n\n"
            "Пример правильного формата:\n"
            "<code>S:1, M:2, L:1</code>"
        )
        return

    await state.update_data(sizes=sizes, size_stock=size_stock, stock=total_stock)
    if await return_to_preview_after_edit(message, state):
        return

    await message.answer(
        f"✅ Размеры сохранены: <b>{format_size_stock({'sizes': sizes, 'size_stock': size_stock})}</b>\n\n"
        "Шаг 6 из 8: отправьте <b>описание товара</b> или нажмите «Пропустить описание»:",
        reply_markup=get_description_keyboard()
    )
    await state.set_state(AddProduct.description)


async def continue_after_description(message: Message, state: FSMContext):
    data = await state.get_data()
    if data.get("product_type", "stock") == "order":
        await state.update_data(condition=None, images=[])
        await ask_product_images(message, state)
        return

    await message.answer(
        "Шаг 7 из 8: выберите <b>состояние товара</b>:",
        reply_markup=get_condition_keyboard()
    )
    await state.set_state(AddProduct.condition)


@router.message(AddProduct.description)
async def process_description(message: Message, state: FSMContext):
    description = (message.text or "").strip()
    if description.casefold() in {"нет", "-", "пропустить"}:
        description = ""
    await state.update_data(description=description)

    if await return_to_preview_after_edit(message, state):
        return

    await continue_after_description(message, state)


@router.callback_query(F.data == "add_description_skip")
async def skip_product_description(callback: CallbackQuery, state: FSMContext):
    await state.update_data(description="")
    data = await state.get_data()
    if data.get("edit_return"):
        await state.update_data(edit_return=False)
        await callback.answer("Описание очищено")
        await send_product_preview(callback.message, state)
        return

    await callback.answer("Описание пропущено")
    await continue_after_description(callback.message, state)


@router.callback_query(F.data.startswith("addcondition_"))
async def process_condition(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    try:
        condition_index = int(callback.data.split("_", 1)[1])
        condition = PRODUCT_CONDITIONS[condition_index]
    except (IndexError, ValueError):
        await callback.answer("❌ Неверное состояние", show_alert=True)
        return

    await state.update_data(condition=condition)
    data = await state.get_data()
    if data.get("edit_return"):
        await state.update_data(edit_return=False)
        await callback.answer("✅ Состояние изменено")
        await send_product_preview(callback.message, state)
        return

    await state.update_data(images=[])
    await callback.answer()
    await ask_product_images(callback.message, state, step_text="Шаг 8 из 8")


# ==================== ИСПРАВЛЕННЫЙ ОБРАБОТЧИК ФОТО ====================

async def upload_temp_telegram_photo_to_github(temp_url: str) -> Optional[str]:
    """Скачивает временное Telegram-фото и загружает его на GitHub, возвращая постоянную ссылку."""
    try:
        await ensure_images_folder_exists()

        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as http_session:
            async with http_session.get(temp_url) as response:
                if response.status != 200:
                    print(f"❌ Не удалось скачать фото из Telegram: HTTP {response.status}")
                    return None
                image_data = await response.read()

        return await upload_photo_to_github(image_data, 0)

    except Exception as e:
        print(f"❌ Ошибка upload_temp_telegram_photo_to_github: {e}")
        return None


@router.message(AddProduct.images, F.photo)
async def process_image(message: Message, state: FSMContext):
    user_id = message.from_user.id
    media_group_id = message.media_group_id

    photo = message.photo[-1]
    file = await bot.get_file(photo.file_id)
    temp_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"

    # Одиночное фото — сериализуем обновление FSM, чтобы несколько быстрых фото
    # не перезаписывали список друг друга.
    if not media_group_id:
        state_lock = product_image_state_locks.setdefault(user_id, asyncio.Lock())
        async with state_lock:
            data = await state.get_data()
            images = list(data.get('images', []))

            if len(images) >= MAX_PRODUCT_IMAGES:
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="✅ Готово — далее", callback_data="save_product")],
                    [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
                ])
                await message.answer(
                    f"⚠️ Уже сохранено максимум фото: {MAX_PRODUCT_IMAGES} из {MAX_PRODUCT_IMAGES}\n\n"
                    "Нажмите <b>Готово</b>",
                    reply_markup=keyboard
                )
                return

            await message.answer("⏳ Загружаю фото на GitHub...")
            permanent_url = await upload_temp_telegram_photo_to_github(temp_url)

            if not permanent_url:
                await message.answer("❌ Не удалось загрузить фото на GitHub. Попробуйте отправить фото ещё раз.")
                return

            # Повторно читаем актуальное состояние после загрузки, затем добавляем ссылку.
            current_data = await state.get_data()
            images = list(current_data.get('images', []))
            if permanent_url not in images and len(images) < MAX_PRODUCT_IMAGES:
                images.append(permanent_url)
            await state.update_data(images=images)

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Готово — далее", callback_data="save_product")],
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])

        await message.answer(
            f"✅ Фото сохранено на GitHub!\n\n"
            f"Всего фото: {len(images)} из {MAX_PRODUCT_IMAGES}\n\n"
            "Отправьте ещё фото или нажмите <b>Готово</b>",
            reply_markup=keyboard
        )
        return

    # Альбом — сначала собираем временные ссылки, потом переносим каждую на GitHub
    buffer_key = f"{user_id}_{media_group_id}"

    if buffer_key not in album_buffers:
        album_buffers[buffer_key] = []

    album_buffers[buffer_key].append(temp_url)

    if buffer_key in album_locks:
        return

    album_locks[buffer_key] = True

    async def process_album_after_delay():
        await asyncio.sleep(2)

        try:
            collected_urls = album_buffers.pop(buffer_key, [])
            album_locks.pop(buffer_key, None)

            if not collected_urls:
                return

            state_lock = product_image_state_locks.setdefault(user_id, asyncio.Lock())
            async with state_lock:
                data = await state.get_data()
                images = list(data.get('images', []))
            remaining_slots = max(MAX_PRODUCT_IMAGES - len(images), 0)

            if remaining_slots <= 0:
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="✅ Готово — далее", callback_data="save_product")],
                    [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
                ])
                await message.answer(
                    f"⚠️ Уже сохранено максимум фото: {MAX_PRODUCT_IMAGES} из {MAX_PRODUCT_IMAGES}\n\n"
                    "Нажмите <b>Готово</b>",
                    reply_markup=keyboard
                )
                return

            selected_urls = collected_urls[:remaining_slots]
            await message.answer(f"⏳ Загружаю {len(selected_urls)} фото на GitHub...")

            permanent_urls = []
            for i, url in enumerate(selected_urls, start=1):
                permanent_url = await upload_temp_telegram_photo_to_github(url)
                if permanent_url:
                    permanent_urls.append(permanent_url)
                    print(f"  📸 {i}/{len(selected_urls)} фото товара загружено на GitHub")

            if not permanent_urls:
                await message.answer("❌ Не удалось загрузить фото на GitHub. Попробуйте отправить фото ещё раз.")
                return

            async with state_lock:
                current_data = await state.get_data()
                images = list(current_data.get('images', []))
                for permanent_url in permanent_urls:
                    if permanent_url not in images and len(images) < MAX_PRODUCT_IMAGES:
                        images.append(permanent_url)
                await state.update_data(images=images)

            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✅ Готово — далее", callback_data="save_product")],
                [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
            ])

            await message.answer(
                f"✅ Фото сохранены на GitHub!\n\n"
                f"Всего фото: {len(images)} из {MAX_PRODUCT_IMAGES}\n\n"
                "Отправьте ещё фото или нажмите <b>Готово</b>",
                reply_markup=keyboard
            )

        except Exception as e:
            print(f"❌ Ошибка обработки альбома: {e}")
            album_buffers.pop(buffer_key, None)
            album_locks.pop(buffer_key, None)

    asyncio.create_task(process_album_after_delay())

@router.callback_query(F.data == "save_product")
async def save_product(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()

    if not data.get("images"):
        await callback.answer("❌ Добавьте хотя бы одно фото", show_alert=True)
        return

    if data.get("edit_return"):
        await state.update_data(edit_return=False)
        await callback.answer("✅ Фотографии обновлены")
        await send_product_preview(callback.message, state)
        return

    if data.get("product_type", "stock") != "order" and not data.get("extra_photos_asked"):
        await state.update_data(extra_photos_asked=True)
        await callback.message.answer(
            "Дополнительный шаг: отправьте ссылку на пост с дополнительными фото.\n"
            "Если ссылки нет — напишите <b>нет</b>.\n\n"
            "Пример:\n<code>https://t.me/mestniystore/9587</code>",
            reply_markup=get_add_product_cancel_keyboard()
        )
        await state.set_state(AddProduct.extra_photos_url)
        await callback.answer()
        return

    await callback.answer("Открываю предпросмотр")
    await send_product_preview(callback.message, state)


@router.message(AddProduct.extra_photos_url)
async def process_extra_photos_url(message: Message, state: FSMContext):
    value = (message.text or "").strip()
    extra_url = "" if value.casefold() in {"нет", "no", "не", "-", "удалить"} else value
    await state.update_data(extra_photos_url=extra_url, extra_photos_asked=True)

    if await return_to_preview_after_edit(message, state):
        return

    await send_product_preview(message, state)


async def edit_callback_message(callback: CallbackQuery, text: str, reply_markup: InlineKeyboardMarkup):
    try:
        if callback.message.photo:
            await callback.message.edit_caption(caption=text, reply_markup=reply_markup)
        else:
            await callback.message.edit_text(text, reply_markup=reply_markup)
    except Exception:
        await callback.message.answer(text, reply_markup=reply_markup)


@router.callback_query(F.data == "product_edit_menu")
async def product_edit_menu(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    await edit_callback_message(
        callback,
        "✏️ <b>Что изменить?</b>\n\nПосле изменения вы снова увидите предпросмотр товара.",
        get_product_edit_keyboard(data.get("product_type", "stock"))
    )
    await state.set_state(AddProduct.edit_field)
    await callback.answer()


@router.callback_query(F.data == "product_preview_back")
async def product_preview_back(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await send_product_preview(callback.message, state)


async def start_field_edit(callback: CallbackQuery, state: FSMContext, field: str):
    await state.update_data(edit_return=True)

    prompts = {
        "brand": (AddProduct.brand, "Отправьте новое <b>название бренда</b> или напишите <code>нет</code>:", get_add_product_cancel_keyboard()),
        "name": (AddProduct.name, "Отправьте новое <b>название товара</b>:", get_add_product_cancel_keyboard()),
        "price": (AddProduct.price_byn, "Отправьте новую <b>цену в BYN</b>:", get_add_product_cancel_keyboard()),
        "sizes": (AddProduct.sizes, "Отправьте новые <b>размеры и количество</b>.\nПример: <code>S:1, M:2, L:1</code>", get_add_product_cancel_keyboard()),
        "description": (AddProduct.description, "Отправьте новое <b>описание</b> или нажмите «Пропустить описание»:", get_description_keyboard()),
        "extra_photos": (AddProduct.extra_photos_url, "Отправьте новую ссылку на <b>дополнительные фото</b> или напишите <code>нет</code>:", get_add_product_cancel_keyboard()),
    }
    state_value, prompt, keyboard = prompts[field]
    await callback.message.answer(prompt, reply_markup=keyboard)
    await state.set_state(state_value)
    await callback.answer()


@router.callback_query(F.data == "product_edit_brand")
async def edit_new_product_brand(callback: CallbackQuery, state: FSMContext):
    await start_field_edit(callback, state, "brand")


@router.callback_query(F.data == "product_edit_name")
async def edit_new_product_name(callback: CallbackQuery, state: FSMContext):
    await start_field_edit(callback, state, "name")


@router.callback_query(F.data == "product_edit_price")
async def edit_new_product_price(callback: CallbackQuery, state: FSMContext):
    await start_field_edit(callback, state, "price")


@router.callback_query(F.data == "product_edit_sizes")
async def edit_new_product_sizes(callback: CallbackQuery, state: FSMContext):
    await start_field_edit(callback, state, "sizes")


@router.callback_query(F.data == "product_edit_description")
async def edit_new_product_description(callback: CallbackQuery, state: FSMContext):
    await start_field_edit(callback, state, "description")


@router.callback_query(F.data == "product_edit_extra_photos")
async def edit_new_product_extra_photos(callback: CallbackQuery, state: FSMContext):
    await start_field_edit(callback, state, "extra_photos")


@router.callback_query(F.data == "product_edit_category")
async def edit_new_product_category(callback: CallbackQuery, state: FSMContext):
    await state.update_data(edit_return=True)
    await callback.message.answer("Выберите новую <b>категорию</b>:", reply_markup=get_category_keyboard())
    await state.set_state(AddProduct.category)
    await callback.answer()


@router.callback_query(F.data == "product_edit_condition")
async def edit_new_product_condition(callback: CallbackQuery, state: FSMContext):
    await state.update_data(edit_return=True)
    await callback.message.answer("Выберите новое <b>состояние товара</b>:", reply_markup=get_condition_keyboard())
    await state.set_state(AddProduct.condition)
    await callback.answer()


@router.callback_query(F.data == "product_edit_images")
async def edit_new_product_images(callback: CallbackQuery, state: FSMContext):
    await state.update_data(images=[], edit_return=True)
    await callback.answer()
    await ask_product_images(callback.message, state, step_text="Замена фото")


@router.callback_query(F.data == "publish_product")
async def publish_product(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    required_fields = ["category_id", "name", "price_byn", "sizes", "images"]
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        await callback.answer("❌ Не заполнены обязательные поля", show_alert=True)
        return

    await callback.answer("⏳ Публикую товар...")
    await finish_product_creation(callback.message, state, data, edit=bool(callback.message.photo))


async def finish_product_creation(target_message, state: FSMContext, data: dict, edit: bool = False):
    try:
        images = (data.get("images") or [])[:MAX_PRODUCT_IMAGES]
        product_type = data.get("product_type", "stock")
        size_stock = data.get("size_stock") or {str(size): 1 for size in (data.get("sizes") or [])}
        stock = int(data.get("stock") or sum(int(value) for value in size_stock.values()))

        prices = {
            "BYN": data["price_byn"],
            "RUB": data["price_rub"],
            "USD": data["price_usd"],
            "product_type": product_type,
            "size_stock": size_stock,
        }
        if product_type != "order" and data.get("condition"):
            prices["condition"] = data["condition"]
        if product_type != "order" and data.get("extra_photos_url"):
            prices["extra_photos_url"] = data["extra_photos_url"]

        async with async_session() as session:
            product = Product(
                category_id=data["category_id"],
                brand=data.get("brand"),
                name=data["name"],
                description=data.get("description") or "",
                price_byn=data["price_byn"],
                prices=prices,
                sizes=data["sizes"],
                stock=stock,
                images=images,
            )
            session.add(product)
            await session.commit()
            product_id = product.id

        brand_name = display_brand_name(data.get("brand")) or "Без бренда"
        cat_data = CATEGORIES.get(data["category_id"], {})
        type_label = "На заказ" if product_type == "order" else "Наличие"

        text = (
            f"✅ <b>Товар #{product_id} опубликован!</b>\n\n"
            f"📦 <b>{data['name']}</b>\n"
            f"🏷 Бренд: {brand_name}\n"
            f"📁 Категория: {cat_data.get('icon', '')} {cat_data.get('name', '')}\n"
            f"💰 Цена: {data['price_byn']:g} BYN\n"
            f"📏 Размеры: {format_size_stock(data)}\n"
        )
        if product_type != "order":
            text += (
                f"📦 Всего в наличии: {stock} шт.\n"
                f"✨ Состояние: {data.get('condition') or 'не указано'}\n"
            )
        text += f"🖼 Фото: {len(images)} шт.\n"
        if product_type != "order" and data.get("extra_photos_url"):
            text += f"🔗 Доп. фото: {data['extra_photos_url']}\n"
        text += "\n✨ Товар уже доступен в каталоге."

        try:
            if edit and target_message.photo:
                await target_message.edit_caption(caption=text, reply_markup=get_admin_keyboard())
            elif edit:
                await target_message.edit_text(text, reply_markup=get_admin_keyboard())
            else:
                await target_message.answer(text, reply_markup=get_admin_keyboard())
        except Exception:
            await target_message.answer(text, reply_markup=get_admin_keyboard())

        await state.clear()
        print(f"✅ Товар #{product_id} добавлен: {data['name']}")

        success = await auto_push_to_github()
        if not success:
            await target_message.answer(
                "⚠️ Товар сохранён в базе, но каталог не удалось отправить на GitHub. "
                "Повторите команду /export позже."
            )

    except Exception as exc:
        print(f"❌ Ошибка сохранения товара: {exc}")
        await target_message.answer(
            f"❌ Ошибка при сохранении товара!\n\n<code>{str(exc)}</code>",
            reply_markup=get_admin_keyboard()
        )
        await state.clear()


@router.message(AddProduct.images)
async def process_images_invalid(message: Message, state: FSMContext):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Готово — далее", callback_data="save_product")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])
    await message.answer(
        "⚠️ Отправьте <b>фото</b> или нажмите <b>Готово</b>",
        reply_markup=keyboard
    )

@router.callback_query(F.data == "admin_cancel")
async def admin_cancel(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    try:
        if callback.message.photo:
            await callback.message.edit_caption(
                caption="❌ Действие отменено",
                reply_markup=get_admin_keyboard()
            )
        else:
            await callback.message.edit_text(
                "❌ Действие отменено",
                reply_markup=get_admin_keyboard()
            )
    except Exception:
        await callback.message.answer(
            "❌ Действие отменено",
            reply_markup=get_admin_keyboard()
        )
    await callback.answer()


@router.callback_query(F.data == "admin_commands")
async def admin_commands(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    text = (
        "🧰 <b>Доступные команды</b>\n\n"
        "<code>/add_product</code> — добавить товар\n"
        "<code>/products</code> — список товаров\n"
        "<code>/delete ID</code> — удалить товар\n"
        "<code>/fix_product ID</code> — заменить фото товара\n"
        "<code>/edit_stock ID КОЛИЧЕСТВО</code> — изменить наличие\n"
        "<code>/remove_size ID РАЗМЕР</code> — удалить размер\n"
        "<code>/edit_extra_photos ID ССЫЛКА</code> — изменить ссылку «Доп фото»\n"
        "<code>/discount ID BYN RUB USD</code> — поставить скидку ценами\n"
        "<code>/discount ID 0</code> — убрать скидку\n"
        "<code>/add_update</code> — добавить обновление\n"
        "<code>/updates</code> — список обновлений\n"
        "<code>/delete_update ID</code> — удалить обновление\n"
        "<code>/export</code> — обновить каталог на GitHub"
    )
    await callback.message.answer(text, reply_markup=get_admin_keyboard())
    await callback.answer()

# ==================== ADMIN: СПИСОК ТОВАРОВ ====================

@router.callback_query(F.data == "admin_products")
async def admin_products_btn(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    async with async_session() as session:
        result = await session.execute(select(Product).order_by(Product.created_at.desc()))
        products = result.scalars().all()

    if not products:
        await callback.message.answer(
            "📦 <b>Товаров пока нет</b>\n\n"
            "Добавьте первый товар через кнопку ниже",
            reply_markup=get_admin_keyboard()
        )
        await callback.answer()
        return

    text = f"📦 <b>Все товары ({len(products)}):</b>\n\n"
    for p in products[:20]:
        product_type = (p.prices or {}).get("product_type", "stock")
        is_order = product_type == "order"
        status = "🛒" if is_order else ("✅" if p.stock > 0 else "❌")
        type_label = "На заказ" if is_order else "Наличие"
        brand_name = display_brand_name(p.brand)
        details = f"   🏷 {brand_name} | 💰 {p.price_byn} BYN | 📌 {type_label}"
        if not is_order:
            details += f" | 📦 {p.stock} шт"
        text += (
            f"{status} <b>#{p.id}</b> {p.name}\n"
            f"{details}\n\n"
        )

    if len(products) > 20:
        text += f"\n<i>...и ещё {len(products) - 20} товаров</i>\n"

    text += "\n🗑 Удалить товар: /delete ID\n(например: <code>/delete 5</code>)"
    text += "\n🔧 Починить фото: /fix_product ID\n(например: <code>/fix_product 5</code>)"

    await callback.message.answer(text)
    await callback.answer()

@router.message(Command("products"))
async def cmd_products(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    async with async_session() as session:
        result = await session.execute(select(Product).order_by(Product.created_at.desc()))
        products = result.scalars().all()

    if not products:
        await message.answer("📦 Товаров пока нет")
        return

    text = f"📦 <b>Все товары ({len(products)}):</b>\n\n"
    for p in products[:20]:
        product_type = (p.prices or {}).get("product_type", "stock")
        is_order = product_type == "order"
        status = "🛒" if is_order else ("✅" if p.stock > 0 else "❌")
        type_label = "На заказ" if is_order else "Наличие"
        brand_name = display_brand_name(p.brand)
        details = f"   🏷 {brand_name} | 💰 {p.price_byn} BYN | 📌 {type_label}"
        if not is_order:
            details += f" | 📦 {p.stock} шт"
        text += (
            f"{status} <b>#{p.id}</b> {p.name}\n"
            f"{details}\n\n"
        )

    text += "\n🗑 Удалить: <code>/delete ID</code>"
    text += "\n🔧 Починить фото: <code>/fix_product ID</code>"

    await message.answer(text)

# ==================== ADMIN: УДАЛЕНИЕ ТОВАРА ====================

@router.message(Command("delete"))
async def cmd_delete_product(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    try:
        parts = message.text.split()
        if len(parts) < 2:
            raise ValueError("Не указан ID")
        product_id = int(parts[1])
    except (IndexError, ValueError):
        await message.answer(
            "❓ <b>Как удалить товар:</b>\n\n"
            "<code>/delete ID</code>\n\n"
            "Например: <code>/delete 5</code>\n\n"
            "Узнать ID можно в списке товаров: /products"
        )
        return

    async with async_session() as session:
        result = await session.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()

        if not product:
            await message.answer(f"❌ Товар #{product_id} не найден")
            return

        product_name = product.name
        await session.delete(product)
        await session.commit()

    await message.answer(
        f"✅ Товар удалён!\n\n"
        f"<b>#{product_id}</b> {product_name}",
        reply_markup=get_admin_keyboard()
    )
    print(f"🗑 Товар #{product_id} удалён: {product_name}")

    await auto_push_to_github()


# ==================== ADMIN: ОБНОВЛЕНИЯ ====================

UPDATES_FILENAME = "updates.json"

def get_updates_path() -> Path:
    return Path(__file__).resolve().parent / UPDATES_FILENAME

def load_updates_sync():
    path = get_updates_path()
    if not path.exists():
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"⚠️ Не удалось прочитать updates.json: {e}")
        return []

def news_is_active(item: dict) -> bool:
    value = item.get("is_active", True)
    if isinstance(value, str):
        return value.strip().casefold() not in {"false", "0", "нет", "off", "hidden"}
    return bool(value)


def normalize_news_order(updates: list[dict]) -> list[dict]:
    """Preserve current list order and make visibility/position explicit."""
    normalized = []
    for position, item in enumerate(updates, start=1):
        current = dict(item or {})
        current["is_active"] = news_is_active(current)
        current["position"] = position
        normalized.append(current)
    return normalized


def save_updates_sync(updates):
    path = get_updates_path()
    normalized = normalize_news_order(list(updates or []))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

def next_update_id(updates):
    ids = []
    for item in updates:
        try:
            ids.append(int(item.get("id", 0)))
        except Exception:
            pass
    return (max(ids) + 1) if ids else 1

async def upload_update_photo_to_github(image_data: bytes, update_id: int) -> Optional[str]:
    try:
        unique_name = f"update_{update_id}_{uuid.uuid4().hex[:8]}.jpg"
        github_path = f"images/{unique_name}"
        content_base64 = base64.b64encode(image_data).decode("utf-8")

        api_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{github_path}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        payload = {
            "message": f"📰 Фото обновления #{update_id}",
            "content": content_base64,
            "branch": GITHUB_BRANCH
        }

        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.put(api_url, headers=headers, json=payload) as response:
                if response.status in [200, 201]:
                    permanent_url = f"https://liknine.github.io/mestniybot/images/{unique_name}"
                    print(f"✅ Фото обновления загружено: {permanent_url}")
                    await asyncio.sleep(0.5)
                    return permanent_url
                error = await response.text()
                print(f"❌ Ошибка загрузки фото обновления: {error}")
                return None
    except Exception as e:
        print(f"❌ Ошибка upload_update_photo_to_github: {e}")
        return None

async def push_updates_to_github():
    try:
        updates = load_updates_sync()
        json_content = json.dumps(updates, ensure_ascii=False, indent=2)
        content_base64 = base64.b64encode(json_content.encode("utf-8")).decode("utf-8")

        api_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{UPDATES_FILENAME}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }

        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(api_url, headers=headers) as response:
                if response.status == 200:
                    sha = (await response.json()).get("sha")
                else:
                    sha = None

            payload = {
                "message": f"📰 Обновление новостей ({len(updates)} шт)",
                "content": content_base64,
                "branch": GITHUB_BRANCH
            }
            if sha:
                payload["sha"] = sha

            async with session.put(api_url, headers=headers, json=payload) as response:
                if response.status in [200, 201]:
                    print("✅ updates.json загружен на GitHub")
                    return True
                error = await response.text()
                print(f"❌ Ошибка GitHub API для updates.json: {error}")
                return False
    except Exception as e:
        print(f"❌ Ошибка push_updates_to_github: {e}")
        import traceback
        traceback.print_exc()
        return False

def format_updates_list(updates):
    if not updates:
        return "📰 <b>Обновлений пока нет</b>\n\nДобавить: <code>/add_update</code>"

    text = f"📰 <b>Обновления ({len(updates)}):</b>\n\n"
    for item in updates[:20]:
        text += (
            f"#{item.get('id')} — <b>{item.get('title', 'Без названия')}</b>\n"
            f"🔗 {item.get('post_url', '')}\n\n"
        )
    text += "➕ Добавить: <code>/add_update</code>\n"
    text += "🗑 Удалить: <code>/delete_update ID</code>"
    return text

@router.callback_query(F.data == "admin_add_update")
async def admin_add_update_btn(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    await state.clear()
    await state.set_state(AddUpdate.title)
    await callback.message.answer(
        "➕ <b>Добавление обновления</b>\n\n"
        "Шаг 1: отправьте <b>название обновления</b>.\n\n"
        "Например: <code>Новый дроп Stone Island</code>",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])
    )
    await callback.answer()

@router.message(Command("add_update"))
async def cmd_add_update(message: Message, state: FSMContext):
    if message.from_user.id not in ADMIN_IDS:
        return

    await state.clear()
    await state.set_state(AddUpdate.title)
    await message.answer(
        "➕ <b>Добавление обновления</b>\n\n"
        "Шаг 1: отправьте <b>название обновления</b>.\n\n"
        "Например: <code>Новый дроп Stone Island</code>",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])
    )

@router.message(AddUpdate.title)
async def process_update_title(message: Message, state: FSMContext):
    title = (message.text or "").strip()
    if not title:
        await message.answer("❌ Название не может быть пустым. Отправьте название обновления.")
        return

    await state.update_data(title=title)
    await state.set_state(AddUpdate.photo)
    await message.answer(
        f"✅ Название: <b>{title}</b>\n\n"
        "Шаг 2: отправьте <b>одно фото</b> для карточки обновления.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])
    )

@router.message(AddUpdate.photo, F.photo)
async def process_update_photo(message: Message, state: FSMContext):
    updates = load_updates_sync()
    update_id = next_update_id(updates)

    await message.answer("⏳ Загружаю фото обновления на GitHub...")

    photo = message.photo[-1]
    file = await bot.get_file(photo.file_id)
    temp_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"

    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as http_session:
            async with http_session.get(temp_url) as response:
                if response.status != 200:
                    await message.answer("❌ Не удалось скачать фото из Telegram. Попробуйте ещё раз.")
                    return
                image_data = await response.read()

        permanent_url = await upload_update_photo_to_github(image_data, update_id)
        if not permanent_url:
            await message.answer("❌ Не удалось загрузить фото на GitHub. Попробуйте ещё раз.")
            return

        await state.update_data(update_id=update_id, image=permanent_url)
        await state.set_state(AddUpdate.post_url)
        await message.answer(
            "✅ Фото сохранено!\n\n"
            "Шаг 3: отправьте <b>ссылку</b> на пост или страницу.\n\n"
            "Если ссылка не нужна — напишите <code>нет</code>.\n"
            "Пример: <code>https://t.me/mestniystore/10021</code>",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
            ])
        )
    except Exception as e:
        print(f"❌ Ошибка process_update_photo: {e}")
        await message.answer(f"❌ Ошибка обработки фото: {e}")

@router.message(AddUpdate.photo)
async def process_update_photo_invalid(message: Message, state: FSMContext):
    await message.answer("⚠️ Нужно отправить именно <b>фото</b> для карточки обновления.")

@router.message(AddUpdate.post_url)
async def process_update_url(message: Message, state: FSMContext):
    post_url = (message.text or "").strip()

    if post_url.casefold() in {"нет", "-", "без ссылки", "убрать"}:
        post_url = ""
    elif not (post_url.startswith("https://") or post_url.startswith("http://")):
        await message.answer(
            "❌ Отправьте корректную ссылку, начинающуюся с http:// или https://.\n\n"
            "Если ссылка не нужна — напишите <code>нет</code>."
        )
        return

    data = await state.get_data()
    updates = load_updates_sync()

    update = {
        "id": data.get("update_id") or next_update_id(updates),
        "title": data.get("title", "Обновление"),
        "image": data.get("image", ""),
        "post_url": post_url,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "is_active": True,
        "position": 1,
    }

    updates.insert(0, update)
    save_updates_sync(updates)
    await state.clear()

    success = await push_updates_to_github()

    text = (
        f"✅ <b>Обновление добавлено!</b>\n\n"
        f"📰 #{update['id']} — <b>{update['title']}</b>\n"
        f"🔗 {update['post_url'] or 'без ссылки — переход в каталог'}\n"
        f"🖼 Фото: {update['image']}\n\n"
    )
    if success:
        text += "🌐 Загружено на GitHub. В приложении появится через 1–2 минуты."
    else:
        text += "⚠️ Локально сохранено, но не удалось загрузить на GitHub. Попробуйте позже: <code>/updates</code>"

    await message.answer(text, disable_web_page_preview=True, reply_markup=get_admin_keyboard())

@router.callback_query(F.data == "admin_updates")
async def admin_updates_btn(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    await callback.message.answer(format_updates_list(load_updates_sync()), disable_web_page_preview=True, reply_markup=get_admin_keyboard())
    await callback.answer()

@router.message(Command("updates"))
async def cmd_updates(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    await message.answer(format_updates_list(load_updates_sync()), disable_web_page_preview=True, reply_markup=get_admin_keyboard())

@router.message(Command("delete_update"))
async def cmd_delete_update(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    try:
        parts = message.text.split()
        if len(parts) < 2:
            raise ValueError("Не указан ID")
        update_id = int(parts[1])
    except Exception:
        await message.answer(
            "❓ <b>Как удалить обновление:</b>\n\n"
            "<code>/delete_update ID</code>\n\n"
            "Например: <code>/delete_update 2</code>\n\n"
            "Список: /updates"
        )
        return

    updates = load_updates_sync()
    target = next((item for item in updates if int(item.get("id", 0)) == update_id), None)

    if not target:
        await message.answer(f"❌ Обновление #{update_id} не найдено")
        return

    updates = [item for item in updates if int(item.get("id", 0)) != update_id]
    save_updates_sync(updates)
    success = await push_updates_to_github()

    text = f"✅ Обновление удалено!\n\n#{update_id} — <b>{target.get('title', '')}</b>"
    if not success:
        text += "\n\n⚠️ Локально удалено, но не удалось обновить GitHub."
    await message.answer(text, reply_markup=get_admin_keyboard())


# ==================== ADMIN: СТАТИСТИКА ====================
# ==================== ADMIN: STOCK / DISCOUNT ====================

@router.message(Command("edit_stock"))
async def edit_stock_cmd(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    args = message.text.split()[1:]

    if len(args) != 2:
        await message.answer(
            "Использование:\n"
            "/edit_stock ID НАЛИЧИЕ\n\n"
            "Пример:\n"
            "/edit_stock 12 5"
        )
        return

    try:
        product_id = int(args[0])
        new_stock = int(args[1])
    except ValueError:
        await message.answer("ID и количество должны быть целыми числами.")
        return

    if new_stock < 0:
        await message.answer("Количество должно быть целым числом от 0 и выше.")
        return

    async with async_session() as session:
        product = await session.get(Product, product_id)

        if not product:
            await message.answer(f"Товар с ID {product_id} не найден.")
            return

        product.stock = new_stock
        await session.commit()

    success = await auto_push_to_github()

    if success:
        await message.answer(f"✅ Наличие товара ID {product_id} изменено на {new_stock} и отправлено на GitHub.")
    else:
        await message.answer(f"⚠️ Наличие товара ID {product_id} изменено, но GitHub export не удался.")


@router.message(Command("remove_size"))
async def remove_size_cmd(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    parts = (message.text or "").split(maxsplit=2)
    if len(parts) != 3:
        await message.answer(
            "Использование:\n"
            "/remove_size ID РАЗМЕР\n\n"
            "Пример:\n"
            "/remove_size 12 XL"
        )
        return

    try:
        product_id = int(parts[1])
    except ValueError:
        await message.answer("ID должен быть целым числом.")
        return

    size_to_remove = parts[2].strip()
    if not size_to_remove:
        await message.answer("Укажите размер, который нужно удалить.")
        return

    async with async_session() as session:
        product = await session.get(Product, product_id)

        if not product:
            await message.answer(f"Товар с ID {product_id} не найден.")
            return

        current_sizes = product.sizes if isinstance(product.sizes, list) else []
        normalized_size = size_to_remove.casefold()
        new_sizes = [
            size for size in current_sizes
            if str(size).strip().casefold() != normalized_size
        ]

        if len(new_sizes) == len(current_sizes):
            await message.answer(f"Размер «{size_to_remove}» у товара ID {product_id} не найден.")
            return

        product.sizes = new_sizes
        await session.commit()

    success = await auto_push_to_github()

    sizes_text = ", ".join(str(size) for size in new_sizes) if new_sizes else "пустой список"
    if success:
        await message.answer(
            f"✅ Размер «{size_to_remove}» удалён у товара ID {product_id}.\n"
            f"Текущие размеры: {sizes_text}\n"
            "Каталог отправлен на GitHub."
        )
    else:
        await message.answer(
            f"⚠️ Размер «{size_to_remove}» удалён у товара ID {product_id}, "
            "но GitHub export не удался."
        )


@router.message(Command("edit_extra_photos"))
async def edit_extra_photos_cmd(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    parts = (message.text or "").split(maxsplit=2)
    if len(parts) != 3:
        await message.answer(
            "Использование:\n"
            "/edit_extra_photos ID ССЫЛКА\n\n"
            "Удалить ссылку:\n"
            "/edit_extra_photos ID нет\n\n"
            "Пример:\n"
            "/edit_extra_photos 12 https://t.me/mestniybaryga/9843"
        )
        return

    try:
        product_id = int(parts[1])
    except ValueError:
        await message.answer("ID должен быть целым числом.")
        return

    value = parts[2].strip()
    if not value:
        await message.answer("Укажите ссылку или значение для удаления: нет, 0, -, *, remove, удалить.")
        return

    remove_values = {"нет", "0", "-", "*", "remove", "удалить"}
    should_remove = value.casefold() in remove_values

    async with async_session() as session:
        product = await session.get(Product, product_id)

        if not product:
            await message.answer(f"Товар с ID {product_id} не найден.")
            return

        prices = dict(product.prices or {})
        if should_remove:
            prices.pop("extra_photos_url", None)
        else:
            prices["extra_photos_url"] = value

        product.prices = prices
        await session.commit()

    success = await auto_push_to_github()

    action_text = "удалена" if should_remove else "обновлена"
    if success:
        await message.answer(f"✅ Ссылка «Доп фото» у товара ID {product_id} {action_text} и отправлена на GitHub.")
    else:
        await message.answer(f"⚠️ Ссылка «Доп фото» у товара ID {product_id} {action_text}, но GitHub export не удался.")


@router.message(Command("discount"))
async def discount_cmd(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    args = message.text.split()[1:]

    if len(args) not in (2, 4):
        await message.answer(
            "Использование:\n"
            "/discount ID BYN RUB USD — поставить скидку\n"
            "/discount ID 0 — убрать скидку\n\n"
            "Примеры:\n"
            "/discount 12 100 3000 30\n"
            "/discount 12 0"
        )
        return

    try:
        product_id = int(args[0])
    except ValueError:
        await message.answer("ID должен быть числом.")
        return

    async with async_session() as session:
        product = await session.get(Product, product_id)

        if not product:
            await message.answer(f"Товар с ID {product_id} не найден.")
            return

        if len(args) == 2 and args[1] == "0":
            product.old_price_byn = None
            product.old_price_rub = None
            product.old_price_usd = None
            await session.commit()

            success = await auto_push_to_github()

            if success:
                await message.answer(f"✅ Скидка у товара ID {product_id} убрана и изменения отправлены на GitHub.")
            else:
                await message.answer(f"⚠️ Скидка у товара ID {product_id} убрана, но GitHub export не удался.")
            return

        if len(args) == 4:
            try:
                old_byn = float(args[1])
                old_rub = float(args[2])
                old_usd = float(args[3])
            except ValueError:
                await message.answer("Цены должны быть числами.")
                return

            product.old_price_byn = old_byn
            product.old_price_rub = old_rub
            product.old_price_usd = old_usd
            await session.commit()

            success = await auto_push_to_github()

            if success:
                await message.answer(f"✅ Скидка у товара ID {product_id} установлена и отправлена на GitHub.")
            else:
                await message.answer(f"⚠️ Скидка у товара ID {product_id} установлена, но GitHub export не удался.")
            return

        await message.answer(
            "Неверный формат.\n"
            "Используй:\n"
            "/discount ID BYN RUB USD\n"
            "или:\n"
            "/discount ID 0"
        )
@router.callback_query(F.data == "admin_stats")
async def admin_stats(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    async with async_session() as session:
        users_result = await session.execute(select(User))
        users_count = len(users_result.scalars().all())

        products_result = await session.execute(select(Product))
        products_count = len(products_result.scalars().all())

        orders_result = await session.execute(select(Order))
        orders = orders_result.scalars().all()
        orders_count = len(orders)

        new_orders = len([o for o in orders if o.status == "new"])

    text = (
        "📊 <b>Статистика магазина</b>\n\n"
        f"👥 Пользователей: <b>{users_count}</b>\n"
        f"📦 Товаров: <b>{products_count}</b>\n"
        f"🛒 Всего заказов: <b>{orders_count}</b>\n"
        f"🆕 Новых заказов: <b>{new_orders}</b>"
    )
    await callback.message.answer(text)
    await callback.answer()

# ==================== ADMIN: ЗАКАЗЫ ====================

@router.callback_query(F.data == "admin_orders")
async def admin_orders(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    async with async_session() as session:
        result = await session.execute(
            select(Order).where(Order.status == "new").order_by(Order.created_at.desc())
        )
        orders = result.scalars().all()

    if not orders:
        await callback.message.answer("✅ Новых заказов нет")
        await callback.answer()
        return

    for order in orders[:5]:
        customer = order.customer or {}
        items = order.items or []

        items_text = ""
        for item in items:
            sizes = item.get('sizes', [item.get('size', '?')])
            if isinstance(sizes, list):
                sizes_str = ', '.join(sizes)
            else:
                sizes_str = str(sizes)
            items_text += f"   • {item.get('name', '?')} (р. {sizes_str})\n"

        text = (
            f"🆕 <b>Заказ #{order.id}</b>\n\n"
            f"👤 {customer.get('lastName', '')} {customer.get('firstName', '')}\n"
            f"📞 {customer.get('phone', 'Не указан')}\n"
            f"💰 {order.total:.2f} {order.currency}\n"
            f"🚚 {order.delivery_type}\n"
            f"📦 Товары:\n{items_text}"
            f"📅 {order.created_at.strftime('%d.%m.%Y %H:%M')}"
        )

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Принять", callback_data=f"order_accept_{order.id}"),
                InlineKeyboardButton(text="🚚 Отправлен", callback_data=f"order_ship_{order.id}")
            ]
        ])
        await callback.message.answer(text, reply_markup=keyboard)

    await callback.answer()

@router.callback_query(F.data.startswith("order_accept_"))
async def accept_order(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        return

    order_id = int(callback.data.split("_")[2])

    async with async_session() as session:
        result = await session.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if order:
            order.status = "processing"
            await session.commit()

    await callback.answer("✅ Заказ принят в обработку")
    await callback.message.edit_text(
        callback.message.text + "\n\n✅ <b>ПРИНЯТ В ОБРАБОТКУ</b>"
    )

@router.callback_query(F.data.startswith("order_ship_"))
async def ship_order(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        return

    order_id = int(callback.data.split("_")[2])

    async with async_session() as session:
        result = await session.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if order:
            order.status = "shipped"
            await session.commit()

    await callback.answer("🚚 Заказ отмечен как отправленный")
    await callback.message.edit_text(
        callback.message.text + "\n\n🚚 <b>ОТПРАВЛЕН</b>"
    )

# ==================== ПОЛЬЗОВАТЕЛЬ: МОИ ЗАКАЗЫ ====================

@router.callback_query(F.data == "my_orders")
async def show_my_orders(callback: CallbackQuery):
    user_id = callback.from_user.id

    async with async_session() as session:
        result = await session.execute(
            select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
        )
        orders = result.scalars().all()

    if not orders:
        await callback.message.answer("📦 У тебя пока нет заказов")
    else:
        text = "📦 <b>Твои заказы:</b>\n\n"
        for order in orders[:10]:
            status_emoji = {
                "new": "🆕",
                "processing": "⏳",
                "shipped": "🚚",
                "delivered": "✅"
            }.get(order.status, "❓")

            text += (
                f"{status_emoji} <b>Заказ #{order.id}</b>\n"
                f"   Сумма: {order.total:.2f} {order.currency}\n"
                f"   Дата: {order.created_at.strftime('%d.%m.%Y %H:%M')}\n\n"
            )
        await callback.message.answer(text)

    await callback.answer()


# ==================== START MENU BUTTONS ====================

@router.callback_query(F.data == "delivery_info")
async def delivery_info(callback: CallbackQuery):
    text = (
        "• <b>Личная встреча:</b> г. Лида 🌇\n\n"
        "• <b>Доставка:</b> По всем странам СНГ, через:\n"
        "Белпочта ( по Беларуси )\n"
        "Европочта ( по Беларуси )\n"
        "Маршрутка ( по Беларуси )\n"
        "Такси ( по городу Лида )\n"
        "CDEK ( между странами СНГ )\n\n"
        "По всем интересующим вопросам обращаться сюда:\n"
        "<b>@manager_of_mestniy</b>"
    )
    await callback.message.answer(text, disable_web_page_preview=True, reply_markup=get_main_keyboard())
    await callback.answer()


@router.callback_query(F.data == "custom_order_info")
async def custom_order_info(callback: CallbackQuery):
    text = (
        "Мы, с нашей командой, можем привезти вам абсолютно любой товар, из разных стран, "
        "вам необходимо найти любую фотку в интернете, нужного товара, затем скинуть её нашему менеджеру, "
        "и обязательно скажите нужный размер, он вам расскажет обо всём: "
        "Какая будет итоговая цена | сроки доставки, и ответит на все ваши вопросы!\n\n"
        "<b>Как связаться с менеджером?</b>\n\n"
        "Открывай приложение → Внизу выбирай раздел каталог → Заказать товар по предзаказу\n\n"
        "<b>Канал по предзаказам:</b>\n"
        "<b><a href='https://t.me/mestniypodzakaz'>https://t.me/mestniypodzakaz</a></b>"
    )
    await callback.message.answer(text, disable_web_page_preview=True, reply_markup=get_main_keyboard())
    await callback.answer()


@router.callback_query(F.data == "reviews_info")
async def reviews_info(callback: CallbackQuery):
    text = "<b><a href='https://t.me/mestniyotzivyy'>ГЛЯНУТЬ ОТЗЫВЫ ТУТ *ТЫКАЙ</a></b>"
    await callback.message.answer(text, disable_web_page_preview=True, reply_markup=get_main_keyboard())
    await callback.answer()

# ==================== ИНФОРМАЦИЯ ====================

@router.callback_query(F.data == "info")
async def show_info(callback: CallbackQuery):
    text = (
        "• <b>Личная встреча:</b> г. Лида 🌇\n\n"
        "• <b>Доставка:</b> По всем странам СНГ, через:\n"
        "Белпочта ( по Беларуси )\n"
        "Европочта ( по Беларуси )\n"
        "Маршрутка ( по Беларуси )\n"
        "Такси ( по городу Лида )\n"
        "CDEK ( между странами СНГ )\n\n"
        "По всем интересующим вопросам обращаться сюда:\n"
        "<b>@manager_of_mestniy</b>"
    )
    await callback.message.answer(text, disable_web_page_preview=True, reply_markup=get_main_keyboard())
    await callback.answer()

# ==================== ОБРАБОТКА ЗАКАЗОВ ОТ WEBAPP ====================

@router.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    try:
        data = json.loads(message.web_app_data.data)
        user_id = message.from_user.id

        async with async_session() as session:
            order = Order(
                user_id=user_id,
                items=data.get('items', []),
                total=data.get('total', 0),
                currency=data.get('currency', 'BYN'),
                delivery_type=data.get('deliveryType', 'pickup'),
                delivery_service=data.get('deliveryService'),
                delivery_data=data.get('deliveryData'),
                customer=data.get('customer', {}),
                comment=data.get('comment', ''),
                status='new'
            )
            session.add(order)
            await session.commit()
            order_id = order.id

        customer = data.get('customer', {})
        items = data.get('items', [])

        items_text = ""
        for item in items:
            sizes = item.get('sizes', [])
            sizes_str = ', '.join(sizes) if isinstance(sizes, list) else str(sizes)
            items_text += f"   • {item.get('name', '?')} (р. {sizes_str})\n"

        user_text = (
            f"✅ <b>Заказ #{order_id} оформлен!</b>\n\n"
            f"📦 Товары:\n{items_text}\n"
            f"💰 Сумма: {data.get('total', 0):.2f} {data.get('currency', 'BYN')}\n"
            f"🚚 Доставка: {data.get('deliveryType', 'pickup')}\n\n"
            f"Мы свяжемся с вами в ближайшее время! 📞"
        )

        await message.answer(user_text, reply_markup=get_main_keyboard())

        for admin_id in ADMIN_IDS:
            try:
                admin_text = (
                    f"🆕 <b>Новый заказ #{order_id}!</b>\n\n"
                    f"👤 {customer.get('lastName', '')} {customer.get('firstName', '')}\n"
                    f"📞 {customer.get('phone', 'Не указан')}\n"
                    f"💰 {data.get('total', 0):.2f} {data.get('currency', 'BYN')}\n"
                    f"🚚 {data.get('deliveryType', 'pickup')}"
                )

                if data.get('deliveryService'):
                    admin_text += f" ({data.get('deliveryService')})"

                admin_text += f"\n\n📦 <b>Товары:</b>\n"

                for item in items:
                    sizes = item.get('sizes', [])
                    sizes_str = ', '.join(sizes) if isinstance(sizes, list) else str(sizes)
                    admin_text += f"• {item.get('name', '?')}\n  Размеры: {sizes_str}\n"

                    img = item.get('image', '')
                    if img:
                        admin_text += f"  Фото: {img}\n"

                if data.get('comment'):
                    admin_text += f"\n💬 Комментарий: {data.get('comment')}"

                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [
                        InlineKeyboardButton(text="✅ Принять", callback_data=f"order_accept_{order_id}"),
                        InlineKeyboardButton(text="🚚 Отправлен", callback_data=f"order_ship_{order_id}")
                    ]
                ])

                await bot.send_message(admin_id, admin_text, reply_markup=keyboard)

            except Exception as e:
                print(f"❌ Не удалось уведомить админа {admin_id}: {e}")

        print(f"✅ Заказ #{order_id} создан от пользователя {user_id}")

    except Exception as e:
        print(f"❌ Ошибка обработки WebApp данных: {e}")
        import traceback
        traceback.print_exc()
        await message.answer("❌ Ошибка при оформлении заказа. Попробуйте ещё раз.")

# ==================== API ДЛЯ WEBAPP ====================

@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        return web.Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        })
    response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

async def api_get_products(request):
    async with async_session() as session:
        result = await session.execute(select(Product).order_by(Product.created_at.desc()))
        products = result.scalars().all()

        data = []
        for p in products:
            data.append({
                "id": p.id,
                "category_id": p.category_id,
                "brand": p.brand,
                "name": p.name,
                "description": p.description,
                "price_byn": p.price_byn,
                "prices": p.prices,
                "sizes": p.sizes,
                "size_stock": (p.prices or {}).get("size_stock") or {str(size): 1 for size in (p.sizes or [])},
                "stock": p.stock,
                "condition": (p.prices or {}).get("condition"),
                "extra_photos_url": (p.prices or {}).get("extra_photos_url"),
                "images": (p.images or [])[:MAX_PRODUCT_IMAGES],
                "created_at": p.created_at.isoformat() if p.created_at else None
            })

        return web.json_response(data)

async def api_get_categories(request):
    categories = [{"id": k, **v} for k, v in CATEGORIES.items()]
    return web.json_response(categories)

async def api_get_brands(request):
    return web.json_response(BRANDS)

async def api_get_rates(request):
    return web.json_response(CURRENCIES)

async def api_get_updates(request):
    return web.json_response(load_updates_sync())

async def start_api_server():
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/api/products", api_get_products)
    app.router.add_get("/api/categories", api_get_categories)
    app.router.add_get("/api/brands", api_get_brands)
    app.router.add_get("/api/rates", api_get_rates)
    app.router.add_get("/api/updates", api_get_updates)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, API_HOST, API_PORT)
    await site.start()
    print(f"🌐 API сервер запущен на http://{API_HOST}:{API_PORT}")

# ==================== ЭКСПОРТ ТОВАРОВ ====================

@router.message(Command("export"))
async def cmd_export_products(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    await message.answer("⏳ Экспортирую и загружаю на GitHub...")

    success = await auto_push_to_github()

    if success:
        async with async_session() as session:
            result = await session.execute(select(Product))
            products_count = len(result.scalars().all())

        await message.answer(
            f"✅ <b>Готово!</b>\n\n"
            f"📦 Товаров: {products_count}\n"
            f"🌐 Загружено на GitHub\n"
            f"⏱ Обновится через 1-2 минуты",
            reply_markup=get_admin_keyboard()
        )
    else:
        await message.answer(
            "❌ Ошибка загрузки на GitHub\n\n"
            "Проверьте токен или попробуйте позже",
            reply_markup=get_admin_keyboard()
        )

# ==================== AUTO PUSH TO GITHUB ====================

import base64

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
GITHUB_REPO = os.getenv("GITHUB_REPO", "liknine/mestniybot")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

async def export_products_to_file():
    async with async_session() as session:
        result = await session.execute(select(Product).order_by(Product.id))
        products = result.scalars().all()

    data = []
    for p in products:
        data.append({
            "id": p.id,
            "category_id": p.category_id,
            "brand": p.brand,
            "name": p.name,
            "description": p.description,
            "price_byn": p.price_byn,
            "prices": p.prices,
            "sizes": p.sizes,
            "size_stock": (p.prices or {}).get("size_stock") or {str(size): 1 for size in (p.sizes or [])},
            "stock": p.stock,
            "product_type": (p.prices or {}).get("product_type", "stock"),
            "section": (p.prices or {}).get("product_type", "stock"),
            "condition": (p.prices or {}).get("condition"),
            "extra_photos_url": (p.prices or {}).get("extra_photos_url"),
            "images": (p.images or [])[:MAX_PRODUCT_IMAGES],
            "created_at": p.created_at.isoformat() if p.created_at else None
        })

    webapp_path = Path(__file__).resolve().parent / "products.json"

    with open(webapp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"📦 Экспортировано {len(data)} товаров")
    return data

async def auto_push_to_github():
    try:
        products_data = await export_products_to_file()

        json_content = json.dumps(products_data, ensure_ascii=False, indent=2)
        content_base64 = base64.b64encode(json_content.encode('utf-8')).decode('utf-8')

        api_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/products.json"

        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }

        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(api_url, headers=headers) as response:
                if response.status == 200:
                    file_data = await response.json()
                    sha = file_data['sha']
                else:
                    sha = None

            payload = {
                "message": f"🤖 Обновление товаров ({len(products_data)} шт)",
                "content": content_base64,
                "branch": GITHUB_BRANCH
            }

            if sha:
                payload["sha"] = sha

            async with session.put(api_url, headers=headers, json=payload) as response:
                if response.status in [200, 201]:
                    print("✅ Товары автоматически загружены на GitHub!")
                    return True
                else:
                    error = await response.text()
                    print(f"❌ Ошибка GitHub API: {error}")
                    return False

    except Exception as e:
        print(f"❌ Ошибка автопуша: {e}")
        import traceback
        traceback.print_exc()
        return False

# ==================== FIX PRODUCT ====================

async def ensure_images_folder_exists():
    """Создаёт папку images на GitHub если её нет"""
    try:
        api_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/images/.gitkeep"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }

        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(api_url, headers=headers) as response:
                if response.status == 200:
                    return True

            payload = {
                "message": "📁 Создание папки images",
                "content": base64.b64encode(b"").decode('utf-8'),
                "branch": GITHUB_BRANCH
            }

            async with session.put(api_url, headers=headers, json=payload) as response:
                if response.status in [200, 201]:
                    print("✅ Папка images создана на GitHub")
                    return True
                else:
                    print(f"❌ Ошибка создания папки: {await response.text()}")
                    return False

    except Exception as e:
        print(f"❌ Ошибка ensure_images_folder_exists: {e}")
        return False


async def upload_photo_to_github(image_data: bytes, product_id: int) -> str:
    """Загружает фото на GitHub и возвращает постоянный URL"""
    try:
        unique_name = f"product_{product_id}_{uuid.uuid4().hex[:8]}.jpg"
        github_path = f"images/{unique_name}"

        content_base64 = base64.b64encode(image_data).decode('utf-8')

        api_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{github_path}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }

        payload = {
            "message": f"📸 Фото для товара #{product_id}",
            "content": content_base64,
            "branch": GITHUB_BRANCH
        }

        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.put(api_url, headers=headers, json=payload) as response:
                if response.status in [200, 201]:
                    permanent_url = f"https://liknine.github.io/mestniybot/images/{unique_name}"
                    print(f"✅ Фото загружено: {permanent_url}")
                    await asyncio.sleep(0.5)
                    return permanent_url
                else:
                    error = await response.text()
                    print(f"❌ Ошибка загрузки фото: {error}")
                    return None

    except Exception as e:
        print(f"❌ Ошибка upload_photo_to_github: {e}")
        return None


@router.message(Command("fix_product"))
async def cmd_fix_product(message: Message, state: FSMContext):
    if message.from_user.id not in ADMIN_IDS:
        return

    try:
        parts = message.text.split()
        if len(parts) < 2:
            raise ValueError("Не указан ID")
        product_id = int(parts[1])
    except (IndexError, ValueError):
        await message.answer(
            "❓ <b>Как использовать:</b>\n\n"
            "<code>/fix_product ID</code>\n\n"
            "Например: <code>/fix_product 8</code>\n\n"
            "Узнать ID товаров: /products"
        )
        return

    async with async_session() as session:
        result = await session.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()

    if not product:
        await message.answer(f"❌ Товар #{product_id} не найден\n\nПосмотреть все товары: /products")
        return

    brand_name = display_brand_name(product.brand)
    cat_data = CATEGORIES.get(product.category_id, {})

    await state.update_data(fix_product_id=product_id)
    await state.set_state(FixProduct.waiting_photos)

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отмена", callback_data="fix_cancel")]
    ])

    await message.answer(
        f"🔧 <b>Починка фото товара #{product_id}</b>\n\n"
        f"📦 {product.name}\n"
        f"🏷 {brand_name}\n"
        f"📁 {cat_data.get('icon', '')} {cat_data.get('name', '')}\n\n"
        f"Сейчас в товаре: <b>{len(product.images)} фото</b>\n\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"📸 Отправьте новые фото для этого товара\n"
        f"(можно альбомом или по одному)\n\n"
        f"После всех фото нажмите <b>Готово</b>",
        reply_markup=keyboard
    )


@router.message(FixProduct.waiting_photos, F.photo)
async def fix_product_photo(message: Message, state: FSMContext):
    user_id = message.from_user.id
    media_group_id = message.media_group_id

    data = await state.get_data()
    product_id = data.get('fix_product_id')

    photo = message.photo[-1]
    file = await bot.get_file(photo.file_id)
    temp_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"

    # Одиночное фото
    if not media_group_id:
        current_data = await state.get_data()
        fix_images = list(current_data.get("fix_images", []))
        if len(fix_images) >= MAX_PRODUCT_IMAGES:
            await message.answer(
                f"⚠️ Уже добавлено максимум {MAX_PRODUCT_IMAGES} фото. Нажмите «Готово — сохранить».",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="✅ Готово — сохранить", callback_data="fix_save")],
                    [InlineKeyboardButton(text="❌ Отмена", callback_data="fix_cancel")],
                ]),
            )
            return
        await message.answer("⏳ Загружаю фото на GitHub...")

        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as http_session:
            async with http_session.get(temp_url) as response:
                image_data = await response.read()

        permanent_url = await upload_photo_to_github(image_data, product_id)

        if permanent_url:
            current_data = await state.get_data()
            fix_images = current_data.get('fix_images', [])
            fix_images.append(permanent_url)
            await state.update_data(fix_images=fix_images)

            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✅ Готово — сохранить", callback_data="fix_save")],
                [InlineKeyboardButton(text="❌ Отмена", callback_data="fix_cancel")]
            ])

            await message.answer(
                f"✅ Фото {len(fix_images)} загружено на GitHub!\n\n"
                f"Отправьте ещё фото или нажмите <b>Готово</b>",
                reply_markup=keyboard
            )
        else:
            await message.answer("❌ Ошибка загрузки фото. Попробуйте ещё раз.")
        return

    # Альбом — буферизируем
    buffer_key = f"fix_{user_id}_{media_group_id}"

    if buffer_key not in fix_product_buffer:
        fix_product_buffer[buffer_key] = []

    fix_product_buffer[buffer_key].append(temp_url)

    if buffer_key in fix_product_locks:
        return

    fix_product_locks[buffer_key] = True

    async def process_fix_album():
        await asyncio.sleep(2)

        try:
            collected_urls = fix_product_buffer.pop(buffer_key, [])
            fix_product_locks.pop(buffer_key, None)

            if not collected_urls:
                return

            current_data = await state.get_data()
            current_images = list(current_data.get("fix_images", []))
            remaining_slots = max(MAX_PRODUCT_IMAGES - len(current_images), 0)
            if remaining_slots <= 0:
                await message.answer(
                    f"⚠️ Уже добавлено максимум {MAX_PRODUCT_IMAGES} фото. Нажмите «Готово — сохранить».",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text="✅ Готово — сохранить", callback_data="fix_save")],
                        [InlineKeyboardButton(text="❌ Отмена", callback_data="fix_cancel")],
                    ]),
                )
                return
            collected_urls = collected_urls[:remaining_slots]
            await message.answer(f"⏳ Загружаю {len(collected_urls)} фото на GitHub...")

            await ensure_images_folder_exists()

            permanent_urls = []
            for i, url in enumerate(collected_urls):
                connector = aiohttp.TCPConnector(ssl=False)
                async with aiohttp.ClientSession(connector=connector) as http_session:
                    async with http_session.get(url) as response:
                        if response.status == 200:
                            image_data = await response.read()
                            permanent_url = await upload_photo_to_github(image_data, product_id)
                            if permanent_url:
                                permanent_urls.append(permanent_url)
                                print(f"  📸 {i+1}/{len(collected_urls)} загружено")

            if permanent_urls:
                current_data = await state.get_data()
                fix_images = current_data.get('fix_images', [])
                fix_images.extend(permanent_urls)
                await state.update_data(fix_images=fix_images)

                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="✅ Готово — сохранить", callback_data="fix_save")],
                    [InlineKeyboardButton(text="❌ Отмена", callback_data="fix_cancel")]
                ])

                await message.answer(
                    f"✅ Загружено {len(permanent_urls)} фото на GitHub!\n\n"
                    f"Всего новых фото: {len(fix_images)}\n\n"
                    f"Отправьте ещё фото или нажмите <b>Готово</b>",
                    reply_markup=keyboard
                )
            else:
                await message.answer("❌ Не удалось загрузить фото. Попробуйте ещё раз.")

        except Exception as e:
            print(f"❌ Ошибка process_fix_album: {e}")
            fix_product_buffer.pop(buffer_key, None)
            fix_product_locks.pop(buffer_key, None)

    asyncio.create_task(process_fix_album())


@router.callback_query(F.data == "fix_save")
async def fix_save(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    data = await state.get_data()
    product_id = data.get('fix_product_id')
    fix_images = list(data.get('fix_images', []))[:MAX_PRODUCT_IMAGES]

    if not fix_images:
        await callback.answer("❌ Нет фото для сохранения!", show_alert=True)
        return

    await callback.answer("⏳ Сохраняем...")

    try:
        async with async_session() as session:
            result = await session.execute(select(Product).where(Product.id == product_id))
            product = result.scalar_one_or_none()

            if not product:
                await callback.message.edit_text("❌ Товар не найден!")
                await state.clear()
                return

            old_count = len(product.images)
            product.images = fix_images
            await session.commit()

        await state.clear()

        await callback.message.edit_text(
            f"✅ <b>Фото товара #{product_id} обновлены!</b>\n\n"
            f"Было: {old_count} фото\n"
            f"Стало: {len(fix_images)} фото\n\n"
            f"⏳ Обновляю каталог..."
        )

        success = await auto_push_to_github()

        if success:
            await callback.message.edit_text(
                f"✅ <b>Готово! Товар #{product_id} починен!</b>\n\n"
                f"📸 Фото: {len(fix_images)} шт\n"
                f"🌐 Каталог обновится через 1-2 минуты\n\n"
                f"Следующий товар: /fix_product ID",
                reply_markup=get_admin_keyboard()
            )
        else:
            await callback.message.edit_text(
                f"⚠️ Фото сохранены в БД, но не удалось обновить GitHub\n\n"
                f"Попробуй вручную: /export",
                reply_markup=get_admin_keyboard()
            )

    except Exception as e:
        print(f"❌ Ошибка fix_save: {e}")
        await callback.message.edit_text(
            f"❌ Ошибка: {str(e)}",
            reply_markup=get_admin_keyboard()
        )
        await state.clear()


@router.callback_query(F.data == "fix_cancel")
async def fix_cancel(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text(
        "❌ Починка отменена",
        reply_markup=get_admin_keyboard()
    )
    await callback.answer()


@router.message(FixProduct.waiting_photos)
async def fix_product_invalid(message: Message, state: FSMContext):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Готово — сохранить", callback_data="fix_save")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="fix_cancel")]
    ])
    await message.answer(
        "⚠️ Отправьте <b>фото</b> или нажмите <b>Готово</b>",
        reply_markup=keyboard
    )

# ==================== ЗАПУСК ====================

async def main():
    global bot

    logging.basicConfig(level=logging.INFO)

    storage = MemoryStorage()

    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=storage)
    dp.include_router(router)

    await init_db()
    await get_exchange_rates()

    try:
        await bot.set_my_commands([
            BotCommand(command="start", description="🚀 Запустить бота"),
            BotCommand(command="admin", description="🛠 Админ-панель"),
            BotCommand(command="add_product", description="➕ Добавить товар"),
            BotCommand(command="products", description="📦 Список товаров"),
            BotCommand(command="delete", description="🗑 Удалить товар"),
            BotCommand(command="export", description="📤 Экспорт на GitHub"),
            BotCommand(command="fix_product", description="🔧 Починить фото товара"),
            BotCommand(command="edit_stock", description="📦 Изменить наличие"),
            BotCommand(command="remove_size", description="📏 Удалить размер"),
            BotCommand(command="edit_extra_photos", description="🔗 Изменить доп фото"),
            BotCommand(command="add_update", description="📰 Добавить обновление"),
            BotCommand(command="updates", description="📰 Список обновлений"),
            BotCommand(command="delete_update", description="🗑 Удалить обновление"),
        ])
    except Exception as e:
        print(f"⚠️ Не удалось обновить команды Telegram: {e}")

    try:
        await start_api_server()
    except OSError as e:
        print(f"⚠️ API сервер не запущен, порт занят или недоступен: {e}")
        print("🤖 Продолжаем запуск бота без API-сервера")


    print("🤖 Бот запущен!")
    print("📝 Команды: /add_product, /products, /delete ID, /export, /fix_product ID, /edit_stock ID КОЛИЧЕСТВО, /remove_size ID РАЗМЕР, /edit_extra_photos ID ССЫЛКА, /add_update, /updates, /delete_update ID")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
