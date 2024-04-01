import { Inject } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { IMailRepository, MailOptions, MailResponse, SendMailOptions } from 'src/interfaces/mail.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { ImmichLogger } from 'src/utils/logger';
import { SystemConfigSmtpDefaultsDto, SystemConfigSmtpTransportDto } from '../dtos/system-config.dto';

@Instrumentation()
export class MailRepository implements IMailRepository {
  private logger = new ImmichLogger(MailRepository.name);

  constructor(@Inject(IJobRepository) private jobRepository: IJobRepository) {}

  buildTransport(options: SystemConfigSmtpTransportDto, defaults?: SystemConfigSmtpDefaultsDto): Promise<Transporter> {
    const { host, port, username, password } = options;

    const transporter = createTransport(
      {
        host,
        port,
        secure: port == 465, // STARTTLS is automatically detected
        auth: {
          user: username,
          pass: password,
        },
      },
      defaults,
    );

    return this.verifyTransporter(transporter).then((valid) => {
      if (valid) return transporter;
      throw new Error(`Invalid configuration for transporter ${options}`);
    });
  }

  verifyTransporter(transporter: Transporter): Promise<boolean> {
    return transporter.verify().catch((error) => {
      this.logger.error(`Error occurred while verifying the transporter: ${error.message}`);
      return Promise.resolve(false);
    });
  }

  sendRawEmail(transporter: Transporter, options: SendMailOptions): Promise<MailResponse> {
    return transporter.sendMail(options).then((success: MailResponse) => {
      const { messageId, response } = success;
      return { messageId, response };
    });
  }

  // queueSendEmailEmail(template: string, options: MailOptions): Promise<void> {
  //   return this.jobRepository.queue({
  //     name: JobName.NOTIFY_SEND_EMAIL,
  //     data: {
  //       template,
  //       options,
  //     },
  //   });
  // }
}
