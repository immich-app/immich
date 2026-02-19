import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export class PartnerCreateDto {
  @ValidateUUID({ description: 'User ID to share with' })
  sharedWithId!: string;

  @ValidateDate({ optional: true, nullable: true, description: 'Only share assets from this date onward' })
  shareFromDate?: Date | null;
}

export class PartnerUpdateDto {
  @ValidateBoolean({ optional: true, description: 'Show partner assets in timeline' })
  inTimeline?: boolean;

  @ValidateDate({ optional: true, nullable: true, description: 'Only share assets from this date onward' })
  shareFromDate?: Date | null;
}

export class PartnerSearchDto {
  @ValidateEnum({ enum: PartnerDirection, name: 'PartnerDirection', description: 'Partner direction' })
  direction!: PartnerDirection;
}

export class PartnerResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ description: 'Show in timeline' })
  inTimeline?: boolean;

  @ApiPropertyOptional({ description: 'Share assets from this date onward' })
  shareFromDate?: string | null;
}
