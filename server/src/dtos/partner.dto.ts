import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export class PartnerCreateDto {
  @ApiProperty({ description: 'User ID to share with' })
  @ValidateUUID()
  sharedWithId!: string;
}

export class PartnerUpdateDto {
  @ApiProperty({ description: 'Show partner assets in timeline' })
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerSearchDto {
  @ApiProperty({ description: 'Partner direction', enum: PartnerDirection })
  @ValidateEnum({ enum: PartnerDirection, name: 'PartnerDirection' })
  direction!: PartnerDirection;
}

export class PartnerResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ description: 'Show in timeline' })
  inTimeline?: boolean;
}
