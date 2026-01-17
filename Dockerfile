# Backend Dockerfile for Apex
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose backend port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
