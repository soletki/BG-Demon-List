# Use official Node.js base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json if you have them
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your server listens on (change if needed)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
