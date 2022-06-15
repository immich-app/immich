import { IsNotEmpty } from 'class-validator';

export class OAuthAccessTokenDto {
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  redirect_uri: string;
}
