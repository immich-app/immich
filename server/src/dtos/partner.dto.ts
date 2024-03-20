import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/dtos/user.dto';

export class UpdatePartnerDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerResponseDto extends UserResponseDto {
  inTimeline?: boolean;
}
