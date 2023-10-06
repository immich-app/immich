export const ICommunicationRepository = 'ICommunicationRepository';

export enum CommunicationEvent {
  UPLOAD_SUCCESS = 'on_upload_success',
  CONFIG_UPDATE = 'on_config_update',
}

export interface ICommunicationRepository {
  send(event: CommunicationEvent, userId: string, data: any): void;
  broadcast(event: CommunicationEvent, data: any): void;
}
