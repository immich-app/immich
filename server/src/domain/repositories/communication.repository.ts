export const ICommunicationRepository = 'ICommunicationRepository';

export enum CommunicationEvent {
  UPLOAD_SUCCESS = 'on_upload_success',
  ASSET_DELETE = 'on_asset_delete',
  ASSET_TRASH = 'on_asset_trash',
  PERSON_THUMBNAIL = 'on_person_thumbnail',
  SERVER_VERSION = 'on_server_version',
  CONFIG_UPDATE = 'on_config_update',
}

export interface ICommunicationRepository {
  send(event: CommunicationEvent, userId: string, data: any): void;
  broadcast(event: CommunicationEvent, data: any): void;
}
