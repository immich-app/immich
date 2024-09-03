import { Inject, Injectable } from '@nestjs/common';
import { render } from '@react-email/render';
import { createTransport } from 'nodemailer';
import React from 'react';
import { AlbumInviteEmail } from 'src/emails/album-invite.email';
import { AlbumUpdateEmail } from 'src/emails/album-update.email';
import { TestEmail } from 'src/emails/test.email';
import { WelcomeEmail } from 'src/emails/welcome.email';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  EmailRenderRequest,
  EmailTemplate,
  INotificationRepository,
  SendEmailOptions,
  SendEmailResponse,
  SmtpOptions,
} from 'src/interfaces/notification.interface';
import { Instrumentation } from 'src/utils/instrumentation';

@Instrumentation()
@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(NotificationRepository.name);
  }

  verifySmtp(options: SmtpOptions): Promise<true> {
    const transport = this.createTransport(options);
    try {
      return transport.verify();
    } finally {
      transport.close();
    }
  }

  async renderEmail(request: EmailRenderRequest): Promise<{ html: string; text: string }> {
    const component = this.render(request);
    const html = await render(component, { pretty: true });
    const text = await render(component, { plainText: true });
    return { html, text };
  }

  sendEmail({ to, from, subject, html, text, smtp, imageAttachments }: SendEmailOptions): Promise<SendEmailResponse> {
    this.logger.debug(`Sending email to ${to} with subject: ${subject}`);
    const transport = this.createTransport(smtp);

    const attachments = imageAttachments?.map((attachment) => ({
      filename: attachment.filename,
      path: attachment.path,
      cid: attachment.cid,
    }));

    try {
      return transport.sendMail({ to, from, subject, html, text, attachments });
    } finally {
      transport.close();
    }
  }

  private render({ template, data }: EmailRenderRequest): React.FunctionComponentElement<any> {
    switch (template) {
      case EmailTemplate.TEST_EMAIL: {
        return React.createElement(TestEmail, data);
      }

      case EmailTemplate.WELCOME: {
        return React.createElement(WelcomeEmail, data);
      }

      case EmailTemplate.ALBUM_INVITE: {
        return React.createElement(AlbumInviteEmail, data);
      }

      case EmailTemplate.ALBUM_UPDATE: {
        return React.createElement(AlbumUpdateEmail, data);
      }
    }
  }

  private createTransport(options: SmtpOptions) {
    return createTransport({
      host: options.host,
      port: options.port,
      tls: { rejectUnauthorized: !options.ignoreCert },
      auth:
        options.username || options.password
          ? {
              user: options.username,
              pass: options.password,
            }
          : undefined,
      connectionTimeout: 5000,
    });
  }
}
