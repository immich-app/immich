import { PartnerEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AuthDto } from '../auth';
import { IAccessRepository, IPartnerRepository, PartnerDirection, PartnerIds } from '../repositories';
import { mapUser } from '../user';
import { PartnerResponseDto, UpdatePartnerDto } from './partner.dto';

@Injectable()
export class PartnerService {
  private access: AccessCore;
  constructor(
    @Inject(IPartnerRepository) private repository: IPartnerRepository,
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async create(auth: AuthDto, sharedWithId: string): Promise<PartnerResponseDto> {
    const partnerId: PartnerIds = { sharedById: auth.user.id, sharedWithId };
    const exists = await this.repository.get(partnerId);
    if (exists) {
      throw new BadRequestException(`Partner already exists`);
    }

    const partner = await this.repository.create(partnerId);
    return this.mapToPartnerEntity(partner, PartnerDirection.SharedBy);
  }

  async remove(auth: AuthDto, sharedWithId: string): Promise<void> {
    const partnerId: PartnerIds = { sharedById: auth.user.id, sharedWithId };
    const partner = await this.repository.get(partnerId);
    if (!partner) {
      throw new BadRequestException('Partner not found');
    }

    await this.repository.remove(partner);
  }

  async getAll(auth: AuthDto, direction: PartnerDirection): Promise<PartnerResponseDto[]> {
    const partners = await this.repository.getAll(auth.user.id);
    const key = direction === PartnerDirection.SharedBy ? 'sharedById' : 'sharedWithId';
    return partners
      .filter((partner) => partner.sharedBy && partner.sharedWith) // Filter out soft deleted users
      .filter((partner) => partner[key] === auth.user.id)
      .map((partner) => this.mapToPartnerEntity(partner, direction));
  }

  async update(auth: AuthDto, sharedById: string, dto: UpdatePartnerDto): Promise<PartnerResponseDto> {
    await this.access.requirePermission(auth, Permission.PARTNER_UPDATE, sharedById);
    const partnerId: PartnerIds = { sharedById, sharedWithId: auth.user.id };

    const entity = await this.repository.update({ ...partnerId, inTimeline: dto.inTimeline });
    return this.mapToPartnerEntity(entity, PartnerDirection.SharedWith);
  }

  private mapToPartnerEntity(partner: PartnerEntity, direction: PartnerDirection): PartnerResponseDto {
    // this is opposite to return the non-me user of the "partner"
    const user = mapUser(
      direction === PartnerDirection.SharedBy ? partner.sharedWith : partner.sharedBy,
    ) as PartnerResponseDto;

    user.inTimeline = partner.inTimeline;

    return user;
  }
}
