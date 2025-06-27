FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser && \
    chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3001

CMD ["node", "src/index.js"]
