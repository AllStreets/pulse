import { create } from 'zustand';
import { Profile } from '@/types';

interface UserStore {
  profile: Profile | null;
  callsUsedTonight: number;
  browseMode: boolean;
  setProfile: (profile: Profile | null) => void;
  incrementCallsUsed: () => void;
  resetCallsUsed: () => void;
  setBrowseMode: (v: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  callsUsedTonight: 0,
  browseMode: false,
  setProfile: (profile) => set({ profile }),
  incrementCallsUsed: () => set((s) => ({ callsUsedTonight: s.callsUsedTonight + 1 })),
  resetCallsUsed: () => set({ callsUsedTonight: 0 }),
  setBrowseMode: (v) => set({ browseMode: v }),
}));

export const NIGHTLY_CALL_LIMIT = 10;
