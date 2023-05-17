import { IsNotEmpty, IsString } from 'class-validator';

export class PersonUpdateDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}
