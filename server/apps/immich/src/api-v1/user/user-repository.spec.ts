import { UserEntity } from '@app/database/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
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

  describe('create', () => {
    it('should not create a user if there is no local admin account', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);
      await expect(sui.create({ isAdmin: false })).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepositoryMock.findOne).toHaveBeenCalled();
    });
  });
});
