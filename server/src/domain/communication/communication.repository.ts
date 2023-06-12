export const ICommunicationRepository = 'ICommunicationRepository';

export enum CommunicationEvent {
  UPLOAD_SUCCESS = 'on_upload_success',
}

export interface ICommunicationRepository {
  send(event: CommunicationEvent, userId: string, data: any): void;
}
