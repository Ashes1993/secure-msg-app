import { create } from "zustand";

interface ChatState {
  typingUsers: string[];
  setTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;

  onlineUsers: string[];
  setUserOnlineStatus: (userId: string, isOnline: boolean) => void;

  editingMessage: { id: string; decryptedText: string } | null;
  setEditingMessage: (
    payload: { id: string; decryptedText: string } | null,
  ) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  typingUsers: [],
  onlineUsers: [],
  editingMessage: null,

  setTypingUser: (userId) =>
    set((state) => {
      if (state.typingUsers.includes(userId)) {
        return state;
      }
      return { typingUsers: [...state.typingUsers, userId] };
    }),
  removeTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((id) => id !== userId),
    })),

  setUserOnlineStatus: (userId, isOnline) =>
    set((state) => {
      const isCurrentlyMarkedOnline = state.onlineUsers.includes(userId);

      if (isOnline) {
        if (isCurrentlyMarkedOnline) return state;
        return { onlineUsers: [...state.onlineUsers, userId] };
      } else {
        if (!isCurrentlyMarkedOnline) return state;
        return { onlineUsers: state.onlineUsers.filter((id) => id !== userId) };
      }
    }),

  setEditingMessage: (payload) => set({ editingMessage: payload }),
}));
