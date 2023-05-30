import { TagEntity, TagType, UserEntity } from '@app/infra/entities';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { ITagRepository } from './tag.repository';
import { TagService } from './tag.service';

describe('TagService', () => {
  let sut: TagService;
  let tagRepositoryMock: jest.Mocked<ITagRepository>;

  const user1AuthUser: AuthUserDto = Object.freeze({
    id: '1111',
    email: 'testuser@email.com',
    isAdmin: false,
  });

  const user1: UserEntity = Object.freeze({
    id: '1111',
    firstName: 'Alex',
    lastName: 'Tran',
    isAdmin: true,
    email: 'testuser@email.com',
    profileImagePath: '',
    shouldChangePassword: true,
    createdAt: new Date('2022-12-02T19:29:23.603Z'),
    deletedAt: null,
    updatedAt: new Date('2022-12-02T19:29:23.603Z'),
    tags: [],
    assets: [],
    oauthId: 'oauth-id-1',
    storageLabel: null,
  });

  // const user2: UserEntity = Object.freeze({
  //   id: '2222',
  //   firstName: 'Alex',
  //   lastName: 'Tran',
  //   isAdmin: true,
  //   email: 'testuser2@email.com',
  //   profileImagePath: '',
  //   shouldChangePassword: true,
  //   createdAt: '2022-12-02T19:29:23.603Z',
  //   deletedAt: undefined,
  //   tags: [],
  //   oauthId: 'oauth-id-2',
  // });

  const user1Tag1: TagEntity = Object.freeze({
    name: 'user 1 tag 1',
    type: TagType.CUSTOM,
    userId: user1.id,
    user: user1,
    renameTagId: '',
    id: 'user1-tag-1-id',
    assets: [],
  });

  // const user1Tag2: TagEntity = Object.freeze({
  //   name: 'user 1 tag 2',
  //   type: TagType.CUSTOM,
  //   userId: user1.id,
  //   user: user1,
  //   renameTagId: '',
  //   id: 'user1-tag-2-id',
  //   assets: [],
  // });

  beforeAll(() => {
    tagRepositoryMock = {
      create: jest.fn(),
      getByIds: jest.fn(),
      getById: jest.fn(),
      getByUserId: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    sut = new TagService(tagRepositoryMock);
  });

  it('creates tag', async () => {
    const createTagDto = {
      name: 'user 1 tag 1',
      type: TagType.CUSTOM,
    };

    tagRepositoryMock.create.mockResolvedValue(user1Tag1);

    const result = await sut.create(user1AuthUser, createTagDto);

    expect(result.userId).toEqual(user1AuthUser.id);
    expect(result.name).toEqual(createTagDto.name);
    expect(result.type).toEqual(createTagDto.type);
  });
});
