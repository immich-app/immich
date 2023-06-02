import type { UserResponseDto } from '@api';
import { faker } from '@faker-js/faker';
import { Sync } from 'factory.ts';

export const userFactory = Sync.makeFactory<UserResponseDto>({
	id: Sync.each(() => faker.datatype.uuid()),
	email: Sync.each(() => faker.internet.email()),
	firstName: Sync.each(() => faker.name.firstName()),
	lastName: Sync.each(() => faker.name.lastName()),
	storageLabel: Sync.each(() => faker.random.alphaNumeric()),
	profileImagePath: '',
	shouldChangePassword: Sync.each(() => faker.datatype.boolean()),
	isAdmin: true,
	createdAt: Sync.each(() => faker.date.past().toISOString()),
	deletedAt: null,
	updatedAt: Sync.each(() => faker.date.past().toISOString()),
	oauthId: ''
});
