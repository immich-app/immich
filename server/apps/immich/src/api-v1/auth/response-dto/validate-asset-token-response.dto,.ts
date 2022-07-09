export class ValidateAccessTokenResponseDto {
  constructor(authStatus: boolean) {
    this.authStatus = authStatus;
  }

  authStatus: boolean;
}
