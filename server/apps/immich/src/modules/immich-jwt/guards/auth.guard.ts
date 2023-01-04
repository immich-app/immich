import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { API_KEY_STRATEGY } from '../strategies/api-key.strategy';
import { JWT_STRATEGY } from '../strategies/jwt.strategy';

@Injectable()
export class AuthGuard extends PassportAuthGuard([JWT_STRATEGY, API_KEY_STRATEGY]) {}
