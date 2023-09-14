import { PartnerEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IPartnerRepository, PartnerDirection, PartnerIds } from '.';
import { AuthUserDto } from '../auth';
import { mapUser, UserResponseDto } from '../user';

@Injectable()
export class PartnerService {
  constructor(@Inject(IPartnerRepository) private repository: IPartnerRepository) {}

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

  async getAll(authUser: AuthUserDto, direction: PartnerDirection): Promise<UserResponseDto[]> {
    const partners = await this.repository.getAll(authUser.id);
    const key = direction === PartnerDirection.SharedBy ? 'sharedById' : 'sharedWithId';
    return partners
      .filter((partner) => partner.sharedBy && partner.sharedWith) // Filter out soft deleted users
      .filter((partner) => partner[key] === authUser.id)
      .map((partner) => this.map(partner, direction));
  }

  private map(partner: PartnerEntity, direction: PartnerDirection): UserResponseDto {
    // this is opposite to return the non-me user of the "partner"
    return mapUser(direction === PartnerDirection.SharedBy ? partner.sharedWith : partner.sharedBy);
  }
}
