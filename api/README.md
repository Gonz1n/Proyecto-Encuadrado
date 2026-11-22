# API de Encuadrado

Backend en FastAPI con SQLAlchemy y Alembic, sobre Postgres (Neon).

## Requisitos

- [uv](https://docs.astral.sh/uv/)
- Python 3.15

## Variables de entorno

Se leen desde el entorno o desde `api/.env` (usar `api/.env.example` como base).

- `DATABASE_URL`: cadena de conexion a la base de desarrollo de Neon, formato `postgresql+psycopg://usuario:contrasena@host/base?sslmode=require`.
- `TEST_DATABASE_URL`: cadena de conexion a una base separada para las pruebas. Debe ser distinta de `DATABASE_URL`.

## Comandos

Ejecutar desde la carpeta `api/`.

```bash
uv sync                          # instalar dependencias
uv run alembic upgrade head      # aplicar migraciones
uv run fastapi dev app/main.py   # servidor de desarrollo
uv run pytest -q                 # pruebas
uv run python -m app.db.seed     # cargar datos de ejemplo
```

La salud del servicio se verifica en `GET /api/health/`.

## Deploy en Render

1. En Render, crear un Blueprint desde el repositorio. Render toma la configuracion de `render.yaml` en la raiz.
2. Cargar el valor de `DATABASE_URL` en el servicio, apuntando a un branch nuevo de Neon.
3. Cada arranque ejecuta las migraciones y el seed automaticamente antes de iniciar el servidor. El seed es idempotente, por lo que repetirlo es seguro.
4. Verificar que `https://<servicio>.onrender.com/api/health/` responda `{"status":"ok"}`.
