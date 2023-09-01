export class OAuthConfigResponseDto {
  enabled!: boolean;
  passwordLoginEnabled!: boolean;
  url?: string;
  buttonText?: string;
  autoLaunch?: boolean;
}

export class OAuthAuthorizeResponseDto {
  url!: string;
}
