import { UserEntity } from '@app/database/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRepository } from './user-repository';

describe('UserRepository', () => {
  let sui: UserRepository;
  let userRepositoryMock: jest.Mocked<Repository<UserEntity>>;

  beforeAll(() => {
    userRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserEntity>>;

    sui = new UserRepository(userRepositoryMock);
  });

  it('should be defined', () => {
    expect(sui).toBeDefined();
  });
});
