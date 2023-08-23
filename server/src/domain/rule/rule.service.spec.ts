import { BadRequestException } from '@nestjs/common';
import { authStub, IAccessRepositoryMock, newAccessRepositoryMock, newRuleRepositoryMock, ruleStub } from '@test';
import { RuleKey } from '../../infra/entities/rule.entity';
import { RuleResponseDto } from './rule.dto';
import { IRuleRepository } from './rule.repository';
import { RuleService } from './rule.service';

const responseDto: RuleResponseDto = {
  id: 'rule-1',
  key: RuleKey.CITY,
  value: 'Chandler',
  ownerId: authStub.admin.id,
};

describe(RuleService.name, () => {
  let sut: RuleService;
  let accessMock: jest.Mocked<IAccessRepositoryMock>;
  let ruleMock: jest.Mocked<IRuleRepository>;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    ruleMock = newRuleRepositoryMock();
    sut = new RuleService(accessMock, ruleMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should require album access', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      accessMock.album.hasSharedAlbumAccess.mockResolvedValue(false);
      await expect(
        sut.create(authStub.admin, {
          albumId: 'not-found-album',
          key: RuleKey.CITY,
          value: { value: 'abc' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.album.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'not-found-album');
      expect(accessMock.album.hasSharedAlbumAccess).toHaveBeenCalledWith(authStub.admin.id, 'not-found-album');
    });

    it('should create a rule', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      ruleMock.create.mockResolvedValue(ruleStub.rule1);
      await expect(
        sut.create(authStub.admin, {
          albumId: 'album-123',
          key: RuleKey.CITY,
          value: { value: 'abc' },
        }),
      ).resolves.toEqual(responseDto);
      expect(accessMock.album.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'album-123');
    });
  });

  describe('get', () => {
    it('should throw a bad request when the rule is not found', async () => {
      accessMock.rule.hasOwnerAccess.mockResolvedValue(false);
      await expect(sut.get(authStub.admin, 'rule-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should get a rule by id', async () => {
      accessMock.rule.hasOwnerAccess.mockResolvedValue(true);
      ruleMock.get.mockResolvedValue(ruleStub.rule1);
      await expect(sut.get(authStub.admin, 'rule-1')).resolves.toEqual(responseDto);
      expect(ruleMock.get).toHaveBeenCalledWith('rule-1');
    });
  });

  describe('update', () => {
    it('should throw a bad request when the rule is not found', async () => {
      accessMock.rule.hasOwnerAccess.mockResolvedValue(false);
      await expect(
        sut.update(authStub.admin, 'rule-1', {
          key: RuleKey.CITY,
          value: { value: 'Atlanta' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
