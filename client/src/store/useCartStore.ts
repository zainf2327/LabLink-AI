import { create } from 'zustand';
import type { Test } from '../services/catalog.service';

interface CartState {
  items: Test[];
  addItem: (test: Test) => void;
  removeItem: (testId: string) => void;
  clearCart: () => void;
  isInCart: (testId: string) => boolean;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (test) => {
    const exists = get().items.some((item) => item._id === test._id);
    if (!exists) {
      set({ items: [...get().items, test] });
    }
  },
  removeItem: (testId) => {
    set({ items: get().items.filter((item) => item._id !== testId) });
  },
  clearCart: () => set({ items: [] }),
  isInCart: (testId) => get().items.some((item) => item._id === testId),
}));

export default useCartStore;
