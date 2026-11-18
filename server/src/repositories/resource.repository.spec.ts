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
    it('should send the paths with the correlation id to each user room', () => {
      const [user1, user2] = [newUuid(), newUuid()];

      sut.send({ userIds: [user1, user2], paths: ['/albums/album-1', '/shared-links'] });

      expect(websocket.clientSend).toHaveBeenCalledTimes(1);
      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceUpdateV1', [user1, user2], {
        paths: ['/albums/album-1', '/shared-links'],
        correlationId: 'device-1.7',
      });
    });

    it('should send nothing without users', () => {
      sut.send({ userIds: [], paths: ['/albums'] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should send nothing without paths', () => {
      sut.send({ userIds: [newUuid()], paths: [] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should skip paths that are false or undefined', () => {
      const userId = newUuid();

      sut.send({ userIds: [userId], paths: ['/albums', false, undefined, '/shared-links'] });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceUpdateV1', [userId], {
        paths: ['/albums', '/shared-links'],
        correlationId: 'device-1.7',
      });
    });

    it('should send nothing when every path is skipped', () => {
      sut.send({ userIds: [newUuid()], paths: [false, undefined] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should send a path listed twice once', () => {
      const userId = newUuid();

      sut.send({ userIds: [userId], paths: ['/albums', '/albums'] });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceUpdateV1', [userId], {
        paths: ['/albums'],
        correlationId: 'device-1.7',
      });
    });

    it('should send once to a user listed twice', () => {
      const userId = newUuid();

      sut.send({ userIds: [userId, userId], paths: ['/albums'] });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceUpdateV1', [userId], {
        paths: ['/albums'],
        correlationId: 'device-1.7',
      });
    });
  });

  describe('delete', () => {
    it('should send the deleted paths with the correlation id to each user room', () => {
      const [user1, user2] = [newUuid(), newUuid()];

      sut.delete({ userIds: [user1, user2], paths: ['/albums/album-1', '/albums/album-2'] });

      expect(websocket.clientSend).toHaveBeenCalledTimes(1);
      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceDeleteV1', [user1, user2], {
        paths: ['/albums/album-1', '/albums/album-2'],
        correlationId: 'device-1.7',
      });
    });

    it('should send nothing without users', () => {
      sut.delete({ userIds: [], paths: ['/albums/album-1'] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should send nothing when every path is skipped', () => {
      sut.delete({ userIds: [newUuid()], paths: [false, undefined] });

      expect(websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should send each path and user once', () => {
      const userId = newUuid();

      sut.delete({ userIds: [userId, userId], paths: ['/tags/tag-1', false, '/tags/tag-1'] });

      expect(websocket.clientSend).toHaveBeenCalledWith('ResourceDeleteV1', [userId], {
        paths: ['/tags/tag-1'],
        correlationId: 'device-1.7',
      });
    });
  });
});
