import { Server } from 'socket.io';
import { createBroadcastChannelAdapter } from 'src/middleware/broadcast-channel.adapter';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { WebsocketRepository } from 'src/repositories/websocket.repository';
import { automock } from 'test/utils';
import { vi } from 'vitest';

describe('WebSocket Integration - serverSend with adapters', () => {
  describe('BroadcastChannel adapter', () => {
    it('should broadcast ConfigUpdate event through BroadcastChannel adapter', async () => {
      const createMockNamespace = () => ({
        name: '/',
        sockets: new Map(),
        adapter: null,
        server: {
          encoder: { encode: vi.fn().mockReturnValue([]) },
          _opts: {},
          sockets: { sockets: new Map() },
        },
      });

      const factory1 = createBroadcastChannelAdapter();
      const factory2 = createBroadcastChannelAdapter();

      const namespace1 = createMockNamespace();
      const namespace2 = createMockNamespace();

      const adapter1 = factory1(namespace1);
      const adapter2 = factory2(namespace2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const receivedMessages: any[] = [];
      vi.spyOn(adapter2, 'onMessage').mockImplementation((message: any) => {
        receivedMessages.push(message);
      });

      const configUpdatePayload = {
        type: 5,
        data: {
          event: 'ConfigUpdate',
          args: [{ newConfig: { ffmpeg: { crf: 23 } }, oldConfig: { ffmpeg: { crf: 20 } } }],
        },
        nsp: '/',
      };

      void adapter1.doPublish(configUpdatePayload as any);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const configMessages = receivedMessages.filter((m) => m?.data?.event === 'ConfigUpdate');
      expect(configMessages.length).toBeGreaterThan(0);

      adapter1.close();
      adapter2.close();
    });

    it('should broadcast AppRestart event through BroadcastChannel adapter', async () => {
      const createMockNamespace = () => ({
        name: '/',
        sockets: new Map(),
        adapter: null,
        server: {
          encoder: { encode: vi.fn().mockReturnValue([]) },
          _opts: {},
          sockets: { sockets: new Map() },
        },
      });

      const factory1 = createBroadcastChannelAdapter();
      const factory2 = createBroadcastChannelAdapter();

      const namespace1 = createMockNamespace();
      const namespace2 = createMockNamespace();

      const adapter1 = factory1(namespace1);
      const adapter2 = factory2(namespace2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const receivedMessages: any[] = [];
      vi.spyOn(adapter2, 'onMessage').mockImplementation((message: any) => {
        receivedMessages.push(message);
      });

      const appRestartPayload = {
        type: 5,
        data: {
          event: 'AppRestart',
          args: [{ isMaintenanceMode: true }],
        },
        nsp: '/',
      };

      void adapter1.doPublish(appRestartPayload as any);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const restartMessages = receivedMessages.filter((m) => m?.data?.event === 'AppRestart');
      expect(restartMessages.length).toBeGreaterThan(0);

      adapter1.close();
      adapter2.close();
    });
  });

  describe('WebsocketRepository with adapter', () => {
    it('should call serverSideEmit when serverSend is called', () => {
      const mockServer = {
        serverSideEmit: vi.fn(),
        on: vi.fn(),
      } as unknown as Server;

      const eventRepository = automock(EventRepository, {
        args: [undefined, undefined, { setContext: () => {} }],
      });
      const loggingRepository = automock(LoggingRepository, {
        args: [undefined, { getEnv: () => ({ noColor: false }) }],
        strict: false,
      });

      const websocketRepository = new WebsocketRepository(eventRepository, loggingRepository);
      (websocketRepository as any).server = mockServer;

      websocketRepository.serverSend('ConfigUpdate', {
        newConfig: { ffmpeg: { crf: 23 } } as any,
        oldConfig: { ffmpeg: { crf: 20 } } as any,
      });

      expect(mockServer.serverSideEmit).toHaveBeenCalledWith('ConfigUpdate', {
        newConfig: { ffmpeg: { crf: 23 } },
        oldConfig: { ffmpeg: { crf: 20 } },
      });
    });

    it('should call serverSideEmit for AppRestart event', () => {
      const mockServer = {
        serverSideEmit: vi.fn(),
        on: vi.fn(),
      } as unknown as Server;

      const eventRepository = automock(EventRepository, {
        args: [undefined, undefined, { setContext: () => {} }],
      });
      const loggingRepository = automock(LoggingRepository, {
        args: [undefined, { getEnv: () => ({ noColor: false }) }],
        strict: false,
      });

      const websocketRepository = new WebsocketRepository(eventRepository, loggingRepository);
      (websocketRepository as any).server = mockServer;

      websocketRepository.serverSend('AppRestart', { isMaintenanceMode: true });

      expect(mockServer.serverSideEmit).toHaveBeenCalledWith('AppRestart', { isMaintenanceMode: true });
    });
  });
});
