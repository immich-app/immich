import { IsNotEmpty } from 'class-validator';
import { UserDto } from 'src/dtos/user.dto';

export class UpdatePartnerDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerResponseDto extends UserDto {
  inTimeline?: boolean;
}
