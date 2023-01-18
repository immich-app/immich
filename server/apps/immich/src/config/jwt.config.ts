import { JwtModuleOptions } from '@nestjs/jwt';
import { jwtSecret } from '../constants/jwt.constant';

export const jwtConfig: JwtModuleOptions = {
  secret: jwtSecret,
  signOptions: { expiresIn: '30d' },
};
