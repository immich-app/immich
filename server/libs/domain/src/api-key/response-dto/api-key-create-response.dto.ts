import { APIKeyResponseDto } from './api-key-response.dto';

export class APIKeyCreateResponseDto {
  secret!: string;
  apiKey!: APIKeyResponseDto;
}
