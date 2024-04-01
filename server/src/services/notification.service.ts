import { Inject, Injectable } from '@nestjs/common';
import { ImmichLogger } from 'src/utils/logger';
import { IMailRepository } from 'src/interfaces/mail.interface';

@Injectable()
export class NotificationService {
  private logger = new ImmichLogger(NotificationService.name);

  constructor(@Inject(IMailRepository) private mailRepository: IMailRepository) {}
}
