import { IsNotEmpty } from 'class-validator';

export class PersonUpdateDto {
  @IsNotEmpty()
  name!: string;
}
