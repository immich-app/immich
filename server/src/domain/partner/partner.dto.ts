import { IsNotEmpty } from 'class-validator';

export class UpdatePartnerDto {
  @IsNotEmpty()
  inTimeline!: boolean;
}
