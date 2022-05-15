import { IsNotEmpty } from 'class-validator';

export class OAuthLoginDto {
  @IsNotEmpty()
  accessToken: string;
}
