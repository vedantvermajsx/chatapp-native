const listeners = new Set();

export const emitPrivateChatUpdated = (otherUser, lastMessage) => {
  listeners.forEach((fn) => fn(otherUser, lastMessage));
};

export const onPrivateChatUpdated = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
