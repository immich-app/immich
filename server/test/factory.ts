import { Insertable, Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { randomBytes, randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { AssetJobStatus, Assets, DB, Exif, Sessions, Users } from 'src/db';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFileType, AssetType } from 'src/enum';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';

class CustomWritable extends Writable {
  private data = '';

  _write(chunk: any, encoding: string, callback: () => void) {
    this.data += chunk.toString();
    callback();
  }

  getResponse() {
    const result = this.data;
    return result
      .split('\n')
      .filter((x) => x.length > 0)
      .map((x) => JSON.parse(x));
  }
}
//  deviceAssetId, deviceId, originalFileName, originalPath, type
type Asset = Omit<
  Insertable<Assets>,
  'checksum' | 'deviceAssetId' | 'deviceId' | 'originalFileName' | 'originalPath' | 'type'
> & {
  checksum?: Buffer;
  deviceAssetId?: string;
  deviceId?: string;
  originalFileName?: string;
  originalPath?: string;
  type?: AssetType;
};
type User = Partial<Insertable<Users>>;
type Session = Omit<Insertable<Sessions>, 'token'> & { token?: string };
type JobStatus = Omit<Partial<Insertable<AssetJobStatus>>, 'assetId'> & { assetId: string };
type AssetFile = { assetId: string; type: AssetFileType; path: string };
type AssetExif = Insertable<Exif>;
type FactoryOptions = { assetJobStatus?: boolean; assetFiles?: boolean; assetExif?: boolean };

const DEFAULT_OPTIONS = {
  assetJobStatus: false,
  assetFiles: false,
  assetExif: false,
};

export const newUuid = () => randomUUID() as string;

export class TestFactory {
  private assets: Asset[] = [];
  private assetJobs: JobStatus[] = [];
  private assetFiles: AssetFile[] = [];
  private assetExif: AssetExif[] = [];
  private options: FactoryOptions = DEFAULT_OPTIONS;
  private sessions: Session[] = [];
  private users: User[] = [];

  private constructor(private context: TestContext) {}

  private clear() {
    this.assets = [];
    this.assetJobs = [];
    this.assetFiles = [];
    this.assetExif = [];
    this.options = DEFAULT_OPTIONS;
    this.sessions = [];
    this.users = [];
  }

  static create(context: TestContext) {
    return new TestFactory(context);
  }

  static stream() {
    return new CustomWritable();
  }

  static asset(asset: Asset) {
    const assetId = asset.id || newUuid();
    const defaults: Omit<Insertable<Assets>, 'ownerId'> = {
      deviceAssetId: newUuid(),
      deviceId: newUuid(),
      originalFileName: `${assetId}-file.jpg`,
      checksum: randomBytes(32),
      type: AssetType.IMAGE,
      originalPath: '/path/to/something.jpg',
      isVisible: true,
    };

    return {
      ...defaults,
      ...asset,
      id: assetId,
    };
  }

  static assetJobStatus(job: JobStatus): Insertable<AssetJobStatus> {
    const date = DateTime.now().minus({ days: 15 }).toISO();
    const defaults: Omit<Insertable<AssetJobStatus>, 'assetId'> = {
      duplicatesDetectedAt: date,
      facesRecognizedAt: date,
      metadataExtractedAt: date,
      previewAt: date,
      thumbnailAt: date,
    };

    return {
      ...defaults,
      ...job,
    };
  }

  static auth(auth: { user: User; session?: Session }) {
    return auth as AuthDto;
  }

  static user(user: User = {}) {
    const userId = user.id || newUuid();
    const defaults: Insertable<Users> = {
      email: `${userId}@immich.cloud`,
      name: `User ${userId}`,
      deletedAt: null,
    };

    return {
      ...defaults,
      ...user,
      id: userId,
    };
  }

  static session(session: Session) {
    const id = session.id || newUuid();
    const defaults = {
      token: randomBytes(36).toString('base64url'),
    };

    return {
      ...defaults,
      ...session,
      id,
    };
  }

  withOptions(options: Partial<FactoryOptions>) {
    this.options = { ...this.options, ...options };
    return this;
  }

  withAsset(asset: Asset) {
    this.assets.push(asset);
    return this;
  }

  withAssets(assets: Asset[]) {
    this.assets.push(...assets);
    return this;
  }

  withAssetJob(job: JobStatus) {
    this.assetJobs.push(job);
    return this;
  }

  withAssetJobs(jobs: JobStatus[]) {
    this.assetJobs.push(...jobs);
    return this;
  }

  withSession(session: Session) {
    this.sessions.push(session);
    return this;
  }

  withUser(user: User = {}) {
    this.users.push(user);
    return this;
  }

  async create() {
    for (const user of this.users) {
      await this.context.createUser(user);
    }

    for (const asset of this.assets) {
      const entity = await this.context.createAsset(asset);
      if (this.options.assetJobStatus) {
        this.assetJobs.push({ assetId: entity.id });
      }

      if (this.options.assetFiles) {
        this.assetFiles.push(
          { assetId: entity.id, type: AssetFileType.PREVIEW, path: '/path/to/preview.jpg' },
          { assetId: entity.id, type: AssetFileType.THUMBNAIL, path: '/path/to/thumbnail.jpg' },
        );
      }

      if (this.options.assetExif) {
        this.assetExif.push({ assetId: entity.id, make: 'Cannon' });
      }
    }

    for (const assetJob of this.assetJobs) {
      await this.context.createAssetJobStatus(assetJob);
    }

    for (const assetFile of this.assetFiles) {
      await this.context.createAssetFile(assetFile);
    }

    for (const assetExif of this.assetExif) {
      await this.context.createAssetExif(assetExif);
    }

    for (const session of this.sessions) {
      await this.context.createSession(session);
    }

    this.clear();

    return this.context;
  }
}

export class TestContext {
  userRepository: UserRepository;
  assetRepository: AssetRepository;
  albumRepository: AlbumRepository;
  memoryRepository: MemoryRepository;
  sessionRepository: SessionRepository;
  syncRepository: SyncRepository;
  systemMetadataRepository: SystemMetadataRepository;

  private constructor(private db: Kysely<DB>) {
    this.userRepository = new UserRepository(this.db);
    this.assetRepository = new AssetRepository(this.db);
    this.albumRepository = new AlbumRepository(this.db);
    this.memoryRepository = new MemoryRepository(this.db);
    this.sessionRepository = new SessionRepository(this.db);
    this.syncRepository = new SyncRepository(this.db);
    this.systemMetadataRepository = new SystemMetadataRepository(this.db);
  }

  static from(db: Kysely<DB>) {
    return new TestContext(db).getFactory();
  }

  getFactory() {
    return TestFactory.create(this);
  }

  createUser(user: User = {}) {
    return this.userRepository.create(TestFactory.user(user));
  }

  createAsset(asset: Asset) {
    return this.assetRepository.create(TestFactory.asset(asset));
  }

  createAssetJobStatus(jobStatus: JobStatus) {
    return this.assetRepository.upsertJobStatus(TestFactory.assetJobStatus(jobStatus));
  }

  createAssetFile(assetFile: AssetFile) {
    return this.assetRepository.upsertFile(assetFile);
  }

  createAssetExif(assetExif: AssetExif) {
    return this.assetRepository.upsertExif(assetExif);
  }

  createSession(session: Session) {
    return this.sessionRepository.create(TestFactory.session(session));
  }
}
