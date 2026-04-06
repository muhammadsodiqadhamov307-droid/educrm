# EduCRM — Education Center Management System

EduCRM is a full-stack CRM for education centers with role-based access, student finance tracking, attendance workflows, and multilingual support.

## Tech Stack
- Frontend: React 18, Vite, TailwindCSS, React Router v6, Zustand, i18next, React Hook Form, Zod
- Backend: Django 4, Django REST Framework, PostgreSQL, SimpleJWT, django-filter, django-cors-headers

## Recommended Versions
- Python: 3.11 or 3.12
- Node.js: 18 LTS or 20 LTS
- npm: 9+
- Database for first local run: SQLite
- Database for production: PostgreSQL

## Features
- Role-based access for Admin, Receptionist, and Teacher
- Student management with balance and discount tracking
- Group and course management
- Attendance marking with automatic balance deduction and teacher earnings updates
- Payment management with balance synchronization
- Lead management with student conversion
- Expense tracking
- JWT authentication with refresh flow
- Multi-language support: Uzbek, Russian, English
- Responsive UI for desktop and mobile

## Project Structure
```text
.
├── crm_backend/        # Django apps and project config package
├── src/                # React frontend source
├── setup_backend_windows.bat
├── start_backend_windows.bat
├── setup_frontend_windows.bat
├── start_frontend_windows.bat
├── manage.py           # Django entrypoint
├── requirements.txt    # Backend dependencies
├── package.json        # Frontend dependencies
└── .env.example        # Shared environment variables example
```

## Very Important When Moving To Windows
- `venv/` ni Mac’dan Windows’ga ko'chirmang.
- `node_modules/` ni ham ko'chirmang.
- `dist/` va `db.sqlite3` ni ham yangi muhitga tayyor build sifatida ko'chirish tavsiya qilinmaydi.
- Windows kompyuterda loyihani ochgandan keyin dependencylarni qayta o'rnating.
- Shu repo ichidagi `.bat` skriptlar aynan shu jarayonni yengillashtirish uchun qo'shilgan.

## Backend Packages
`requirements.txt` ichidagi backend kutubxonalari:

```text
Django==4.2.16
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.4.0
django-filter==24.3
python-decouple==3.8
psycopg2-binary==2.9.10
```

## Frontend Packages
`package.json` ichidagi frontend kutubxonalari:

```text
dependencies:
@hookform/resolvers 3.9.1
axios 1.7.9
date-fns 4.1.0
i18next 24.2.2
lucide-react 0.468.0
prop-types 15.8.1
react 18.3.1
react-dom 18.3.1
react-hook-form 7.54.2
react-hot-toast 2.5.1
react-i18next 15.4.1
react-router-dom 6.30.1
zod 3.24.1
zustand 5.0.2

devDependencies:
@vitejs/plugin-react-swc 3.8.0
autoprefixer 10.4.20
postcss 8.4.49
tailwindcss 3.4.17
vite 6.0.7
```

## Windows Quick Start
PowerShell yoki CMD ichida loyiha root papkasiga kiring va quyidagi ketma-ketlikni ishlating.

### 1. Backend setup
```bat
setup_backend_windows.bat
```

### 2. Frontend setup
```bat
setup_frontend_windows.bat
```

### 3. Backend start
```bat
start_backend_windows.bat
```

### 4. Frontend start
Yangi terminal oynasida:

```bat
start_frontend_windows.bat
```

### 5. Open in browser
- Frontend: `http://127.0.0.1:7010`
- Backend: `http://127.0.0.1:10234`

## Windows Manual Setup
`.bat` skriptsiz qo'lda ishga tushirishni xohlasangiz:

### Backend
```powershell
py -3.12 -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 127.0.0.1:10234
```

### Frontend
```powershell
npm install
copy .env.example .env
npm run dev -- --host 127.0.0.1 --port 7010
```

## Setup — Backend
This repository keeps the Django entrypoint at the project root, so run backend commands from the root directory.

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Setup — Frontend
The frontend also runs from the project root.

```bash
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:10234
npm run dev
```

## Environment Variables

### Backend / Root `.env`
| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `SECRET_KEY` | Django secret key | required |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated Django allowed hosts | `127.0.0.1,localhost` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:7010` |
| `CSRF_TRUSTED_ORIGINS` | Trusted browser origins for admin/API forms | `http://localhost:7010` |
| `SECURE_SSL_REDIRECT` | Redirect HTTP to HTTPS behind Nginx | `False` locally |
| `SESSION_COOKIE_SECURE` | Send session cookie only over HTTPS | `False` locally |
| `CSRF_COOKIE_SECURE` | Send CSRF cookie only over HTTPS | `False` locally |
| `SECURE_HSTS_SECONDS` | HSTS max-age | `0` locally |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access token lifetime in minutes | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh token lifetime in days | `7` |
| `TEACHER_SHARE_PERCENT` | Teacher earnings percentage per lesson | `30` |

### Frontend / Root `.env`
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

## Role Permissions
| Feature | Admin | Receptionist | Teacher |
|---|---|---|---|
| Dashboard | ✅ | ❌ | ❌ |
| Students | ✅ | ✅ | ❌ |
| Groups | ✅ | ✅ | ❌ |
| Attendance | ✅ | ❌ | ✅ (own groups) |
| Payments | ✅ | ✅ | ❌ |
| Courses | ✅ | ❌ | ❌ |
| Teachers | ✅ | ❌ | ❌ |
| Leads | ✅ | ✅ | ❌ |
| Expenses | ✅ | ❌ | ❌ |

## API Summary
Base URL: `/api/`

- `POST /auth/login/` — Get JWT access and refresh tokens
- `POST /auth/refresh/` — Refresh access token
- `POST /auth/logout/` — Blacklist refresh token
- `GET /auth/me/` — Current user info
- `GET /dashboard/stats/` — Dashboard statistics
- `CRUD /students/` — Student management
- `CRUD /groups/` — Group management
- `CRUD /courses/` — Course management
- `GET /teachers/` — Teacher list
- `CRUD /teachers/` — Teacher management for admins
- `POST /attendance/bulk-save/` — Save attendance and trigger balance deduction
- `CRUD /payments/` — Payment management with balance updates
- `CRUD /leads/` — Lead management
- `POST /leads/{id}/convert-to-student/` — Convert lead to student
- `CRUD /expenses/` — Expense tracking

## Development Notes
- The frontend and backend currently share a single root `.env` file.
- Default frontend URL is `http://localhost:7010`.
- Default backend URL is `http://localhost:10234`.
- Tailwind is configured with a custom brand palette and responsive layouts.
- JWT refresh is handled automatically by the Axios interceptor layer.

## Windows Troubleshooting
- `python3` ishlamasa, Windows’da `py -3.12` yoki `python` ishlating.
- `source venv/bin/activate` o'rniga `venv\Scripts\activate` ishlating.
- `cp .env.example .env` o'rniga `copy .env.example .env` ishlating.
- Agar frontend install xato bersa, eski `node_modules` papkani o'chirib, `npm install` ni qayta ishga tushiring.
- Agar backend install xato bersa, eski `venv` papkani o'chirib, virtual environmentni qayta yarating.
- Agar PostgreSQL ulanishida muammo bo'lsa, birinchi ishga tushirish uchun `.env` ichida `DATABASE_URL=sqlite:///db.sqlite3` dan foydalaning.
- Agar port band bo'lsa:
  - backend: `python manage.py runserver 127.0.0.1:8001`
  - frontend: `npm run dev -- --host 127.0.0.1 --port 5174`

## Production Checks
- Frontend build: `npm run build`
- Django system check: `python manage.py check`

## Ubuntu / AWS Deployment Notes
- Do not deploy this repo with the checked-in `node_modules/`, `dist/`, `venv/`, `venv313/`, or `.venv/` folders. Rebuild dependencies on the server.
- The repo now includes a deployment scaffold in [`deploy/deploy_ubuntu.sh`](/home/odoo19/Downloads/Robotnic/deploy/deploy_ubuntu.sh), [`deploy/educrm.service`](/home/odoo19/Downloads/Robotnic/deploy/educrm.service), and [`deploy/educrm-nginx.conf`](/home/odoo19/Downloads/Robotnic/deploy/educrm-nginx.conf).
- Before running it on Ubuntu, set production values in `.env`:
  - `DEBUG=False`
  - `ALLOWED_HOSTS=your-server-ip,your-subdomain.duckdns.org`
  - `CORS_ORIGINS=https://your-subdomain.duckdns.org`
  - `CSRF_TRUSTED_ORIGINS=https://your-subdomain.duckdns.org`
  - `SECURE_SSL_REDIRECT=True`
  - `SESSION_COOKIE_SECURE=True`
  - `CSRF_COOKIE_SECURE=True`
- After Nginx is live, request the free TLS certificate with:

```bash
sudo certbot --nginx -d your-subdomain.duckdns.org
```

- If you use DuckDNS, point the DuckDNS record to your AWS public IP before requesting the certificate.

## Git Update Flow
- GitHub remote: `git@github.com:muhammadsodiqadhamov307-droid/educrm.git`
- Recommended branch for deployment: `main`
- Server update script: [`deploy/update_from_git.sh`](/home/odoo19/Downloads/Robotnic/deploy/update_from_git.sh)

### Local workflow
```bash
git add .
git commit -m "Describe your change"
git push origin main
```

### Server workflow
After pushing new code, connect to the server and run:

```bash
cd /srv/educrm
./deploy/update_from_git.sh
```

That script will:
- pull the latest code from GitHub
- install backend dependencies
- install frontend dependencies
- rebuild the frontend
- run Django migrations
- collect static files
- restart Gunicorn and reload Nginx

## Data Backup
For the current SQLite production setup, create a timestamped zip backup with:

```bash
cd /srv/educrm
python3 scripts/backup_data.py
```

The backup zip will be written into `/srv/educrm/backups/`.

If you also want the environment file included in the zip:

```bash
cd /srv/educrm
python3 scripts/backup_data.py --include-env
```

To download a backup from the server to your local machine:

```bash
scp -i /path/to/key.pem ubuntu@your-server:/srv/educrm/backups/educrm-backup-YYYYMMDDTHHMMSSZ.zip .
```

Important:
- This backup script is for SQLite.
- If you later move production to PostgreSQL, use `pg_dump` instead of copying the database file.
