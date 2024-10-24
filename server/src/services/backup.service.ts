import { Injectable } from '@nestjs/common';
import { exec } from 'node:child_process';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
import { StorageFolder } from 'src/enum';
import { DatabaseLock } from 'src/interfaces/database.interface';
import { ArgOf } from 'src/interfaces/event.interface';
import { JobName, JobStatus } from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';
import { handlePromiseError } from 'src/utils/misc';
import { validateCronExpression } from 'src/validation';

@Injectable()
export class BackupService extends BaseService {
  private backupLock = false;

  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap() {
    const config = await this.getConfig({ withCache: false });

    const { database } = config.backups;

    // This ensures that backups only occur in one microservice
    this.backupLock = await this.databaseRepository.tryLock(DatabaseLock.BackupDatabase);

    this.jobRepository.addCronJob(
      'backupDatabase',
      database.cronExpression,
      () => handlePromiseError(this.jobRepository.queue({ name: JobName.BACKUP_DATABASE }), this.logger),
      database.enabled,
    );
  }

  @OnEvent({ name: 'config.update', server: true })
  onConfigUpdate({ newConfig: { backups }, oldConfig }: ArgOf<'config.update'>) {
    if (!oldConfig || !this.backupLock) {
      return;
    }

    this.jobRepository.updateCronJob('backupDatabase', backups.database.cronExpression, backups.database.enabled);
  }

  @OnEvent({ name: 'config.validate' })
  onConfigValidate({ newConfig }: ArgOf<'config.validate'>) {
    const { database } = newConfig.backups;
    if (!validateCronExpression(database.cronExpression)) {
      throw new Error(`Invalid cron expression ${database.cronExpression}`);
    }
  }

  async handleBackupDatabase(): Promise<JobStatus> {
    this.logger.debug(`Backing up database`);
    const env = this.configRepository.getEnv();

    try {
      await new Promise<void>((resolve) => {
        const backup = exec(
          `pg_dumpall -U ${env.database.username} -h ${env.database.host} --clean --if-exists | gzip > "${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/${Date.now()}-database-dump.sql.gz"`,
          {
            env: { PATH: process.env.PATH, PGPASSWORD: env.database.password },
          },
        );

        if (!backup.stderr || !backup.stdout) {
          throw new Error('Backup failed, could not spawn backup process');
        }

        let logs = '';

        backup.stderr.on('data', (data) => (logs += data));
        backup.stdout.on('data', (data) => (logs += data));

        backup.on('exit', (code) => {
          if (code === 0) {
            this.logger.log(logs);
            resolve();
          } else {
            this.logger.error(`Backup failed with code ${code}, command output follows`);
            this.logger.error(logs);
            throw new Error(`Backup failed with code ${code}`);
          }
        });
      });
    } catch {
      return JobStatus.FAILED;
    }

    return JobStatus.SUCCESS;
  }
}
