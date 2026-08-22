بسم الله الرحمن الرحیم

# لایسنس

این پروژه تحت [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) منتشر شده است.  
هرگونه استفاده، تغییر، یا توزیع باید تحت شرایط این لایسنس باشد.

به صورت کلی استفاده از کدهای این ریپازیتوری در سایر پروژه‌ها مجاز است،
به شرط اینکه کد آن پروژه‌ها نیز به صورت متن‌باز منتشر شود.

# مستندات محصولی

مستندات محصولی پروژه دورخوانی:

https://docs.google.com/document/d/1pfFlyGtX7q5XsaEhDGlUMa7GrybwvR06ERrzLZmvRlw

# راه اندازی

برای بیلد و اجرای پروژه متغیرهای محیطی زیر را ست کنید:

```
PORT = 3000
ORIGIN = 'https://dorkhani.ir'
DATABASE_URL = 'mysql://user:pass@host:3306/khatm'
ADMIN_USER = "admin"
ADMIN_PASS = "123456"
BASE_PATH = ''
PUBLIC_FONT_PROXY=1
BODY_SIZE_LIMIT = '12M'
```

برای بیلد پروژه به ترتیب دستورات زیر را وارد نمایید (باید node.js و pnpm از قبل نصب باشد)

```bash
pnpm install
npx prisma migrate deploy
pnpm run build
```

با این کار پروژه بیلدشده و در پوشه‌ی build فایل‌های خروجی ریخته می‌شود. حالا برای اجرای پروژه‌ی بیلدشده دستور زیر را وارد کنید:

```bash
node build/index.js
```

## بیلد وب و CSR نیتیو

بیلد پیش‌فرض و `build:web` خروجی Node SSR را در `build/` می‌سازند. برای خروجی استاتیک آمادهٔ
Capacitor، آدرس HTTPS سرور فعلی را مشخص کنید:

```bash
pnpm build:web
PUBLIC_SERVER_ORIGIN=https://dorkhani.ir pnpm build:csr
pnpm build:all
```

در ویندوز، `PUBLIC_SERVER_ORIGIN` را در env یا فایل `.env` قرار دهید. خروجی CSR در
`build-capacitor/` ساخته می‌شود و برای داده، auth و branding به همان backend متصل است. روی backend
نیز originهای مجاز نیتیو را به‌صورت comma-separated در `NATIVE_TRUSTED_ORIGINS` قرار دهید؛ مقدار
استاندارد آیندهٔ Capacitor برابر `https://localhost` است. پنل `/admin` فقط در بیلد وب در دسترس است.

## PWA وب

بیلد وب service worker را خودکار ثبت می‌کند و فایل‌های versioned برنامه، assetهای ثابت، branding عمومی و
فونت‌های قرآنی استفاده‌شده را برای اجرای آفلاین نگه می‌دارد. در navigation آفلاین، `offline.html` نمایش داده
می‌شود. پاسخ‌های HTML، حساب کاربری، APIهای داده و لینک‌های خصوصی ختم عمداً cache نمی‌شوند؛ بنابراین مشاهدهٔ
اطلاعات به‌روز و انجام عملیات ختم همچنان به اینترنت نیاز دارد. در بیلد Capacitor ثبت service worker غیرفعال است.

## Android با Capacitor

Capacitor 8 به Node 22 و Android Studio 2025.2.1 یا جدیدتر نیاز دارد. پروژه native با شناسه
`ir.dorkhani.app` در `android/` نگهداری می‌شود:

```bash
pnpm android:assets
pnpm android:sync
pnpm android:open
pnpm android:run
```

`android:sync` ابتدا CSR را می‌سازد و سپس assetها و pluginها را sync می‌کند. برای AAB امضاشده،
`ANDROID_KEYSTORE_PATH`، `ANDROID_KEYSTORE_PASSWORD`، `ANDROID_KEY_ALIAS` و
`ANDROID_KEY_PASSWORD` را خارج از repository تنظیم و `pnpm android:build` را اجرا کنید.

برای فعال‌شدن App Links، fingerprintهای SHA-256 گواهی debug، release و Google Play App Signing را
به‌صورت comma-separated در `ANDROID_SHA256_CERT_FINGERPRINTS` سرور قرار دهید. فایل association در
`https://dorkhani.ir/.well-known/assetlinks.json` ارائه می‌شود. ورود Google در Android فعلاً نمایش
داده نمی‌شود؛ ورود و بازیابی ایمیلی از bearer token ذخیره‌شده در Android Keystore استفاده می‌کنند.

در صفحهٔ جزئیات ختم، لانچرهای پشتیبانی‌شده می‌توانند برای همان ختم pinned shortcut بسازند. URL ختم
خصوصی شامل access token است؛ بنابراین میان‌بر خصوصی فقط باید روی دستگاه قابل‌اعتماد ساخته شود.

## مینی‌اپ و بازوی بله

برای اجرای پروژه در بله، یک بازو با `@botfather` بسازید و آدرس HTTPS برنامه را به‌عنوان مینی‌اپ
اصلی و دکمه منو تنظیم کنید. متغیرهای زیر نیز باید در محیط production وجود داشته باشند:

```dotenv
BALE_BOT_TOKEN="token-issued-by-botfather"
BALE_BOT_USERNAME="bot_username"
BALE_WEBHOOK_SECRET="a-long-random-url-secret"
EITAA_BOT_USERNAME="eitaa_bot_username"
```

وب‌هوک بله را یک بار با متد `setWebhook` روی آدرس زیر ثبت کنید. در صورت استفاده از `BASE_PATH`،
آن را نیز پیش از `/api` قرار دهید:

```text
https://example.com/api/bale/webhook/<BALE_WEBHOOK_SECRET>
```

در reverse proxy نباید هدر `X-Frame-Options` مسدودکننده اضافه شود و CSP باید embedding از
`https://*.bale.ai` را مجاز بداند. ورود و کوکی iframe فقط روی HTTPS پشتیبانی می‌شود. همان
`EITAA_APP_TOKEN` ورود ایتا برای اعلان خصوصی کاربر نیز استفاده می‌شود؛ بنابراین بازوی ایتا باید
اجازه ارسال پیام به کاربری را داشته باشد که مینی‌اپ را باز می‌کند.
