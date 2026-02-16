import { ClusterMessage, ClusterResponse } from 'socket.io-adapter';
import { createBroadcastChannelAdapter } from 'src/middleware/broadcast-channel.adapter';
import { vi } from 'vitest';

const createMockNamespace = () => ({
  name: '/',
  sockets: new Map(),
  adapter: null,
  server: {
    encoder: {
      encode: vi.fn().mockReturnValue([]),
    },
    _opts: {},
    sockets: {
      sockets: new Map(),
    },
  },
});

describe('BroadcastChannelAdapter', () => {
  describe('createBroadcastChannelAdapter', () => {
    it('should return a factory function', () => {
      const factory = createBroadcastChannelAdapter();
      expect(typeof factory).toBe('function');
    });

    it('should create adapter instance when factory is called', () => {
      const mockNamespace = createMockNamespace();
      const factory = createBroadcastChannelAdapter();
      const adapter = factory(mockNamespace);

      expect(adapter).toBeDefined();
      expect(adapter.doPublish).toBeDefined();
      expect(adapter.doPublishResponse).toBeDefined();

      adapter.close();
    });
  });

  describe('BroadcastChannelAdapter message passing', () => {
    it('should actually send and receive messages between two adapters', async () => {
      const factory1 = createBroadcastChannelAdapter();
      const factory2 = createBroadcastChannelAdapter();

      const namespace1 = createMockNamespace();
      const namespace2 = createMockNamespace();

      const adapter1 = factory1(namespace1);
      const adapter2 = factory2(namespace2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const receivedMessages: ClusterMessage[] = [];
      const messageReceived = new Promise<void>((resolve) => {
        const originalOnMessage = adapter2.onMessage.bind(adapter2);
        adapter2.onMessage = (message: ClusterMessage) => {
          receivedMessages.push(message);
          resolve();
          return originalOnMessage(message);
        };
      });

      const testMessage = {
        type: 2,
        data: {
          opts: { rooms: new Set(['room1']) },
          rooms: ['room1'],
        },
        nsp: '/',
      };

      void adapter1.doPublish(testMessage as any);

      await Promise.race([messageReceived, new Promise((resolve) => setTimeout(resolve, 500))]);

      expect(receivedMessages.length).toBeGreaterThan(0);

      adapter1.close();
      adapter2.close();
    });

    it('should send ConfigUpdate-style event and receive it on another adapter', async () => {
      const factory1 = createBroadcastChannelAdapter();
      const factory2 = createBroadcastChannelAdapter();

      const namespace1 = createMockNamespace();
      const namespace2 = createMockNamespace();

      const adapter1 = factory1(namespace1);
      const adapter2 = factory2(namespace2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const receivedMessages: ClusterMessage[] = [];
      const messageReceived = new Promise<void>((resolve) => {
        const originalOnMessage = adapter2.onMessage.bind(adapter2);
        adapter2.onMessage = (message: ClusterMessage) => {
          receivedMessages.push(message);
          if ((message as any)?.data?.event === 'ConfigUpdate') {
            resolve();
          }
          return originalOnMessage(message);
        };
      });

      const configUpdateMessage = {
        type: 2,
        data: {
          event: 'ConfigUpdate',
          payload: { newConfig: { ffmpeg: { crf: 23 } }, oldConfig: { ffmpeg: { crf: 20 } } },
          opts: { rooms: new Set() },
          rooms: [],
        },
        nsp: '/',
      };

      void adapter1.doPublish(configUpdateMessage as any);

      await Promise.race([messageReceived, new Promise((resolve) => setTimeout(resolve, 500))]);

      const configMessages = receivedMessages.filter((m) => (m as any)?.data?.event === 'ConfigUpdate');
      expect(configMessages.length).toBeGreaterThan(0);
      expect((configMessages[0] as any).data.payload.newConfig.ffmpeg.crf).toBe(23);

      adapter1.close();
      adapter2.close();
    });

    it('should send AppRestart-style event and receive it on another adapter', async () => {
      const factory1 = createBroadcastChannelAdapter();
      const factory2 = createBroadcastChannelAdapter();

      const namespace1 = createMockNamespace();
      const namespace2 = createMockNamespace();

      const adapter1 = factory1(namespace1);
      const adapter2 = factory2(namespace2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const receivedMessages: ClusterMessage[] = [];
      const messageReceived = new Promise<void>((resolve) => {
        const originalOnMessage = adapter2.onMessage.bind(adapter2);
        adapter2.onMessage = (message: ClusterMessage) => {
          receivedMessages.push(message);
          if ((message as any)?.data?.event === 'AppRestart') {
            resolve();
          }
          return originalOnMessage(message);
        };
      });

      const appRestartMessage = {
        type: 2,
        data: {
          event: 'AppRestart',
          payload: { isMaintenanceMode: true },
          opts: { rooms: new Set() },
          rooms: [],
        },
        nsp: '/',
      };

      void adapter1.doPublish(appRestartMessage as any);

      await Promise.race([messageReceived, new Promise((resolve) => setTimeout(resolve, 500))]);

      const restartMessages = receivedMessages.filter((m) => (m as any)?.data?.event === 'AppRestart');
      expect(restartMessages.length).toBeGreaterThan(0);
      expect((restartMessages[0] as any).data.payload.isMaintenanceMode).toBe(true);

      adapter1.close();
      adapter2.close();
    });

    it('should not receive its own messages (echo prevention)', async () => {
      const factory = createBroadcastChannelAdapter();
      const namespace = createMockNamespace();
      const adapter = factory(namespace);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const receivedOwnMessages: ClusterMessage[] = [];
      const uniqueMarker = `test-${Date.now()}-${Math.random()}`;

      const originalOnMessage = adapter.onMessage.bind(adapter);
      adapter.onMessage = (message: ClusterMessage) => {
        if ((message as any)?.data?.marker === uniqueMarker) {
          receivedOwnMessages.push(message);
        }
        return originalOnMessage(message);
      };

      const testMessage = {
        type: 2,
        data: {
          marker: uniqueMarker,
          opts: { rooms: new Set() },
          rooms: [],
        },
        nsp: '/',
      };

      void adapter.doPublish(testMessage as any);

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(receivedOwnMessages.length).toBe(0);

      adapter.close();
    });

    it('should send and receive response messages between adapters', async () => {
      const factory1 = createBroadcastChannelAdapter();
      const factory2 = createBroadcastChannelAdapter();

      const namespace1 = createMockNamespace();
      const namespace2 = createMockNamespace();

      const adapter1 = factory1(namespace1);
      const adapter2 = factory2(namespace2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const receivedResponses: ClusterResponse[] = [];
      const responseReceived = new Promise<void>((resolve) => {
        const originalOnResponse = adapter1.onResponse.bind(adapter1);
        adapter1.onResponse = (response: ClusterResponse) => {
          receivedResponses.push(response);
          resolve();
          return originalOnResponse(response);
        };
      });

      const responseMessage = {
        type: 3,
        data: { result: 'success', count: 42 },
      };

      void adapter2.doPublishResponse((adapter1 as any).uid, responseMessage as any);

      await Promise.race([responseReceived, new Promise((resolve) => setTimeout(resolve, 500))]);

      expect(receivedResponses.length).toBeGreaterThan(0);

      adapter1.close();
      adapter2.close();
    });
  });

  describe('BroadcastChannelAdapter lifecycle', () => {
    it('should close cleanly without errors', () => {
      const factory = createBroadcastChannelAdapter();
      const namespace = createMockNamespace();
      const adapter = factory(namespace);

      expect(() => adapter.close()).not.toThrow();
    });

    it('should handle multiple adapters closing in sequence', () => {
      const factory1 = createBroadcastChannelAdapter();
      const factory2 = createBroadcastChannelAdapter();
      const factory3 = createBroadcastChannelAdapter();

      const adapter1 = factory1(createMockNamespace());
      const adapter2 = factory2(createMockNamespace());
      const adapter3 = factory3(createMockNamespace());

      expect(() => {
        adapter1.close();
        adapter2.close();
        adapter3.close();
      }).not.toThrow();
    });
  });
});
