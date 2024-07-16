import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import axios from 'axios';

const Home = () => {
  const inputRef = useRef();
  const roomIdRef = useRef();
  const navigate = useNavigate();
  const { setUsername, setRoomId } = useStore(({ setUsername, setRoomId }) => ({
    setUsername,
    setRoomId,
  }));
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    const value = inputRef.current?.value;

    if (!value) {
      alert('Please enter a username.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post('http://192.168.1.18:3334/create-room-with-user', {
        username: value,
      });
      setRoomId(data.roomId);
      setUsername(value);
      localStorage.setItem('username', value);
      localStorage.setItem('roomId', data.roomId);
      alert('Room created successfully.');
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const enterRoom = async () => {
    const value = inputRef.current?.value;
    const roomIdValue = roomIdRef.current?.value;

    if (!value || !roomIdValue) {
      alert('Please enter both username and room ID.');
      return;
    }

    setRoomId(roomIdValue);
    setUsername(value);
    localStorage.setItem('username', value);
    localStorage.setItem('roomId', roomIdValue);
    navigate(`/room/${roomIdValue}`);
  };

  return (
    <>
      <div>
        <input
          type="text"
          placeholder="Enter your name"
          ref={inputRef}
        />
        <button onClick={createRoom} disabled={loading}>
          {loading ? 'Loading...' : 'Create Room'}
        </button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Enter a room ID"
          ref={roomIdRef}
        />
        <button onClick={enterRoom}>
          Join Room
        </button>
      </div>
    </>
  );
};

export default Home;
