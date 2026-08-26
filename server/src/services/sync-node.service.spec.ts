import { BadRequestException, NotFoundException } from '@nestjs/common';
import { serverVersion } from 'src/constants';
import { SyncNodeStatus } from 'src/enum';
import { NodeClientError } from 'src/repositories/node-client.repository';
import { SyncNodeService } from 'src/services/sync-node.service';
import { newTestService, ServiceMocks } from 'test/utils';

const nodeStub = {
  id: 'node-1',
  name: 'Backup server',
  url: 'https://immich.example.com',
  apiKey: 'peer-key',
  isEnabled: true,
  status: SyncNodeStatus.Online,
  remoteVersion: `${serverVersion.major}.1.0`,
  lastCheckedAt: new Date('2026-01-01'),
  error: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

const pairingStub = {
  id: 'pairing-1',
  nodeId: 'node-1',
  localUserId: 'user-1',
  remoteUserId: 'remote-user-1',
  remoteUserEmail: 'alice@remote.example',
  apiKey: 'paired-user-key',
  pushEnabled: true,
  pullEnabled: true,
  pushCursor: null,
  pullCursor: null,
  lastSyncedAt: null,
  error: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

const healthyPeer = (mocks: ServiceMocks) => {
  mocks.nodeClient.ping.mockResolvedValue(true);
  mocks.nodeClient.getServerInfo.mockResolvedValue({
    version: `${serverVersion.major}.1.0`,
    versionMajor: serverVersion.major,
    versionMinor: 1,
  });
  mocks.nodeClient.getMyApiKey.mockResolvedValue({ permissions: ['all'] });
};

describe(SyncNodeService.name, () => {
  let sut: SyncNodeService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SyncNodeService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should never expose the stored api key', async () => {
      mocks.syncNode.getAll.mockResolvedValue([nodeStub]);

      const [node] = await sut.getAll();

      expect(node).not.toHaveProperty('apiKey');
      expect(node.name).toBe('Backup server');
    });
  });

  describe('create', () => {
    it('should reject a peer that cannot be reached', async () => {
      mocks.syncNode.getByName.mockResolvedValue(void 0);
      mocks.nodeClient.ping.mockRejectedValue(new NodeClientError('Could not reach host'));

      await expect(
        sut.create({ name: 'Unreachable', url: 'https://nope.example', apiKey: 'k', isEnabled: true }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.syncNode.create).not.toHaveBeenCalled();
    });

    it('should reject a peer on a different major version', async () => {
      mocks.syncNode.getByName.mockResolvedValue(void 0);
      mocks.nodeClient.ping.mockResolvedValue(true);
      mocks.nodeClient.getServerInfo.mockResolvedValue({
        version: `${serverVersion.major + 1}.0.0`,
        versionMajor: serverVersion.major + 1,
        versionMinor: 0,
      });

      await expect(
        sut.create({ name: 'Newer', url: 'https://newer.example', apiKey: 'k', isEnabled: true }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.syncNode.create).not.toHaveBeenCalled();
    });

    it('should reject an api key missing required permissions', async () => {
      mocks.syncNode.getByName.mockResolvedValue(void 0);
      mocks.nodeClient.ping.mockResolvedValue(true);
      mocks.nodeClient.getServerInfo.mockResolvedValue({
        version: `${serverVersion.major}.1.0`,
        versionMajor: serverVersion.major,
        versionMinor: 1,
      });
      mocks.nodeClient.getMyApiKey.mockResolvedValue({ permissions: ['asset.read'] });

      await expect(
        sut.create({ name: 'Weak key', url: 'https://peer.example', apiKey: 'k', isEnabled: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should store a verified node with its trailing slash removed', async () => {
      mocks.syncNode.getByName.mockResolvedValue(void 0);
      healthyPeer(mocks);
      mocks.syncNode.create.mockResolvedValue(nodeStub);

      await sut.create({ name: 'Backup server', url: 'https://immich.example.com/', apiKey: 'k', isEnabled: true });

      expect(mocks.syncNode.create).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://immich.example.com', status: SyncNodeStatus.Online }),
      );
    });

    it('should reject a duplicate name', async () => {
      mocks.syncNode.getByName.mockResolvedValue(nodeStub);

      await expect(
        sut.create({ name: 'Backup server', url: 'https://peer.example', apiKey: 'k', isEnabled: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('should keep the stored api key when none is supplied', async () => {
      mocks.syncNode.get.mockResolvedValue(nodeStub);
      mocks.syncNode.update.mockResolvedValue(nodeStub);

      await sut.update('node-1', { isEnabled: false });

      expect(mocks.syncNode.update).toHaveBeenCalledWith(
        'node-1',
        expect.objectContaining({ apiKey: 'peer-key', isEnabled: false }),
      );
    });
  });

  describe('test', () => {
    it('should record an unauthorized peer rather than throwing', async () => {
      mocks.syncNode.get.mockResolvedValue(nodeStub);
      mocks.nodeClient.ping.mockRejectedValue(new NodeClientError('Forbidden', 403));
      mocks.syncNode.update.mockResolvedValue(nodeStub);

      const result = await sut.test('node-1');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(SyncNodeStatus.Unauthorized);
      expect(mocks.syncNode.update).toHaveBeenCalledWith(
        'node-1',
        expect.objectContaining({ status: SyncNodeStatus.Unauthorized }),
      );
    });
  });

  describe('createPairing', () => {
    beforeEach(() => {
      mocks.syncNode.get.mockResolvedValue(nodeStub);
      mocks.user.get.mockResolvedValue({ id: 'user-1' } as never);
      mocks.nodeClient.searchUsers.mockResolvedValue([
        { id: 'remote-user-1', email: 'alice@remote.example', name: 'Alice' },
      ]);
    });

    it('should reject a user that does not exist on the peer', async () => {
      mocks.syncNode.getPairings.mockResolvedValue([]);

      await expect(
        sut.createPairing('node-1', {
          localUserId: 'user-1',
          remoteUserId: 'nobody',
          remoteApiKey: 'k',
          pushEnabled: true,
          pullEnabled: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject pairing the same local user twice', async () => {
      mocks.syncNode.getPairings.mockResolvedValue([pairingStub]);

      await expect(
        sut.createPairing('node-1', {
          localUserId: 'user-1',
          remoteUserId: 'remote-user-1',
          remoteApiKey: 'k',
          pushEnabled: true,
          pullEnabled: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should store the pairing with the resolved remote email', async () => {
      mocks.syncNode.getPairings.mockResolvedValue([]);
      mocks.syncNode.createPairing.mockResolvedValue(pairingStub);

      mocks.nodeClient.getMe.mockResolvedValue({
        id: 'remote-user-1',
        email: 'alice@remote.example',
        name: 'Alice',
      });

      await sut.createPairing('node-1', {
        localUserId: 'user-1',
        remoteUserId: 'remote-user-1',
        remoteApiKey: 'paired-user-key',
        pushEnabled: true,
        pullEnabled: false,
      });

      expect(mocks.syncNode.createPairing).toHaveBeenCalledWith(
        expect.objectContaining({ remoteUserEmail: 'alice@remote.example', pullEnabled: false }),
      );
    });
  });

  describe('createPairing key ownership', () => {
    it('should reject a key that acts as somebody other than the paired user', async () => {
      mocks.syncNode.get.mockResolvedValue(nodeStub);
      mocks.user.get.mockResolvedValue({ id: 'user-1' } as never);
      mocks.nodeClient.searchUsers.mockResolvedValue([
        { id: 'remote-user-1', email: 'alice@remote.example', name: 'Alice' },
      ]);
      mocks.syncNode.getPairings.mockResolvedValue([]);
      // An admin key: accepted by the peer, but acts as the wrong account, which
      // would silently file every pushed asset under the admin.
      mocks.nodeClient.getMe.mockResolvedValue({
        id: 'remote-admin',
        email: 'admin@remote.example',
        name: 'Admin',
      });

      await expect(
        sut.createPairing('node-1', {
          localUserId: 'user-1',
          remoteUserId: 'remote-user-1',
          remoteApiKey: 'admin-key',
          pushEnabled: true,
          pullEnabled: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.syncNode.createPairing).not.toHaveBeenCalled();
    });
  });

  describe('syncPairingNow', () => {
    it('should queue a run for an existing pairing', async () => {
      mocks.syncNode.getPairing.mockResolvedValue(pairingStub);

      await sut.syncPairingNow('pairing-1');

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: 'NodeSyncPair', data: { pairingId: 'pairing-1' } });
    });

    it('should throw for a pairing that does not exist', async () => {
      mocks.syncNode.getPairing.mockResolvedValue(void 0);

      await expect(sut.syncPairingNow('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
