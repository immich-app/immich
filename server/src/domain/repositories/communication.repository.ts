export const ICommunicationRepository = 'ICommunicationRepository';

export enum ClientEvent {
  UPLOAD_SUCCESS = 'on_upload_success',
  ASSET_DELETE = 'on_asset_delete',
  ASSET_TRASH = 'on_asset_trash',
  ASSET_UPDATE = 'on_asset_update',
  ASSET_HIDDEN = 'on_asset_hidden',
  ASSET_RESTORE = 'on_asset_restore',
  PERSON_THUMBNAIL = 'on_person_thumbnail',
  SERVER_VERSION = 'on_server_version',
  CONFIG_UPDATE = 'on_config_update',
  NEW_RELEASE = 'on_new_release',
}

export enum ServerEvent {
  CONFIG_UPDATE = 'config:update',
}

export type OnConnectCallback = (userId: string) => Promise<void>;
export type OnServerEventCallback = () => Promise<void>;

export interface ICommunicationRepository {
  send(event: ClientEvent, userId: string, data: any): void;
  broadcast(event: ClientEvent, data: any): void;
  on(event: 'connect', callback: OnConnectCallback): void;
  on(event: ServerEvent, callback: OnServerEventCallback): void;
  sendServerEvent(event: ServerEvent): void;
}
