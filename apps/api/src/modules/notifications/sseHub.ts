export type SSEPayload = {
  type: string;
  [k: string]: unknown;
};

type Listener = (payload: SSEPayload) => void;

export class SSEHub {
  private clients = new Map<string, Set<Listener>>();

  subscribe(userId: string, listener: Listener): () => void {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(listener);

    return () => {
      const set = this.clients.get(userId);
      if (!set) return;
      set.delete(listener);
      if (set.size === 0) this.clients.delete(userId);
    };
  }

  publish(userId: string, payload: SSEPayload): void {
    const listeners = this.clients.get(userId);
    if (!listeners) return;

    for (const fn of listeners) fn(payload);
  }
}
