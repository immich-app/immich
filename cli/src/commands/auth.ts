import { getMyUserInfo } from '@immich/sdk';
import { existsSync } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { BaseOptions, connect, getAuthFilePath, logError, withError, writeAuthFile } from 'src/utils';

export const login = async (url: string, key: string, options: BaseOptions) => {
  console.log(`Logging in to ${url}`);

  const { configDirectory: configDir } = options;

  await connect(url, key);

  const [error, userInfo] = await withError(getMyUserInfo());
  if (error) {
    logError(error, 'Failed to load user info');
    process.exit(1);
  }

  console.log(`Logged in as ${userInfo.email}`);

  if (!existsSync(configDir)) {
    // Create config folder if it doesn't exist
    const created = await mkdir(configDir, { recursive: true });
    if (!created) {
      console.log(`Failed to create config folder: ${configDir}`);
      return;
    }
  }

  await writeAuthFile(configDir, { url, key });

  console.log(`Wrote auth info to ${getAuthFilePath(configDir)}`);
};

export const logout = async (options: BaseOptions) => {
  console.log('Logging out...');

  const { configDirectory: configDir } = options;

  const authFile = getAuthFilePath(configDir);

  if (existsSync(authFile)) {
    await unlink(authFile);
    console.log(`Removed auth file: ${authFile}`);
  }

  console.log('Successfully logged out');
};
