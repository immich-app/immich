import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export type Options = {
  optional?: boolean;
  each?: boolean;
};

export function ValidateUUID({ optional, each }: Options = { optional: false, each: false }) {
  return applyDecorators(
    IsUUID('4', { each }),
    ApiProperty({ format: 'uuid' }),
    optional ? IsOptional() : IsNotEmpty(),
    each ? IsArray() : IsString(),
  );
}
