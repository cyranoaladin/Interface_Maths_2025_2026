FROM python:3.11-slim

# Prevents Python from writing .pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

# System deps (optional: build essentials if needed by pip)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps first to leverage Docker layer cache
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port for the ASGI server
EXPOSE 8000

# Default environment (can be overridden)
# STATIC_BASE_URL=/content (Nginx maps /content/ -> webroot)
# CONTENT_ROOT should point to mounted /site in docker-compose

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

