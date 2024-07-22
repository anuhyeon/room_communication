import React, { useState,  useEffect  } from 'react';
import axios from 'axios';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '../store';

const VoiceChat = () => {
  const [sessionId, setSessionId] = useState('');
  const [token, setToken] = useState('');
  const [session, setSession] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const { username, roomId } = useStore(({ username, roomId }) => ({
    username,
    roomId,
  }));


  // 알고 갈 것
  // session과 sessionId는 서로 다른 개념
  // sessionId는 세션의 고유한 식별자(아이디)이고, session은 OpenVidu 세션 객체이다.
  // OpenVidu에서 스트림은 퍼블리셔가 생성하고 세션에 전송하는 데이터이며, 서브스크라이버가 이를 수신하여 재생한다.

  const createSession = async () => { // 하나의 방을 만드는거랑 같다고 보면됨 해당 세션으로 접속한 사람들끼리만 음성채팅 가는
    try {
      const response = await axios.post('https://api.poke-code.com:1235/api/sessions', { customSessionId: roomId }); // 세션 아이디를 서버로 부터 발급받음 
      console.log('####################',response.data);
      setSessionId(response.data);
      console.log('Session created with ID: ', response.data);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const joinSession = async () => {
    try {
      const response = await axios.post(`https://api.poke-code.com:1235/api/sessions/${sessionId}/connections`, {}); // 해당 sessionId를 가지고 openvidu서버에 해당 세션이 존재하면 토큰 발급받음
      setToken(response.data);
      console.log('Token received: ', response.data);
      //console.log('Token received: ', token);

      const OV = new OpenVidu();
      const session = OV.initSession();
      setSession(session);

      session.on('streamCreated', (event) => { // event.stream은 구독할 스트림 객체 -> stremCreated이벤트에 의해 전달
        const subscriber = session.subscribe(event.stream, 'audio-container'); // 생성된 스트림을 구독하고 해당 스트림을 특정 HTML태그에 연결(audio-container'는 스트림을 재생할 HTML 요소의 ID로 OpenVidu는 이 요소에 비디오 또는 오디오 스트림을 삽입하여 재생한다.)
        // const subscriber는 구독된 스트림을 나타내는 구독자(subscriber) 객체로, 이 객체는 구독된 스트림을 관리하고 제어하는 데 사용
        console.log('Subscriber added:', subscriber);
      });

      await session.connect(response.data, { clientData: 'User' }); // 해당 토큰을 가지고 openvidu 세션에 연결 

      const publisher = OV.initPublisher('audio-container', {
        audioSource:  true,
        videoSource: false,
        publishAudio: !isMuted,  // 초기화할 때 isMuted 상태와 동기화
        publishVideo: false,
        //resolution: '640x480',
        //frameRate: 30,
        //insertMode: 'APPEND',
      });

      session.publish(publisher);
      setPublisher(publisher);
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const toggleMute = () => {
    if (publisher) {
      const newMuteState = !isMuted;
      publisher.publishAudio(!newMuteState);
      setIsMuted(newMuteState);
    }
  };

  return (
    <div className="App">
      <h1>OpenVidu React Client</h1>
      <button onClick={createSession}>Create Session</button>
      {/* <input
        type="text"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        placeholder="Session ID"
      /> */}
      <button onClick={joinSession}>음성채팅 참여하기</button>
      <div id="audio-container"></div>
      {publisher && (
        <button onClick={toggleMute}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      )}
    </div>
  );
};

export default VoiceChat;
