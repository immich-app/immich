
export class UserCountResponseDto {
  userCount!: number;
}

export function mapUserCountResponse(count: number): UserCountResponseDto {
  return {
    userCount: count,
  };
}