import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { API_KEY_STRATEGY } from '../strategies/api-key.strategy';
import { AUTH_COOKIE_STRATEGY } from '../strategies/auth-cookie-strategy';
import { PUBLIC_SHARE_STRATEGY } from '../strategies/public-share.strategy';

@Injectable()
export class AuthGuard extends PassportAuthGuard([PUBLIC_SHARE_STRATEGY, AUTH_COOKIE_STRATEGY, API_KEY_STRATEGY]) {}
