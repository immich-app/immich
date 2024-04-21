import { Injectable, Scope } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { LogLevel } from 'src/entities/system-config.entity';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ImmichLogger } from 'src/utils/logger';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerRepository extends ImmichLogger implements ILoggerRepository {
  constructor(private cls: ClsService) {
    super(LoggerRepository.name);
  }

  protected formatContext(context: string): string {
    let formattedContext = super.formatContext(context);

    const correlationId = this.cls?.getId();
    if (correlationId && this.isLevelEnabled(LogLevel.VERBOSE)) {
      formattedContext += `[${correlationId}] `;
    }

    return formattedContext;
  }

  setLogLevel(level: LogLevel): void {
    ImmichLogger.setLogLevel(level);
  }
}
