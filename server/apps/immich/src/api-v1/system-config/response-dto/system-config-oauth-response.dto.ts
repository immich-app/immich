export class SystemOAuthConfigResponseDto {
  enabled!: boolean;
  issuerUrl!: string;
  clientId!: string;
  clientSecret!: string;
  scope!: string;
  buttonText!: string;
  autoRegister!: boolean;
}
