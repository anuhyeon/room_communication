FROM node:22.3.0

WORKDIR /test_socket

COPY . .

COPY package*.json ./

RUN npm install

CMD ["node","socket.io_server"]