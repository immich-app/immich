import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

export const faceSchemaVersion = 1;
export const faceSchema: CollectionCreateSchema = {
  name: `faces-v${faceSchemaVersion}`,
  fields: [
    // faces
    { name: 'ownerId', type: 'string', facet: false },
    { name: 'fileCreatedAt', type: 'string', facet: false, sort: true },

    { name: 'faces', type: 'float[]', facet: false, optional: true, num_dim: 512 },
  ],
  default_sorting_field: 'fileCreatedAt',
};
