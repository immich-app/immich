import { Insertable, Kysely } from 'kysely';
import { randomBytes } from 'node:crypto';
import { Writable } from 'node:stream';
import { Assets, DB, Partners, Sessions, Users } from 'src/db';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { MoveRepository } from 'src/repositories/move.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { OAuthRepository } from 'src/repositories/oauth.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { TrashRepository } from 'src/repositories/trash.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { ViewRepository } from 'src/repositories/view-repository';
import { newTelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { newUuid } from 'test/small.factory';
import { automock } from 'test/utils';

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

type Asset = Partial<Insertable<Assets>>;
type User = Partial<Insertable<Users>>;
type Session = Omit<Insertable<Sessions>, 'token'> & { token?: string };
type Partner = Insertable<Partners>;

export class TestFactory {
  private assets: Asset[] = [];
  private sessions: Session[] = [];
  private users: User[] = [];
  private partners: Partner[] = [];

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

  static partner(partner: Partner) {
    const defaults = {
      inTimeline: true,
    };

    return {
      ...defaults,
      ...partner,
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

  withPartner(partner: Partner) {
    this.partners.push(partner);
    return this;
  }

  async create() {
    for (const user of this.users) {
      await this.context.createUser(user);
    }

    for (const partner of this.partners) {
      await this.context.createPartner(partner);
    }

    for (const session of this.sessions) {
      await this.context.createSession(session);
    }

    for (const asset of this.assets) {
      await this.context.createAsset(asset);
    }

    return this.context;
  }
}

export class TestContext {
  access: AccessRepository;
  logger: LoggingRepository;
  activity: ActivityRepository;
  album: AlbumRepository;
  apiKey: ApiKeyRepository;
  asset: AssetRepository;
  audit: AuditRepository;
  config: ConfigRepository;
  library: LibraryRepository;
  machineLearning: MachineLearningRepository;
  media: MediaRepository;
  metadata: MetadataRepository;
  move: MoveRepository;
  notification: NotificationRepository;
  oauth: OAuthRepository;
  partner: PartnerRepository;
  person: PersonRepository;
  process: ProcessRepository;
  search: SearchRepository;
  serverInfo: ServerInfoRepository;
  session: SessionRepository;
  sharedLink: SharedLinkRepository;
  stack: StackRepository;
  storage: StorageRepository;
  sync: SyncRepository;
  telemetry: TelemetryRepository;
  trash: TrashRepository;
  user: UserRepository;
  versionHistory: VersionHistoryRepository;
  view: ViewRepository;

  private constructor(public db: Kysely<DB>) {
    const logger = automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false });
    const config = new ConfigRepository();

    this.access = new AccessRepository(this.db);
    this.logger = logger;
    this.activity = new ActivityRepository(this.db);
    this.album = new AlbumRepository(this.db);
    this.apiKey = new ApiKeyRepository(this.db);
    this.asset = new AssetRepository(this.db);
    this.audit = new AuditRepository(this.db);
    this.config = config;
    this.library = new LibraryRepository(this.db);
    this.machineLearning = new MachineLearningRepository(logger);
    this.media = new MediaRepository(logger);
    this.metadata = new MetadataRepository(logger);
    this.move = new MoveRepository(this.db);
    this.notification = new NotificationRepository(logger);
    this.oauth = new OAuthRepository(logger);
    this.partner = new PartnerRepository(this.db);
    this.person = new PersonRepository(this.db);
    this.process = new ProcessRepository(logger);
    this.search = new SearchRepository(logger, this.db);
    this.serverInfo = new ServerInfoRepository(config, logger);
    this.session = new SessionRepository(this.db);
    this.sharedLink = new SharedLinkRepository(this.db);
    this.stack = new StackRepository(this.db);
    this.storage = new StorageRepository(logger);
    this.sync = new SyncRepository(this.db);
    this.telemetry = newTelemetryRepositoryMock() as unknown as TelemetryRepository;
    this.trash = new TrashRepository(this.db);
    this.user = new UserRepository(this.db);
    this.versionHistory = new VersionHistoryRepository(this.db);
    this.view = new ViewRepository(this.db);
  }

  static from(db: Kysely<DB>) {
    return new TestContext(db).getFactory();
  }

  getFactory() {
    return TestFactory.create(this);
  }

  createUser(user: User = {}) {
    return this.user.create(TestFactory.user(user));
  }

  createPartner(partner: Partner) {
    return this.partner.create(TestFactory.partner(partner));
  }

  createAsset(asset: Asset) {
    return this.asset.create(TestFactory.asset(asset));
  }

  createSession(session: Session) {
    return this.session.create(TestFactory.session(session));
  }
}
