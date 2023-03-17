# Build stage
FROM node:18 AS build

WORKDIR /src/usr/app

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node", "index.js" ]