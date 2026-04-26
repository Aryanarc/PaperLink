# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app/frontend

COPY package*.json ./ 

RUN npm install

COPY /. .

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose port 80 for the Nginx server
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
