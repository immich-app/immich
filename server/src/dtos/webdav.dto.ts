import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WebDavResourceDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  path!: string;

  @ApiProperty()
  size!: number;

  @ApiProperty()
  created!: Date;

  @ApiProperty()
  modified!: Date;

  @ApiProperty()
  isCollection!: boolean;

  @ApiProperty({ required: false })
  etag?: string;

  @ApiProperty({ required: false })
  contentType?: string;
}

export class WebDavPropfindRequestDto {
  @ApiProperty({ required: false })
  @IsString()
  depth?: string;

  @ApiProperty({ required: false })
  propfind?: any;
}

export class WebDavCopyMoveRequestDto {
  @ApiProperty()
  @IsString()
  destination!: string;

  @ApiProperty({ required: false })
  @IsString()
  overwrite?: string;

  @ApiProperty({ required: false })
  @IsString()
  depth?: string;
}

export class WebDavLockRequestDto {
  @ApiProperty({ required: false })
  lockinfo?: any;

  @ApiProperty({ required: false })
  @IsString()
  timeout?: string;

  @ApiProperty({ required: false })
  @IsString()
  depth?: string;
}

export class WebDavErrorResponseDto {
  @ApiProperty()
  error!: string;

  @ApiProperty()
  statusCode!: number;
}
