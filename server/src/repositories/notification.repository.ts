import { NotImplementedException } from '@nestjs/common';
import { render } from '@react-email/render';
import { createTransport } from 'nodemailer';
import React from 'react';
import { WelcomeEmail } from 'src/emails/welcome.email';
import {
  EmailRenderRequest,
  EmailTemplate,
  INotificationRepository,
  SendEmailOptions,
  SendEmailResponse,
  SmtpOptions,
} from 'src/interfaces/notification.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { ImmichLogger } from 'src/utils/logger';

@Instrumentation()
export class NotificationRepository implements INotificationRepository {
  private logger = new ImmichLogger(NotificationRepository.name);

  verifySmtp(options: SmtpOptions): Promise<true> {
    return this.createTransport(options).verify();
  }

  renderEmail(request: EmailRenderRequest): { html: string; text: string } {
    const component = this.render(request);
    const html = render(component, { pretty: true });
    const text = render(component, { plainText: true });
    return { html, text };
  }

  sendEmail({ to, from, subject, html, text, smtp }: SendEmailOptions): Promise<SendEmailResponse> {
    this.logger.debug(`Sending email to ${to} with subject: ${subject}`);
    return this.createTransport(smtp).sendMail({ to, from, subject, html, text });
  }

  private render({ template, data }: EmailRenderRequest): React.FunctionComponentElement<any> {
    switch (template) {
      case EmailTemplate.WELCOME: {
        return React.createElement(WelcomeEmail, data);
      }

      case EmailTemplate.RESET_PASSWORD: {
        throw new NotImplementedException();
      }
    }
  }

  private createTransport(options: SmtpOptions) {
    return createTransport({
      host: options.host,
      port: options.port,
      secure: options.port == 465, // STARTTLS is automatically detected
      auth:
        options.username || options.password
          ? {
              user: options.username,
              pass: options.password,
            }
          : undefined,
    });
  }
}
