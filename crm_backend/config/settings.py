from datetime import timedelta
from pathlib import Path
import re
from urllib.parse import urlparse

from decouple import config
from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent.parent
WINDOWS_DRIVE_PATTERN = re.compile(r"^[A-Za-z]:[\\/]")


def to_bool(value) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def split_csv(value: str) -> list[str]:
    return [item.strip() for item in str(value).split(",") if item.strip()]


def parse_database_url(database_url: str) -> dict:
    parsed = urlparse(database_url)
    engine_map = {
        "postgres": "django.db.backends.postgresql",
        "postgresql": "django.db.backends.postgresql",
        "pgsql": "django.db.backends.postgresql",
        "sqlite": "django.db.backends.sqlite3",
    }
    engine = engine_map.get(parsed.scheme)
    if engine is None:
        raise ValueError(f"Unsupported database scheme: {parsed.scheme}")
    if engine == "django.db.backends.sqlite3":
        sqlite_path = parsed.path or ""
        if parsed.netloc:
            sqlite_path = f"{parsed.netloc}{sqlite_path}"
        sqlite_path = sqlite_path.lstrip("/") or "db.sqlite3"
        normalized_path = sqlite_path.replace("\\", "/")
        if Path(normalized_path).is_absolute() or WINDOWS_DRIVE_PATTERN.match(normalized_path):
            db_path = Path(normalized_path)
        else:
            db_path = BASE_DIR / normalized_path
        return {
            "ENGINE": engine,
            "NAME": str(db_path),
        }
    return {
        "ENGINE": engine,
        "NAME": parsed.path.lstrip("/"),
        "USER": parsed.username or "",
        "PASSWORD": parsed.password or "",
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or ""),
    }


SECRET_KEY = config("SECRET_KEY", default="unsafe-secret-key")
DEBUG = to_bool(config("DEBUG", default=True))
ALLOWED_HOSTS = split_csv(
    config("ALLOWED_HOSTS", default="127.0.0.1,localhost")
)

if not DEBUG and SECRET_KEY == "unsafe-secret-key":
    raise ImproperlyConfigured("SECRET_KEY must be set to a secure value when DEBUG is False.")

if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS must contain at least one host when DEBUG is False.")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "crm_backend.apps.accounts",
    "crm_backend.apps.students",
    "crm_backend.apps.groups",
    "crm_backend.apps.courses",
    "crm_backend.apps.attendance",
    "crm_backend.apps.payments",
    "crm_backend.apps.leads",
    "crm_backend.apps.expenses",
    "crm_backend.apps.dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "crm_backend.config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "crm_backend.config.wsgi.application"
ASGI_APPLICATION = "crm_backend.config.asgi.application"

DATABASES = {
    "default": parse_database_url(
        config("DATABASE_URL", default=f"sqlite:///{(BASE_DIR / 'db.sqlite3').as_posix()}")
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

CORS_ALLOWED_ORIGINS = split_csv(
    config(
        "CORS_ORIGINS",
        default="http://localhost:7010,http://127.0.0.1:7010",
    )
)
CSRF_TRUSTED_ORIGINS = split_csv(
    config(
        "CSRF_TRUSTED_ORIGINS",
        default="http://localhost:7010,http://127.0.0.1:7010",
    )
)

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = to_bool(config("SECURE_SSL_REDIRECT", default=not DEBUG))
SESSION_COOKIE_SECURE = to_bool(config("SESSION_COOKIE_SECURE", default=not DEBUG))
CSRF_COOKIE_SECURE = to_bool(config("CSRF_COOKIE_SECURE", default=not DEBUG))
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", cast=int, default=0 if DEBUG else 3600)
SECURE_HSTS_INCLUDE_SUBDOMAINS = to_bool(
    config("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=not DEBUG)
)
SECURE_HSTS_PRELOAD = to_bool(config("SECURE_HSTS_PRELOAD", default=False))

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "crm_backend.config.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", cast=int, default=60)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", cast=int, default=7)
    ),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

TEACHER_SHARE_PERCENT = config("TEACHER_SHARE_PERCENT", cast=int, default=30)
