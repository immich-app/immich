import { AssetResponseDto, ReleaseNotification, ServerVersionResponseDto } from '@app/domain';

export const ICommunicationRepository = 'ICommunicationRepository';

export enum ClientEvent {
  UPLOAD_SUCCESS = 'on_upload_success',
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

export interface ClientEventMap {
  [ClientEvent.UPLOAD_SUCCESS]: AssetResponseDto;
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

export type OnConnectCallback = (userId: string) => Promise<void>;
export type OnServerEventCallback = () => Promise<void>;

export interface ICommunicationRepository {
  send<E extends keyof ClientEventMap>(event: E, userId: string, data: ClientEventMap[E]): void;
  broadcast<E extends keyof ClientEventMap>(event: E, data: ClientEventMap[E]): void;
  on(event: 'connect', callback: OnConnectCallback): void;
  on(event: ServerEvent, callback: OnServerEventCallback): void;
  sendServerEvent(event: ServerEvent): void;
}
