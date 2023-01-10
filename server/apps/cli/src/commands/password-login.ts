import { SystemConfigEntity, SystemConfigKey } from '@app/database';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Command, CommandRunner } from 'nest-commander';
import { Repository } from 'typeorm';

@Command({
  name: 'enable-password-login',
  description: 'Enable password login',
})
export class EnablePasswordLoginCommand extends CommandRunner {
  constructor(
    @InjectRepository(SystemConfigEntity) private repository: Repository<SystemConfigEntity>, //
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.repository.delete({ key: SystemConfigKey.PASSWORD_LOGIN_ENABLED });
    await axios.post('http://localhost:3001/refresh-config');
    console.log('Password login has been enabled.');
  }
}

@Command({
  name: 'disable-password-login',
  description: 'Disable password login',
})
export class DisablePasswordLoginCommand extends CommandRunner {
  constructor(@InjectRepository(SystemConfigEntity) private repository: Repository<SystemConfigEntity>) {
    super();
  }

  async run(): Promise<void> {
    await this.repository.save({ key: SystemConfigKey.PASSWORD_LOGIN_ENABLED, value: false });
    await axios.post('http://localhost:3001/refresh-config');
    console.log('Password login has been disabled.');
  }
}
