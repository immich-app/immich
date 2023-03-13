import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

export const assetSchemaVersion = 2;
export const assetSchema: CollectionCreateSchema = {
  name: `assets-v${assetSchemaVersion}`,
  fields: [
    // asset
    { name: 'ownerId', type: 'string', facet: false },
    { name: 'type', type: 'string', facet: true },
    { name: 'originalPath', type: 'string', facet: false },
    { name: 'createdAt', type: 'string', facet: false, sort: true },
    { name: 'updatedAt', type: 'string', facet: false, sort: true },
    { name: 'fileCreatedAt', type: 'string', facet: false, sort: true },
    { name: 'fileModifiedAt', type: 'string', facet: false, sort: true },
    { name: 'isFavorite', type: 'bool', facet: true },
    // { name: 'checksum', type: 'string', facet: true },
    // { name: 'tags', type: 'string[]', facet: true, optional: true },

    // exif
    { name: 'exifInfo.city', type: 'string', facet: true, optional: true },
    { name: 'exifInfo.country', type: 'string', facet: true, optional: true },
    { name: 'exifInfo.state', type: 'string', facet: true, optional: true },
    { name: 'exifInfo.description', type: 'string', facet: false, optional: true },
    { name: 'exifInfo.imageName', type: 'string', facet: false, optional: true },
    { name: 'exifInfo.make', type: 'string', facet: true, optional: true },
    { name: 'exifInfo.model', type: 'string', facet: true, optional: true },
    { name: 'exifInfo.orientation', type: 'string', optional: true },

    // smart info
    { name: 'smartInfo.objects', type: 'string[]', facet: true, optional: true },
    { name: 'smartInfo.tags', type: 'string[]', facet: true, optional: true },

    // computed
    { name: 'geo', type: 'geopoint', facet: false, optional: true },
    { name: 'motion', type: 'bool', facet: true },
  ],
  token_separators: ['.'],
  enable_nested_fields: true,
  default_sorting_field: 'fileCreatedAt',
};
