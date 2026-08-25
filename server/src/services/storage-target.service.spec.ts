import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StorageTargetKind, StorageTransferDirection, StorageTransferScopeType, StorageTransferStatus } from 'src/enum';
import { StorageTargetService } from 'src/services/storage-target.service';
import { newTestService, ServiceMocks } from 'test/utils';

/** What a client sends: one flat shape regardless of kind. */
const s3ConfigDto = {
  endpoint: 'http://minio:9000',
  bucket: 'immich',
  region: 'us-east-1',
  forcePathStyle: true,
  baseUrl: '',
  basePath: '',
  prefix: 'photos',
};

/** What gets stored: narrowed to the declared kind. */
const s3Config = {
  kind: StorageTargetKind.S3 as const,
  endpoint: 'http://minio:9000',
  bucket: 'immich',
  region: 'us-east-1',
  forcePathStyle: true,
  prefix: 'photos',
};

/** What a client sends: no `kind`, the config already carries it. */
const s3SecretDto = {
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
};

/** What gets stored: narrowed to the configured kind. */
const s3Secret = {
  kind: StorageTargetKind.S3 as const,
  ...s3SecretDto,
};

const targetStub = {
  id: 'target-1',
  name: 'MinIO',
  kind: StorageTargetKind.S3,
  config: s3Config,
  secret: s3Secret,
  isEnabled: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

const transferStub = {
  id: 'transfer-1',
  targetId: 'target-1',
  ownerId: 'user-1',
  direction: StorageTransferDirection.Export,
  status: StorageTransferStatus.Pending,
  scope: { type: StorageTransferScopeType.All } as const,
  totalCount: 0,
  completedCount: 0,
  failedCount: 0,
  startedAt: null,
  finishedAt: null,
  error: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

describe(StorageTargetService.name, () => {
  let sut: StorageTargetService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(StorageTargetService));

    mocks.remoteStorage.evict.mockReturnValue(void 0);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should never expose stored credentials', async () => {
      mocks.storageTarget.getAll.mockResolvedValue([targetStub]);

      const [target] = await sut.getAll();

      expect(target).not.toHaveProperty('secret');
      expect(target.hasCredentials).toBe(true);
      // The response widens the stored, kind-specific config back to the flat shape.
      expect(target.config).toEqual(s3ConfigDto);
    });
  });

  describe('get', () => {
    it('should throw when the target does not exist', async () => {
      mocks.storageTarget.get.mockResolvedValue(void 0);
      await expect(sut.get('target-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('should reject credentials that do not fit the configured kind', async () => {
      await expect(
        sut.create({
          name: 'Mismatched',
          kind: StorageTargetKind.S3,
          config: s3ConfigDto,
          secret: { username: 'alice', password: 'hunter2' },
          isEnabled: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.storageTarget.create).not.toHaveBeenCalled();
    });

    it('should not require credentials for a local target', async () => {
      const localConfig = { ...s3ConfigDto, basePath: '/mnt/backup', prefix: '' };
      mocks.storageTarget.getByName.mockResolvedValue(void 0);
      mocks.storageTarget.create.mockResolvedValue({ ...targetStub, kind: StorageTargetKind.Local });

      await sut.create({
        name: 'NAS',
        kind: StorageTargetKind.Local,
        config: localConfig,
        secret: {},
        isEnabled: true,
      });

      expect(mocks.storageTarget.create).toHaveBeenCalledWith(
        expect.objectContaining({ kind: StorageTargetKind.Local, secret: { kind: StorageTargetKind.Local } }),
      );
    });

    it('should reject a duplicate name', async () => {
      mocks.storageTarget.getByName.mockResolvedValue(targetStub);

      await expect(
        sut.create({
          name: 'MinIO',
          kind: StorageTargetKind.S3,
          config: s3ConfigDto,
          secret: s3SecretDto,
          isEnabled: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.storageTarget.create).not.toHaveBeenCalled();
    });

    it('should create a target and derive the kind from the config', async () => {
      mocks.storageTarget.getByName.mockResolvedValue(void 0);
      mocks.storageTarget.create.mockResolvedValue(targetStub);

      await sut.create({
        name: 'MinIO',
        kind: StorageTargetKind.S3,
        config: s3ConfigDto,
        secret: s3SecretDto,
        isEnabled: true,
      });

      expect(mocks.storageTarget.create).toHaveBeenCalledWith({
        name: 'MinIO',
        kind: StorageTargetKind.S3,
        config: s3Config,
        secret: s3Secret,
        isEnabled: true,
      });
    });
  });

  describe('update', () => {
    it('should keep the stored secret when none is supplied', async () => {
      mocks.storageTarget.get.mockResolvedValue(targetStub);
      mocks.storageTarget.update.mockResolvedValue(targetStub);

      await sut.update('target-1', { isEnabled: false });

      expect(mocks.storageTarget.update).toHaveBeenCalledWith(
        'target-1',
        expect.objectContaining({ secret: s3Secret, isEnabled: false }),
      );
    });

    it('should reject a config that is missing what the kind needs', async () => {
      mocks.storageTarget.get.mockResolvedValue(targetStub);

      await expect(sut.update('target-1', { config: { ...s3ConfigDto, bucket: '' } })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.storageTarget.update).not.toHaveBeenCalled();
    });

    it('should evict the cached driver so the next call uses the new config', async () => {
      mocks.storageTarget.get.mockResolvedValue(targetStub);
      mocks.storageTarget.update.mockResolvedValue(targetStub);

      await sut.update('target-1', { name: 'MinIO' });

      expect(mocks.remoteStorage.evict).toHaveBeenCalledWith('target-1');
    });
  });

  describe('test', () => {
    it('should report a failure in the body rather than throwing', async () => {
      mocks.storageTarget.get.mockResolvedValue(targetStub);
      mocks.remoteStorage.test.mockRejectedValue(new Error('Access Denied'));

      await expect(sut.test('target-1')).resolves.toEqual({ ok: false, error: 'Access Denied' });
    });

    it('should report success', async () => {
      mocks.storageTarget.get.mockResolvedValue(targetStub);
      mocks.remoteStorage.test.mockResolvedValue(void 0);

      await expect(sut.test('target-1')).resolves.toEqual({ ok: true });
    });
  });

  describe('startExport', () => {
    it('should refuse to use a disabled target', async () => {
      mocks.storageTarget.get.mockResolvedValue({ ...targetStub, isEnabled: false });

      await expect(
        sut.startExport('target-1', { ownerId: 'user-1', scope: { type: StorageTransferScopeType.All } }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should queue an export and return the transfer', async () => {
      mocks.storageTarget.get.mockResolvedValue(targetStub);
      mocks.user.get.mockResolvedValue({ id: 'user-1' } as never);
      mocks.storageTarget.createTransfer.mockResolvedValue(transferStub);

      const transfer = await sut.startExport('target-1', {
        ownerId: 'user-1',
        scope: { type: StorageTransferScopeType.All },
      });

      expect(transfer.id).toBe('transfer-1');
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: 'StorageTargetExportQueue',
        data: { transferId: 'transfer-1' },
      });
    });
  });

  describe('startImport', () => {
    it('should queue a scan of the target', async () => {
      mocks.storageTarget.get.mockResolvedValue(targetStub);
      mocks.user.get.mockResolvedValue({ id: 'user-1' } as never);
      mocks.storageTarget.createTransfer.mockResolvedValue({
        ...transferStub,
        direction: StorageTransferDirection.Import,
      });

      await sut.startImport('target-1', { ownerId: 'user-1', scope: { type: StorageTransferScopeType.All } });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: 'StorageTargetImportScan',
        data: { transferId: 'transfer-1' },
      });
    });
  });
});
