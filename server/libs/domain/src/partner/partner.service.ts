import { Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IPartnerRepository, mapPartner, PartnerCore, PartnerResponseDto } from '../partner';

@Injectable()
export class PartnerService {
  private partnerCore: PartnerCore;

  constructor(@Inject(IPartnerRepository) partnerRepository: IPartnerRepository) {
    this.partnerCore = new PartnerCore(partnerRepository);
  }

  async addPartner(authUser: AuthUserDto, sharedWith: string): Promise<void> {
    await this.partnerCore.create(authUser.id, sharedWith);
  }

  async removePartner(authUser: AuthUserDto, sharedWith: string): Promise<void> {
    await this.partnerCore.remove(authUser.id, sharedWith);
  }

  async getAllPartners(authUser: AuthUserDto): Promise<PartnerResponseDto[]> {
    const partners = await this.partnerCore.getAll(authUser.id, 'shared-by');
    return partners.map(mapPartner);
  }
}
