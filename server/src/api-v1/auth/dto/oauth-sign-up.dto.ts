import { IsNotEmpty } from 'class-validator';

export class OAuthSignUpDto {
  @IsNotEmpty()
  accessToken: string;
}
