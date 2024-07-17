import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';


const ChatRoom = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const { username, roomId, setUsername, setRoomId } = useStore(({ username, roomId, setUsername, setRoomId }) => ({
    username,
    roomId,
    setUsername,
    setRoomId,
  }));
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    const savedRoomId = localStorage.getItem('roomId');

    if (savedUsername && savedRoomId) {
      setUsername(savedUsername);
      setRoomId(savedRoomId);
    }

    const socket = io('https://api.poke-code.com:3334', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Connected to socket, joining room ${savedRoomId || roomId}`);
      socket.emit('CONNECTED_TO_ROOM', { roomId: savedRoomId || roomId, username: savedUsername || username });
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected from socket, leaving room ${roomId}`);
    });

    socket.on('ROOM:CONNECTION', (users) => {
      console.log(`Users in room ${roomId}:`, users);
      setUsers(users);
    });

    socket.on('ROOM:MESSAGES', (messages) => {
      setMessages(messages);
    });

    socket.on('MESSAGE', (message) => {
      console.log(`Received message in room ${roomId}:`, message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      console.log(`Leaving room ${roomId}`);
      //socket.emit('DISCONNECT_FROM_ROOM', { roomId, username });
      socket.off();
    };
  }, []); // oomId, username, setUsername, setRoomId

  const sendMessage = () => {
    if (message.trim() !== '') {
      const socket = socketRef.current;
      console.log(`Sending message: ${message}`);
      socket.emit('SEND_MESSAGE', { roomId, username, message });
      setMessage('');
    }
  };

  const leaveRoom = () => { 
    const socket = socketRef.current;
    console.log(`Leaving room ${roomId}`);
    socket.emit('DISCONNECT_FROM_ROOM', { roomId, username }); // 서버한테도 유저정보를 지워달라고 요청
    socket.off();
    setUsers([]);
    setMessages([]);
    setMessage('');
    setRoomId('');
    setUsername('');
    localStorage.removeItem('username');
    localStorage.removeItem('roomId');
    navigate('/');
  };

  return (
    <>
      <h2>너의 이름은 {username}</h2>
      <h2>방 ID: {roomId}</h2>
      <h2>방에 접속중인 사람 개수: <b>{users.length}</b></h2>
      <button onClick={leaveRoom}>나가기</button>
      <div>
        <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid black' }}>
          {messages.map((msg, index) => (
            <div key={index}>
              <strong>{msg.username}: </strong>{msg.message}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>보내기</button>
      </div>
    </>
  );
};

export default ChatRoom;
