import { IsNotEmpty, IsString } from 'class-validator';

export class OAuthConfigDto {
  @IsNotEmpty()
  @IsString()
  redirectUri!: string;
}
