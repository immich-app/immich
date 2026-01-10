import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { ValidateEnum, ValidateUUID } from 'src/validation';

@ApiSchema({ description: 'Partner creation request with user ID' })
export class PartnerCreateDto {
  @ApiProperty({ description: 'User ID to share with' })
  @ValidateUUID()
  sharedWithId!: string;
}

@ApiSchema({ description: 'Partner update request with timeline visibility' })
export class PartnerUpdateDto {
  @ApiProperty({ description: 'Show partner assets in timeline' })
  @IsNotEmpty()
  inTimeline!: boolean;
}

@ApiSchema({ description: 'Partner search query with direction filter' })
export class PartnerSearchDto {
  @ApiProperty({ description: 'Partner direction', enum: PartnerDirection })
  @ValidateEnum({ enum: PartnerDirection, name: 'PartnerDirection' })
  direction!: PartnerDirection;
}

@ApiSchema({ description: 'Partner response with user details' })
export class PartnerResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ description: 'Show in timeline' })
  inTimeline?: boolean;
}
