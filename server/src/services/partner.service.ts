import { BadRequestException, Injectable } from '@nestjs/common';
import { Partner } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { PartnerCreateDto, PartnerResponseDto, PartnerSearchDto, PartnerUpdateDto } from 'src/dtos/partner.dto';
import { mapUser } from 'src/dtos/user.dto';
import { Permission } from 'src/enum';
import { PartnerDirection, PartnerIds } from 'src/repositories/partner.repository';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PartnerService extends BaseService {
  async create(auth: AuthDto, {sharedWithId, shareFromDate}: PartnerCreateDto): Promise<PartnerResponseDto> {
    const partnerId: PartnerIds = { sharedById: auth.user.id, sharedWithId };
    const exists = await this.partnerRepository.get(partnerId);
    if (exists) {
      throw new BadRequestException(`Partner already exists`);
    }

    const partner = await this.partnerRepository.create({
      ...partnerId,
      ...(shareFromDate !== undefined && { shareFromDate }),
    });
    return this.mapPartner(partner, PartnerDirection.SharedBy);
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
    const key = direction === PartnerDirection.SharedBy ? 'sharedById' : 'sharedWithId';
    return partners
      .filter((partner): partner is Partner => !!(partner.sharedBy && partner.sharedWith)) // Filter out soft deleted users
      .filter((partner) => partner[key] === auth.user.id)
      .map((partner) => this.mapPartner(partner, direction));
  }

  async update(auth: AuthDto, id: string, dto: PartnerUpdateDto): Promise<PartnerResponseDto> {
    if (dto.inTimeline !== undefined && dto.shareFromDate !== undefined) {
      throw new BadRequestException('Cannot update both inTimeline and shareFromDate in the same request');
    }

    if (dto.inTimeline !== undefined) {
      await this.requireAccess({ auth, permission: Permission.PartnerUpdate, ids: [id] });
      const partnerId: PartnerIds = { sharedById: id, sharedWithId: auth.user.id };
      const entity = await this.partnerRepository.update(partnerId, { inTimeline: dto.inTimeline });
      return this.mapPartner(entity, PartnerDirection.SharedWith);
    }

    if (dto.shareFromDate !== undefined) {
      const partnerId: PartnerIds = { sharedById: auth.user.id, sharedWithId: id };
      const partner = await this.partnerRepository.get(partnerId);
      if (!partner) {
        throw new BadRequestException('Partner not found');
      }
      const entity = await this.partnerRepository.update(partnerId, { shareFromDate: dto.shareFromDate });
      return this.mapPartner(entity, PartnerDirection.SharedBy);
    }

    throw new BadRequestException('No update fields provided');
  }

  private mapPartner(partner: Partner, direction: PartnerDirection): PartnerResponseDto {
    // this is opposite to return the non-me user of the "partner"
    const user = mapUser(
      direction === PartnerDirection.SharedBy ? partner.sharedWith : partner.sharedBy,
    ) as PartnerResponseDto;

    return {
      ...user,
      inTimeline: partner.inTimeline,
      shareFromDate: partner.shareFromDate?.toISOString().split('T')[0] ?? null,
    };
  }
}
