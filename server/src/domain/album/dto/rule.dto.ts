import { RuleKey } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateRuleDto {
  @ApiProperty({ enumName: 'RuleKey', enum: RuleKey })
  @IsNotEmpty()
  key!: RuleKey;

  @IsNotEmpty()
  value!: string;
}
