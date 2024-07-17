import React, { useState,  useEffect, useRef  } from 'react';
import axios from 'axios';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '../store';
//import io from 'socket.io-client';

const SERVER_URL = 'https://api.poke-code.com:1235';
//const SOCKETIO_SERVER_URL = 'http://192.168.1.18:3334'

const VoiceChat = () => {
  const [sessionId, setSessionId] = useState('');
  const [token, setToken] = useState('');
  const [session, setSession] = useState(null);
  const [publisher, setPublisher] = useState(null);
  //const [subscribers, setSubscribers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [users, setUsers] = useState([]); // setSubscriber 대신 사용
  const [isJoined, setIsJoined] = useState(false); // 추가된 상태 음성 참가하기 여러번 join 중복 못하게


  const { username, roomId } = useStore(({ username, roomId }) => ({
    username,
    roomId,
  }));

  //const socketRef = useRef(null);

  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await axios.post(`${SERVER_URL}/api/sessions`, { customSessionId: roomId });
        console.log('Session created with ID: ', response.data);
        setSessionId(response.data);
      } catch (error) {
        console.error('Error creating session:', error);
      }
    };
    if (roomId) {
        createSession();
    }
  }, [roomId]);
//--------아래는 음성채팅 사용자 정보 및 음성채팅 mute 정보 동가화 로직----------//
//   useEffect(() => {
//     socketRef.current = io(SOCKETIO_SERVER_URL);
//     const socket = socketRef.current;

//     socket.emit('joinRoom', { roomId, username });

//     socket.on('userJoined', (user) => {
//         setUsers((prevUsers) => [...prevUsers, user]);
//     });

//     socket.on('userMuteChanged', (user) => {
//         setUsers((prevUsers) =>
//             prevUsers.map((u) => (u.username === user.username ? { ...u, isMuted: user.isMuted } : u))
//         );
//     });

//     socket.on('userLeft', (user) => {
//         setUsers((prevUsers) => prevUsers.filter((u) => u.username !== user.username));
//     });

//     return () => {
//         socket.emit('leaveRoom', { roomId, username });
//         socket.disconnect();
//     };
// }, [roomId, username]);
  //---------------------------------------------------------//
  // 알고 갈 것
  // session과 sessionId는 서로 다른 개념
  // sessionId는 세션의 고유한 식별자(아이디)이고, session은 OpenVidu 세션 객체이다.
  // OpenVidu에서 스트림은 퍼블리셔가 생성하고 세션에 전송하는 데이터이며, 서브스크라이버가 이를 수신하여 재생한다.

//   const createSession = async () => { // 하나의 방을 만드는거랑 같다고 보면됨 해당 세션으로 접속한 사람들끼리만 음성채팅 가는
//     try {
//       const response = await axios.post(`${SERVER_URL}/api/sessions`, { customSessionId: roomId }); // 세션 아이디를 서버로 부터 발급받음
//       console.log('####################',response.data);
//       setSessionId(response.data); // sessionId = response.data
//       console.log('Session created with ID: ', response.data);
//       //return sessionId;
//     } catch (error) {
//       console.error('Error creating session:', error);
//     }
//   };

  const joinSession = async () => {
    if (isJoined) {
        console.log('이미 세션에 참가중입니다.');
        return;
      }

    try {
      const response = await axios.post(`${SERVER_URL}/api/sessions/${sessionId}/connections`, {}); // 해당 sessionId를 가지고 openvidu서버에 해당 세션이 존재하면 토큰 발급받음
      setToken(response.data);
      console.log('Token received: ', response.data);
      //console.log('Token received: ', token);

      const OV = new OpenVidu();
      const newSession = OV.initSession();
      setSession(newSession);

      newSession.on('streamCreated', (event) => { // event.stream은 구독할 스트림 객체 -> stremCreated이벤트에 의해 전달
        const subscriber = newSession.subscribe(event.stream, 'audio-container'); // 생성된 스트림을 구독하고 해당 스트림을 특정 HTML태그에 연결(audio-container'는 스트림을 재생할 HTML 요소의 ID로 OpenVidu는 이 요소에 비디오 또는 오디오 스트림을 삽입하여 재생한다.)
        // const subscriber는 구독된 스트림을 나타내는 구독자(subscriber) 객체로, 이 객체는 구독된 스트림을 관리하고 제어하는 데 사용
        // 아래는 기존 subscriber 배열에 새로운 요소 추가하는 함수라고 보면됨.
        //setSubscribers((prevSubscribers) => [...prevSubscribers, subscriber]); // 여기서는 함수형 업데이트를 사용 -> 이전 상태 값(prevSubscribers)을 인자로 받아 새로운 상태 값을 반환하는 함수를 전달. 이는 상태가 비동기적으로 업데이트될 때 유용
        //  스프레드 연산자(...)를 사용하여 이전 상태 값인 prevSubscribers 배열을 복사하고, 그 뒤에 새로운 subscriber 객체를 추가 -> prevSubscribers는 이전에 구독된 모든 스트림을 포함하는 배열로 이전에 구독된 모든 스트림과 새로 구독된 스트림을 포함하는 새로운 배열

        setUsers((prevUsers) => [ // setsubscriber 대신에 setUsers를 사용!
            ...prevUsers,
            { username: JSON.parse(event.stream.connection.data).clientData, socketId: event.stream.connection.connectionId, isMuted: false }
        ]);

        console.log('Subscriber added:', subscriber);
      });
      // token = response.data
      console.log('111111',response.data)
      console.log('22222',token)
      await newSession.connect(response.data, { clientData: username }); // 해당 토큰을 가지고 openvidu 세션에 연결 

      const newPublisher = OV.initPublisher('audio-container', {
        audioSource:  true,
        videoSource: false,
        publishAudio: !isMuted,  // 초기화할 때 isMuted 상태와 동기화
        publishVideo: false,
        //resolution: '640x480',
        //frameRate: 30,
        //insertMode: 'APPEND',
      });

      newSession.publish(newPublisher);
      setPublisher(newPublisher);
      setIsJoined(true); // 세션에 성공적으로 참가했음을 표시
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
      setSession(null);
      setPublisher(null);
      //setSubscribers([]);
      setUsers((prevUsers) => prevUsers.filter((u) => u.username !== username));
      setIsMuted(false);
      //setIsJoined(false); // 세션을 떠날 때 isJoined를 false로 설정
      //socketRef.current.emit('leaveRoom', { roomId, username });

    }
  };


  const toggleMute = () => {
    if (publisher) {
      const newMuteState = !isMuted;
      publisher.publishAudio(!newMuteState);
      setIsMuted(newMuteState);
      //socketRef.current.emit('toggleMute', { roomId, username, isMuted: newMuteState });

    }
  };

  return (
    <div className="VoiceChat">
      <h1>오픈비두</h1>
      {/* <button onClick={createSession}>Create Session</button> */}
      <button onClick={joinSession}>음성채팅 참여하기</button>
      {session && <button onClick={leaveSession}>음성채팅 나가기</button>}
      <div id="audio-container"></div>
      {publisher && (
        <button onClick={toggleMute}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      )}
      <h3>참여 중인 사용자:</h3>
      <ul>
        {users.map((user) => (  // -> subscribers로 바꾸기
          <li key={user.socketId}>
           {user.username} {user.isMuted ? '(Muted)' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VoiceChat;
