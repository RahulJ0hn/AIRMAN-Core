import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 3000;

type ToastVariant = "default" | "destructive";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open: boolean;
}

interface ToastState {
  toasts: Toast[];
}

let count = 0;
function genId() { return `toast-${++count}`; }

type Action =
  | { type: "ADD_TOAST"; toast: Omit<Toast, "id" | "open"> }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "DISMISS_TOAST"; id: string };

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        toasts: [{ ...action.toast, id: genId(), open: true }, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "DISMISS_TOAST":
      return {
        toasts: state.toasts.map((t) => (t.id === action.id ? { ...t, open: false } : t)),
      };
    case "REMOVE_TOAST":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function toast(opts: Omit<Toast, "id" | "open">) {
  dispatch({ type: "ADD_TOAST", toast: opts });
  const id = `toast-${count}`;
  setTimeout(() => dispatch({ type: "DISMISS_TOAST", id }), TOAST_REMOVE_DELAY);
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), TOAST_REMOVE_DELAY + 300);
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return { toasts: state.toasts, toast };
}

export { toast };
