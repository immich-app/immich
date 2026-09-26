import { BadRequestException, Injectable } from '@nestjs/common';
import { Partner } from 'src/database.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { PartnerCreateDto, PartnerResponseDto, PartnerSearchDto, PartnerUpdateDto } from 'src/dtos/partner.dto.js';
import { mapUser } from 'src/dtos/user.dto.js';
import { Permission, SharingDirection } from 'src/enum.js';
import { PartnerIds } from 'src/repositories/partner.repository.js';
import { BaseService } from 'src/services/base.service.js';

@Injectable()
export class PartnerService extends BaseService {
  async create(auth: AuthDto, { sharedWithId }: PartnerCreateDto): Promise<PartnerResponseDto> {
    const partnerId: PartnerIds = { sharedById: auth.user.id, sharedWithId };
    const exists = await this.partnerRepository.get(partnerId);
    if (exists) {
      throw new BadRequestException(`Partner already exists`);
    }

    const user = await this.userRepository.get(sharedWithId, {});
    if (!user) {
      this.logger.debug('Partner creation failed: user not found');
      throw new BadRequestException('Invalid user');
    }

    const partner = await this.partnerRepository.create(partnerId);
    return this.mapPartner(partner, SharingDirection.SharedBy);
  }

  async remove(auth: AuthDto, sharedWithId: string): Promise<void> {
    const partnerId: PartnerIds = { sharedById: auth.user.id, sharedWithId };
    const partner = await this.partnerRepository.get(partnerId);
    if (!partner) {
      throw new BadRequestException('Partner not found');
    }

    await this.partnerRepository.remove(partnerId);
  }

  async search(auth: AuthDto, { direction }: PartnerSearchDto): Promise<PartnerResponseDto[]> {
    const partners = await this.partnerRepository.getAll(auth.user.id);
    const key = direction === SharingDirection.SharedBy ? 'sharedById' : 'sharedWithId';
    return partners
      .filter((partner): partner is Partner => !!(partner.sharedBy && partner.sharedWith)) // Filter out soft deleted users
      .filter((partner) => partner[key] === auth.user.id)
      .map((partner) => this.mapPartner(partner, direction));
  }

  async update(auth: AuthDto, sharedById: string, dto: PartnerUpdateDto): Promise<PartnerResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PartnerUpdate, ids: [sharedById] });
    const partnerId: PartnerIds = { sharedById, sharedWithId: auth.user.id };

    const entity = await this.partnerRepository.update(partnerId, { inTimeline: dto.inTimeline });
    return this.mapPartner(entity, SharingDirection.SharedWith);
  }

  private mapPartner(partner: Partner, direction: SharingDirection): PartnerResponseDto {
    // this is opposite to return the non-me user of the "partner"
    const sharedUser = direction === SharingDirection.SharedBy ? partner.sharedWith : partner.sharedBy;
    const user = mapUser(sharedUser);

    return { ...user, inTimeline: partner.inTimeline };
  }
}
