import create from 'zustand'

export const useStore = create((set) => ({
  username: null,
  roomId: null,
  setUsername: (username) => set(() => ({ username })), // set 함수를 통해서 store에 저장된 정보를 업데이트,
  setRoomId: (roomId) => set(() => ({ roomId: roomId })),
}))

