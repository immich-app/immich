import { ApiProperty } from '@nestjs/swagger';

export class TimeBucketResponseDto {
  @ApiProperty({ type: 'string' })
  timeBucket!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}
