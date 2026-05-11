import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { StorageFolder } from 'src/enum';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { mimeTypes } from 'src/utils/mime-types';

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

  const inputFrame =
    typeof input === 'string' && mimeTypes.isHeif(input) ? await extractHeifFrame(media, input) : undefined;

  try {
    await media.generateThumbnail(
      inputFrame?.path ?? input,
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
  } finally {
    await inputFrame?.cleanup();
  }

  return outputPath;
};

const extractHeifFrame = async (media: MediaRepository, input: string) => {
  const outputDir = await mkdtemp(join(tmpdir(), 'gallery-heif-profile-'));
  const outputPath = join(outputDir, 'frame.jpeg');

  try {
    await media.convertHeifToJpeg(input, outputPath);
    return {
      path: outputPath,
      cleanup: () => rm(outputDir, { force: true, recursive: true }),
    };
  } catch (error) {
    await rm(outputDir, { force: true, recursive: true });
    throw error;
  }
};
