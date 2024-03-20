import { AssetResponseDto } from 'src/domain/asset/response-dto/asset-response.dto';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/domain/server-info/server-info.dto';
import { SystemConfig } from 'src/infra/entities/system-config.entity';

export const ICommunicationRepository = 'ICommunicationRepository';

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

export enum ServerEvent {
  CONFIG_UPDATE = 'config:update',
}

export enum InternalEvent {
  VALIDATE_CONFIG = 'validate_config',
}

export interface InternalEventMap {
  [InternalEvent.VALIDATE_CONFIG]: { newConfig: SystemConfig; oldConfig: SystemConfig };
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

export type OnConnectCallback = (userId: string) => void | Promise<void>;
export type OnServerEventCallback = () => Promise<void>;

export interface ICommunicationRepository {
  send<E extends keyof ClientEventMap>(event: E, userId: string, data: ClientEventMap[E]): void;
  broadcast<E extends keyof ClientEventMap>(event: E, data: ClientEventMap[E]): void;
  on(event: 'connect', callback: OnConnectCallback): void;
  on(event: ServerEvent, callback: OnServerEventCallback): void;
  sendServerEvent(event: ServerEvent): void;
  emit<E extends keyof InternalEventMap>(event: E, data: InternalEventMap[E]): boolean;
  emitAsync<E extends keyof InternalEventMap>(event: E, data: InternalEventMap[E]): Promise<any>;
}
