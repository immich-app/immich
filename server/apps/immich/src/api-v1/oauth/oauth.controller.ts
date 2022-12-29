import { Body, Controller, Get, HttpStatus, Post, Redirect, Req, Res, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthType } from '../../constants/jwt.constant';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { LoginResponseDto } from '../auth/response-dto/login-response.dto';
import { UserResponseDto } from '../user/response-dto/user-response.dto';
import { OAuthCallbackDto } from './dto/oauth-auth-code.dto';
import { OAuthConfigDto } from './dto/oauth-config.dto';
import { MOBILE_REDIRECT, OAuthService } from './oauth.service';
import { OAuthConfigResponseDto } from './response-dto/oauth-config-response.dto';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {
  constructor(private readonly immichJwtService: ImmichJwtService, private readonly oauthService: OAuthService) {}

  @Get('mobile-redirect')
  @Redirect()
  public mobileRedirect(@Req() req: Request) {
    const url = `${MOBILE_REDIRECT}?${req.url.split('?')[1] || ''}`;
    return { url, statusCode: HttpStatus.TEMPORARY_REDIRECT };
  }

  @Post('config')
  public generateConfig(@Body(ValidationPipe) dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    return this.oauthService.generateConfig(dto);
  }

  @Post('callback')
  public async callback(
    @Res({ passthrough: true }) response: Response,
    @Body(ValidationPipe) dto: OAuthCallbackDto,
  ): Promise<LoginResponseDto> {
    const loginResponse = await this.oauthService.login(dto);
    response.setHeader('Set-Cookie', this.immichJwtService.getCookies(loginResponse, AuthType.OAUTH));
    return loginResponse;
  }

  @Authenticated()
  @Post('link')
  public async link(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: OAuthCallbackDto,
  ): Promise<UserResponseDto> {
    return this.oauthService.link(authUser, dto);
  }

  @Authenticated()
  @Post('unlink')
  public async unlink(@GetAuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.oauthService.unlink(authUser);
  }
}
