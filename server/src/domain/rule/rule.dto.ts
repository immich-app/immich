import { RuleEntity, RuleKey } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ValidateUUID } from '../domain.util';

export class CreateRuleDto {
  @ValidateUUID()
  albumId!: string;

  @ApiProperty({ enumName: 'RuleKey', enum: RuleKey })
  @IsEnum(RuleKey)
  key!: RuleKey;

  @IsNotEmpty()
  value!: any;
}

export class UpdateRuleDto {
  @ApiProperty({ enumName: 'RuleKey', enum: RuleKey })
  @IsOptional()
  @IsEnum(RuleKey)
  key?: RuleKey;

  @IsOptional()
  @IsNotEmpty()
  value?: any;
}

export class RuleResponseDto {
  id!: string;
  @ApiProperty({ enumName: 'RuleKey', enum: RuleKey })
  key!: RuleKey;
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
