import { ICryptoRepository } from '@app/domain';
import { compareSync, hash } from 'bcrypt';
import { randomBytes } from 'crypto';

export const cryptoRepository: ICryptoRepository = {
  randomBytes,
  hash,
  compareSync,
};
