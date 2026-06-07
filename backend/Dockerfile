FROM python:3.12-slim

WORKDIR /app

# Evita geração de .pyc e bufferização de logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Dependências de sistema necessárias para compilar pacotes Python e libpq (postgres)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libgl1 \
        libglib2.0-0 \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# Config GCP
CMD ["sh", "-c", "python manage.py migrate && gunicorn cytoml_proj.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 1 --timeout 300"]

