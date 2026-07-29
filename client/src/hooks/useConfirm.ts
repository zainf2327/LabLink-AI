import { useState, useEffect } from 'react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  variant?: ConfirmVariant;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
}

type Listener = (state: ConfirmState) => void;

let state: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'warning',
  onConfirm: () => {},
};

const listeners = new Set<Listener>();

export const confirmStore = {
  getState() {
    return state;
  },
  show(config: ConfirmConfig) {
    state = {
      isOpen: true,
      title: config.title,
      message: config.message,
      variant: config.variant || 'warning',
      onConfirm: config.onConfirm,
    };
    listeners.forEach((l) => l(state));
  },
  hide() {
    state = {
      ...state,
      isOpen: false,
    };
    listeners.forEach((l) => l(state));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<ConfirmState>(confirmStore.getState());

  useEffect(() => {
    return confirmStore.subscribe((newState) => {
      setConfirmState(newState);
    });
  }, []);

  return {
    ...confirmState,
    confirm: (config: ConfirmConfig) => confirmStore.show(config),
    cancel: () => confirmStore.hide(),
  };
};
