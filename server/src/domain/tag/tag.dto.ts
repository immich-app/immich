import { TagType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  @IsOptional()
  name?: string;
}
