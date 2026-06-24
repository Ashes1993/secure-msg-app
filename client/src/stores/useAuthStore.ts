import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  privateKey: string | null;
  publicKey: string | null;

  setAuthKeys: (privateKey: string, publicKey: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial states
      privateKey: null,
      publicKey: null,

      // Actions
      setAuthKeys: (privateKey, publicKey) =>
        set({
          privateKey,
          publicKey,
        }),

      clearAuth: () =>
        set({
          privateKey: null,
          publicKey: null,
        }),
    }),
    {
      name: "vault-storage",

      partialize: (state) => ({
        privateKey: state.privateKey,
        publicKey: state.publicKey,
      }),
    },
  ),
);
