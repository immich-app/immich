import { PartnerEntity } from '@app/infra/entities';
import { Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IPartnerRepository, PartnerCore, PartnerDirection } from '../partner';
import { UserResponseDto } from '../user';

@Injectable()
export class PartnerService {
  private partnerCore: PartnerCore;

  constructor(@Inject(IPartnerRepository) partnerRepository: IPartnerRepository) {
    this.partnerCore = new PartnerCore(partnerRepository);
  }

  async addPartner(authUser: AuthUserDto, sharedWith: string): Promise<UserResponseDto> {
    const partner = await this.partnerCore.create({ sharedBy: authUser.id, sharedWith });
    return this.map(partner, PartnerDirection.SharedBy);
  }

  async removePartner(authUser: AuthUserDto, sharedWith: string): Promise<void> {
    await this.partnerCore.remove({ sharedBy: authUser.id, sharedWith });
  }

  async getPartners(authUser: AuthUserDto, direction: PartnerDirection): Promise<UserResponseDto[]> {
    const partners = await this.partnerCore.getAll(authUser.id, direction);
    return partners.map((partner) => this.map(partner, direction));
  }

  private map(partner: PartnerEntity, direction: PartnerDirection): UserResponseDto {
    // this is opposite to return the non-me user of the "partner"
    return direction === PartnerDirection.SharedBy ? partner.sharedWith : partner.sharedBy;
  }
}
