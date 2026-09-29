import { create } from 'zustand';
import type { SecurityEvent, Incident } from '../types';

interface LiveEvent {
  id: string;
  type: 'event' | 'incident';
  data: SecurityEvent | Incident | Record<string, unknown>;
  timestamp: Date;
}

interface WebSocketState {
  connected: boolean;
  connectionId: string | null;
  liveEvents: LiveEvent[];
  activeConnections: number;
  connect: () => void;
  disconnect: () => void;
  addLiveEvent: (event: LiveEvent) => void;
}

let wsInstance: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  connected: false,
  connectionId: null,
  liveEvents: [],
  activeConnections: 0,

  connect: () => {
    if (wsInstance?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
    wsInstance = new WebSocket(wsUrl);

    wsInstance.onopen = () => {
      console.log('🔌 WebSocket connected');
      set({ connected: true });
      // Keep alive ping every 30s
      const pingInterval = setInterval(() => {
        if (wsInstance?.readyState === WebSocket.OPEN) {
          wsInstance.send('ping');
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    };

    wsInstance.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const store = get();

        if (msg.type === 'connected') {
          set({ connectionId: msg.connection_id, activeConnections: msg.active_connections });
        } else if (msg.type === 'new_event') {
          const liveEvent: LiveEvent = {
            id: `evt-${Date.now()}-${Math.random()}`,
            type: 'event',
            data: msg.data,
            timestamp: new Date(),
          };
          store.addLiveEvent(liveEvent);
        } else if (msg.type === 'new_incident') {
          const liveEvent: LiveEvent = {
            id: `inc-${Date.now()}-${Math.random()}`,
            type: 'incident',
            data: msg.data,
            timestamp: new Date(),
          };
          store.addLiveEvent(liveEvent);
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    wsInstance.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 3s...');
      set({ connected: false });
      // Auto-reconnect
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        get().connect();
      }, 3000);
    };

    wsInstance.onerror = (err) => {
      console.warn('WebSocket error:', err);
    };
  },

  disconnect: () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    wsInstance?.close();
    wsInstance = null;
    set({ connected: false, connectionId: null });
  },

  addLiveEvent: (event: LiveEvent) => {
    set((state) => ({
      liveEvents: [event, ...state.liveEvents].slice(0, 100), // Keep last 100
    }));
  },
}));
