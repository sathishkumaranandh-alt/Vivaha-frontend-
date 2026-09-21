let listeners = [];
let idCounter = 0;

export const toast = {
  success: (msg, duration) => emit({ type: "success", message: msg, duration }),
  error: (msg, duration) => emit({ type: "error", message: msg, duration }),
  info: (msg, duration) => emit({ type: "info", message: msg, duration }),
  warning: (msg, duration) => emit({ type: "warning", message: msg, duration }),
  show: (msg, type = "info", duration) => emit({ type, message: msg, duration }),
};

function emit({ type, message, duration = 3500 }) {
  const id = ++idCounter;
  listeners.forEach((fn) => fn({ id, type, message, duration }));
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}