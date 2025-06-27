# Multi-stage build for Enhanced Saga Orchestrator
FROM python:3.11-slim as builder

# Set build arguments
ARG BUILD_DATE
ARG VERSION
ARG VCS_REF

# Set labels
LABEL maintainer="AIC Development Team" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="Enhanced Saga Orchestrator" \
      org.label-schema.description="Enterprise-grade distributed transaction management" \
      org.label-schema.version=$VERSION \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
COPY requirements-dev.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.local/bin:$PATH" \
    ENVIRONMENT=production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r saga && useradd -r -g saga saga

# Create app directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/
COPY alembic.ini .
COPY alembic/ ./alembic/

# Copy health check script
COPY scripts/health-check.sh /usr/local/bin/health-check
RUN chmod +x /usr/local/bin/health-check

# Create necessary directories
RUN mkdir -p /app/logs /app/data && \
    chown -R saga:saga /app

# Switch to non-root user
USER saga

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD health-check

# Set default command
CMD ["python", "-m", "src.main"]

# Development stage
FROM production as development

# Switch back to root for development tools
USER root

# Install development dependencies
COPY --from=builder /app/requirements-dev.txt .
RUN pip install -r requirements-dev.txt

# Install development tools
RUN apt-get update && apt-get install -y \
    vim \
    htop \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Switch back to saga user
USER saga

# Override command for development
CMD ["python", "-m", "src.main", "--reload"]
