import { SendMailOptions as NodemailerMailOptions, Transporter } from 'nodemailer';
import { SystemConfigSmtpDefaultsDto, SystemConfigSmtpTransportDto } from '../dtos/system-config.dto';

export const IMailRepository = 'IMailRepository';

export interface MailOptions extends NodemailerMailOptions {
  context?: {
    [name: string]: any;
  };
}

export interface SendMailOptions extends MailOptions {
  template?: string;
}

export type MailResponse = {
  messageId: string;
  response: string;
};

export interface TemplateRegistry {
  name: string;
  component: any;
}

export interface TemplateAdapterOptions {
  plainText: boolean;
  pretty: boolean;

  [name: string]: any;
}

export interface TemplateAdapter {
  compile(mail: any, callback: (err?: any, body?: string) => any, options: TemplateAdapterOptions): void;
}

export interface IMailRepository {
  /**
   * Build a new Transporter based on specified options
   */
  buildTransport(options: SystemConfigSmtpTransportDto, defaults?: SystemConfigSmtpDefaultsDto): Promise<Transporter>;

  /**
   * Verify if specified transporter is valid
   */
  verifyTransporter(transporter: Transporter): Promise<boolean>;

  /**
   * Send email immediately don't wait for response.
   */
  sendRawEmail(transporter: Transporter, options: SendMailOptions): Promise<MailResponse>;

  /**
   * Send an email with specified template and options. Queue the Job.
   */
  queueSendEmailEmail(template: string, options: MailOptions): Promise<void>;
}
