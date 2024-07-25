# Use the official Node.js image as the base image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the gateway code to the container
COPY . .

# Build the application
RUN npm run build 

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "dist/apps/ecommerce-app/main"]
