import { existsSync } from 'fs';
import { access, constants, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';
import { ImmichApi } from './api.service';

class LoginError extends Error {
  constructor(message: string) {
    super(message);

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class SessionService {
  readonly configDir!: string;
  readonly authPath!: string;

  constructor(configDir: string) {
    this.configDir = configDir;
    this.authPath = path.join(configDir, '/auth.yml');
  }

  async connect(): Promise<ImmichApi> {
    let instanceUrl = process.env.IMMICH_INSTANCE_URL;
    let apiKey = process.env.IMMICH_API_KEY;

    if (!instanceUrl || !apiKey) {
      await access(this.authPath, constants.F_OK).catch((error) => {
        if (error.code === 'ENOENT') {
          throw new LoginError('No auth file exist. Please login first');
        }
      });

      const data: string = await readFile(this.authPath, 'utf8');
      const parsedConfig = yaml.parse(data);

      instanceUrl = parsedConfig.instanceUrl;
      apiKey = parsedConfig.apiKey;

      if (!instanceUrl) {
        throw new LoginError(`Instance URL missing in auth config file ${this.authPath}`);
      }

      if (!apiKey) {
        throw new LoginError(`API key missing in auth config file ${this.authPath}`);
      }
    }

    const api = new ImmichApi(instanceUrl, apiKey);

    const { data: pingResponse } = await api.serverInfoApi.pingServer().catch((error) => {
      throw new Error(`Failed to connect to server ${api.instanceUrl}: ${error.message}`);
    });

    if (pingResponse.res !== 'pong') {
      throw new Error(`Could not parse response. Is Immich listening on ${api.instanceUrl}?`);
    }

    return api;
  }

  async login(instanceUrl: string, apiKey: string): Promise<ImmichApi> {
    console.log('Logging in...');

    const api = new ImmichApi(instanceUrl, apiKey);

    // Check if server and api key are valid
    const { data: userInfo } = await api.userApi.getMyUserInfo().catch((error) => {
      throw new LoginError(`Failed to connect to server ${instanceUrl}: ${error.message}`);
    });

    console.log(`Logged in as ${userInfo.email}`);

    if (!existsSync(this.configDir)) {
      // Create config folder if it doesn't exist
      const created = await mkdir(this.configDir, { recursive: true });
      if (!created) {
        throw new Error(`Failed to create config folder ${this.configDir}`);
      }
    }

    await writeFile(this.authPath, yaml.stringify({ instanceUrl, apiKey }));

    console.log('Wrote auth info to ' + this.authPath);

    return api;
  }

  async logout(): Promise<void> {
    console.log('Logging out...');

    if (existsSync(this.authPath)) {
      await unlink(this.authPath);
      console.log('Removed auth file ' + this.authPath);
    }

    console.log('Successfully logged out');
  }
}
