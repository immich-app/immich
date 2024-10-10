import { join } from 'node:path';
import { GeneratedImageType } from 'src/cores/storage.core';
import { AssetEntity } from 'src/entities/asset.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { ImageFormat } from 'src/enum';
import { MediaPaths } from 'src/interfaces/config.interface';

type PathRequest = { mediaPaths: MediaPaths } & (
  | { personThumbnail: PersonEntity }
  | { asset: AssetEntity }
  | {
      imageThumbnail: {
        asset: AssetEntity;
        type: GeneratedImageType;
        format: ImageFormat;
      };
    }
  | { encodedVideo: AssetEntity }
);

const asNestedFolder = (mediaPath: string, ownerId: string, filename: string) =>
  join(mediaPath, ownerId, filename.slice(0, 2), filename.slice(2, 4));

export const buildPath = (item: PathRequest): string => {
  if ('personThumbnail' in item) {
    const { personThumbnail: person } = item;
    const filename = `${person.id}.jpeg`;
    const folderPath = asNestedFolder(item.mediaPaths.thumbnails, item.personThumbnail.ownerId, filename);
    return join(folderPath, filename);
  }

  return '';
};
