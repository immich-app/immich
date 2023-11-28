export const ICommunicationRepository = 'ICommunicationRepository';

export enum CommunicationEvent {
  UPLOAD_SUCCESS = 'on_upload_success',
  ASSET_DELETE = 'on_asset_delete',
  ASSET_TRASH = 'on_asset_trash',
  ASSET_UPDATE = 'on_asset_update',
  ASSET_RESTORE = 'on_asset_restore',
  PERSON_THUMBNAIL = 'on_person_thumbnail',
  SERVER_VERSION = 'on_server_version',
  CONFIG_UPDATE = 'on_config_update',
  NEW_RELEASE = 'on_new_release',
}

export type Callback = (userId: string) => Promise<void>;

export interface ICommunicationRepository {
  send(event: CommunicationEvent, userId: string, data: any): void;
  broadcast(event: CommunicationEvent, data: any): void;
  addEventListener(event: 'connect', callback: Callback): void;
}
