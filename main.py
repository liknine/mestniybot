import asyncio
import logging
import ssl
import aiohttp
from aiohttp import web
from datetime import datetime
from typing import Optional
import json
import uuid



from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, BotCommand
from aiogram.filters import CommandStart, Command
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Float, JSON, DateTime, BigInteger, Text

# ==================== ФИКС SSL для Mac ====================
ssl._create_default_https_context = ssl._create_unverified_context

# ==================== КОНФИГ ====================

BOT_TOKEN = "8639878235:AAGHQOmcyU_wI8b4MD1ktxYg0lFWK6AK-js"
ADMIN_IDS = [1639462053, 8465820993]
WEBAPP_URL = "https://liknine.github.io/mestniybot/?v=webapp_redesign_v1"
DATABASE_URL = "sqlite+aiosqlite:///./shop.db"
API_HOST = "0.0.0.0"
API_PORT = 8080

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
    category = State()
    brand = State()
    name = State()
    description = State()
    price_byn = State()
    price_rub = State()
    price_usd = State()
    sizes = State()
    stock = State()
    images = State()

# ==================== FIX PRODUCT STATE ====================

class FixProduct(StatesGroup):
    waiting_photos = State()

# ==================== ГЛОБАЛЬНЫЕ БУФЕРЫ ====================

album_buffers = {}
album_locks = {}
fix_product_buffer = {}
fix_product_locks = {}

# ==================== TELEGRAM БОТ ====================

router = Router()
bot: Bot = None

def get_main_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛍 Открыть каталог", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="ℹ️ Информация", callback_data="info")]
    ])

def get_admin_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛍 Открыть каталог", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="📦 Все товары", callback_data="admin_products")],
        [InlineKeyboardButton(text="➕ Добавить товар", callback_data="admin_add_product")],
        [InlineKeyboardButton(text="🧰 Команды", callback_data="admin_commands")]
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
        f"👋 Привет, <b>{message.from_user.first_name}</b>!\n\n"
        f"<b>MESTNIY | STORE</b>\n\n"
        f"Нажимай <b>Открыть каталог</b> и выбирай раздел: <b>Наличие</b> или <b>На заказ</b>. "
        f"В каталоге можно выбрать валюту, категорию, бренд и размер.\n\n"
        f"Открой нужный товар, выбери размер, если размеров несколько, и нажми <b>Добавить в корзину</b>. "
        f"Если размер один — товар добавится без лишнего выбора.\n\n"
        f"Когда всё выбрано, зайди в корзину и нажми <b>Оформить заказ</b> — тебя сразу перекинет к менеджеру.\n\n"
        f"🛞 <b>Самовывоз:</b> город Лида.\n\n"
        f"📦 <b>Доставка:</b> Европочта / Белпочта / CDEK / Маршрутка.\n\n"
        f"По всем вопросам: @manager_of_mestniy"
    )

    if is_admin:
        text += "\n\n🔧 <i>Режим администратора</i>"
        await message.answer(text, reply_markup=get_admin_keyboard())
    else:
        await message.answer(text, reply_markup=get_main_keyboard())

        # ==================== ADMIN: ДОБАВЛЕНИЕ ТОВАРА ====================

@router.callback_query(F.data == "admin_add_product")
async def admin_add_product_btn(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    await callback.message.answer(
        "➕ <b>Добавление товара</b>\n\n"
        "Шаг 1/10: Выберите категорию:",
        reply_markup=get_category_keyboard()
    )
    await state.set_state(AddProduct.category)
    await callback.answer()

@router.message(Command("add_product"))
async def cmd_add_product(message: Message, state: FSMContext):
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("⛔ Эта команда только для администраторов")
        return

    await message.answer(
        "➕ <b>Добавление товара</b>\n\n"
        "Шаг 1/10: Выберите категорию:",
        reply_markup=get_category_keyboard()
    )
    await state.set_state(AddProduct.category)

@router.callback_query(F.data.startswith("addcat_"))
async def process_category(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    category_id = int(callback.data.split("_")[1])
    cat_data = CATEGORIES.get(category_id, {})

    await state.update_data(category_id=category_id)

    await callback.message.edit_text(
        f"✅ Категория: <b>{cat_data.get('icon', '')} {cat_data.get('name', '')}</b>\n\n"
        "Шаг 2/10: Выберите бренд:",
        reply_markup=get_brand_keyboard()
    )
    await state.set_state(AddProduct.brand)
    await callback.answer()

@router.callback_query(F.data.startswith("addbrand_"))
async def process_brand(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("⛔ Доступ запрещён", show_alert=True)
        return

    brand_key = callback.data.split("_")[1]
    brand_name = BRANDS.get(brand_key, brand_key)

    await state.update_data(brand=brand_key)

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])

    await callback.message.edit_text(
        f"✅ Бренд: <b>{brand_name}</b>\n\n"
        "Шаг 3/10: Отправьте <b>название товара</b>:",
        reply_markup=keyboard
    )
    await state.set_state(AddProduct.name)
    await callback.answer()

@router.message(AddProduct.name)
async def process_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text.strip())

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])

    await message.answer(
        f"✅ Название: <b>{message.text.strip()}</b>\n\n"
        "Шаг 4/10: Отправьте <b>описание товара</b>:",
        reply_markup=keyboard
    )
    await state.set_state(AddProduct.description)

@router.message(AddProduct.description)
async def process_description(message: Message, state: FSMContext):
    await state.update_data(description=message.text.strip())

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])

    await message.answer(
        "✅ Описание сохранено\n\n"
        "Шаг 5/10: Отправьте <b>цену в BYN</b> 🇧🇾\n"
        "(например: 450 или 299.99):",
        reply_markup=keyboard
    )
    await state.set_state(AddProduct.price_byn)

@router.message(AddProduct.price_byn)
async def process_price_byn(message: Message, state: FSMContext):
    try:
        price = float(message.text.strip().replace(',', '.'))
        if price <= 0:
            raise ValueError("Цена должна быть больше 0")

        await state.update_data(price_byn=price)

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])

        await message.answer(
            f"✅ Цена BYN: <b>{price} BYN</b>\n\n"
            "Шаг 6/10: Отправьте <b>цену в RUB</b> 🇷🇺\n"
            "(например: 12500):",
            reply_markup=keyboard
        )
        await state.set_state(AddProduct.price_rub)
    except ValueError:
        await message.answer(
            "❌ Неправильный формат цены!\n\n"
            "Отправьте число, например: <code>450</code> или <code>299.99</code>"
        )

@router.message(AddProduct.price_rub)
async def process_price_rub(message: Message, state: FSMContext):
    try:
        price = float(message.text.strip().replace(',', '.'))
        if price <= 0:
            raise ValueError("Цена должна быть больше 0")

        await state.update_data(price_rub=price)

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])

        await message.answer(
            f"✅ Цена RUB: <b>{price} ₽</b>\n\n"
            "Шаг 7/10: Отправьте <b>цену в USD</b> 🇺🇸\n"
            "(например: 145):",
            reply_markup=keyboard
        )
        await state.set_state(AddProduct.price_usd)
    except ValueError:
        await message.answer(
            "❌ Неправильный формат цены!\n\n"
            "Отправьте число, например: <code>12500</code>"
        )

@router.message(AddProduct.price_usd)
async def process_price_usd(message: Message, state: FSMContext):
    try:
        price = float(message.text.strip().replace(',', '.'))
        if price <= 0:
            raise ValueError("Цена должна быть больше 0")

        await state.update_data(price_usd=price)

        data = await state.get_data()
        category_id = data.get('category_id', 1)

        if category_id == 1:
            size_example = "36, 37, 38, 39, 40, 41, 42, 43, 44, 45"
            size_hint = "Обувь"
        elif category_id in [9, 10]:
            size_example = "ONE SIZE"
            size_hint = "Один размер"
        else:
            size_example = "S, M, L, XL, XXL"
            size_hint = "Одежда"

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])

        await message.answer(
            f"✅ Цена USD: <b>${price}</b>\n\n"
            f"Шаг 8/10: Отправьте <b>размеры через запятую</b>\n\n"
            f"Тип: {size_hint}\n"
            f"Пример: <code>{size_example}</code>",
            reply_markup=keyboard
        )
        await state.set_state(AddProduct.sizes)
    except ValueError:
        await message.answer(
            "❌ Неправильный формат цены!\n\n"
            "Отправьте число, например: <code>145</code>"
        )

@router.message(AddProduct.sizes)
async def process_sizes(message: Message, state: FSMContext):
    sizes = [s.strip().upper() for s in message.text.split(',') if s.strip()]

    if not sizes:
        await message.answer("❌ Укажите хотя бы один размер!")
        return

    await state.update_data(sizes=sizes)

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])

    await message.answer(
        f"✅ Размеры: <b>{', '.join(sizes)}</b>\n\n"
        "Шаг 9/10: Отправьте <b>количество на складе</b>\n"
        "(например: 10):",
        reply_markup=keyboard
    )
    await state.set_state(AddProduct.stock)

@router.message(AddProduct.stock)
async def process_stock(message: Message, state: FSMContext):
    try:
        stock = int(message.text.strip())
        if stock < 0:
            raise ValueError("Количество не может быть отрицательным")

        await state.update_data(stock=stock, images=[])

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Готово — сохранить товар", callback_data="save_product")],
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])

        await message.answer(
            f"✅ На складе: <b>{stock} шт</b>\n\n"
            "Шаг 10/10: Отправьте <b>фото товара</b> 📸\n\n"
            "• Можно отправить несколько фото подряд\n"
            "• После всех фото нажмите <b>Готово</b>",
            reply_markup=keyboard
        )
        await state.set_state(AddProduct.images)
    except ValueError:
        await message.answer(
            "❌ Неправильный формат!\n\n"
            "Отправьте целое число, например: <code>10</code>"
        )

# ==================== ИСПРАВЛЕННЫЙ ОБРАБОТЧИК ФОТО ====================

@router.message(AddProduct.images, F.photo)
async def process_image(message: Message, state: FSMContext):
    user_id = message.from_user.id
    media_group_id = message.media_group_id

    photo = message.photo[-1]
    file = await bot.get_file(photo.file_id)
    file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"

    # Одиночное фото
    if not media_group_id:
        data = await state.get_data()
        images = data.get('images', [])
        images.append(file_url)
        await state.update_data(images=images)

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Готово — сохранить товар", callback_data="save_product")],
            [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
        ])

        await message.answer(
            f"✅ Фото {len(images)} добавлено!\n\n"
            f"Всего фото: {len(images)}\n\n"
            "Отправьте ещё фото или нажмите <b>Готово</b>",
            reply_markup=keyboard
        )
        return

    # Альбом — буферизируем
    buffer_key = f"{user_id}_{media_group_id}"

    if buffer_key not in album_buffers:
        album_buffers[buffer_key] = []

    album_buffers[buffer_key].append(file_url)

    # Если таймер уже запущен — просто добавили фото и выходим
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

            data = await state.get_data()
            images = data.get('images', [])
            images.extend(collected_urls)
            await state.update_data(images=images)

            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✅ Готово — сохранить товар", callback_data="save_product")],
                [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
            ])

            await message.answer(
                f"✅ Добавлено {len(collected_urls)} фото!\n\n"
                f"Всего фото: {len(images)}\n\n"
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

    if not data.get('images'):
        await callback.answer("❌ Добавьте хотя бы одно фото!", show_alert=True)
        return

    await callback.answer("⏳ Сохраняем товар...")

    try:
        prices = {
            "BYN": data['price_byn'],
            "RUB": data['price_rub'],
            "USD": data['price_usd']
        }

        async with async_session() as session:
            product = Product(
                category_id=data['category_id'],
                brand=data.get('brand'),
                name=data['name'],
                description=data['description'],
                price_byn=data['price_byn'],
                prices=prices,
                sizes=data['sizes'],
                stock=data['stock'],
                images=data['images']
            )
            session.add(product)
            await session.commit()
            product_id = product.id

        brand_name = BRANDS.get(data.get('brand'), data.get('brand', ''))
        cat_data = CATEGORIES.get(data['category_id'], {})

        text = (
            f"✅ <b>Товар #{product_id} добавлен!</b>\n\n"
            f"📦 <b>{data['name']}</b>\n"
            f"🏷 Бренд: {brand_name}\n"
            f"📁 Категория: {cat_data.get('icon', '')} {cat_data.get('name', '')}\n"
            f"💰 Цены:\n"
            f"   • {data['price_byn']} BYN\n"
            f"   • {data['price_rub']} ₽\n"
            f"   • ${data['price_usd']}\n"
            f"📏 Размеры: {', '.join(data['sizes'])}\n"
            f"🏷 На складе: {data['stock']} шт\n"
            f"🖼 Фото: {len(data['images'])} шт\n\n"
            f"✨ Товар уже доступен в каталоге!"
        )

        await callback.message.edit_text(text, reply_markup=get_admin_keyboard())
        await state.clear()

        print(f"✅ Товар #{product_id} добавлен: {data['name']}")

        await auto_push_to_github()

    except Exception as e:
        print(f"❌ Ошибка сохранения товара: {e}")
        await callback.message.edit_text(
            f"❌ Ошибка при сохранении товара!\n\n{str(e)}",
            reply_markup=get_admin_keyboard()
        )
        await state.clear()

@router.message(AddProduct.images)
async def process_images_invalid(message: Message, state: FSMContext):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Готово — сохранить товар", callback_data="save_product")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin_cancel")]
    ])
    await message.answer(
        "⚠️ Отправьте <b>фото</b> или нажмите <b>Готово</b>",
        reply_markup=keyboard
    )

@router.callback_query(F.data == "admin_cancel")
async def admin_cancel(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text(
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
        "<code>/edit_stock ID</code> — изменить наличие\n"
        "<code>/discount ID BYN RUB USD</code> — поставить скидку ценами\n"
        "<code>/discount ID 0</code> — убрать скидку\n"
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
        status = "✅" if p.stock > 0 else "❌"
        brand_name = BRANDS.get(p.brand, '') if p.brand else ''
        text += (
            f"{status} <b>#{p.id}</b> {p.name}\n"
            f"   🏷 {brand_name} | 💰 {p.price_byn} BYN | 📦 {p.stock} шт\n\n"
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
        status = "✅" if p.stock > 0 else "❌"
        brand_name = BRANDS.get(p.brand, '') if p.brand else ''
        text += (
            f"{status} <b>#{p.id}</b> {p.name}\n"
            f"   🏷 {brand_name} | 💰 {p.price_byn} BYN | 📦 {p.stock} шт\n\n"
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

# ==================== ADMIN: СТАТИСТИКА ====================

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

# ==================== ИНФОРМАЦИЯ ====================

@router.callback_query(F.data == "info")
async def show_info(callback: CallbackQuery):
    text = (
        "• Личная встреча: г. Лида 🌇\n\n"
        "• Отзывы: Более 720!\n"
        "<a href='https://t.me/mestniyotzivyy'>ГЛЯНУТЬ ОТЗЫВЫ ТУТ (ТЫКАЙ)</a>\n\n"
        "• Доставка: По всем странам СНГ, через:\n\n"
        "<blockquote>Белпочта ( по Беларуси )\n"
        "Европочта ( по Беларуси )\n"
        "Маршрутка ( по Беларуси )\n"
        "Такси ( по городу Лида )\n"
        "CDEK ( между странами СНГ )</blockquote>\n\n"
        "По всем интересующим вопросам обращаться сюда: @manager_of_mestniy"
    )
    await callback.message.answer(text, disable_web_page_preview=True)
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
                "stock": p.stock,
                "images": p.images
            })

        return web.json_response(data)

async def api_get_categories(request):
    categories = [{"id": k, **v} for k, v in CATEGORIES.items()]
    return web.json_response(categories)

async def api_get_brands(request):
    return web.json_response(BRANDS)

async def api_get_rates(request):
    return web.json_response(CURRENCIES)

async def start_api_server():
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/api/products", api_get_products)
    app.router.add_get("/api/categories", api_get_categories)
    app.router.add_get("/api/brands", api_get_brands)
    app.router.add_get("/api/rates", api_get_rates)

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

GITHUB_TOKEN = "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"
GITHUB_REPO = "liknine/mestniybot"
GITHUB_BRANCH = "main"

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
            "stock": p.stock,
            "images": p.images
        })

    webapp_path = "/home/botuser/mestniy_bot/products.json"

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

    brand_name = BRANDS.get(product.brand, '') if product.brand else ''
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
    fix_images = data.get('fix_images', [])

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

    await bot.set_my_commands([
        BotCommand(command="start", description="🚀 Запустить бота"),
        BotCommand(command="add_product", description="➕ Добавить товар"),
        BotCommand(command="products", description="📦 Список товаров"),
        BotCommand(command="delete", description="🗑 Удалить товар"),
        BotCommand(command="export", description="📤 Экспорт на GitHub"),
        BotCommand(command="fix_product", description="🔧 Починить фото товара"),
    ])

    await start_api_server()

    print("🤖 Бот запущен!")
    print("📝 Команды: /add_product, /products, /delete ID, /export, /fix_product ID")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
