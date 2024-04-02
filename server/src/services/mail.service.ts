import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { Transporter } from 'nodemailer';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnServerEvent } from 'src/decorators';
import { SystemConfigSmtpDto } from 'src/dtos/system-config.dto';
import { ServerAsyncEvent, ServerAsyncEventMap } from 'src/interfaces/event.interface';
import { IMailRepository, TemplateAdapter, TemplateRegistry } from 'src/interfaces/mail.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { ReactMailAdapter } from 'src/react-mail.adapter';
import { ImmichLogger } from 'src/utils/logger';
import { IEmailJob, JobStatus } from '../interfaces/job.interface';

@Injectable()
export class MailService extends EventEmitter {
  readonly logger = new ImmichLogger(MailService.name);
  private configCore: SystemConfigCore;
  private templateAdapter?: TemplateAdapter;
  private transporter?: Transporter;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMailRepository) private repository: IMailRepository,
  ) {
    super();
    this.configCore = SystemConfigCore.create(configRepository);
  }

  async init(templates: TemplateRegistry[]) {
    const config = await this.configCore.getConfig();
    const adapter = new ReactMailAdapter();

    // Register all the templates
    templates.forEach((template) => {
      adapter.registerTemplate(template.name, template.component);
    });
    this.templateAdapter = adapter;

    this.transporter = await this.initTransportWithTemplateAdapter(config.smtp, this.templateAdapter);
    this.logger.log(`Transporter is ready`);

    this.configCore.config$.subscribe(({ smtp }) => {
      this.initTransportWithTemplateAdapter(smtp, adapter).then((transporter) => {
        this.transporter = transporter;
        this.logger.log(`Transporter has been updated`);
      });
    });
  }

  @OnServerEvent(ServerAsyncEvent.CONFIG_VALIDATE)
  async onValidateConfig({ newConfig }: ServerAsyncEventMap[ServerAsyncEvent.CONFIG_VALIDATE]) {
    console.log('onValidateConfig', newConfig);
    return this.repository.buildTransport(newConfig.smtp.transport, newConfig.smtp.defaults).catch(() => {
      return Promise.reject(new Error(`Invalid SMTP configuration`));
    });
  }

  private initTransportWithTemplateAdapter(
    options: SystemConfigSmtpDto,
    templateAdapter: TemplateAdapter,
  ): Promise<Transporter> {
    return this.repository.buildTransport(options.transport, options.defaults).then((transporter) => {
      transporter.use('compile', (mail, callback) => {
        if (mail.data.html) {
          return callback();
        }

        return templateAdapter.compile(mail, callback, {
          pretty: false,
          plainText: true,
        });
      });

      return transporter;
    });
  }

  async handleQueueSendEmail({ template, options }: IEmailJob): Promise<JobStatus> {
    this.logger.debug('Cleaning up any pending email');

    if (!this.transporter) throw new Error('SMTP transporter is not available to send email!');

    const response = await this.repository.sendRawEmail(this.transporter, { template, ...options });
    if (!response) {
      return JobStatus.FAILED;
    }

    this.logger.log(`Sent mail with id: ${response.messageId} status: ${response.response}`);

    return JobStatus.SUCCESS;
  }
}
