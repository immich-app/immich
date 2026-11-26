import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { Stack } from 'src/database.js';
import { AssetResponseSchema, mapAsset } from 'src/dtos/asset-response.dto.js';
import { AuthDto } from 'src/dtos/auth.dto.js';

const StackResponseSchema = z
  .object({
    id: z.uuidv4().describe('Stack ID'),
    primaryAssetId: z.uuidv4().describe('Primary asset ID'),
    assets: z.array(AssetResponseSchema),
  })
  .describe('Stack response')
  .meta({ id: 'StackResponseDto' });

export class StackSearchDto extends createZodDto({
  primaryAssetId: z.uuidv4().optional().describe('Filter by primary asset ID'),
}) {}

export class StackCreateDto extends createZodDto({
  assetIds: z.array(z.uuidv4()).min(2).describe('Asset IDs (first becomes primary, min 2)'),
}) {}

export class StackUpdateDto extends createZodDto({
  primaryAssetId: z.uuidv4().optional().describe('Primary asset ID'),
}) {}

export class StackResponseDto extends createZodDto(StackResponseSchema) {}

export const mapStack = (stack: Stack, { auth }: { auth?: AuthDto }) => {
  const primary = stack.assets.filter((asset) => asset.id === stack.primaryAssetId);
  const others = stack.assets.filter((asset) => asset.id !== stack.primaryAssetId);

  return {
    id: stack.id,
    primaryAssetId: stack.primaryAssetId,
    assets: [...primary, ...others].map((asset) => mapAsset(asset, { auth })),
  };
};
