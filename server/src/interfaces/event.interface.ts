import { SystemConfig } from 'src/config';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/dtos/server.dto';

export const IEventRepository = 'IEventRepository';

export type SystemConfigUpdateEvent = { newConfig: SystemConfig; oldConfig: SystemConfig };
export type AlbumUpdateEvent = {
  id: string;
  /** user id */
  updatedBy: string;
};
export type AlbumInviteEvent = { id: string; userId: string };
export type UserSignupEvent = { notify: boolean; id: string; tempPassword?: string };

type MaybePromise<T> = Promise<T> | T;
type Handler<T = undefined> = (data: T) => MaybePromise<void>;

const noop = () => {};
const dummyHandlers = {
  // app events
  onBootstrapEvent: noop as Handler<'api' | 'microservices'>,
  onShutdownEvent: noop as () => MaybePromise<void>,

  // config events
  onConfigUpdateEvent: noop as Handler<SystemConfigUpdateEvent>,
  onConfigValidateEvent: noop as Handler<SystemConfigUpdateEvent>,

  // album events
  onAlbumUpdateEvent: noop as Handler<AlbumUpdateEvent>,
  onAlbumInviteEvent: noop as Handler<AlbumInviteEvent>,

  // user events
  onUserSignupEvent: noop as Handler<UserSignupEvent>,
};

export type EventHandlers = typeof dummyHandlers;
export type EmitEvent = keyof EventHandlers;
export type EmitEventHandler<T extends EmitEvent> = (...args: Parameters<EventHandlers[T]>) => MaybePromise<void>;
export const events = Object.keys(dummyHandlers) as EmitEvent[];
export type OnEvents = Partial<EventHandlers>;

export enum ClientEvent {
  UPLOAD_SUCCESS = 'on_upload_success',
  USER_DELETE = 'on_user_delete',
  ASSET_DELETE = 'on_asset_delete',
  ASSET_TRASH = 'on_asset_trash',
  ASSET_UPDATE = 'on_asset_update',
  ASSET_HIDDEN = 'on_asset_hidden',
  ASSET_RESTORE = 'on_asset_restore',
  ASSET_STACK_UPDATE = 'on_asset_stack_update',
  PERSON_THUMBNAIL = 'on_person_thumbnail',
  SERVER_VERSION = 'on_server_version',
  CONFIG_UPDATE = 'on_config_update',
  NEW_RELEASE = 'on_new_release',
}

export interface ClientEventMap {
  [ClientEvent.UPLOAD_SUCCESS]: AssetResponseDto;
  [ClientEvent.USER_DELETE]: string;
  [ClientEvent.ASSET_DELETE]: string;
  [ClientEvent.ASSET_TRASH]: string[];
  [ClientEvent.ASSET_UPDATE]: AssetResponseDto;
  [ClientEvent.ASSET_HIDDEN]: string;
  [ClientEvent.ASSET_RESTORE]: string[];
  [ClientEvent.ASSET_STACK_UPDATE]: string[];
  [ClientEvent.PERSON_THUMBNAIL]: string;
  [ClientEvent.SERVER_VERSION]: ServerVersionResponseDto;
  [ClientEvent.CONFIG_UPDATE]: Record<string, never>;
  [ClientEvent.NEW_RELEASE]: ReleaseNotification;
}

export enum ServerEvent {
  CONFIG_UPDATE = 'config.update',
  WEBSOCKET_CONNECT = 'websocket.connect',
}

export interface ServerEventMap {
  [ServerEvent.CONFIG_UPDATE]: null;
  [ServerEvent.WEBSOCKET_CONNECT]: { userId: string };
}

export interface IEventRepository {
  on<T extends EmitEvent>(event: T, handler: EmitEventHandler<T>): void;
  emit<T extends EmitEvent>(event: T, ...args: Parameters<EmitEventHandler<T>>): Promise<void>;

  /**
   * Send to connected clients for a specific user
   */
  clientSend<E extends keyof ClientEventMap>(event: E, userId: string, data: ClientEventMap[E]): void;
  /**
   * Send to all connected clients
   */
  clientBroadcast<E extends keyof ClientEventMap>(event: E, data: ClientEventMap[E]): void;
  /**
   * Notify listeners in this and connected processes. Subscribe to an event with `@OnServerEvent`
   */
  serverSend<E extends keyof ServerEventMap>(event: E, data: ServerEventMap[E]): boolean;
}
