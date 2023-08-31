import { LibraryEntity, LibraryType } from '@app/infra/entities';
import { userStub } from './user.stub';

export const libraryStub = {
  uploadLibrary1: Object.freeze<LibraryEntity>({
    id: 'library-id',
    name: 'test_library',
    assets: [],
    owner: userStub.user1,
    ownerId: 'user-id',
    type: LibraryType.UPLOAD,
    importPaths: [],
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01'),
    refreshedAt: null,
    isVisible: true,
    exclusionPatterns: [],
  }),
  externalLibrary1: Object.freeze<LibraryEntity>({
    id: 'library-id',
    name: 'test_library',
    assets: [],
    owner: userStub.externalPath1,
    ownerId: 'user-id',
    type: LibraryType.EXTERNAL,
    importPaths: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    refreshedAt: null,
    isVisible: true,
    exclusionPatterns: [],
  }),
};
