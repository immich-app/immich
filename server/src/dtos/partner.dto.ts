import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export class PartnerCreateDto {
  @ValidateUUID()
  sharedWithId!: string;
}

export class PartnerUpdateDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerSearchDto {
  @ValidateEnum({ enum: PartnerDirection, name: 'PartnerDirection' })
  direction!: PartnerDirection;
}

export class PartnerResponseDto extends UserResponseDto {
  inTimeline?: boolean;
}
