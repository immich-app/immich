import { join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core.js';
import { SystemConfig } from 'src/dtos/config.dto.js';
import { StorageFolder } from 'src/enum.js';
import { CryptoRepository } from 'src/repositories/crypto.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';

type Repos = {
  media: MediaRepository;
  crypto: CryptoRepository;
  storageCore: StorageCore;
};

export const generateProfileImage = async (
  { media, crypto, storageCore }: Repos,
  { image }: SystemConfig,
  userId: string,
  input: string | Buffer,
): Promise<string> => {
  const outputPath = join(
    StorageCore.getFolderLocation(StorageFolder.Profile, userId),
    `${crypto.randomUUID()}.${image.thumbnail.format}`,
  );
  storageCore.ensureFolders(outputPath);

  await media.generateThumbnail(
    input,
    {
      colorspace: image.colorspace,
      format: image.thumbnail.format,
      quality: image.thumbnail.quality,
      progressive: image.thumbnail.progressive,
      size: image.thumbnail.size,
      processInvalidImages: false,
    },
    outputPath,
  );

  return outputPath;
};
