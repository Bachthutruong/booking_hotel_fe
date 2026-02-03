import { create } from 'zustand';

interface SearchState {
  destination: string;
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
  setDestination: (destination: string) => void;
  setCheckIn: (date: Date | null) => void;
  setCheckOut: (date: Date | null) => void;
  setAdults: (adults: number) => void;
  setChildren: (children: number) => void;
  setSearch: (data: Partial<SearchState>) => void;
  reset: () => void;
}

const initialState = {
  destination: '',
  checkIn: null,
  checkOut: null,
  adults: 2,
  children: 0,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,

  setDestination: (destination) => set({ destination }),
  setCheckIn: (checkIn) => set({ checkIn }),
  setCheckOut: (checkOut) => set({ checkOut }),
  setAdults: (adults) => set({ adults }),
  setChildren: (children) => set({ children }),

  setSearch: (data) => set((state) => ({ ...state, ...data })),

  reset: () => set(initialState),
}));
