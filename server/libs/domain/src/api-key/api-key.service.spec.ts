import { Test } from '@nestjs/testing';
import { APIKeyEntity } from '@app/infra';
import { ADMIN_AUTH_DTO, ADMIN_ENTITY } from '../../test';
import { TestModule } from '../../test/test.module';
import { ICryptoRepository } from '../auth';
import { IKeyRepository } from './api-key.repository';
import { APIKeyService } from './api-key.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const ADMIN_KEY = Object.freeze({
  id: 1,
  name: 'My Key',
  key: 'my-api-key (hashed)',
  userId: ADMIN_ENTITY.id,
  user: ADMIN_ENTITY,
} as APIKeyEntity);

const token = Buffer.from('1:my-api-key', 'utf8').toString('base64');

describe(APIKeyService.name, () => {
  let sut: APIKeyService;
  let keyMock: jest.Mocked<IKeyRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ imports: [TestModule] }).compile();

    cryptoMock = module.get(ICryptoRepository);
    keyMock = module.get(IKeyRepository);
    sut = module.get(APIKeyService);
  });

  describe('create', () => {
    it('should create a new key', async () => {
      keyMock.create.mockResolvedValue(ADMIN_KEY);

      await sut.create(ADMIN_AUTH_DTO, { name: 'Test Key' });

      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'Test Key',
        userId: ADMIN_AUTH_DTO.id,
      });
      expect(cryptoMock.randomBytes).toHaveBeenCalled();
      expect(cryptoMock.hash).toHaveBeenCalled();
    });

    it('should not require a name', async () => {
      keyMock.create.mockResolvedValue(ADMIN_KEY);

      await sut.create(ADMIN_AUTH_DTO, {});

      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'API Key',
        userId: ADMIN_AUTH_DTO.id,
      });
      expect(cryptoMock.randomBytes).toHaveBeenCalled();
      expect(cryptoMock.hash).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.update(ADMIN_AUTH_DTO, 1, { name: 'New Name' })).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.update).not.toHaveBeenCalledWith(1);
    });

    it('should update a key', async () => {
      keyMock.getById.mockResolvedValue(ADMIN_KEY);

      await sut.update(ADMIN_AUTH_DTO, 1, { name: 'New Name' });

      expect(keyMock.update).toHaveBeenCalledWith(ADMIN_AUTH_DTO.id, 1, { name: 'New Name' });
    });
  });

  describe('delete', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.delete(ADMIN_AUTH_DTO, 1)).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.delete).not.toHaveBeenCalledWith(1);
    });

    it('should delete a key', async () => {
      keyMock.getById.mockResolvedValue(ADMIN_KEY);

      await sut.delete(ADMIN_AUTH_DTO, 1);

      expect(keyMock.delete).toHaveBeenCalledWith(ADMIN_AUTH_DTO.id, 1);
    });
  });

  describe('getById', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.getById(ADMIN_AUTH_DTO, 1)).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.getById).toHaveBeenCalledWith(ADMIN_AUTH_DTO.id, 1);
    });

    it('should get a key by id', async () => {
      keyMock.getById.mockResolvedValue(ADMIN_KEY);

      await sut.getById(ADMIN_AUTH_DTO, 1);

      expect(keyMock.getById).toHaveBeenCalledWith(ADMIN_AUTH_DTO.id, 1);
    });
  });

  describe('getAll', () => {
    it('should return all the keys for a user', async () => {
      keyMock.getByUserId.mockResolvedValue([ADMIN_KEY]);

      await expect(sut.getAll(ADMIN_AUTH_DTO)).resolves.toHaveLength(1);

      expect(keyMock.getByUserId).toHaveBeenCalledWith(ADMIN_AUTH_DTO.id);
    });
  });

  describe('validate', () => {
    it('should throw an error for an invalid id', async () => {
      keyMock.getKey.mockResolvedValue(null);

      await expect(sut.validate(token)).rejects.toBeInstanceOf(UnauthorizedException);

      expect(keyMock.getKey).toHaveBeenCalledWith(1);
      expect(cryptoMock.compareSync).not.toHaveBeenCalled();
    });

    it('should validate the token', async () => {
      keyMock.getKey.mockResolvedValue(ADMIN_KEY);

      await expect(sut.validate(token)).resolves.toEqual(ADMIN_AUTH_DTO);

      expect(keyMock.getKey).toHaveBeenCalledWith(1);
      expect(cryptoMock.compareSync).toHaveBeenCalledWith('my-api-key', 'my-api-key (hashed)');
    });
  });
});
