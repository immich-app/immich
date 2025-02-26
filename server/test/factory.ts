import { Insertable, Kysely } from 'kysely';
import { randomBytes, randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { Assets, DB, Sessions, Users } from 'src/db';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetType } from 'src/enum';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
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

type Asset = Insertable<Assets>;
type User = Partial<Insertable<Users>>;
type Session = Omit<Insertable<Sessions>, 'token'> & { token?: string };

export const newUuid = () => randomUUID() as string;

export class TestFactory {
  private assets: Asset[] = [];
  private sessions: Session[] = [];
  private users: User[] = [];

  private constructor(private context: TestContext) {}

  static create(context: TestContext) {
    return new TestFactory(context);
  }

  static stream() {
    return new CustomWritable();
  }

  static asset(asset: Asset) {
    const assetId = asset.id || newUuid();
    const defaults: Insertable<Assets> = {
      deviceAssetId: '',
      deviceId: '',
      originalFileName: '',
      checksum: randomBytes(32),
      type: AssetType.IMAGE,
      originalPath: '/path/to/something.jpg',
      ownerId: '@immich.cloud',
      isVisible: true,
    };

    return {
      ...defaults,
      ...asset,
      id: assetId,
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

  withAsset(asset: Asset) {
    this.assets.push(asset);
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
    for (const asset of this.assets) {
      await this.context.createAsset(asset);
    }

    for (const user of this.users) {
      await this.context.createUser(user);
    }

    for (const session of this.sessions) {
      await this.context.createSession(session);
    }

    return this.context;
  }
}

export class TestContext {
  userRepository: UserRepository;
  assetRepository: AssetRepository;
  albumRepository: AlbumRepository;
  sessionRepository: SessionRepository;
  syncRepository: SyncRepository;

  private constructor(private db: Kysely<DB>) {
    this.userRepository = new UserRepository(this.db);
    this.assetRepository = new AssetRepository(this.db);
    this.albumRepository = new AlbumRepository(this.db);
    this.sessionRepository = new SessionRepository(this.db);
    this.syncRepository = new SyncRepository(this.db);
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

  createSession(session: Session) {
    return this.sessionRepository.create(TestFactory.session(session));
  }
}
