import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

export const faceSchemaVersion = 1;
export const faceSchema: CollectionCreateSchema = {
  name: `faces-v${faceSchemaVersion}`,
  fields: [
    { name: 'ownerId', type: 'string', facet: false },
    { name: 'assetId', type: 'string', facet: false },
    { name: 'personId', type: 'string', facet: false },
    { name: 'embedding', type: 'float[]', facet: false, num_dim: 512 },
  ],
};
