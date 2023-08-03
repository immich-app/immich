import { LibraryEntity, LibraryType } from '@app/infra/entities';
import { userStub } from './user.stub';

export const libraryStub = {
  library1: Object.freeze<LibraryEntity>({
    id: 'library-id',
    name: 'test_library',
    assets: [],
    owner: userStub.user1,
    ownerId: 'user-id',
    type: LibraryType.UPLOAD,
    importPaths: [],
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    refreshedAt: null,
    isVisible: true,
  }),
  uploadLibrary: Object.freeze<LibraryEntity>({
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
  }),
  importLibrary: Object.freeze<LibraryEntity>({
    id: 'library-id',
    name: 'test_library',
    assets: [],
    owner: userStub.user1,
    ownerId: 'user-id',
    type: LibraryType.IMPORT,
    importPaths: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    refreshedAt: null,
    isVisible: true,
  }),
};
