# Use official Deno base image
FROM denoland/deno:alpine-2.3.5

# Create working directory
WORKDIR /app

# Copy all files
COPY . .

# Run the WebDAV server
CMD ["run", "-A", "deno-cli-server.js"]
