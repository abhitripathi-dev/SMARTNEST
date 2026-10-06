# Build and Run SmartNest Fullstack Container
FROM node:20-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy project source code
COPY . .

# Build frontend production assets
RUN npm run build

# Expose backend & frontend port
EXPOSE 5000

# Production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["npm", "start"]
