import React from 'react';
import ChatRoom from './ChatRoom';
import RealTimeEditor from './RealTimeEditor';


const Room = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1>Chat and Code Editor</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <ChatRoom />
        </div>
        <div style={{ flex: 1 }}>
          <RealTimeEditor />
        </div>
      </div>
    </div>
  );
};

export default Room;
