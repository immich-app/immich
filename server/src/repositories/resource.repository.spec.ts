import { ClsService } from 'nestjs-cls';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { WebsocketRepository } from 'src/repositories/websocket.repository.js';
import { newUuid } from 'test/small.factory.js';
import { ServiceMocks, getMocks } from 'test/utils.js';

describe(ResourceRepository.name, () => {
  let sut: ResourceRepository;
  let websocket: ServiceMocks['websocket'];

  beforeEach(() => {
    websocket = getMocks().websocket;
    const cls = { getId: () => 'device-1.7' } as ClsService;
    sut = new ResourceRepository(cls, websocket as unknown as WebsocketRepository);
  });

  describe('send', () => {
    it('should send changed and deleted paths with the correlation id to each user room', () => {
      const [user1, user2] = [newUuid(), newUuid()];

      sut.send({ userIds: [user1, user2], changed: ['/albums/statistics'], deleted: ['/albums/album-1'] });

      expect(websocket.clientSend).toHaveBeenCalledTimes(1);
      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceEventV1', [user1, user2], {
        changed: ['/albums/statistics'],
        deleted: ['/albums/album-1'],
        correlationId: 'device-1.7',
      });
    });

    it('should send an empty deleted list when only paths changed', () => {
      const userId = newUuid();

      sut.send({ userIds: [userId], changed: ['/albums/album-1', '/shared-links'] });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceEventV1', [userId], {
        changed: ['/albums/album-1', '/shared-links'],
        deleted: [],
        correlationId: 'device-1.7',
      });
    });

    it('should send an empty changed list when only paths were deleted', () => {
      const userId = newUuid();

      sut.send({ userIds: [userId], deleted: ['/tags/tag-1'] });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceEventV1', [userId], {
        changed: [],
        deleted: ['/tags/tag-1'],
        correlationId: 'device-1.7',
      });
    });

    it('should send nothing without users', () => {
      sut.send({ userIds: [], changed: ['/albums'], deleted: ['/albums/album-1'] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should send nothing without paths', () => {
      sut.send({ userIds: [newUuid()], changed: [], deleted: [] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should send nothing when every path is skipped', () => {
      sut.send({ userIds: [newUuid()], changed: [false, undefined], deleted: [undefined, false] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should skip paths that are false or undefined', () => {
      const userId = newUuid();

      sut.send({
        userIds: [userId],
        changed: ['/albums', false, undefined, '/shared-links'],
        deleted: [false, '/tags/tag-1', undefined],
      });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceEventV1', [userId], {
        changed: ['/albums', '/shared-links'],
        deleted: ['/tags/tag-1'],
        correlationId: 'device-1.7',
      });
    });

    it('should send each path and user once', () => {
      const userId = newUuid();

      sut.send({
        userIds: [userId, userId],
        changed: ['/albums', '/albums'],
        deleted: ['/tags/tag-1', '/tags/tag-1'],
      });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceEventV1', [userId], {
        changed: ['/albums'],
        deleted: ['/tags/tag-1'],
        correlationId: 'device-1.7',
      });
    });
  });
});
