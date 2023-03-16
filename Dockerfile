# Build stage
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Runtime stage
FROM node:18-alpine
WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package*.json /app/
COPY --from=build /app/index.js /app/

# Remove the entrypoint from the base image
ENTRYPOINT []

CMD [ "node", "index.js" ]
