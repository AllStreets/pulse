import { create } from 'zustand';
import { Profile } from '@/types';

interface UserStore {
  profile: Profile | null;
  callsUsedTonight: number;
  setProfile: (profile: Profile | null) => void;
  incrementCallsUsed: () => void;
  resetCallsUsed: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  callsUsedTonight: 0,
  setProfile: (profile) => set({ profile }),
  incrementCallsUsed: () => set((s) => ({ callsUsedTonight: s.callsUsedTonight + 1 })),
  resetCallsUsed: () => set({ callsUsedTonight: 0 }),
}));

export const NIGHTLY_CALL_LIMIT = 10;
