import { TagType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Optional } from '../domain.util';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(TagType)
  @IsNotEmpty()
  @ApiProperty({ enumName: 'TagTypeEnum', enum: TagType })
  type!: TagType;
}

export class UpdateTagDto {
  @IsString()
  @Optional()
  name?: string;
}
