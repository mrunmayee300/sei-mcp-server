# Use official Node.js image with Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies (cleaner and faster)
RUN npm ci

# Copy the rest of your code
COPY . .

# Build (optional: only if you have a build script)
# Comment out if no build step
# RUN npm run build

# Expose the correct port
EXPOSE 3001

# Start the app
CMD ["npm", "start"]
