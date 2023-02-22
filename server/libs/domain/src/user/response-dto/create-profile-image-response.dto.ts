export class CreateProfileImageResponseDto {
  userId!: string;
  profileImagePath!: string;
}

export function mapCreateProfileImageResponse(userId: string, profileImagePath: string): CreateProfileImageResponseDto {
  return {
    userId: userId,
    profileImagePath: profileImagePath,
  };
}
