import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface UserState {
  currentUser: User | null;
  setUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,

      setUser: (user) => set({ currentUser: user }),

      switchRole: (role) =>
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, role }
            : null
        })),

      logout: () => set({ currentUser: null })
    }),
    {
      name: 'sparehub-user'
    }
  )
);
