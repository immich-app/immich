import { TagEntity, TagType } from '@app/database/entities/tag.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { IAssetRepository } from '../asset/asset-repository';
import { IUserRepository } from '../user/user-repository';
import { ITagRepository } from './tag.repository';
import { TagService } from './tag.service';

describe('TagService', () => {
  let sut: TagService;
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let tagRepositoryMock: jest.Mocked<ITagRepository>;
  let assetRepositoryMock: jest.Mocked<IAssetRepository>;

  const user1AuthUser: AuthUserDto = Object.freeze({
    id: '1111',
    email: 'testuser@email.com',
  });

  const user1: UserEntity = Object.freeze({
    id: '1111',
    firstName: 'Alex',
    lastName: 'Tran',
    isAdmin: true,
    email: 'testuser@email.com',
    profileImagePath: '',
    shouldChangePassword: true,
    createdAt: '2022-12-02T19:29:23.603Z',
    deletedAt: undefined,
    tags: [],
  });

  const user2: UserEntity = Object.freeze({
    id: '2222',
    firstName: 'Alex',
    lastName: 'Tran',
    isAdmin: true,
    email: 'testuser2@email.com',
    profileImagePath: '',
    shouldChangePassword: true,
    createdAt: '2022-12-02T19:29:23.603Z',
    deletedAt: undefined,
    tags: [],
  });

  const user1Tag1: TagEntity = Object.freeze({
    name: 'user 1 tag 1',
    type: TagType.CUSTOM,
    user: {
      id: '1111',
      firstName: 'Alex',
      lastName: 'Tran',
      isAdmin: true,
      email: 'testuser@email.com',
      profileImagePath: '',
      shouldChangePassword: true,
      createdAt: '2022-12-02T19:29:23.603Z',
      deletedAt: undefined,
      tags: [],
    },
    renameTagId: '',
    id: 'user1-tag-1-id',
    assets: [],
  });

  const user1Tag2: TagEntity = Object.freeze({
    name: 'user 1 tag 2',
    type: TagType.CUSTOM,
    user: {
      id: '1111',
      firstName: 'Alex',
      lastName: 'Tran',
      isAdmin: true,
      email: 'testuser@email.com',
      profileImagePath: '',
      shouldChangePassword: true,
      createdAt: '2022-12-02T19:29:23.603Z',
      deletedAt: undefined,
      tags: [],
    },
    renameTagId: '',
    id: 'user1-tag-2-id',
    assets: [],
  });

  const user2Tag1: TagEntity = Object.freeze({
    name: 'user 2 tag 1',
    type: TagType.CUSTOM,
    user: {
      id: '2222',
      firstName: 'Alex',
      lastName: 'Tran',
      isAdmin: true,
      email: 'testuser2@email.com',
      profileImagePath: '',
      shouldChangePassword: true,
      createdAt: '2022-12-02T19:29:23.603Z',
      deletedAt: undefined,
      tags: [],
    },
    renameTagId: '',
    id: 'user2-tag-1-id',
    assets: [],
  });

  beforeAll(() => {
    userRepositoryMock = {
      create: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      getAdmin: jest.fn(),
      getByEmail: jest.fn(),
      getList: jest.fn(),
      restore: jest.fn(),
    };

    tagRepositoryMock = {
      create: jest.fn(),
      getById: jest.fn(),
      getAllTagsByUserId: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    assetRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      getAllByUserId: jest.fn(),
      getAllByDeviceId: jest.fn(),
      getAssetCountByTimeBucket: jest.fn(),
      getById: jest.fn(),
      getDetectedObjectsByUserId: jest.fn(),
      getLocationsByUserId: jest.fn(),
      getSearchPropertiesByUserId: jest.fn(),
      getAssetByTimeBucket: jest.fn(),
      getAssetByChecksum: jest.fn(),
      getAssetCountByUserId: jest.fn(),
      getAssetWithNoEXIF: jest.fn(),
      getAssetWithNoThumbnail: jest.fn(),
      getAssetWithNoSmartInfo: jest.fn(),
      getExistingAssets: jest.fn(),
    };

    sut = new TagService(tagRepositoryMock, userRepositoryMock);
  });

  it('creates tag', async () => {
    const createTagDto = {
      name: 'user 1 tag 1',
      type: TagType.CUSTOM,
    };

    userRepositoryMock.get.mockResolvedValue(user1);
    tagRepositoryMock.getAllTagsByUserId.mockResolvedValue([user1Tag2]);
    tagRepositoryMock.create.mockResolvedValue(user1Tag1);

    const result = await sut.create(user1AuthUser, createTagDto);

    expect(result.user.id).toEqual(user1AuthUser.id);
    expect(result.name).toEqual(createTagDto.name);
    expect(result.type).toEqual(createTagDto.type);
  });

  it('throws error when creating tag with duplicate name and type by the same user', async () => {
    const createTagDto = {
      name: 'user 1 tag 1',
      type: TagType.CUSTOM,
    };

    userRepositoryMock.get.mockResolvedValue(user1);
    tagRepositoryMock.create.mockResolvedValue(user1Tag1);
    tagRepositoryMock.getAllTagsByUserId.mockResolvedValue([user1Tag1]);

    await expect(sut.create(user1AuthUser, createTagDto)).rejects.toThrow();
  });

  it('throw error when accessing tag of different user', async () => {
    tagRepositoryMock.getById.mockResolvedValue(user2Tag1);

    await expect(sut.findOne(user1AuthUser, user2Tag1.id)).rejects.toThrow();
  });
});
