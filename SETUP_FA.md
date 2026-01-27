# اقامتگاه جنگلی ارسباران - سیستم رزرو آنلاین

## 📋 راهنمای راه‌اندازی

### پیش‌نیازها
- Node.js v18+
- حساب Supabase

### مرحله ۱: نصب dependencies

```bash
npm install
```

### مرحله ۲: تنظیم Supabase

#### ۲.۱ ایجاد جداول دیتابیس
1. وارد داشبورد Supabase شوید
2. به قسمت **SQL Editor** بروید
3. محتویات فایل زیر را کپی و اجرا کنید:
   ```
   supabase/migrations/20260124_complete_secure_schema.sql
   ```

#### ۲.۲ ایجاد اولین ادمین
1. به **Authentication > Users** بروید
2. روی **Add user** کلیک کنید
3. ایمیل و رمز عبور وارد کنید
4. UUID کاربر جدید را کپی کنید
5. در SQL Editor این کوئری را اجرا کنید:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-کاربر-اینجا', 'admin');
```

### مرحله ۳: تنظیم Environment Variables

فایل `.env` را با اطلاعات خود پر کنید:

```env
# Supabase (ضروری)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# پرداخت کریپتو (آدرس USDT TRC20 خود را وارد کنید)
VITE_USDT_TRC20_ADDRESS=your-trc20-wallet-address

# تلگرام (برای اعلان‌ها)
# 1. از @BotFather یک ربات بسازید
# 2. توکن را اینجا وارد کنید
# 3. ربات را به گروه/کانال خود اضافه کنید و chat_id بگیرید
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# ایمیل (Resend) - اختیاری
RESEND_API_KEY=re_your_api_key

# زرین‌پال - وقتی merchant_id گرفتید
ZARINPAL_MERCHANT_ID=

# PayPal - برای پرداخت بین‌المللی
VITE_PAYPAL_CLIENT_ID=
```

### مرحله ۴: Deploy کردن Edge Functions

```bash
# نصب Supabase CLI
npm install -g supabase

# لاگین
supabase login

# لینک به پروژه
supabase link --project-ref your-project-ref

# ست کردن secrets
supabase secrets set TELEGRAM_BOT_TOKEN=your-token
supabase secrets set TELEGRAM_CHAT_ID=your-chat-id
supabase secrets set USDT_TRC20_ADDRESS=your-wallet
supabase secrets set RESEND_API_KEY=your-key
supabase secrets set ZARINPAL_MERCHANT_ID=your-merchant-id

# Deploy
supabase functions deploy send-notification
supabase functions deploy crypto-payment
supabase functions deploy zarinpal-payment
```

### مرحله ۵: اجرای پروژه

```bash
npm run dev
```

---

## 📁 ساختار پروژه

```
arasbaran/
├── src/
│   ├── components/        # کامپوننت‌های UI
│   ├── hooks/             # React Hooks
│   │   ├── useCabins.ts   # مدیریت کلبه‌ها
│   │   ├── useBooking.ts  # رزرو امن
│   │   ├── useReviews.ts  # نظرات
│   │   └── useNotifications.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts  # کلاینت Supabase
│   │       └── types.ts   # TypeScript types
│   ├── pages/
│   │   ├── Index.tsx      # صفحه اصلی
│   │   ├── Admin.tsx      # پنل ادمین
│   │   └── AdminLogin.tsx
│   └── i18n/              # ترجمه‌ها
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── send-notification/
│   │   ├── crypto-payment/
│   │   └── zarinpal-payment/
│   └── migrations/        # SQL migrations
└── .env                   # متغیرهای محیطی
```

---

## 🔒 ویژگی‌های امنیتی

### ✅ اصلاحات انجام شده:

1. **محاسبه قیمت سمت سرور**: قیمت دیگر از frontend ارسال نمی‌شود
2. **جلوگیری از Double Booking**: استفاده از `pg_advisory_xact_lock`
3. **RLS Policies محدود**: فقط دسترسی‌های لازم
4. **اعتبارسنجی در Database**: CHECK constraints روی همه فیلدها
5. **Database Functions امن**: `SECURITY DEFINER` با `search_path`

---

## 💳 روش‌های پرداخت

| روش | وضعیت | توضیح |
|-----|--------|-------|
| USDT (TRC20) | ✅ آماده | آدرس کیف پول را در `.env` وارد کنید |
| زرین‌پال | ⏳ آماده | merchant_id بگیرید و در secrets وارد کنید |
| PayPal | ⏳ آماده | Client ID بگیرید |
| پرداخت در محل | ✅ همیشه کار می‌کند | - |

---

## 📱 اعلان‌ها

### تلگرام
1. به @BotFather پیام دهید
2. یک ربات جدید بسازید (`/newbot`)
3. توکن را کپی کنید
4. ربات را به گروه/کانال اضافه کنید
5. از این API برای گرفتن chat_id استفاده کنید:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

### ایمیل (Resend)
1. به https://resend.com بروید
2. ثبت‌نام و API Key بگیرید
3. دامنه خود را verify کنید (اختیاری)

---

## 🎨 قیمت‌گذاری پویا

سیستم از سه سطح قیمت‌گذاری پشتیبانی می‌کند:

1. **قیمت پایه**: قیمت پیش‌فرض هر کلبه
2. **قیمت فصلی**: مثلاً نوروز ۱.۵ برابر
3. **قیمت روزانه**: برای روزهای خاص (تعطیلات، مناسبت‌ها)

اولویت: `روزانه > فصلی > پایه`

---

## 📞 پشتیبانی

برای سوالات فنی با ما تماس بگیرید.
