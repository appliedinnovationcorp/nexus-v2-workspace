FROM node:18-bullseye

WORKDIR /app

# Install dependencies for TensorFlow.js
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Create a non-root user and switch to it
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nodeuser && \
    chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3003

CMD ["node", "src/index.js"]
