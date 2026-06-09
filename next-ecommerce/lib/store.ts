'use client';

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialCartState = {
  items: [] as { productId: string; name: string; price: number; quantity: number; imageUrl: string }[],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: initialCartState,
  reducers: {
    addItem(state, action: PayloadAction<typeof initialCartState.items[0]>) {
      const existing = state.items.find((item) => item.productId === action.payload.productId);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as { name: string; email: string; token: string; role: string } | null },
  reducers: {
    setUser(state, action: PayloadAction<typeof state.user>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export const { setUser, clearUser } = authSlice.actions;

export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    auth: authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
