import { UserEntity } from '@app/database/entities/user.entity';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { IUserRepository, UserRepository } from './user-repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let sui: UserService;
  let userRepositoryMock: jest.Mocked<IUserRepository>;

  const adminAuthUser: AuthUserDto = Object.freeze({
    id: 'admin_id',
    email: 'admin@test.com',
  });

  const immichAuthUser: AuthUserDto = Object.freeze({
    id: 'immich_id',
    email: 'immich@test.com',
  });

  const adminUser: UserEntity = Object.freeze({
    id: 'admin_id',
    email: 'admin@test.com',
    password: 'admin_password',
    salt: 'admin_salt',
    firstName: 'admin_first_name',
    lastName: 'admin_last_name',
    isAdmin: true,
    shouldChangePassword: false,
    profileImagePath: '',
    createdAt: '2021-01-01',
  });

  const immichUser: UserEntity = Object.freeze({
    id: 'immich_id',
    email: 'immich@test.com',
    password: 'immich_password',
    salt: 'immich_salt',
    firstName: 'immich_first_name',
    lastName: 'immich_last_name',
    isAdmin: false,
    shouldChangePassword: false,
    profileImagePath: '',
    createdAt: '2021-01-01',
  });

  beforeAll(() => {
    userRepositoryMock = {
      create: jest.fn(),
      createProfileImage: jest.fn(),
      get: jest.fn(),
      getByEmail: jest.fn(),
      getList: jest.fn(),
      update: jest.fn(),
    };

    sui = new UserService(userRepositoryMock);
  });
});
