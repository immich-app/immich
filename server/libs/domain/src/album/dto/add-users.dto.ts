import { IsNotEmpty } from 'class-validator';

export class AddUsersDto {
  @IsNotEmpty()
  sharedUserIds!: string[];
}
