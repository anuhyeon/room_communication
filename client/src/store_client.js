import create from 'zustand';

export const useStore = create((set) => ({
    username: localStorage.getItem('username') || null,
    roomId: localStorage.getItem('roomId') || null,
    messages: JSON.parse(localStorage.getItem('messages')) || [],
    setUsername: (username) => {
        localStorage.setItem('username', username);
        set({ username });
    },
    setRoomId: (roomId) => {
        localStorage.setItem('roomId', roomId);
        set({ roomId });
    },
    addMessage: (message) => set((state) => {
        const updatedMessages = [...state.messages, message];
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        return { messages: updatedMessages };
    }),
    setMessages: (messages) => {
        localStorage.setItem('messages', JSON.stringify(messages));
        set({ messages });
    },
}));
