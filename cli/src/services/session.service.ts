import fs from 'node:fs';
import yaml from 'yaml';
import path from 'node:path';
import { ImmichApi } from '../api/client';
import { LoginError } from '../cores/errors/login-error';

export class SessionService {
  readonly configDir: string;
  readonly authPath!: string;
  private api!: ImmichApi;

  constructor(configDir: string) {
    this.configDir = configDir;
    this.authPath = path.join(this.configDir, 'auth.yml');
  }

  public async connect(): Promise<ImmichApi> {
    await fs.promises.access(this.authPath, fs.constants.F_OK).catch((error) => {
      if (error.code === 'ENOENT') {
        throw new LoginError('No auth file exist. Please login first');
      }
    });

    const data: string = await fs.promises.readFile(this.authPath, 'utf8');
    const parsedConfig = yaml.parse(data);
    const instanceUrl: string = parsedConfig.instanceUrl;
    const apiKey: string = parsedConfig.apiKey;

    if (!instanceUrl) {
      throw new LoginError('Instance URL missing in auth config file ' + this.authPath);
    }

    if (!apiKey) {
      throw new LoginError('API key missing in auth config file ' + this.authPath);
    }

    this.api = new ImmichApi(instanceUrl, apiKey);

    await this.ping();

    return this.api;
  }

  public async keyLogin(instanceUrl: string, apiKey: string): Promise<ImmichApi> {
    this.api = new ImmichApi(instanceUrl, apiKey);

    // Check if server and api key are valid
    const { data: userInfo } = await this.api.userApi.getMyUserInfo().catch((error) => {
      throw new LoginError(`Failed to connect to server ${instanceUrl}: ${error.message}`);
    });

    console.log(`Logged in as ${userInfo.email}`);

    if (!fs.existsSync(this.configDir)) {
      // Create config folder if it doesn't exist
      const created = await fs.promises.mkdir(this.configDir, { recursive: true });
      if (!created) {
        throw new Error(`Failed to create config folder ${this.configDir}`);
      }
    }

    if (!fs.existsSync(this.configDir)) {
      console.error('waah');
    }

    fs.writeFileSync(this.authPath, yaml.stringify({ instanceUrl, apiKey }));

    console.log('Wrote auth info to ' + this.authPath);
    return this.api;
  }

  public async logout(): Promise<void> {
    if (fs.existsSync(this.authPath)) {
      fs.unlinkSync(this.authPath);
      console.log('Removed auth file ' + this.authPath);
    }
  }

  private async ping(): Promise<void> {
    const { data: pingResponse } = await this.api.serverInfoApi.pingServer().catch((error) => {
      throw new Error(`Failed to connect to server ${this.api.apiConfiguration.instanceUrl}: ${error.message}`);
    });

    if (pingResponse.res !== 'pong') {
      throw new Error('Unexpected ping reply');
    }
  }
}
