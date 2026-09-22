type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * The API client clears tokens when a refresh fails, but it has no way to reach
 * React state. Without this the UI keeps showing a signed in user whose every
 * request now fails.
 */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionExpired(): void {
  for (const listener of listeners) listener();
}
