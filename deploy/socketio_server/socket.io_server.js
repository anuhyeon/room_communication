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
const moment = require('moment');
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

const pool = mysql.createPool({ // createconnection을 사용하는 것보다 createpool을 사용해서 DB를 제어하는게 더 효율적
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// pool.connect((err) => { // createconnection을 사용했을 경우, mysql2/promise 모듈을 사용하여 연결을 체크하고 싶은 경우, pool.connect 메서드가 없으므로 getConnection 메서드를 사용해야함!!
//   if (err) console.log(err);
//   else console.log('Connected to the mysql database');
// });

async function checkConnection() {
  let connection = null;
  try {
    connection = await pool.getConnection();
    console.log('Connected to the MySQL database');
  } catch (err) {
    console.error('Error connecting to the MySQL database:', err);
  } finally {
    if (connection) {
      connection.release(); // 연결을 풀에 반환
    }
  }
}
checkConnection(); // DB 연결 체크
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send({ msg: 'hi' });
});

app.get('/roomlist', async (req, res) => {
  let connection = null;
  try {
    // 페이지 네이션을 진행후 전송
    const page = parseInt(req.query.page) || 1; // 요청된 페이지 번호, 기본값은 1
    const itemsPerPage = 10; // 페이지당 항목 수
    const offset = (page - 1) * itemsPerPage; // OFFSET 계산 ,반환할 행의 시작지점 -> 3 페이지면 순서 20부터 나와야함.

    connection = await pool.getConnection();
    // 총 항목 수 조회 onnection.query('SELECT COUNT(*) AS totalItems FROM review')의 결과는 이중 배열 형식으로 반환
    // 첫 번째 대괄호 쌍은 결과의 첫 번째 요소를 추출. 이 요소는 배열, 두 번째 대괄호 쌍은 그 배열의 첫 번째 요소를 추출. 이 요소는 객체
    const [[{ totalItems }]] = await connection.query('SELECT COUNT(*) AS totalItems FROM review'); // COUNT(*)는 review 테이블의 모든 행(row) 수를 계산, AS totalItems는 결과에 대한 별칭(alias)을 지정하여, 결과가 totalItems라는 이름으로 접근할 수 있게 함
    // 특정 페이지의 항목 조회
    const [rows] = await connection.query('SELECT * FROM review LIMIT ? OFFSET ?', [itemsPerPage, offset]); // LIMIT ?:반환할 최대 행(row) 수를 지정  OFFSET ?: 반환할 행(row)의 시작 지점을 지정
    // 총 페이지 수 계산
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    // 클라이언트에 페이지네이션 정보와 데이터 응답
    res.status(200).json({
      currentPage: page, // 현재 페이지
      totalPages,  // 전체 페이지수
      itemsPerPage, // 페이지당 항목수 : 10
      totalItems, // 전체 방 수(총 항목수)
      rooms: rows, // 특정페이지의 항목 10개 -> 이걸 roomlist에 뿌리면됨.
    });
  } catch (err) {
    console.error('roomlist 에러임 ', err);
    res.status(500).json({ message: '방 목록을 불러오는 데 실패했습니다.' });
  } finally {
    if (connection) {
      connection.release(); // 연결을 풀에 반환
    }
  }
});

app.post('/max-people-check',async (req,res) => {
  let connection = null;
  const {room_id} = req.body;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT COUNT(*) as count FROM reviewer WHERE room_id = ?", [room_id]);
    console.log(rows);  // 확인용 로그
    const count = rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error('Error 쿼리 에러:', error);
    res.status(500).json({ error: '서버에라ㅓ' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


app.post('/create-room-with-user', async (req, res) => {
  let connection = null;
  const {
    room_title,
    problem_no,
    problem_tier,
    problem_title,
    max_people,
    room_owner
  } = req.body; // 본문에서 username 필드를 추출
  const room_id = uuidv4(); // v4()함수를 사용하여 새로운 UUID를 생성 -> UUID는 새로운 방의 고유 식별자로 사용됨.
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();// insert delete update

    const createTime = moment().format('YYYY-MM-DD HH:mm:ss');

    await connection.query('INSERT INTO review (room_id, room_title, problem_no, problem_tier, problem_title, max_people, room_owner, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [room_id, // 서버에서 만든 데이터
        room_title,
        problem_no,
        problem_tier,
        problem_title,
        max_people,
        room_owner,
        createTime // 서버에서 만든 데이터
      ]);  // 데이터베이스의 review 테이블에 (room_id, room_owner, create_time =>  삽입할 데이터의 열(컬럼) 이름) ? ? ? 이 물음표자리에는 각각  [roomId, username, createTime] 해당 값이 들어감

    // 현재 방
    await connection.commit();
    res.status(201).json({
      room_id: room_id,
      create_time: createTime,
      message: '방 생성 완료 힛릿힛ㅇ >< '
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error('방생성 실패함:', err);
    //await connection.rollback();
    res.status(500).json({ message: '방 생성 실패' });
  } finally {
    if (connection) {
      await connection.release(); // 연결을 풀에 반환
    }
  }
});

io.on('connection', (socket) => {
  // 채팅 소켓 통신
  console.log('New client connected:' + socket.id);
  // 여기서 username은 nick_name이다!
  // 클라이언트가 특정 방에 연결되었을 때 발생하는 일련의 작업을 처리하는 코드이다.
  socket.on('CONNECTED_TO_ROOM', async ({ room_id, nick_name, bakjoon_id, cur_poke_id}) => {
    let connection = null;
    console.log("+_+_+_+_방에 들어옴+_+_+-->", room_id, nick_name, bakjoon_id, cur_poke_id)
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      await connection.query('INSERT INTO reviewer (room_id, bakjoon_id, nick_name, socket_id, cur_poke_id ) VALUES (?,?,?,?,?)', [room_id, bakjoon_id, nick_name, socket.id, cur_poke_id]);
      //const [users] = await connection.query('SELECT nick_name, cur_poke_id FROM reviewer WHERE room_id = ?', [room_id]); // 현재 해당 방에 참여한 클라이언트들의 정보 가져옴, 채팅방에서 user정보를 표현할 것은 nick_name이기때문에 nick_name 가져옴
      const [users] = await connection.query(` SELECT * FROM reviewer a 
        LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id = b.bakjoon_id
        LEFT OUTER JOIN poketmon c ON a.cur_poke_id = c.idx
        WHERE a.room_id = ?`, [room_id]);

      const roomName = `ROOM:${room_id}`;
      console.log(users);

      // 모든 exp 정보를 100으로 나눠서 처리 GPT게이
      const processedUsers = users.map(user => ({
        ...user,
        math_exp: Math.floor(user.math_exp / 100),
        impl_exp: Math.floor(user.impl_exp / 100),
        dp_exp: Math.floor(user.dp_exp / 100),
        data_exp: Math.floor(user.data_exp / 100),
        graph_exp: Math.floor(user.graph_exp / 100)
      }));


      socket.join(roomName); // 현재 소켓(클라이언트)를 roomName이라는 방에 추가 -> socket.io에서 방(room)을 사용하면 특정 그룹의 클라이언트에게만 이벤트를 보낼 수있음!
      io.in(roomName).emit('ROOM:CONNECTION', processedUsers); // 해당 방(roomName)에 있는 모든 클라이언트에게 ROOM:CONNECTION 이벤트를 발생시키고, users 데이터를 보냄
      await connection.commit();// connection.release()는 호출되지만, 트랜잭션이 중단되지 않고 커밋되지 않아서 데이터베이스 상태가 원치 않는 상태로 남아있었던 것!
      const [messages] = await connection.query('SELECT nick_name, message, timestamp FROM chat WHERE room_id = ?', [room_id]);
      socket.emit('ROOM:MESSAGES', messages);
      console.log(`${nick_name} joined room ${room_id}`);
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Error connecting to room:', err);
      //await connection.rollback();
    } finally {
      await connection.release();
    }
  });

  // 사용자가 메시지를 전송할 때 해당 방에 있는 모든 사용자에게 메시지를 브로드캐스트
  socket.on('SEND_MESSAGE', async ({ room_id, nick_name, message }) => {
    let connection = null;
    try {
      const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
      connection = await pool.getConnection();
      await connection.beginTransaction();
      await connection.query('INSERT INTO chat (room_id, nick_name, message, timestamp) VALUES (?, ?, ?, ?)', [room_id, nick_name, message, timestamp]);
      const messageData = { nick_name, message, timestamp };
      const roomName = `ROOM:${room_id}`;
      await connection.commit();
      io.in(roomName).emit('MESSAGE', messageData);
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Error SEND_MESSAGE~!!:', err);
      //await connection.rollback();
    } finally {
      if (connection) {
        await connection.release(); // 연결을 풀에 반환
      }
    }
  });
 // 사용자 강퇴 기능
  socket.on('FORCE_OUT', async ({ room_id, nick_name }) => {
    console.log("덕기짱이 강퇴하면서 보낸 정보들: ",room_id,nick_name);
    let connection = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      // room_id와 nick_name을 기반으로 강퇴 시킬 유저의 socket_id 추출
      const [[{forced_out_socketId}]] = await connection.query('SELECT socket_id FROM reviewer WHERE room_id = ? AND nick_name = ?', [room_id, nick_name]);
      console.error('Error - 강제퇴장 :',forced_out_socketId);
      // 리뷰어 목록에서 강퇴자 삭제
      await connection.query('DELETE FROM reviewer WHERE room_id = ? AND nick_name = ?', [room_id, nick_name]);
      // 강퇴후 방에 남아있는 유저 목록 추출
      //const [users] = await connection.query('SELECT nick_name, cur_poke_id FROM reviewer WHERE room_id = ?', [room_id]);
      //const [users] = await connection.query(` SELECT * FROM reviewer a LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id = b.bakjoon_id WHERE a.room_id = ?`, [room_id]);
      const [users] = await connection.query(` SELECT * FROM reviewer a 
        LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id = b.bakjoon_id
        LEFT OUTER JOIN poketmon c ON a.cur_poke_id = c.idx
        WHERE a.room_id = ?`, [room_id]);
      await connection.commit();

      // 모든 exp 정보를 100으로 나눠서 처리 GPT게이
      const processedUsers = users.map(user => ({
        ...user,
        math_exp: Math.floor(user.math_exp / 100),
        impl_exp: Math.floor(user.impl_exp / 100),
        dp_exp: Math.floor(user.dp_exp / 100),
        data_exp: Math.floor(user.data_exp / 100),
        graph_exp: Math.floor(user.graph_exp / 100)
      }));

      // 방에서 나간 후 갱신된 방 참여자목록을 모든 클라이언트에게 전달
      const roomName = `ROOM:${room_id}`;
      io.in(roomName).emit('ROOM:CONNECTION', processedUsers);

      // 강퇴 당한 유저에게 강퇴되었음을 알리고 연결 끊기
      io.to(forced_out_socketId).emit('USER:FORCED_OUT'); // 클라이언트 단에서 넣어줄것
      io.sockets.sockets.get(forced_out_socketId)?.disconnect(); // io는 Socket.IO 서버 인스턴스 -> io.sockets는 현재 연결된 모든 소켓의 컬렉션을 포함하는 객체 -> io.sockets.sockets는 각 개별 소켓 인스턴스를 socket.id를 키로 가지는 맵객체
     
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      //console.error('Error - 강제퇴장 :', err);
      await connection.rollback();
    } finally {
      if (connection) {
        await connection.release(); // 연결을 풀에 반환
      }
    }
  });


  // 사용자가 방에서 나갈 때 DB에서 사용자 정보를 제거하고, 방에 있는 모든 사용자에게 업데이트된 사용자 목록을 브로드캐스트 
  socket.on('DISCONNECT_FROM_ROOM', async ({ room_id, nick_name }) => {
    let connection = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      await connection.query('DELETE FROM reviewer WHERE room_id = ? AND nick_name = ?', [room_id, nick_name]);
      
      //const [users] = await connection.query('SELECT nick_name, cur_poke_id FROM reviewer WHERE room_id = ?', [room_id]); //reviewer 테이블에서 특정 room_id에 속하는 모든 사용자의 nick_name 을 가져옴. -> 삭제된 이후 다시 조회해서 클라이언트들에게 뿌려줌.
      //const [users] = await connection.query(` SELECT * FROM reviewer a LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id = b.bakjoon_id WHERE a.room_id = ?`, [room_id]);
      const [users] = await connection.query(` SELECT * FROM reviewer a 
        LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id = b.bakjoon_id
        LEFT OUTER JOIN poketmon c ON a.cur_poke_id = c.idx
        WHERE a.room_id = ?`, [room_id]);
      // 해당 방에 참여자가 아무도 없을 경우 방 폭파
      if (users.length === 0) {
        // 해당 방의 대화 내용도 삭제 -> chat 테이블의 room_id가 review의 room_id 를 외래키로 가지고 있기 때문에 해당 room_id 를 사용하고 있는 자식 테이블을 의 room_id 데이터들을 먼저 지운 후 review테이블에서 방 삭제 가능
        await connection.query('DELETE FROM chat WHERE room_id = ?', [room_id])
        await connection.query('DELETE FROM review WHERE room_id = ?', [room_id]);
        
      }

      // 모든 exp 정보를 100으로 나눠서 처리 GPT게이
      const processedUsers = users.map(user => ({
        ...user,
        math_exp: Math.floor(user.math_exp / 100),
        impl_exp: Math.floor(user.impl_exp / 100),
        dp_exp: Math.floor(user.dp_exp / 100),
        data_exp: Math.floor(user.data_exp / 100),
        graph_exp: Math.floor(user.graph_exp / 100)
      }));



      const roomName = `ROOM:${room_id}`;
      socket.leave(roomName);
      io.in(roomName).emit('ROOM:CONNECTION', processedUsers);
      await connection.commit();
      console.log(`${nick_name} left room ${room_id}`);
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Error disconnecting from room:', err);
      //await connection.rollback();
    } finally {
      if (connection) {
        await connection.release(); // 연결을 풀에 반환
      }
    }
  });

  // 사용자가 연결을 끊을 때 Redis에서 사용자 정보를 제거하고, 방에 있는 모든 사용자에게 업데이트된 사용자 목록을 브로드캐스트
  socket.on('disconnect', async () => {
    let connection = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [rows] = await connection.query('SELECT room_id, nick_name FROM reviewer WHERE socket_id = ?', [socket.id]); // socket.id를 통해서 room_id와 nick_name을 추출
      if (rows.length > 0) {
        const { room_id, nick_name } = rows[0];
        await connection.query('DELETE FROM reviewer WHERE room_id = ? AND nick_name = ?', [room_id, nick_name]);
        //socket.leave(roomName); -> disconnect 이벤트는 서버가 직접 소켓연결을 끊어주는 것이아니라 네트워크 문제나 새로고침으로 알아서 끊기기 때문에 이 코드는 작성할 필요X
        //const [users] = await connection.query('SELECT nick_name, cur_poke_id FROM reviewer WHERE room_id = ?', [room_id]);
        //const [users] = await connection.query(` SELECT * FROM reviewer a LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id = b.bakjoon_id WHERE a.room_id = ?`, [room_id]);
        const [users] = await connection.query(` SELECT * FROM reviewer a 
          LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id = b.bakjoon_id
          LEFT OUTER JOIN poketmon c ON a.cur_poke_id = c.idx
          WHERE a.room_id = ?`, [room_id]);
        // 해당 방에 참여자가 아무도 없을 경우 방 폭파
        if (users.length === 0) {  
          await connection.query('DELETE FROM chat WHERE room_id = ?', [room_id])
          await connection.query('DELETE FROM review WHERE room_id = ?', [room_id]); // 리뷰 테이블의 해당 방 레코드 제거
        }

          // 모든 exp 정보를 100으로 나눠서 처리 GPT게이
        const processedUsers = users.map(user => ({
          ...user,
          math_exp: Math.floor(user.math_exp / 100),
          impl_exp: Math.floor(user.impl_exp / 100),
          dp_exp: Math.floor(user.dp_exp / 100),
          data_exp: Math.floor(user.data_exp / 100),
          graph_exp: Math.floor(user.graph_exp / 100)
        }));

        const roomName = `ROOM:${room_id}`;
        io.in(roomName).emit('ROOM:CONNECTION', processedUsers); // 리뷰어 나간 후 갱신된 방 참여자목록을.
        console.log(`${nick_name} disconnected from room ${room_id}`);
      }

      await connection.commit();
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Error handling socket disconnect:', err);
      //await connection.rollback();
    } finally {
      if (connection) {
        await connection.release(); // 연결을 풀에 반환
      }
    }

  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});