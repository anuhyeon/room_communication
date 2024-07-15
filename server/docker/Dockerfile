FROM node:22.3.0

WORKDIR /test_editor

COPY . .

COPY package*.json ./

RUN npm install

CMD ["node","y_websocket_server"]