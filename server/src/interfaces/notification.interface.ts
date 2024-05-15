import { Attachment } from 'nodemailer/lib/mailer';

export const INotificationRepository = 'INotificationRepository';

export type SendEmailOptions = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[] | undefined;
  smtp: SmtpOptions;
};

export type SmtpOptions = {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  ignoreCert?: boolean;
};

export enum EmailTemplate {
  // COMMON
  WELCOME = 'welcome',
  RESET_PASSWORD = 'reset-password',

  // ALBUM
  ALBUM_INVITE = 'album-invite',
  ALBUM_UPDATE = 'album-update',
}

export interface WelcomeEmailProps {
  baseUrl: string;
  displayName: string;
  username: string;
  password?: string;
}

export interface AlbumInviteEmailProps {
  baseUrl: string;
  albumName: string;
  albumId: string;
  ownerName: string;
  guestName: string;
  thumbnailData?: string;
}

export interface AlbumUpdateEmailProps {
  baseUrl: string;
  albumName: string;
  albumId: string;
  userName: string;
}

export type EmailRenderRequest =
  | {
      template: EmailTemplate.WELCOME;
      data: WelcomeEmailProps;
    }
  | {
      template: EmailTemplate.ALBUM_INVITE;
      data: AlbumInviteEmailProps;
    }
  | {
      template: EmailTemplate.ALBUM_UPDATE;
      data: AlbumUpdateEmailProps;
    };

export type SendEmailResponse = {
  messageId: string;
  response: any;
};

export interface INotificationRepository {
  renderEmail(request: EmailRenderRequest): { html: string; text: string };
  sendEmail(options: SendEmailOptions): Promise<SendEmailResponse>;
  verifySmtp(options: SmtpOptions): Promise<true>;
}
