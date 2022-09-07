import { AlbumResponseDto } from '@api';
import { Sync } from 'factory.ts';
import { faker } from '@faker-js/faker';

export const albumFactory = Sync.makeFactory<AlbumResponseDto>({
	albumName: Sync.each(() => faker.commerce.product()),
	albumThumbnailAssetId: null,
	assetCount: Sync.each((i) => i % 5),
	assets: [],
	createdAt: Sync.each(() => faker.date.past().toISOString()),
	id: Sync.each(() => faker.datatype.uuid()),
	ownerId: Sync.each(() => faker.datatype.uuid()),
	shared: false,
	sharedUsers: []
});
