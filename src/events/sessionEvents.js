const listeners = new Set();

export const onSessionExpired = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const emitSessionExpired = () => {
  listeners.forEach((fn) => fn());
};
