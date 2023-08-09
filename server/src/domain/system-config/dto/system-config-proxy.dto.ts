import { ProxyProtocol } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString } from 'class-validator';

export class SystemConfigProxyDto {
  @IsBoolean()
  enabled!: boolean;

  @IsEnum(ProxyProtocol)
  @ApiProperty({ enumName: 'ProxyProtocol', enum: ProxyProtocol })
  protocol!: ProxyProtocol;

  @IsString()
  hostname!: string;

  @IsString()
  port!: string;
}
