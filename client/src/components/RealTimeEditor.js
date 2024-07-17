import React, { useEffect } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import { WebsocketProvider } from 'y-websocket';
import { CodemirrorBinding } from 'y-codemirror';
import * as Y from 'yjs';
//import { useStore } from '../store';


function RealTimeEditor() {
    const editorContainerRef = React.useRef(null);
    
    //const { roomId } = useStore(state => ({ roomId: state.roomId })); // useStore 훅을 사용하여 roomId를 가져옴
    const roomId = localStorage.getItem('roomId');


    useEffect(() => {
        if (!roomId) {
            console.error('roomId가 존재하지 않음');
            return;
        }
        const ydoc = new Y.Doc(); // 텍스트와 같은 공유 데이터를 저장하는데 사용할 수 있는 Yjs문서 생성
        // 'codemirror'는 연결된 문서의 고유 이름임 우리가 수정해도됨 , 원래난 ws
        const provider = new WebsocketProvider(`wss://api.poke-code.com:3333/room/?roomId=${roomId}`,`codemirror_${roomId}`, ydoc); // WebsocketProvider는 서버(여기서는 localhost:3000)와의 WebSocket 연결을 관리 -> 이 연결을 통해 문서의 변경 사항이 서버와 클라이언트 간에 실시간으로 동기화됨.
        const yText = ydoc.getText(`codemirror_${roomId}`); //getText 메소드는 Yjs 문서 내에서 공유 텍스트 필드를 생성하거나 참조. 이 텍스트 필드는 다른 사용자와 실시간으로 텍스트를 공유하고 동기화하는 데 사용.
        // editorContainerRef.current는 CodeMirror 에디터가 마운트될 DOM 요소를 참조한다.
        const editor = CodeMirror(editorContainerRef.current, {
            mode: 'javascript',
            lineNumbers: true
        });
        // CodemirrorBinding은 CodeMirror 에디터와 Yjs 텍스트를 바인딩하여, 에디터 내의 변경사항이 Yjs 텍스트와 동기화되도록함.
        // provider.awareness를 사용하여 사용자의 현재 상태(예: 커서 위치)도 공유할수 있도록 함.
        const binding = new CodemirrorBinding(yText, editor, provider.awareness);

        return () => { // 컴포넌트가 언마운트 될때 클린 함수 실행
            binding.destroy();
            provider.disconnect();
        };
    }, []);

    return <div ref={editorContainerRef} />;
}

export default RealTimeEditor;

