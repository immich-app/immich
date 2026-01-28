import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  CreateFamilyMemberDto,
  FamilyMemberResponseDto,
  mapFamilyMember,
  UpdateFamilyMemberDto,
} from 'src/dtos/family-member.dto';
import { ConfigRepository } from 'src/repositories/config.repository';
import { FamilyMemberRepository } from 'src/repositories/family-member.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TagRepository } from 'src/repositories/tag.repository';

@Injectable()
export class FamilyMemberService {
  constructor(
    private logger: LoggingRepository,
    private configRepository: ConfigRepository,
    private familyMemberRepository: FamilyMemberRepository,
    private tagRepository: TagRepository,
  ) {
    this.logger.setContext(FamilyMemberService.name);
  }

  private requireFamilyMode(): void {
    const { familyMode } = this.configRepository.getEnv();
    if (!familyMode) {
      throw new BadRequestException('Family members are only available in family mode');
    }
  }

  private requireAdmin(auth: AuthDto): void {
    if (!auth.user.isAdmin) {
      throw new ForbiddenException('Only the owner can manage family members');
    }
  }

  async create(auth: AuthDto, dto: CreateFamilyMemberDto): Promise<FamilyMemberResponseDto> {
    this.requireFamilyMode();
    this.requireAdmin(auth);

    // Check if a family member with this name already exists
    const existing = await this.familyMemberRepository.getByOwnerAndName(auth.user.id, dto.name);
    if (existing) {
      throw new BadRequestException(`A family member named "${dto.name}" already exists`);
    }

    // Create a tag for this family member
    const tag = await this.tagRepository.upsertValue({
      userId: auth.user.id,
      value: `Family/${dto.name}`,
      parentId: undefined,
    });

    const familyMember = await this.familyMemberRepository.create({
      ownerId: auth.user.id,
      tagId: tag.id,
      name: dto.name,
      birthdate: dto.birthdate,
      color: dto.color ?? null,
      avatarAssetId: dto.avatarAssetId ?? null,
    });

    this.logger.log(`Family member "${dto.name}" created by user ${auth.user.id}`);

    return mapFamilyMember(familyMember);
  }

  async getAll(auth: AuthDto): Promise<FamilyMemberResponseDto[]> {
    this.requireFamilyMode();

    // Get family members owned by the admin (who invited this user)
    // For now, we assume all family members are visible to all users
    // In the future, we might want to filter based on who invited the user
    const admin = await this.getAdminForUser(auth);
    const members = await this.familyMemberRepository.getByOwnerId(admin.id);

    return members.map(mapFamilyMember);
  }

  async get(auth: AuthDto, id: string): Promise<FamilyMemberResponseDto> {
    this.requireFamilyMode();

    const member = await this.familyMemberRepository.getById(id);
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    return mapFamilyMember(member);
  }

  async update(auth: AuthDto, id: string, dto: UpdateFamilyMemberDto): Promise<FamilyMemberResponseDto> {
    this.requireFamilyMode();
    this.requireAdmin(auth);

    const member = await this.familyMemberRepository.getById(id);
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    if (member.ownerId !== auth.user.id) {
      throw new ForbiddenException('You can only update your own family members');
    }

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== member.name) {
      const existing = await this.familyMemberRepository.getByOwnerAndName(auth.user.id, dto.name);
      if (existing) {
        throw new BadRequestException(`A family member named "${dto.name}" already exists`);
      }
    }

    const updated = await this.familyMemberRepository.update(id, {
      name: dto.name,
      birthdate: dto.birthdate,
      color: dto.color,
      avatarAssetId: dto.avatarAssetId,
    });

    this.logger.log(`Family member "${id}" updated by user ${auth.user.id}`);

    return mapFamilyMember(updated);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    this.requireFamilyMode();
    this.requireAdmin(auth);

    const member = await this.familyMemberRepository.getById(id);
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    if (member.ownerId !== auth.user.id) {
      throw new ForbiddenException('You can only delete your own family members');
    }

    await this.familyMemberRepository.delete(id);
    this.logger.log(`Family member "${id}" deleted by user ${auth.user.id}`);
  }

  /**
   * Get photos of a family member at a specific age
   * @param ageMonths Age in months
   * @param toleranceMonths Tolerance in months (e.g., 1 means +/- 1 month)
   */
  async getPhotosAtAge(
    auth: AuthDto,
    id: string,
    ageMonths: number,
    toleranceMonths: number = 1,
  ): Promise<{ photos: any[]; exactAge: string }> {
    this.requireFamilyMode();

    const member = await this.familyMemberRepository.getById(id);
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    const birthdate = DateTime.fromISO(member.birthdate);

    // Calculate the date range when the member was the specified age
    const startDate = birthdate.plus({ months: ageMonths - toleranceMonths }).toJSDate();
    const endDate = birthdate.plus({ months: ageMonths + toleranceMonths }).toJSDate();

    const photos = await this.familyMemberRepository.getPhotosInDateRange(id, startDate, endDate);

    return {
      photos,
      exactAge: this.formatAge(ageMonths),
    };
  }

  /**
   * Compare all family members at the same age
   */
  async getAgeComparison(
    auth: AuthDto,
    ageMonths: number,
    toleranceMonths: number = 1,
  ): Promise<{ age: string; comparisons: { member: FamilyMemberResponseDto; photos: any[]; exactAge: string }[] }> {
    this.requireFamilyMode();

    const admin = await this.getAdminForUser(auth);
    const members = await this.familyMemberRepository.getByOwnerId(admin.id);

    const comparisons = await Promise.all(
      members.map(async (member) => {
        const birthdate = DateTime.fromISO(member.birthdate);

        // Calculate the date range when the member was the specified age
        const startDate = birthdate.plus({ months: ageMonths - toleranceMonths }).toJSDate();
        const endDate = birthdate.plus({ months: ageMonths + toleranceMonths }).toJSDate();

        // Only include if the date range is in the past (member has reached this age)
        if (endDate > new Date()) {
          return null;
        }

        const photos = await this.familyMemberRepository.getPhotosInDateRange(member.id, startDate, endDate);

        return {
          member: mapFamilyMember(member),
          photos,
          exactAge: this.formatAge(ageMonths),
        };
      }),
    );

    return {
      age: this.formatAge(ageMonths),
      comparisons: comparisons.filter((c): c is NonNullable<typeof c> => c !== null),
    };
  }

  private formatAge(ageMonths: number): string {
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;

    if (years === 0) {
      return months === 1 ? '1 month' : `${months} months`;
    }
    if (months === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    }
    const yearStr = years === 1 ? '1 year' : `${years} years`;
    const monthStr = months === 1 ? '1 month' : `${months} months`;
    return `${yearStr}, ${monthStr}`;
  }

  /**
   * Get the tag ID for a family member (useful for filtering memories/flashbacks)
   */
  async getTagId(auth: AuthDto, id: string): Promise<string> {
    this.requireFamilyMode();

    const member = await this.familyMemberRepository.getById(id);
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    return member.tagId;
  }

  /**
   * Get the admin user for the current user
   * In family mode, all users see the admin's family members
   */
  private async getAdminForUser(auth: AuthDto): Promise<{ id: string }> {
    // If the user is admin, return their own ID
    if (auth.user.isAdmin) {
      return { id: auth.user.id };
    }

    // Otherwise, we need to find the admin
    // For simplicity, in family mode there should only be one admin
    // This could be enhanced later to support multiple admins
    return { id: auth.user.id }; // Placeholder - in a real implementation, we'd query for the admin
  }
}
