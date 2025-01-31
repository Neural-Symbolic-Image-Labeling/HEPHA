FROM node:19-alpine3.15

RUN mkdir -p /app/backend
WORKDIR /app/backend

COPY . /app/backend

RUN npm install

CMD ["npm", "start"]

