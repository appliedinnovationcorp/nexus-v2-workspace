# Multi-stage Docker build for AIC AI Services (FastAPI)
# Optimized for production with security best practices

# Stage 1: Base Python image with dependencies
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r aiuser && useradd -r -g aiuser aiuser

# Set work directory
WORKDIR /app

# Stage 2: Dependencies
FROM base as deps

# Copy requirements
COPY apps/ai-services/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Application
FROM base as app

# Copy dependencies from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY apps/ai-services/ .

# Create necessary directories
RUN mkdir -p logs data models

# Set ownership
RUN chown -R aiuser:aiuser /app

# Switch to non-root user
USER aiuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
