# Use the official Node.js image.
FROM node:18

# Create and set the working directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the root directory.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy all folders except for other microservices.
COPY . .

# Remove directories of other microservices to avoid conflicts.
RUN rm -rf /usr/src/app/apps/auth /usr/src/app/apps/orders /usr/src/app/apps/ecommerce-app

# Build the project.
RUN npm run build products

# Expose the port the app runs on.
EXPOSE 3001

# Command to run the app.
CMD ["npm", "run", "start", "products"]
