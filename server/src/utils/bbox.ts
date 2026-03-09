import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptions } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Property } from 'src/decorators';
import { BBoxDto } from 'src/dtos/bbox.dto';
import { Optional } from 'src/validation';

type BBoxOptions = { optional?: boolean };
export const ValidateBBox = (options: BBoxOptions & ApiPropertyOptions = {}) => {
  const { optional, ...apiPropertyOptions } = options;

  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value !== 'string') {
        return value;
      }

      const [west, south, east, north] = value.split(',', 4).map(Number);
      return Object.assign(new BBoxDto(), { west, south, east, north });
    }),
    Type(() => BBoxDto),
    ValidateNested(),
    Property({
      type: 'string',
      description: 'Bounding box coordinates as west,south,east,north (WGS84)',
      example: '11.075683,49.416711,11.117589,49.454875',
      ...apiPropertyOptions,
    }),
    optional ? Optional({}) : IsNotEmpty(),
  );
};
