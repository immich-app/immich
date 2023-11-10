import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from '..';

export class UpdatePartnerDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class UpdatePartnerResponseDto {
  inTimeline!: boolean;
}

export class PartnerResponseDto extends UserResponseDto {
  inTimeline?: boolean;
}
