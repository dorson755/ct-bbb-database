# Use Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all project files
COPY . .

# Build the frontend
RUN npm run build --prefix client

# Expose port 5000 for backend
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
