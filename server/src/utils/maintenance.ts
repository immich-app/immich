import { SignJWT } from 'jose';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { MaintenanceAuthDto, MaintenanceDetectInstallResponseDto } from 'src/dtos/maintenance.dto';
import { StorageFolder } from 'src/enum';
import { StorageRepository } from 'src/repositories/storage.repository';

export async function createMaintenanceLoginUrl(
  baseUrl: string,
  auth: MaintenanceAuthDto,
  secret: string,
): Promise<string> {
  return `${baseUrl}/maintenance?token=${await signMaintenanceJwt(secret, auth)}`;
}

export async function signMaintenanceJwt(secret: string, data: MaintenanceAuthDto): Promise<string> {
  const alg = 'HS256';

  return await new SignJWT({ ...data })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('4h')
    .sign(new TextEncoder().encode(secret));
}

export function generateMaintenanceSecret(): string {
  return randomBytes(64).toString('hex');
}

export async function detectPriorInstall(
  storageRepository: StorageRepository,
): Promise<MaintenanceDetectInstallResponseDto> {
  return {
    storage: await Promise.all(
      Object.values(StorageFolder).map(async (folder) => {
        const path = StorageCore.getBaseFolder(folder);
        const files = await storageRepository.readdir(path);
        const filename = join(StorageCore.getBaseFolder(folder), '.immich');

        let readable = false,
          writable = false;

        try {
          await storageRepository.readFile(filename);
          readable = true;

          await storageRepository.overwriteFile(filename, Buffer.from(`${Date.now()}`));
          writable = true;
        } catch {
          // no-op
        }

        return {
          folder,
          readable,
          writable,
          files: files.filter((fn) => fn !== '.immich').length,
        };
      }),
    ),
  };
}
