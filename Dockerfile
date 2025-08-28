FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY . .

RUN yarn

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]