import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, IAccessRepository, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { CreateRuleDto, mapRule, UpdateRuleDto } from './rule.dto';
import { IRuleRepository } from './rule.repository';

@Injectable()
export class RuleService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IRuleRepository) private repository: IRuleRepository,
  ) {
    this.access = new AccessCore(accessRepository);
  }

  async get(authUser: AuthUserDto, id: string) {
    await this.access.requirePermission(authUser, Permission.RULE_READ, id);
    const rule = await this.findOrFail(id);
    return mapRule(rule);
  }

  async create(authUser: AuthUserDto, dto: CreateRuleDto) {
    await this.access.requirePermission(authUser, Permission.RULE_CREATE, dto.albumId);

    // TODO additional validation on key and value

    const rule = await this.repository.create({
      key: dto.key,
      value: dto.value,
      albumId: dto.albumId,
      ownerId: authUser.id,
    });
    return mapRule(rule);
  }

  async update(authUser: AuthUserDto, id: string, dto: UpdateRuleDto) {
    await this.access.requirePermission(authUser, Permission.RULE_UPDATE, id);

    // TODO additional validation on key and value

    const rule = await this.repository.update({
      id,
      key: dto.key,
      value: dto.value,
    });
    return mapRule(rule);
  }

  async remove(authUser: AuthUserDto, id: string) {
    await this.access.requirePermission(authUser, Permission.RULE_DELETE, id);
    const rule = await this.findOrFail(id);
    await this.repository.delete(rule);
  }

  private async findOrFail(id: string) {
    const rule = await this.repository.get(id);
    if (!rule) {
      throw new BadRequestException('Rule not found');
    }
    return rule;
  }
}
