import { BaseOptionsDto } from 'src/cores/dto/base-options-dto';
import fs from 'node:fs';
import path from 'node:path';

export const TEST_CONFIG_DIR = '/tmp/immich/';
export const TEST_AUTH_FILE = path.join(TEST_CONFIG_DIR, 'auth.yml');
export const TEST_IMMICH_INSTANCE_URL = 'https://test/api';
export const TEST_IMMICH_API_KEY = 'pNussssKSYo5WasdgalvKJ1n9kdvaasdfbluPg';

export const CLI_BASE_OPTIONS: BaseOptionsDto = { config: TEST_CONFIG_DIR };

export const spyOnConsole = () => jest.spyOn(console, 'log').mockImplementation();

export const createTestAuthFile = async (contents: string) => {
  if (!fs.existsSync(TEST_CONFIG_DIR)) {
    // Create config folder if it doesn't exist
    const created = await fs.promises.mkdir(TEST_CONFIG_DIR, { recursive: true });
    if (!created) {
      throw new Error(`Failed to create config folder ${TEST_CONFIG_DIR}`);
    }
  }

  fs.writeFileSync(TEST_AUTH_FILE, contents);
};

export const readTestAuthFile = async (): Promise<string> => {
  return await fs.promises.readFile(TEST_AUTH_FILE, 'utf8');
};

export const deleteAuthFile = () => {
  try {
    fs.unlinkSync(TEST_AUTH_FILE);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};
