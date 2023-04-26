import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

export const faceSchemaVersion = 1;
export const faceSchema: CollectionCreateSchema = {
  name: `faces-v${faceSchemaVersion}`,
  fields: [
    // faces
    { name: 'faces', type: 'float[]', facet: false, optional: true, num_dim: 512 },
  ],
};
