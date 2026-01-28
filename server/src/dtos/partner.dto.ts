import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export class PartnerCreateDto {
  @ValidateUUID({ description: 'User ID to share with' })
  sharedWithId!: string;
}

export class PartnerUpdateDto {
  @ApiProperty({ description: 'Show partner assets in timeline' })
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerSearchDto {
  @ValidateEnum({ enum: PartnerDirection, name: 'PartnerDirection', description: 'Partner direction' })
  direction!: PartnerDirection;
}

export class PartnerResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ description: 'Show in timeline' })
  inTimeline?: boolean;
}
