# back/Dockerfile
FROM python:3.12-slim

# set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
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

# Install Python dependencies
COPY back/requirements.txt .
RUN python3 -m pip install --upgrade pip setuptools
RUN pip install --no-cache-dir -r requirements.txt

# Set work directory
WORKDIR /backend

# Copy project files
COPY back/ .

# Expose application port
EXPOSE 8000

# Populate the database (optional)
COPY back/entrypoint.sh backend/entrypoint.sh
RUN sed -i 's/\r$//' backend/entrypoint.sh && chmod +x backend/entrypoint.sh
ENTRYPOINT ["backend/entrypoint.sh"]
