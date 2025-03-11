import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';

export class UpdatePartnerDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerSearchDto {
  @IsEnum(PartnerDirection)
  @ApiProperty({ enum: PartnerDirection, enumName: 'PartnerDirection' })
  direction!: PartnerDirection;
}

export class PartnerResponseDto extends UserResponseDto {
  inTimeline?: boolean;
}
