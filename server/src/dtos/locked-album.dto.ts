import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateLockedAlbumSchema = z
  .object({ albumName: z.string().trim().min(1).max(255) })
  .meta({ id: 'CreateLockedAlbumDto' });

export const UpdateLockedAlbumSchema = CreateLockedAlbumSchema.meta({ id: 'UpdateLockedAlbumDto' });

export const LockedAlbumAssetsSchema = z
  .object({ ids: z.array(z.uuid()).min(1).max(100) })
  .meta({ id: 'LockedAlbumAssetsDto' });

export const GetLockedAlbumAssetsSchema = z
  .object({
    skip: z.coerce.number().int().min(0).default(0),
    take: z.coerce.number().int().min(1).max(100).default(50),
  })
  .meta({ id: 'GetLockedAlbumAssetsDto' });

export const LockedAlbumResponseSchema = z
  .object({
    id: z.uuid(),
    albumName: z.string(),
    createdAt: z.string().meta({ format: 'date-time' }),
    updatedAt: z.string().meta({ format: 'date-time' }),
    assetCount: z.int().min(0),
  })
  .meta({ id: 'LockedAlbumResponseDto' });

export const LockedAlbumAssetsResponseSchema = z
  .object({ assetIds: z.array(z.uuid()), hasNextPage: z.boolean() })
  .meta({ id: 'LockedAlbumAssetsResponseDto' });

export class CreateLockedAlbumDto extends createZodDto(CreateLockedAlbumSchema) {}
export class UpdateLockedAlbumDto extends createZodDto(UpdateLockedAlbumSchema) {}
export class LockedAlbumAssetsDto extends createZodDto(LockedAlbumAssetsSchema) {}
export class GetLockedAlbumAssetsDto extends createZodDto(GetLockedAlbumAssetsSchema) {}
export class LockedAlbumResponseDto extends createZodDto(LockedAlbumResponseSchema) {}
export class LockedAlbumAssetsResponseDto extends createZodDto(LockedAlbumAssetsResponseSchema) {}

export const mapLockedAlbum = (album: {
  id: string;
  albumName: string;
  createdAt: Date;
  updatedAt: Date;
  assetCount: number;
}): LockedAlbumResponseDto => ({
  id: album.id,
  albumName: album.albumName,
  createdAt: album.createdAt.toISOString(),
  updatedAt: album.updatedAt.toISOString(),
  assetCount: album.assetCount,
});
