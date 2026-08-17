# back/Dockerfile
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (for PDF generation, image processing, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libglib2.0-0 \
    libglib2.0-dev \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf \
    shared-mime-info \
    libssl-dev \
    libffi-dev \
    libmariadb-dev \
    pkg-config \
    gcc \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /backend

# Copy and install Python dependencies
COPY back/requirements.txt .
RUN python3 -m pip install --upgrade pip setuptools \
    && pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY back/ .

# Expose application port
EXPOSE 8000

# Copy and set entrypoint script
COPY back/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

# Run unprivileged. Gunicorn binds 8000, above 1024, so no capability is
# needed. staticfiles/ and media/ must be writable: collectstatic writes to
# the first on every start, and uploads go to the second. Both are named
# volumes, whose existing ownership is fixed separately in Step 5 - chowning
# here only covers the image, and a pre-existing volume masks it.
# getent guards: these base images already ship a default user at uid/gid 1000,
# so a bare groupadd/useradd exits non-zero and fails the build. The numeric
# uid is what matters - /app must be owned by 1000 either way.
RUN (getent group 1000 || groupadd --gid 1000 app) \
    && (getent passwd 1000 || useradd --uid 1000 --gid 1000 --no-create-home --shell /usr/sbin/nologin app) \
    && mkdir -p /backend/staticfiles /backend/media \
    && chown -R 1000:1000 /backend

USER 1000:1000

ENTRYPOINT ["./entrypoint.sh"]
