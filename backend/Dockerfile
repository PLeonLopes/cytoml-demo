FROM python:3.12-slim

WORKDIR /app

# Evita geração de .pyc e bufferização de logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# 1 worker (cada processo carrega os dois modelos, ~1,3 GB) com 2 threads, que dividem os
# mesmos modelos; timeout alinhado ao do Cloud Run. A API não usa banco, então não há migrate.
CMD ["sh", "-c", "gunicorn cytoml_proj.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 2 --timeout 120"]
