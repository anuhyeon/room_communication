import React from 'react';
import ChatRoom from './ChatRoom';
import RealTimeEditor from './RealTimeEditor';


const Room = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1>공유 에디터 협업 콜라보 레이팅 플레이스</h1>
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
