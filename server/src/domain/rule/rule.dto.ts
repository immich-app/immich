import { GeoRuleValue, RuleEntity, RuleKey, RuleValue, RuleValueType, RULE_TO_TYPE } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ValidateUUID } from '../domain.util';

class UUIDRuleDto {
  @IsUUID(4)
  value!: string;
}

class StringRuleDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}

class DateRuleDto {
  @IsDate()
  @Type(() => Date)
  value!: Date;
}

class GeoRuleValueDto implements GeoRuleValue {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsPositive()
  @IsNumber()
  radius!: number;
}

class GeoRuleDto {
  @ValidateNested()
  @Type(() => GeoRuleValueDto)
  value!: GeoRuleValueDto;
}

const toRuleValueDto = (key: RuleKey, value: RuleValue) => {
  const type = RULE_TO_TYPE[key];
  const map: Record<RuleValueType, ClassConstructor<{ value: RuleValue }>> = {
    [RuleValueType.UUID]: UUIDRuleDto,
    [RuleValueType.STRING]: StringRuleDto,
    [RuleValueType.DATE]: DateRuleDto,
    [RuleValueType.GEO]: GeoRuleDto,
  };

  if (type && map[type]) {
    return plainToInstance(map[type], { value });
  }

  return value;
};

export class UpdateRuleDto {
  @ApiProperty({ enumName: 'RuleKey', enum: RuleKey })
  @IsEnum(RuleKey)
  key!: RuleKey;

  @ApiProperty({ type: String })
  @ValidateNested()
  @Transform(({ obj, value }) => toRuleValueDto(obj.key, value))
  value!: { value: RuleValue };
}

export class CreateRuleDto extends UpdateRuleDto {
  @ValidateUUID()
  albumId!: string;
}

export class RuleResponseDto {
  id!: string;
  @ApiProperty({ enumName: 'RuleKey', enum: RuleKey })
  key!: RuleKey;
  @ApiProperty({ type: String })
  value!: any;
  ownerId!: string;
}

export const mapRule = (rule: RuleEntity): RuleResponseDto => {
  return {
    id: rule.id,
    key: rule.key,
    value: rule.value,
    ownerId: rule.ownerId,
  };
};
