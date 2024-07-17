const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const PORT = 3334;
const { createClient } = require('redis');
const moment = require('moment');

app.use(cors());
app.use(bodyParser.json());

const client = createClient();
client.on('error', console.error);
client
  .connect()
  .then(() => console.log('Connected to redis ly!'))
  .catch(() => {
    console.error('Error connecting to redis');
  });

app.get('/', (req, res) => {
  res.send({ msg: 'hi' });
});

app.post('/create-room-with-user', async (req, res) => {
  const { username } = req.body; // 본문에서 username 필드를 추출
  console.log(username);
  const roomId = uuidv4(); // v4()함수를 사용하여 새로운 UUID를 생성 -> UUID는 새로운 방의 고유 식별자로 사용됨.
  // 아래는 나중에 mysql로 바꿔야함.
  await client
    .hSet(`${roomId}:info`, {
      // Redis클라이언트('client')를 사용하여 방 정보를 Redis에 저장 , 여기서는 hset명령어를 사용하여 Hash자료구조로 데이터를 설정,Redis 키: ${roomId}:info는 Redis에서 해시 데이터를 저장할 키로, 방의 정보를 저장하는데 사용
      created: moment().format(), // 방의 생성 시간
      updated: moment().format(), // 방의 갱신 시간 저장 -> moment()를 사용하여 현재 시간을 설정
    })
    .catch((err) => {
      console.error(1, err);
    });
  await client
    .hSet(`${username}:info`, {
      username: username,
    })
    .catch((err) => {
      console.error(1, err);
    });
  res.status(201).json({ roomId, message: '방 생성 완료 힛릿힛ㅇ >< ' });
});

io.on('connection', (socket) => {
  // 채팅 소켓 통신
  console.log('New client connected:'+ socket.id);

  // socket.on('joinRoom', ({ roomId, username }) => {
  //   socket.join(roomId);
  //   socket.to(roomId).emit('userJoined', { username, socketId: socket.id, isMuted: false });
  // });

  // socket.on('toggleMute', ({ roomId, username, isMuted }) => {
  //   io.in(roomId).emit('userMuteChanged', { username, isMuted });
  // });

  // socket.on('leaveRoom', ({ roomId, username }) => {
  //   socket.leave(roomId);
  //   io.in(roomId).emit('userLeft', { username });
  // });

  // 사용자가 방에서 나갈 때 Redis에서 사용자 정보를 제거하고, 방에 있는 모든 사용자에게 업데이트된 사용자 목록을 브로드캐스트 
  socket.on('DISCONNECT_FROM_ROOM', async ({ roomId, username }) => { // 사용자가 방나가기 버튼을 눌렀을때
    try {
      console.log(`############# DISCONNECT_FROM_ROOM: roomId=${roomId}, username=${username}`);
      // roomId와 username이 문자열인지 확인
      if (typeof roomId !== 'string' || typeof username !== 'string') {
        throw new Error('Invalid roomId or username');
      }
      await client.lRem(`${roomId}:users`, 1, username);
      await client.del(socket.id);
      const users = await client.lRange(`${roomId}:users`, 0, -1);
      const roomName = `ROOM:${roomId}`;
      socket.leave(roomName);
      io.in(roomName).emit('ROOM:CONNECTION', users);
      console.log(`${username} left room ${roomId}`);
    } catch (err) {
      console.error('Error disconnecting from room:', err);
    }
  });

  // 클라이언트가 특정 방에 연결되었을 때 발생하는 일련의 작업을 처리하는 코드이다.
  socket.on('CONNECTED_TO_ROOM', async ({ roomId, username }) => {
    try {
      await client.lPush(`${roomId}:users`, `${username}`);
      await client.hSet(socket.id, { roomId, username });
      const users = await client.lRange(`${roomId}:users`, 0, -1);
      const roomName = `ROOM:${roomId}`;
      socket.join(roomName);
      io.in(roomName).emit('ROOM:CONNECTION', users);

      // 이전 메시지 불러오기
      const messages = await client.lRange(`${roomId}:messages`, 0, -1);
      const parsedMessages = messages.map(msg => JSON.parse(msg));
      //console.log(parsedMessages);
      socket.emit('ROOM:MESSAGES', parsedMessages); // 클라이언트에게 이전 메시지를 전송

      console.log(`${username} joined room ${roomId}`);
    } catch (err) {
      console.error('error connecting to room');
    }
  });

  // 사용자가 메시지를 전송할 때 해당 방에 있는 모든 사용자에게 메시지를 브로드캐스트
  socket.on('SEND_MESSAGE', async ({ roomId, username, message }) => {
    const roomName = `ROOM:${roomId}`;
    const messageData = { username, message, timestamp: moment().format() };
    await client.rPush(`${roomId}:messages`, JSON.stringify(messageData));
    io.in(roomName).emit('MESSAGE', messageData);
  });

  // 사용자가 연결을 끊을 때 Redis에서 사용자 정보를 제거하고, 방에 있는 모든 사용자에게 업데이트된 사용자 목록을 브로드캐스트
  socket.on('disconnect', async () => { // 새로고침이나 네트워크 연결문제로 끊겼을때 -> 사용자 정보 제거, 왜냐면 네트웤크가 끊겨서 방나갔다고 정보를 그대로 DB에 저장하몀 그 방에 안들어오면 계쏙 DB차지하니깐 안됨.
    try {
      const socketData = await client.hGetAll(socket.id);
      if (socketData.roomId && socketData.username) {
        const { roomId, username } = socketData;
        await client.lRem(`${roomId}:users`, 1, username);
        await client.del(socket.id);
        const users = await client.lRange(`${roomId}:users`, 0, -1);
        const roomName = `ROOM:${roomId}`;
        io.in(roomName).emit('ROOM:CONNECTION', users);
        console.log(`${username} disconnected from room ${roomId}`);
      }
    } catch (err) {
      console.error('Error handling socket disconnect:', err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
