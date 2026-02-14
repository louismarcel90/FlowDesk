type Writer = (data: string) => void;

export function buildSseHub() {
  const byUser = new Map<string, Set<Writer>>();

  return {
    subscribe(userId: string, write: Writer) {
      const set = byUser.get(userId) ?? new Set<Writer>();
      set.add(write);
      byUser.set(userId, set);

      return () => {
        const s = byUser.get(userId);
        if (!s) return;
        s.delete(write);
        if (s.size === 0) byUser.delete(userId);
      };
    },

    publish(userId: string, event: { type: string; unreadCount?: number }) {
      const set = byUser.get(userId);
      if (!set) return;
      const payload = JSON.stringify(event);
      for (const w of set) w(payload);
    }
  };
}
