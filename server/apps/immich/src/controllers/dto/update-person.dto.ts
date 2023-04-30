import { IsNotEmpty } from 'class-validator';

export class UpdatePersonDto {
  @IsNotEmpty()
  name!: string;
}
