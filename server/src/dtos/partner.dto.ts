import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export class PartnerCreateDto {
  @ValidateUUID()
  sharedWithId!: string;

  @ValidateDate({ optional: true, nullable: true, format: 'date-time' })
  startDate?: Date | null;
}

export class PartnerUpdateDto {
  @IsNotEmpty()
  inTimeline!: boolean;

  @ValidateDate({ optional: true, nullable: true, format: 'date-time' })
  startDate?: Date | null;
}

export class PartnerSearchDto {
  @ValidateEnum({ enum: PartnerDirection, name: 'PartnerDirection' })
  direction!: PartnerDirection;
}

export class PartnerResponseDto extends UserResponseDto {
  inTimeline?: boolean;
  startDate?: Date | null;
}
