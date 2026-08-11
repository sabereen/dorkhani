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
