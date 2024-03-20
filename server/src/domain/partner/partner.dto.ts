import { IsNotEmpty } from 'class-validator';
import { UserResponseDto } from 'src/domain/user/response-dto/user-response.dto';

export class UpdatePartnerDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerResponseDto extends UserResponseDto {
  inTimeline?: boolean;
}
