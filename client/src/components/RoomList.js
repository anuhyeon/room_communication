import React, { useState, useEffect } from 'react';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRooms(currentPage);
  }, [currentPage]);

  const loadRooms = async (page) => {
    try {
      const response = await fetch(`http://localhost:3334/roomlist?page=${page}`);
      const data = await response.json();

      setRooms(data.rooms);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <h1>Room List</h1>
      <ul>
        {rooms.map((room) => (
          <li key={room.room_id}>
            {room.room_title} (Owner: {room.room_owner}, Created: {room.create_time})
          </li>
        ))}
      </ul>
      <div>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(index + 1)}
            disabled={index + 1 === currentPage}
          >
            Page {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomList;
