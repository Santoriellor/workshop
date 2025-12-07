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
ENTRYPOINT ["./entrypoint.sh"]
