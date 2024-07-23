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
  );
};

export default CreateRoomForm;
