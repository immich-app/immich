import { FFmpegConfig } from '@app/database/entities/system-config.entity';
import { ApiProperty } from '@nestjs/swagger';

export class FFmpegSystemConfigResponseDto {
  @ApiProperty({ type: 'string' })
  crf!: string;

  @ApiProperty({ type: 'string' })
  preset!: string;

  @ApiProperty({ type: 'string' })
  targetVideoCodec!: string;

  @ApiProperty({ type: 'string' })
  targetAudioCodec!: string;

  @ApiProperty({ type: 'string' })
  targetScaling!: string;
}

export function mapFFmpegConfig(config: FFmpegConfig): FFmpegSystemConfigResponseDto {
  return config;
}
