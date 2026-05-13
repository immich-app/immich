import { createZodDto } from 'nestjs-zod';
import { Stack } from 'src/database';
import { AssetResponseSchema, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import z from 'zod';

const StackSearchSchema = z
  .object({
    primaryAssetId: z.uuidv4().optional().describe('Filter by primary asset ID'),
  })
  .meta({ id: 'StackSearchDto' });

const StackCreateSchema = z
  .object({
    assetIds: z.array(z.uuidv4()).min(2).describe('Asset IDs (first becomes primary, min 2)'),
  })
  .meta({ id: 'StackCreateDto' });

const StackUpdateSchema = z
  .object({
    primaryAssetId: z.uuidv4().optional().describe('Primary asset ID'),
  })
  .meta({ id: 'StackUpdateDto' });

const StackResponseSchema = z
  .object({
    id: z.string().describe('Stack ID'),
    primaryAssetId: z.string().describe('Primary asset ID'),
    assets: z.array(AssetResponseSchema),
  })
  .describe('Stack response')
  .meta({ id: 'StackResponseDto' });

export class StackSearchDto extends createZodDto(StackSearchSchema) {}
export class StackCreateDto extends createZodDto(StackCreateSchema) {}
export class StackUpdateDto extends createZodDto(StackUpdateSchema) {}
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
