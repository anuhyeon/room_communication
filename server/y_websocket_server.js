const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils'); // Yjs의 y-websocket 유틸리티 함수로, Yjs 문서의 WebSocket 연결을 설정
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server}); // WebSocket 서버를 독립적으로 생성하지 않고, HTTP 서버와 연결하기 위해 설정, 이는 HTTP 서버에서 WebSocket 업그레이드 요청을 처리할 수 있도록함
PORT = 3333;


wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
});

server.listen(PORT, () => {
    console.log(PORT)
    console.log(`Server running on port:3333`);
});
