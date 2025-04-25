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
