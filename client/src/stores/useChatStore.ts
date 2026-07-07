import { create } from "zustand";

interface ChatState {
  typingUsers: string[];
  setTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  typingUsers: [],

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
}));
