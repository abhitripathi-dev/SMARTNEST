# Build and Run SmartNest Fullstack Container
FROM node:22-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy project source code
COPY . .

# Build frontend production assets
RUN npm run build

# Create data directory for persistent SQLite database
RUN mkdir -p /app/data

# Expose backend & frontend port
EXPOSE 5000

# Production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Volume for database persistence
VOLUME ["/app/data"]

# Start server
CMD ["npm", "start"]
