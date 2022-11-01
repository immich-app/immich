import { Body, Controller, Get, Post, Res, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { OAuthCallbackDto } from './dto/oauth-auth-code.dto';
import { OAuthService } from './oauth.service';
import { OAuthConfigResponseDto } from './response-dto/oauth-config-response.dto';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {
  constructor(private readonly authService: AuthService, private readonly oauthService: OAuthService) {}

  @Get('/config')
  public getConfig(): OAuthConfigResponseDto {
    return this.oauthService.getConfig();
  }

  @Post('/callback')
  public async callback(@Res({ passthrough: true }) response: Response, @Body(ValidationPipe) dto: OAuthCallbackDto) {
    const loginResponse = await this.oauthService.callback(dto);
    response.setHeader('Set-Cookie', this.authService.getCookies(loginResponse));
    return loginResponse;
  }
}
