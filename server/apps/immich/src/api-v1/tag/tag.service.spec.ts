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

  const authUser: AuthUserDto = Object.freeze({
    id: '1111',
    email: 'testuser@email.com',
  });

  const validUser: UserEntity = Object.freeze({
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

  const validTag1: TagEntity = Object.freeze({
    name: 'tag 1',
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
    id: 'tag-1-id',
    assets: [],
  });

  const validTag2: TagEntity = Object.freeze({
    name: 'tag 2',
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
    id: 'tag-2-id',
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
      name: 'tag 1',
      type: TagType.CUSTOM,
    };

    userRepositoryMock.get.mockResolvedValue(validUser);
    tagRepositoryMock.getAllTagsByUserId.mockResolvedValue([validTag2]);
    tagRepositoryMock.create.mockResolvedValue(validTag1);

    const result = await sut.create(authUser, createTagDto);

    expect(result.user.id).toEqual(authUser.id);
    expect(result.name).toEqual(createTagDto.name);
    expect(result.type).toEqual(createTagDto.type);
  });

  it('throws error when creating tag with duplicate name and type by the same user', async () => {
    const createTagDto = {
      name: 'tag 1',
      type: TagType.CUSTOM,
    };

    userRepositoryMock.get.mockResolvedValue(validUser);
    tagRepositoryMock.create.mockResolvedValue(validTag1);
    tagRepositoryMock.getAllTagsByUserId.mockResolvedValue([validTag1]);

    await expect(sut.create(authUser, createTagDto)).rejects.toThrow();
  });
});
