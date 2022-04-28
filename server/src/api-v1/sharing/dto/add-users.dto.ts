import { IsNotEmpty } from 'class-validator';

export class AddUsersDto {
  @IsNotEmpty()
  albumId: string;

  @IsNotEmpty()
  sharedUserIds: string[];
}
