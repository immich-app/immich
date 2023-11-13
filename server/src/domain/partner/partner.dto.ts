import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from '../user';

export class UpdatePartnerDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerResponseDto extends UserResponseDto {
  inTimeline?: boolean;
}
