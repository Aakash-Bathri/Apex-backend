# Backend Dockerfile for Apex
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy applicatio source
COPY . .

# Expose backend port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
