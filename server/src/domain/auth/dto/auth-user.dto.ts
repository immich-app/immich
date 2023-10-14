export class AuthUserDto {
  id!: string;
  email!: string;
  isAdmin!: boolean;
  isPublicUser?: boolean;
  sharedLinkId?: string;
  isAllowUpload?: boolean;
  isAllowDownload?: boolean;
  isShowMetadata?: boolean;
  accessTokenId?: string;
  externalPath?: string | null;
}
