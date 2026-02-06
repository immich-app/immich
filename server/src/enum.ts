export enum AuthType {
  Password = 'password',
}

export enum ImmichCookie {
  AccessToken = 'immich_access_token',
  AuthType = 'immich_auth_type',
  IsAuthenticated = 'immich_is_authenticated',
}

export enum ImmichHeader {
  ApiKey = 'x-api-key',
  UserToken = 'x-immich-user-token',
  SessionToken = 'x-immich-session-token',
  Checksum = 'x-immich-checksum',
  Cid = 'x-immich-cid',
}

export enum ImmichQuery {
  ApiKey = 'apiKey',
  SessionKey = 'sessionKey',
}

export enum DatabaseAction {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

export enum Permission {
  All = 'all',

  ApiKeyCreate = 'apiKey.create',
  ApiKeyRead = 'apiKey.read',
  ApiKeyUpdate = 'apiKey.update',
  ApiKeyDelete = 'apiKey.delete',

  AuthChangePassword = 'auth.changePassword',

  AuthDeviceDelete = 'authDevice.delete',

  SessionCreate = 'session.create',
  SessionRead = 'session.read',
  SessionUpdate = 'session.update',
  SessionDelete = 'session.delete',

  SystemMetadataRead = 'systemMetadata.read',
  SystemMetadataUpdate = 'systemMetadata.update',

  UserRead = 'user.read',
  UserUpdate = 'user.update',

  ServerAbout = 'server.about',

  AdminUserCreate = 'adminUser.create',
  AdminUserRead = 'adminUser.read',
  AdminUserUpdate = 'adminUser.update',
  AdminUserDelete = 'adminUser.delete',
}

export enum UserStatus {
  Active = 'active',
  Removing = 'removing',
  Deleted = 'deleted',
}

export enum SystemMetadataKey {
  AdminOnboarding = 'admin-onboarding',
  SystemConfig = 'system-config',
  SystemFlags = 'system-flags',
}

export enum LogLevel {
  Verbose = 'verbose',
  Debug = 'debug',
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}

export enum LogFormat {
  Console = 'console',
  Json = 'json',
}

export enum ApiCustomExtension {
  Permission = 'x-immich-permission',
  AdminOnly = 'x-immich-admin-only',
  History = 'x-immich-history',
  State = 'x-immich-state',
}

export enum MetadataKey {
  AuthRoute = 'auth_route',
  AdminRoute = 'admin_route',
  SharedRoute = 'shared_route',
  ApiKeySecurity = 'api_key',
  EventConfig = 'event_config',
  JobConfig = 'job_config',
  TelemetryEnabled = 'telemetry_enabled',
}

export enum RouteKey {
  User = 'users',
}

export enum CacheControl {
  PrivateWithCache = 'private_with_cache',
  PrivateWithoutCache = 'private_without_cache',
  None = 'none',
}

export enum ImmichEnvironment {
  Development = 'development',
  Testing = 'testing',
  Production = 'production',
}

export enum ImmichWorker {
  Api = 'api',
  Microservices = 'microservices',
}

export enum ImmichTelemetry {
  Host = 'host',
  Api = 'api',
  Io = 'io',
  Repo = 'repo',
  Job = 'job',
}

export enum DatabaseExtension {
  Vector = 'vector',
}

export enum BootstrapEventPriority {
  DatabaseService = -200,
  JobService = -190,
  SystemConfig = 100,
}

export enum QueueName {
  BackgroundTask = 'backgroundTask',
}

export enum JobName {
  UserDeleteCheck = 'UserDeleteCheck',
  UserDelete = 'UserDelete',
  SessionCleanup = 'SessionCleanup',
}

export enum JobStatus {
  Success = 'success',
  Failed = 'failed',
  Skipped = 'skipped',
}

export enum DatabaseLock {
  Migrations = 200,
  GetSystemConfig = 69,
}

export enum ExitCode {
  AppRestart = 7,
}

export enum ApiTag {
  ApiKeys = 'API keys',
  Authentication = 'Authentication',
  Server = 'Server',
  Sessions = 'Sessions',
  Users = 'Users',
}
