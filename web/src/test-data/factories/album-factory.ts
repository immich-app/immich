import type { AlbumResponseDto } from '@api';
import { faker } from '@faker-js/faker';
import { Sync } from 'factory.ts';
import { userFactory } from './user-factory';

export const albumFactory = Sync.makeFactory<AlbumResponseDto>({
	albumName: Sync.each(() => faker.commerce.product()),
	albumThumbnailAssetId: null,
	assetCount: Sync.each((i) => i % 5),
	assets: [],
	createdAt: Sync.each(() => faker.date.past().toISOString()),
	updatedAt: Sync.each(() => faker.date.past().toISOString()),
	id: Sync.each(() => faker.datatype.uuid()),
	ownerId: Sync.each(() => faker.datatype.uuid()),
	owner: userFactory.build(),
	shared: false,
	sharedUsers: []
});
