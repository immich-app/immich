import { IsNotEmpty, IsString } from 'class-validator';

export class APIKeyUpdateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
