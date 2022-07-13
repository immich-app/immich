import { ApiProperty } from '@nestjs/swagger';

export class UserCountResponseDto {
  @ApiProperty({ type: 'integer' })
  userCount!: number;
}

export function mapUserCountResponse(count: number): UserCountResponseDto {
  return {
    userCount: count,
  };
}
