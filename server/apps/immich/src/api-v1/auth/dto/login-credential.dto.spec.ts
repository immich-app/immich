import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginCredentialDto } from './login-credential.dto';

describe('LoginCredentialDto', () => {
  it('should fail without an email', () => {
    let dto = plainToInstance(LoginCredentialDto, { password: 'password' });
    let errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('email');
  });

  it('should fail with an invalid email', () => {
    let dto = plainToInstance(LoginCredentialDto, { email: 'invalid.com', password: 'password' });
    let errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('email');
  });

  it('should make the email all lowercase', () => {
    let dto = plainToInstance(LoginCredentialDto, { email: 'TeSt@ImMiCh.com', password: 'password' });
    let errors = validateSync(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual('test@immich.com');
  });

  it('should fail without a password', () => {
    let dto = plainToInstance(LoginCredentialDto, { email: 'test@immich.com', password: '' });
    let errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('password');
  });
});
