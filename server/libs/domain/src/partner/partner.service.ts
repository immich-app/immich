import { Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IPartnerRepository, mapPartner, PartnerCore, PartnerDirection, PartnerResponseDto } from '../partner';

@Injectable()
export class PartnerService {
  private partnerCore: PartnerCore;

  constructor(@Inject(IPartnerRepository) partnerRepository: IPartnerRepository) {
    this.partnerCore = new PartnerCore(partnerRepository);
  }

  async addPartner(authUser: AuthUserDto, sharedWith: string): Promise<void> {
    await this.partnerCore.create({ sharedBy: authUser.id, sharedWith });
  }

  async removePartner(authUser: AuthUserDto, sharedWith: string): Promise<void> {
    await this.partnerCore.remove({ sharedBy: authUser.id, sharedWith });
  }

  async getPartners(authUser: AuthUserDto, direction: PartnerDirection): Promise<PartnerResponseDto[]> {
    const partners = await this.partnerCore.getAll(authUser.id, direction);
    return partners.map(mapPartner);
  }
}
