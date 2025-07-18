# Use official Node.js 20 image with Debian base for compatibility with sharp and onnxruntime-node
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install required dependencies for sharp and onnxruntime-node
RUN apt-get update && apt-get install -y \
  python3 \
  g++ \
  make \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port (change if needed)
EXPOSE 3005

# Start the server
CMD ["node", "index.js"]
