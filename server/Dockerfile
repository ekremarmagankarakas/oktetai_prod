# Step 1: Use Node.js base image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application files
COPY . .

# Step 6: Expose the port used by the server
EXPOSE 3000

# Step 7: Command to start the application
CMD ["npm", "start"]

