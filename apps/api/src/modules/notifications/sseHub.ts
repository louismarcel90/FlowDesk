import { JSONValue } from 'postgres';

export class SSEHub {
  private clients = new Map<string, Set<(data: string) => void>>();

  subscribe(userId: string, write: (data: string) => void) {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(write);

    return () => {
      const set = this.clients.get(userId);
      if (!set) return;
      set.delete(write);
      if (set.size === 0) this.clients.delete(userId);
    };
  }

  publish(userId: string, event: { type: string; unreadCount?: number }) {
    const listeners = this.clients.get(userId);
    if (!listeners) return;

    const payload: JSONValue = event as unknown as JSONValue;
    const sse = `data: ${JSON.stringify(payload)}\n\n`;

    for (const write of listeners) write(sse);
  }
}
