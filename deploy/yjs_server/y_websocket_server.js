const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');
const Y = require('yjs'); // Yjs 모듈을 가져옵니다.

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3333;

// 방 별로 Yjs 문서를 관리하기 위한 Map을 생성합니다.
const docs = new Map();

wss.on('connection', (ws, req) => {
  // URL에서 방 ID를 추출합니다.
  const roomId = new URL(req.url, `https://${req.headers.host}`).searchParams.get('roomId'); // roomId는 클라이언트가 접속할 때 URL의 쿼리 매개변수로 전달되는 방 ID
  console.log(req.url +"#######"+ req.headers.host)
  console.log(roomId)

  if (!roomId) {
    ws.close(1008, 'roomId query parameter is required');
    return;
  }

  // 해당 방 ID에 해당하는 Yjs 문서를 가져오거나 새로 생성합니다. docs는 방 ID와 Yjs 문서를 매핑하는 Map 객체
  if (!docs.has(roomId)) {  // roomId가 존재하면 true를 반환하고, 존재하지 않으면 false를 반환
    docs.set(roomId, new Y.Doc());
  }

  const ydoc = docs.get(roomId);

  setupWSConnection(ws, req, { doc: ydoc });
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
