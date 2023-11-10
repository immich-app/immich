import { PartnerEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { IAccessRepository, IPartnerRepository, PartnerDirection, PartnerIds } from '../repositories';
import { UserResponseDto, mapUser } from '../user';
import { PartnerResponseDto, UpdatePartnerDto, UpdatePartnerResponseDto } from './partner.dto';

@Injectable()
export class PartnerService {
  private logger = new Logger(PartnerService.name);
  private access: AccessCore;
  constructor(
    @Inject(IPartnerRepository) private repository: IPartnerRepository,
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async create(authUser: AuthUserDto, sharedWithId: string): Promise<UserResponseDto> {
    const partnerId: PartnerIds = { sharedById: authUser.id, sharedWithId };
    const exists = await this.repository.get(partnerId);
    if (exists) {
      throw new BadRequestException(`Partner already exists`);
    }

    const partner = await this.repository.create(partnerId);
    return this.map(partner, PartnerDirection.SharedBy);
  }

  async remove(authUser: AuthUserDto, sharedWithId: string): Promise<void> {
    const partnerId: PartnerIds = { sharedById: authUser.id, sharedWithId };
    const partner = await this.repository.get(partnerId);
    if (!partner) {
      throw new BadRequestException('Partner not found');
    }

    await this.repository.remove(partner);
  }

  async getAll(authUser: AuthUserDto, direction: PartnerDirection): Promise<PartnerResponseDto[]> {
    const partners = await this.repository.getAll(authUser.id);
    const key = direction === PartnerDirection.SharedBy ? 'sharedById' : 'sharedWithId';
    return partners
      .filter((partner) => partner.sharedBy && partner.sharedWith) // Filter out soft deleted users
      .filter((partner) => partner[key] === authUser.id)
      .map((partner) => {
        const user = this.map(partner, direction) as PartnerResponseDto;
        user.inTimeline = partner.inTimeline;
        return user;
      });
  }

  async update(authUser: AuthUserDto, sharedById: string, dto: UpdatePartnerDto): Promise<UpdatePartnerResponseDto> {
    await this.access.requirePermission(authUser, Permission.PARTNER_UPDATE, sharedById);
    const partnerId: PartnerIds = { sharedById, sharedWithId: authUser.id };

    console.log('payload', dto);
    const entity = await this.repository.update({ ...partnerId, inTimeline: dto.inTimeline });

    console.log('new entity', entity);
    return this.mapUpdate(entity);
  }

  private map(partner: PartnerEntity, direction: PartnerDirection): UserResponseDto {
    // this is opposite to return the non-me user of the "partner"
    return mapUser(direction === PartnerDirection.SharedBy ? partner.sharedWith : partner.sharedBy);
  }

  private mapUpdate(entity: PartnerEntity): UpdatePartnerResponseDto {
    return {
      inTimeline: entity.inTimeline,
    };
  }
}
