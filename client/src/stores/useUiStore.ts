import { create } from "zustand";

interface UIState {
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
}

export const useUiStore = create<UIState>()((set) => ({
  activeRoomId: null,

  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
}));
