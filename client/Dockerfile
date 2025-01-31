FROM node:19-alpine3.15

RUN mkdir -p /app/client
WORKDIR /app/client

COPY . /app/client

RUN npm install

CMD ["npm", "run", "dev"]