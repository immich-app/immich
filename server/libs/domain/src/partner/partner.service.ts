import { PartnerEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IPartnerRepository, PartnerCore, PartnerDirection, PartnerIds } from '../partner';
import { mapUser, UserResponseDto } from '../user';

@Injectable()
export class PartnerService {
  private partnerCore: PartnerCore;

  constructor(@Inject(IPartnerRepository) partnerRepository: IPartnerRepository) {
    this.partnerCore = new PartnerCore(partnerRepository);
  }

  async create(authUser: AuthUserDto, sharedWithId: string): Promise<UserResponseDto> {
    const partnerId: PartnerIds = { sharedById: authUser.id, sharedWithId };
    const exists = await this.partnerCore.get(partnerId);
    if (exists) {
      throw new BadRequestException(`Partner already exists`);
    }

    const partner = await this.partnerCore.create(partnerId);
    return this.map(partner, PartnerDirection.SharedBy);
  }

  async remove(authUser: AuthUserDto, sharedWithId: string): Promise<void> {
    const partnerId: PartnerIds = { sharedById: authUser.id, sharedWithId };
    const partner = await this.partnerCore.get(partnerId);
    if (!partner) {
      throw new BadRequestException('Partner not found');
    }

    await this.partnerCore.remove(partner);
  }

  async getAll(authUser: AuthUserDto, direction: PartnerDirection): Promise<UserResponseDto[]> {
    const partners = await this.partnerCore.getAll(authUser.id, direction);
    return partners.map((partner) => this.map(partner, direction));
  }

  private map(partner: PartnerEntity, direction: PartnerDirection): UserResponseDto {
    // this is opposite to return the non-me user of the "partner"
    return mapUser(direction === PartnerDirection.SharedBy ? partner.sharedWith : partner.sharedBy);
  }
}
