import React, { useState } from 'react';

const CreateRoomForm = ({ onRoomCreated }) => {
  const [roomTitle, setRoomTitle] = useState('');
  const [problemNo, setProblemNo] = useState('');
  const [problemTier, setProblemTier] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [maxPeople, setMaxPeople] = useState('');
  const [roomOwner, setRoomOwner] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const roomData = {
      room_title: roomTitle,
      problem_no: problemNo,
      problem_tier: problemTier,
      problem_title: problemTitle,
      max_people: maxPeople,
      room_owner: roomOwner
    };

  //     const enterRoom = async () => {
  //   const value = inputRef.current?.value;
  //   const roomIdValue = roomIdRef.current?.value;

  //   if (!value || !roomIdValue) {
  //     alert('Please enter both username and room ID.');
  //     return;
  //   }

  //   setRoomId(roomIdValue);
  //   setUsername(value);
  //   localStorage.setItem('username', value);
  //   localStorage.setItem('roomId', roomIdValue);
  //   navigate(`/room/${roomIdValue}`);
  // };

    try {
      const response = await fetch('http://localhost:3334/create-room-with-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      });

      const data = await response.json();
      console.log('Room created:', data);
      alert('Room created successfully!');
      onRoomCreated();
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room.');
    }
  };

  return (
    <div>
    <form onSubmit={handleSubmit}>
      <h2>Create a New Room</h2>
      <input
        type="text"
        value={roomTitle}
        onChange={(e) => setRoomTitle(e.target.value)}
        placeholder="Room Title"
        required
      />
      <input
        type="number"
        value={problemNo}
        onChange={(e) => setProblemNo(e.target.value)}
        placeholder="Problem Number"
        required
      />
      <input
        type="number"
        value={problemTier}
        onChange={(e) => setProblemTier(e.target.value)}
        placeholder="Problem Tier"
        required
      />
      <input
        type="text"
        value={problemTitle}
        onChange={(e) => setProblemTitle(e.target.value)}
        placeholder="Problem Title"
        required
      />
      <input
        type="number"
        value={maxPeople}
        onChange={(e) => setMaxPeople(e.target.value)}
        placeholder="Max People"
        required
      />
      <input
        type="text"
        value={roomOwner}
        onChange={(e) => setRoomOwner(e.target.value)}
        placeholder="Room Owner"
        required
      />
      <button type="submit">Create Room</button>
    </form>
    <button onClick={enterRoom}>
           Join Room
     </button>
     </div>
    

  );
};

export default CreateRoomForm;


// import React, { useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useStore } from '../store';
// import axios from 'axios';

// const Home = () => {
//   const inputRef = useRef();
//   const roomIdRef = useRef();
//   const navigate = useNavigate();
//   const { setUsername, setRoomId } = useStore(({ setUsername, setRoomId }) => ({
//     setUsername,
//     setRoomId,
//   }));
//   const [loading, setLoading] = useState(false);

//   const createRoom = async () => {
//     const value = inputRef.current?.value;

//     if (!value) {
//       alert('Please enter a username.');
//       return;
//     }

//     try {
//       setLoading(true);
//       const { data } = await axios.post('http://192.168.1.18:3334/create-room-with-user', {  // 'https://api.poke-code.com:3334/create-room-with-user'
//         username: value,
//       });
//       setRoomId(data.roomId);
//       setUsername(value);
//       localStorage.setItem('username', value);
//       localStorage.setItem('roomId', data.roomId);
//       alert('Room created successfully.');
//       navigate(`/room/${data.roomId}`);
//     } catch (error) {
//       console.error('Error creating room:', error);
//       alert('Failed to create room.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const enterRoom = async () => {
//     const value = inputRef.current?.value;
//     const roomIdValue = roomIdRef.current?.value;

//     if (!value || !roomIdValue) {
//       alert('Please enter both username and room ID.');
//       return;
//     }

//     setRoomId(roomIdValue);
//     setUsername(value);
//     localStorage.setItem('username', value);
//     localStorage.setItem('roomId', roomIdValue);
//     navigate(`/room/${roomIdValue}`);
//   };

//   return (
//     <>
//       <div>
//         <input
//           type="text"
//           placeholder="Enter your name"
//           ref={inputRef}
//         />
//         <button onClick={createRoom} disabled={loading}>
//           {loading ? 'Loading...' : 'Create Room'}
//         </button>
//       </div>
//       <div>
//         <input
//           type="text"
//           placeholder="Enter a room ID"
//           ref={roomIdRef}
//         />
//         <button onClick={enterRoom}>
//           Join Room
//         </button>
//       </div>
//     </>
//   );
// };

// export default Home;
