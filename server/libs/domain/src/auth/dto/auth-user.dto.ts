export class AuthUserDto {
  id!: string;
  email!: string;
  isAdmin!: boolean;
  isPublicUser?: boolean;
  sharedLinkId?: string;
  isAllowUpload?: boolean;
}
