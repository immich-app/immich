export const INotificationRepository = 'INotificationRepository';

export type EmailImageAttachment = {
  filename: string;
  path: string;
  cid: string;
};

export type SendEmailOptions = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  imageAttachments?: EmailImageAttachment[];
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
  TEST_EMAIL = 'test',

  // AUTH
  WELCOME = 'welcome',
  RESET_PASSWORD = 'reset-password',

  // ALBUM
  ALBUM_INVITE = 'album-invite',
  ALBUM_UPDATE = 'album-update',
}

interface BaseEmailProps {
  baseUrl: string;
}

export interface TestEmailProps extends BaseEmailProps {
  displayName: string;
}

export interface WelcomeEmailProps extends BaseEmailProps {
  displayName: string;
  username: string;
  password?: string;
}

export interface AlbumInviteEmailProps extends BaseEmailProps {
  albumName: string;
  albumId: string;
  senderName: string;
  recipientName: string;
  cid?: string;
}

export interface AlbumUpdateEmailProps extends BaseEmailProps {
  albumName: string;
  albumId: string;
  recipientName: string;
  cid?: string;
}

export type EmailRenderRequest =
  | {
      template: EmailTemplate.TEST_EMAIL;
      data: TestEmailProps;
    }
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
  renderEmail(request: EmailRenderRequest): Promise<{ html: string; text: string }>;
  sendEmail(options: SendEmailOptions): Promise<SendEmailResponse>;
  verifySmtp(options: SmtpOptions): Promise<true>;
}
