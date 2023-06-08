import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

export const albumSchemaVersion = 1;
export const albumSchema: CollectionCreateSchema = {
  name: `albums-v${albumSchemaVersion}`,
  fields: [
    { name: 'ownerId', type: 'string', facet: false },
    { name: 'albumName', type: 'string', facet: false, sort: true },
    { name: 'createdAt', type: 'string', facet: false, sort: true },
    { name: 'updatedAt', type: 'string', facet: false, sort: true },
  ],
  default_sorting_field: 'createdAt',
};
